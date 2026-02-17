import express from 'express';
import { body, validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/posts/:postId/comments
// @desc    Get all comments for a post
// @access  Public
router.get('/:postId/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.postId })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error fetching comments' });
    }
});

// @route   POST /api/posts/:postId/comments
// @desc    Add comment to post
// @access  Private
router.post('/:postId/comments', protect, [
    body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be 1-500 characters')
], async (req, res) => {
    console.log(`📝 Adding comment to post ${req.params.postId} by user ${req.user._id}`);
    console.log('Content:', req.body.content);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const post = await Post.findById(req.params.postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const comment = await Comment.create({
            post: req.params.postId,
            author: req.user._id,
            content: req.body.content
        });

        // Initialize comments array if it doesn't exist
        if (!post.comments) {
            post.comments = [];
        }

        // Add comment to post's comments array and update count
        post.comments.push(comment._id);
        post.commentCount = post.comments.length;
        await post.save();
        console.log('✅ Comment added to post, new count:', post.commentCount);


        const populatedComment = await Comment.findById(comment._id)
            .populate('author', 'username avatar');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error adding comment' });
    }
});

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (own comments only)
router.put('/:id', protect, [
    body('content').trim().isLength({ min: 1, max: 500 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }

        comment.content = req.body.content;
        await comment.save();

        const updatedComment = await Comment.findById(comment._id)
            .populate('author', 'username avatar');

        res.json(updatedComment);
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Server error updating comment' });
    }
});

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (own comments only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Remove comment from post's comments array
        const post = await Post.findById(comment.post);
        if (post) {
            post.comments = post.comments.filter(c => c.toString() !== req.params.id);
            post.commentCount = post.comments.length;
            await post.save();
        }

        await comment.deleteOne();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error deleting comment' });
    }
});

export default router;
