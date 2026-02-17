import express from 'express';
import { body, validationResult } from 'express-validator';
import Journey from '../models/Journey.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/journeys/start
// @desc    Start new journey
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

        const journey = await Journey.create({
            user: req.user._id,
            mood,
            purpose,
            duration
        });

        res.status(201).json(journey);
    } catch (error) {
        console.error('Start journey error:', error);
        res.status(500).json({ message: 'Server error starting journey' });
    }
});

// @route   PUT /api/journeys/:id/complete
// @desc    Mark journey complete
// @access  Private
router.put('/:id/complete', protect, async (req, res) => {
    try {
        const journey = await Journey.findById(req.params.id);

        if (!journey) {
            return res.status(404).json({ message: 'Journey not found' });
        }

        // Check if user owns the journey
        if (journey.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        journey.completed = true;
        journey.endTime = new Date();
        if (req.body.postsViewed) {
            journey.postsViewed = req.body.postsViewed;
        }

        await journey.save();

        res.json(journey);
    } catch (error) {
        console.error('Complete journey error:', error);
        res.status(500).json({ message: 'Server error completing journey' });
    }
});

// @route   GET /api/journeys/history
// @desc    Get user's journey history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const journeys = await Journey.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(journeys);
    } catch (error) {
        console.error('Get journey history error:', error);
        res.status(500).json({ message: 'Server error fetching journey history' });
    }
});

export default router;
