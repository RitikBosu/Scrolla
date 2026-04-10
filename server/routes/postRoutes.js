import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Follow from '../models/Follow.js';
import Like from '../models/Like.js';
import SavedPost from '../models/SavedPost.js';
import HiddenPost from '../models/HiddenPost.js';
import ReportedPost from '../models/ReportedPost.js';
import SharedJourney from '../models/SharedJourney.js';
import JourneyMember from '../models/JourneyMember.js';
import { protect } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Helper to attach isLiked properly
const attachUserInteractions = async (posts, userId) => {
    if (!posts) return posts;
    
    // Normalize to array
    const isArray = Array.isArray(posts);
    const postsList = isArray ? posts : [posts];
    if (postsList.length === 0) return isArray ? [] : null;

    // Convert to plain objects
    const plainPosts = postsList.map(p => p.toJSON ? p.toJSON() : p);

    if (!userId) {
        plainPosts.forEach(p => p.isLiked = false);
        return isArray ? plainPosts : plainPosts[0];
    }

    const postIds = plainPosts.map(p => p._id);
    const userLikes = await Like.find({ user: userId, post: { $in: postIds } });
    const likedPostIds = new Set(userLikes.map(l => l.post.toString()));

    plainPosts.forEach(p => {
        p.isLiked = likedPostIds.has(p._id.toString());
    });

    return isArray ? plainPosts : plainPosts[0];
};

// @route   GET /api/posts
// @desc    Get posts with filters (mood, kidSafe, following)
// @access  Public (but auth-aware for following filter)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { mood, kidSafe, following, limit = 20, page = 1 } = req.query;

        // Build query
        const query = { journey: null };

        if (mood && mood !== 'all') {
            query.mood = mood;
        }

        if (kidSafe === 'true') {
            query.kidSafe = true;
        }

        // Filter by followed users only
        if (following === 'true' && req.user) {
            const followingRecords = await Follow.find({ follower: req.user._id }).select('followee');
            const followingIds = followingRecords.map(f => f.followee);
            
            if (followingIds.length > 0) {
                query.author = { $in: followingIds };
            } else {
                // Not following anyone → return empty
                return res.json({ posts: [], total: 0, page: 1, pages: 0 });
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await Post.find(query)
            .populate('author', 'username avatar bio')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const postsWithInteractions = await attachUserInteractions(posts, req.user?._id);

        const total = await Post.countDocuments(query);

        res.json({
            posts: postsWithInteractions,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Server error fetching posts' });
    }
});

// @route   GET /api/posts/user/:userId
// @desc    Get posts by a specific user
// @access  Public
router.get('/user/:userId', optionalAuth, async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId, journey: null })
            .populate('author', 'username avatar bio')
            .sort({ createdAt: -1 });

        const postsWithInteractions = await attachUserInteractions(posts, req.user?._id);

        res.json(postsWithInteractions);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ message: 'Server error fetching user posts' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username avatar' }
            });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const postWithInteractions = await attachUserInteractions(post, req.user?._id);

        res.json(postWithInteractions);
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Server error fetching post' });
    }
});

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post('/', protect, [
    body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be 1-1000 characters'),
    body('mood').isIn(['all', 'calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss']).withMessage('Invalid mood'),
    body('hashtags').optional().isArray(),
    body('kidSafe').optional().isBoolean(),
    body('videos').optional().isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { content, images, videos, mood, hashtags, kidSafe, journeyId } = req.body;

        // ─── Journey validation ───
        let journeyRef = null;
        if (journeyId) {
            const [journey, membership] = await Promise.all([
                SharedJourney.findById(journeyId).select('closedAt deadline postingMode creator').lean(),
                JourneyMember.findOne({ journey: journeyId, user: req.user._id }).select('role').lean()
            ]);

            if (!journey) return res.status(404).json({ message: 'Journey not found' });
            if (journey.closedAt || journey.deadline <= new Date()) {
                return res.status(400).json({ message: 'Journey has ended — cannot post' });
            }
            if (!membership) return res.status(403).json({ message: 'Join the journey before posting' });
            if (journey.postingMode === 'broadcast' && journey.creator.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: 'Only the creator can post in broadcast mode' });
            }
            journeyRef = journeyId;
        }

        const post = await Post.create({
            author: req.user._id,
            content,
            images: images || [],
            videos: videos || [],
            mood,
            hashtags: (hashtags || []).map(tag => tag.toLowerCase().trim()),
            kidSafe: kidSafe || false,
            journey: journeyRef
        });

        // Increment postCount atomically (non-blocking)
        if (journeyRef) {
            SharedJourney.findByIdAndUpdate(journeyRef, { $inc: { postCount: 1 } }).exec();
        }

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'username avatar')
            .lean();

        res.status(201).json(populatedPost);
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error creating post' });
    }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (own posts only)
router.put('/:id', protect, [
    body('content').optional().trim().isLength({ min: 1, max: 1000 }),
    body('mood').optional().isIn(['all', 'calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss']),
    body('kidSafe').optional().isBoolean(),
    body('videos').optional().isArray()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user owns the post
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this post' });
        }

        const { content, mood, hashtags, images, videos, kidSafe } = req.body;

        if (content !== undefined) post.content = content;
        if (mood) post.mood = mood;
        if (hashtags) post.hashtags = hashtags.map(tag => tag.toLowerCase().trim());
        if (images) post.images = images;
        if (videos) post.videos = videos;
        if (kidSafe !== undefined) post.kidSafe = kidSafe;

        await post.save();

        const updatedPost = await Post.findById(post._id)
            .populate('author', 'username avatar followers');

        res.json(updatedPost);
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Server error updating post' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post + cleanup Cloudinary assets
// @access  Private (own posts only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user owns the post
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Helper: extract Cloudinary public_id from URL (fallback for legacy data)
        const extractPublicId = (url) => {
            try {
                const parts = url.split('/upload/');
                if (parts.length < 2) return null;
                const pathAfterUpload = parts[1];
                const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
                return withoutVersion.replace(/\.[^.]+$/, '');
            } catch {
                return null;
            }
        };

        // Configure cloudinary
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        // Delete images from Cloudinary
        if (post.images && post.images.length > 0) {
            for (const image of post.images) {
                // Use stored publicId if available, otherwise extract from URL
                const pid = image.publicId || extractPublicId(image.url);
                if (pid) {
                    try {
                        await cloudinary.uploader.destroy(pid, { resource_type: 'image' });
                        console.log('Deleted image from Cloudinary:', pid);
                    } catch (err) {
                        console.error('Failed to delete image ' + pid + ':', err.message);
                    }
                }
            }
        }

        // Delete videos from Cloudinary
        if (post.videos && post.videos.length > 0) {
            for (const video of post.videos) {
                const pid = video.publicId || extractPublicId(video.url);
                if (pid) {
                    try {
                        await cloudinary.uploader.destroy(pid, { resource_type: 'video' });
                        console.log('Deleted video from Cloudinary:', pid);
                    } catch (err) {
                        console.error('Failed to delete video ' + pid + ':', err.message);
                    }
                }
            }
        }

        // Delete from MongoDB
        await post.deleteOne();

        res.json({ message: 'Post and media deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error deleting post' });
    }
});

// @route   POST /api/posts/:id/like
// @desc    Toggle like on post
// @access  Private
router.post('/:id/like', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingLike = await Like.findOne({
            user: req.user._id,
            post: req.params.id
        });

        if (existingLike) {
            // Unlike
            await existingLike.deleteOne();
            post.likeCount = Math.max(0, post.likeCount - 1);
            await post.save();
            res.json({ message: 'Post unliked', liked: false, likeCount: post.likeCount });
        } else {
            // Like
            await Like.create({
                user: req.user._id,
                post: req.params.id
            });
            post.likeCount += 1;
            await post.save();
            res.json({ message: 'Post liked', liked: true, likeCount: post.likeCount });
        }
    } catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ message: 'Server error liking post' });
    }
});

// @route   POST /api/posts/:id/save
// @desc    Save post
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingSave = await SavedPost.findOne({
            user: req.user._id,
            post: req.params.id
        });

        if (existingSave) {
            // Unsave
            await existingSave.deleteOne();
            res.json({ message: 'Post unsaved', saved: false });
        } else {
            // Save
            await SavedPost.create({
                user: req.user._id,
                post: req.params.id
            });
            res.json({ message: 'Post saved', saved: true });
        }
    } catch (error) {
        console.error('Save post error:', error);
        res.status(500).json({ message: 'Server error saving post' });
    }
});

// @route   POST /api/posts/:id/hide
// @desc    Hide post
// @access  Private
router.post('/:id/hide', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingHide = await HiddenPost.findOne({
            user: req.user._id,
            post: req.params.id
        });

        if (!existingHide) {
            await HiddenPost.create({
                user: req.user._id,
                post: req.params.id
            });
        }

        res.json({ message: 'Post hidden' });
    } catch (error) {
        console.error('Hide post error:', error);
        res.status(500).json({ message: 'Server error hiding post' });
    }
});

// @route   POST /api/posts/:id/report
// @desc    Report post
// @access  Private
router.post('/:id/report', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const existingReport = await ReportedPost.findOne({
            user: req.user._id,
            post: req.params.id
        });

        if (!existingReport) {
            await ReportedPost.create({
                user: req.user._id,
                post: req.params.id
            });
        }

        res.json({ message: 'Post reported' });
    } catch (error) {
        console.error('Report post error:', error);
        res.status(500).json({ message: 'Server error reporting post' });
    }
});

export default router;
