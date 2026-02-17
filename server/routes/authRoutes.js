import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email or username' });
        }

        // Create user with default avatar
        const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
        const user = await User.create({
            username,
            email,
            password,
            avatar
        });

        // Return user info and token
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            kidsMode: user.kidsMode,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Return user info and token
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('followers', 'username avatar')
            .populate('following', 'username avatar');

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            bio: user.bio,
            kidsMode: user.kidsMode,
            followers: user.followers,
            following: user.following,
            followerCount: user.followers.length,
            followingCount: user.following.length
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

export default router;
