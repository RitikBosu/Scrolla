import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -savedPosts -hiddenPosts -reportedPosts')
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            ...user.toJSON(),
            followerCount: user.followers.length,
            followingCount: user.following.length
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error fetching user' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', protect, [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('bio').optional().isLength({ max: 200 }),
    body('avatar').optional().isURL()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Check if user is updating their own profile
        if (req.user._id.toString() !== req.params.id) {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }

        const { username, bio, avatar } = req.body;
        const updateFields = {};

        if (username) updateFields.username = username;
        if (bio !== undefined) updateFields.bio = bio;
        if (avatar) updateFields.avatar = avatar;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Can't follow yourself
        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot follow yourself' });
        }

        // Check if already following
        if (currentUser.following.includes(req.params.id)) {
            return res.status(400).json({ message: 'Already following this user' });
        }

        // Add to following and followers
        currentUser.following.push(req.params.id);
        userToFollow.followers.push(req.user._id);

        await currentUser.save();
        await userToFollow.save();

        res.json({ message: 'Successfully followed user' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ message: 'Server error following user' });
    }
});

// @route   DELETE /api/users/:id/follow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/follow', protect, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToUnfollow) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if following
        if (!currentUser.following.includes(req.params.id)) {
            return res.status(400).json({ message: 'Not following this user' });
        }

        // Remove from following and followers
        currentUser.following = currentUser.following.filter(
            id => id.toString() !== req.params.id
        );
        userToUnfollow.followers = userToUnfollow.followers.filter(
            id => id.toString() !== req.user._id.toString()
        );

        await currentUser.save();
        await userToUnfollow.save();

        res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.status(500).json({ message: 'Server error unfollowing user' });
    }
});

// @route   GET /api/users/:id/followers
// @desc    Get user's followers
// @access  Public
router.get('/:id/followers', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('followers', 'username avatar bio');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.followers);
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error fetching followers' });
    }
});

// @route   GET /api/users/:id/following
// @desc    Get users being followed
// @access  Public
router.get('/:id/following', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('following', 'username avatar bio');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.following);
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error fetching following' });
    }
});

export default router;
