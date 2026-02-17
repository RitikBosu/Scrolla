import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get posts with filters (mood, kidSafe)
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { mood, kidSafe, limit = 20, page = 1 } = req.query;

        // Build query
        const query = {};

        if (mood && mood !== 'all') {
            query.mood = mood;
        }

        if (kidSafe === 'true') {
            query.kidSafe = true;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const posts = await Post.find(query)
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Post.countDocuments(query);

        res.json({
            posts,
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
router.get('/user/:userId', async (req, res) => {
    try {
        const posts = await Post.find({ author: req.params.userId })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 });

        res.json(posts);
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ message: 'Server error fetching user posts' });
    }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', async (req, res) => {
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

        res.json(post);
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
    body('kidSafe').optional().isBoolean()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { content, images, mood, hashtags, kidSafe } = req.body;

        const post = await Post.create({
            author: req.user._id,
            content,
            images: images || [],
            mood,
            hashtags: hashtags || [],
            kidSafe: kidSafe || false
        });

        const populatedPost = await Post.findById(post._id)
            .populate('author', 'username avatar');

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
    body('kidSafe').optional().isBoolean()
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

        const { content, mood, hashtags, images, kidSafe } = req.body;

        if (content !== undefined) post.content = content;
        if (mood) post.mood = mood;
        if (hashtags) post.hashtags = hashtags;
        if (images) post.images = images;
        if (kidSafe !== undefined) post.kidSafe = kidSafe;

        await post.save();

        const updatedPost = await Post.findById(post._id)
            .populate('author', 'username avatar');

        res.json(updatedPost);
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Server error updating post' });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
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

        await post.deleteOne();

        res.json({ message: 'Post deleted successfully' });
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

        const likeIndex = post.likes.indexOf(req.user._id);

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
            post.likeCount = post.likes.length;
            await post.save();
            res.json({ message: 'Post unliked', liked: false, likeCount: post.likeCount });
        } else {
            // Like
            post.likes.push(req.user._id);
            post.likeCount = post.likes.length;
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

        const saveIndex = user.savedPosts.indexOf(req.params.id);

        if (saveIndex > -1) {
            // Unsave
            user.savedPosts.splice(saveIndex, 1);
            await user.save();
            res.json({ message: 'Post unsaved', saved: false });
        } else {
            // Save
            user.savedPosts.push(req.params.id);
            await user.save();
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

        if (!user.hiddenPosts.includes(req.params.id)) {
            user.hiddenPosts.push(req.params.id);
            await user.save();
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

        if (!user.reportedPosts.includes(req.params.id)) {
            user.reportedPosts.push(req.params.id);
            await user.save();
        }

        res.json({ message: 'Post reported' });
    } catch (error) {
        console.error('Report post error:', error);
        res.status(500).json({ message: 'Server error reporting post' });
    }
});

export default router;
