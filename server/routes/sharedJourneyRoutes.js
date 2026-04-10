import express from 'express';
import { body, validationResult } from 'express-validator';
import SharedJourney from '../models/SharedJourney.js';
import JourneyMember from '../models/JourneyMember.js';
import JourneyHistory from '../models/JourneyHistory.js';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// ─── Helper: check if journey is active ───
const isJourneyActive = (journey) =>
    !journey.closedAt && journey.deadline > new Date();

// ─── Helper: close a journey (shared by deadline-expiry check + creator close) ───
const closeJourney = async (journey, userId) => {
    const now = new Date();

    // 1. Mark closed
    await SharedJourney.findByIdAndUpdate(journey._id, { closedAt: now });

    // 2. Fetch all members in one query
    const members = await JourneyMember.find({ journey: journey._id })
        .select('user role createdAt')
        .lean();

    if (members.length > 0) {
        // 3. For each member, count their posts (batch query)
        const memberIds = members.map(m => m.user);
        const postCounts = await Post.aggregate([
            { $match: { journey: journey._id, author: { $in: memberIds } } },
            { $group: { _id: '$author', count: { $sum: 1 } } }
        ]);
        const postCountMap = {};
        postCounts.forEach(p => { postCountMap[p._id.toString()] = p.count; });

        // 4. Bulk insert JourneyHistory for all members
        const historyDocs = members.map(m => ({
            user: m.user,
            journey: journey._id,
            journeyTitle: journey.title,
            journeyPrompt: journey.prompt,
            role: m.role,
            userPostCount: postCountMap[m.user.toString()] || 0,
            totalMembers: journey.memberCount,
            totalPosts: journey.postCount,
            joinedAt: m.createdAt,
            closedAt: now
        }));

        await JourneyHistory.insertMany(historyDocs, { ordered: false }); // ordered:false = don't stop on dupe
    }

    // 5. Delete all posts in this journey (bulk)
    await Post.deleteMany({ journey: journey._id });

    return true;
};

// ────────────────────────────────────────────────
// @route   POST /api/journeys
// @desc    Create a journey
// @access  Private
// ────────────────────────────────────────────────
router.post('/', protect, [
    body('title').trim().notEmpty().isLength({ max: 80 }).withMessage('Title required (max 80 chars)'),
    body('prompt').trim().notEmpty().isLength({ max: 200 }).withMessage('Prompt required (max 200 chars)'),
    body('description').optional().trim().isLength({ max: 400 }),
    body('deadline').isISO8601().withMessage('Valid deadline date required'),
    body('visibility').isIn(['public', 'private']).withMessage('Visibility must be public or private'),
    body('postingMode').isIn(['open', 'broadcast']).withMessage('Posting mode must be open or broadcast'),
    body('mood').optional().isIn(['calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss'])
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { title, prompt, description, deadline, visibility, postingMode, mood, coverImage } = req.body;

        // Deadline must be in the future
        if (new Date(deadline) <= new Date()) {
            return res.status(400).json({ message: 'Deadline must be in the future' });
        }

        const journeyData = {
            title, prompt, description, deadline, visibility, postingMode,
            creator: req.user._id,
            mood: mood || null,
            coverImage: coverImage || null,
            memberCount: 1 // creator auto-joins
        };

        // Private journeys get an invite code
        if (visibility === 'private') {
            journeyData.inviteCode = SharedJourney.generateInviteCode();
        }

        const journey = await SharedJourney.create(journeyData);

        // Auto-add creator as member with role 'creator'
        await JourneyMember.create({
            journey: journey._id,
            user: req.user._id,
            role: 'creator'
        });

        res.status(201).json(journey);
    } catch (error) {
        console.error('Create journey error:', error);
        res.status(500).json({ message: 'Server error creating journey' });
    }
});

// ────────────────────────────────────────────────
// @route   GET /api/journeys
// @desc    Browse public active journeys (paginated)
// @access  Public (optionalAuth to show isMember)
// ────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { filter = 'active', page = 1, limit = 12 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const now = new Date();

        let query = { visibility: 'public' };

        if (filter === 'active') {
            query.closedAt = null;
            query.deadline = { $gt: now };
        } else if (filter === 'closed') {
            query.$or = [{ closedAt: { $ne: null } }, { deadline: { $lte: now } }];
        }
        // filter === 'all' → no extra conditions

        // Lean + select only card fields (not full docs)
        const [journeys, total] = await Promise.all([
            SharedJourney.find(query)
                .select('title prompt description creator deadline closedAt visibility postingMode mood coverImage memberCount postCount createdAt')
                .sort({ deadline: 1 }) // closing soonest first (urgency)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('creator', 'username avatar')
                .lean(),
            SharedJourney.countDocuments(query)
        ]);

        // Attach isMember for logged-in users (batch query)
        let memberSet = new Set();
        if (req.user && journeys.length > 0) {
            const journeyIds = journeys.map(j => j._id);
            const memberships = await JourneyMember.find({
                journey: { $in: journeyIds },
                user: req.user._id
            }).select('journey').lean();
            memberships.forEach(m => memberSet.add(m.journey.toString()));
        }

        const result = journeys.map(j => ({
            ...j,
            isActive: !j.closedAt && j.deadline > now,
            isMember: memberSet.has(j._id.toString())
        }));

        res.json({
            journeys: result,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get journeys error:', error);
        res.status(500).json({ message: 'Server error fetching journeys' });
    }
});

// ────────────────────────────────────────────────
// @route   GET /api/journeys/mine
// @desc    Journeys I created or joined
// @access  Private
// ────────────────────────────────────────────────
router.get('/mine', protect, async (req, res) => {
    try {
        // Find all journeys user is a member of
        const memberships = await JourneyMember.find({ user: req.user._id })
            .select('journey role createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const journeyIds = memberships.map(m => m.journey);
        const roleMap = {};
        memberships.forEach(m => { roleMap[m.journey.toString()] = m.role; });

        const journeys = await SharedJourney.find({ _id: { $in: journeyIds } })
            .select('title prompt deadline closedAt visibility postingMode memberCount postCount createdAt')
            .populate('creator', 'username avatar')
            .lean();

        const now = new Date();
        const result = journeys.map(j => ({
            ...j,
            isActive: !j.closedAt && j.deadline > now,
            myRole: roleMap[j._id.toString()]
        }));

        res.json(result);
    } catch (error) {
        console.error('Get mine journeys error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ────────────────────────────────────────────────
// @route   GET /api/journeys/history
// @desc    Journey participation history for profile
// @access  Private
// ────────────────────────────────────────────────
router.get('/history', protect, async (req, res) => {
    try {
        const history = await JourneyHistory.find({ user: req.user._id })
            .select('journeyTitle journeyPrompt role userPostCount totalMembers totalPosts joinedAt closedAt')
            .sort({ closedAt: -1 })
            .limit(50)
            .lean();

        res.json(history);
    } catch (error) {
        console.error('Get journey history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ────────────────────────────────────────────────
// @route   GET /api/journeys/:id
// @desc    Journey detail + membership status
// @access  Public (optionalAuth)
// ────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const journey = await SharedJourney.findById(req.params.id)
            .populate('creator', 'username avatar _id')
            .lean();

        if (!journey) return res.status(404).json({ message: 'Journey not found' });

        const now = new Date();
        const active = !journey.closedAt && journey.deadline > now;

        // Private: non-members see only basic info
        let membership = null;
        if (req.user) {
            membership = await JourneyMember.findOne({
                journey: journey._id,
                user: req.user._id
            }).select('role createdAt').lean();
        }

        if (journey.visibility === 'private' && !membership) {
            return res.json({
                _id: journey._id,
                title: journey.title,
                visibility: 'private',
                isActive: active,
                isMember: false,
                memberCount: journey.memberCount,
                locked: true
            });
        }

        res.json({
            ...journey,
            isActive: active,
            isMember: !!membership,
            myRole: membership?.role || null
        });
    } catch (error) {
        console.error('Get journey detail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ────────────────────────────────────────────────
// @route   POST /api/journeys/:id/join
// @desc    Join a public journey
// @access  Private
// ────────────────────────────────────────────────
router.post('/:id/join', protect, async (req, res) => {
    try {
        const journey = await SharedJourney.findById(req.params.id)
            .select('visibility deadline closedAt memberCount')
            .lean();

        if (!journey) return res.status(404).json({ message: 'Journey not found' });
        if (!isJourneyActive(journey)) return res.status(400).json({ message: 'Journey has ended' });
        if (journey.visibility === 'private') return res.status(403).json({ message: 'Use invite code to join private journey' });

        // Upsert: safe if already a member
        const existing = await JourneyMember.findOne({ journey: journey._id, user: req.user._id }).lean();
        if (existing) return res.status(400).json({ message: 'Already a member' });

        await Promise.all([
            JourneyMember.create({ journey: journey._id, user: req.user._id, role: 'member' }),
            SharedJourney.findByIdAndUpdate(journey._id, { $inc: { memberCount: 1 } })
        ]);

        res.json({ message: 'Joined successfully' });
    } catch (error) {
        console.error('Join journey error:', error);
        res.status(500).json({ message: 'Server error joining journey' });
    }
});

// ────────────────────────────────────────────────
// @route   POST /api/journeys/join-code
// @desc    Join private journey via invite code
// @access  Private
// ────────────────────────────────────────────────
router.post('/join-code', protect, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Invite code required' });

        const journey = await SharedJourney.findOne({ inviteCode: code.toUpperCase() })
            .select('_id deadline closedAt memberCount visibility')
            .lean();

        if (!journey) return res.status(404).json({ message: 'Invalid invite code' });
        if (!isJourneyActive(journey)) return res.status(400).json({ message: 'Journey has ended' });

        const existing = await JourneyMember.findOne({ journey: journey._id, user: req.user._id }).lean();
        if (existing) return res.status(400).json({ message: 'Already a member' });

        await Promise.all([
            JourneyMember.create({ journey: journey._id, user: req.user._id, role: 'member' }),
            SharedJourney.findByIdAndUpdate(journey._id, { $inc: { memberCount: 1 } })
        ]);

        res.json({ message: 'Joined successfully', journeyId: journey._id });
    } catch (error) {
        console.error('Join by code error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ────────────────────────────────────────────────
// @route   DELETE /api/journeys/:id/join
// @desc    Leave a journey
// @access  Private
// ────────────────────────────────────────────────
router.delete('/:id/join', protect, async (req, res) => {
    try {
        const member = await JourneyMember.findOne({
            journey: req.params.id,
            user: req.user._id
        }).lean();

        if (!member) return res.status(404).json({ message: 'Not a member' });
        if (member.role === 'creator') return res.status(400).json({ message: 'Creator cannot leave — close the journey instead' });

        await Promise.all([
            JourneyMember.deleteOne({ _id: member._id }),
            SharedJourney.findByIdAndUpdate(req.params.id, { $inc: { memberCount: -1 } })
        ]);

        res.json({ message: 'Left journey' });
    } catch (error) {
        console.error('Leave journey error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ────────────────────────────────────────────────
// @route   PUT /api/journeys/:id/close
// @desc    Creator closes journey early
// @access  Private (creator only)
// ────────────────────────────────────────────────
router.put('/:id/close', protect, async (req, res) => {
    try {
        const journey = await SharedJourney.findById(req.params.id)
            .select('creator closedAt deadline title prompt memberCount postCount')
            .lean();

        if (!journey) return res.status(404).json({ message: 'Journey not found' });
        if (journey.creator.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the creator can close this journey' });
        }
        if (journey.closedAt || journey.deadline <= new Date()) {
            return res.status(400).json({ message: 'Journey already closed' });
        }

        await closeJourney(journey, req.user._id);

        res.json({ message: 'Journey closed successfully' });
    } catch (error) {
        console.error('Close journey error:', error);
        res.status(500).json({ message: 'Server error closing journey' });
    }
});

// ────────────────────────────────────────────────
// @route   GET /api/journeys/:id/posts
// @desc    Get journey feed (members only)
// @access  Private (members only)
// ────────────────────────────────────────────────
router.get('/:id/posts', protect, async (req, res) => {
    try {
        // Verify membership in one query
        const [journey, membership] = await Promise.all([
            SharedJourney.findById(req.params.id).select('visibility closedAt deadline').lean(),
            JourneyMember.findOne({ journey: req.params.id, user: req.user._id }).select('_id').lean()
        ]);

        if (!journey) return res.status(404).json({ message: 'Journey not found' });
        if (!membership) return res.status(403).json({ message: 'Members only' });

        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await Post.find({ journey: req.params.id })
            .populate('author', 'username avatar _id')
            .select('content images videos mood hashtags likeCount commentCount journey createdAt author')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        res.json(posts);
    } catch (error) {
        console.error('Get journey posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ────────────────────────────────────────────────
// @route   GET /api/journeys/:id/members
// @desc    Get journey members (members only)
// @access  Private (members only)
// ────────────────────────────────────────────────
router.get('/:id/members', protect, async (req, res) => {
    try {
        const membership = await JourneyMember.findOne({
            journey: req.params.id,
            user: req.user._id
        }).select('_id').lean();

        if (!membership) return res.status(403).json({ message: 'Members only' });

        const members = await JourneyMember.find({ journey: req.params.id })
            .select('user role createdAt')
            .populate('user', 'username avatar')
            .sort({ role: -1, createdAt: 1 }) // creator first
            .limit(100)
            .lean();

        res.json(members);
    } catch (error) {
        console.error('Get journey members error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
