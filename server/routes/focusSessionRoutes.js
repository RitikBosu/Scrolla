import express from 'express';
import { body, validationResult } from 'express-validator';
import FocusSession from '../models/FocusSession.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/sessions/start
// @desc    Start new focus session
// @access  Private
router.post('/start', protect, [
    body('mood').isIn(['calm', 'focused', 'motivated', 'low', 'happy', 'stressed']).withMessage('Invalid mood'),
    body('purpose').isIn(['learn', 'relax', 'discuss', 'inspire', 'entertain']).withMessage('Invalid purpose'),
    body('duration').isIn([5, 10, 20, 30]).withMessage('Invalid duration')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { mood, purpose, duration } = req.body;

        const session = await FocusSession.create({
            user: req.user._id,
            mood,
            purpose,
            duration
        });

        res.status(201).json(session);
    } catch (error) {
        console.error('Start focus session error:', error);
        res.status(500).json({ message: 'Server error starting focus session' });
    }
});

// @route   PUT /api/sessions/:id/complete
// @desc    Mark focus session complete
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
    try {
        const session = await FocusSession.findById(req.params.id).lean();

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (session.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updated = await FocusSession.findByIdAndUpdate(
            req.params.id,
            {
                completed: true,
                endTime: new Date(),
                ...(req.body.postsViewed && { postsViewed: req.body.postsViewed })
            },
            { new: true, lean: true }
        );

        res.json(updated);
    } catch (error) {
        console.error('Complete focus session error:', error);
        res.status(500).json({ message: 'Server error completing focus session' });
    }
});

// @route   GET /api/sessions/history
// @desc    Get user's focus session history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const sessions = await FocusSession
            .find({ user: req.user._id })
            .select('mood purpose duration completed startTime endTime createdAt')
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json(sessions);
    } catch (error) {
        console.error('Get focus session history error:', error);
        res.status(500).json({ message: 'Server error fetching session history' });
    }
});

export default router;
