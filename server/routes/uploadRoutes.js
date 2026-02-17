import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   GET /api/upload/signature
// @desc    Generate signature for direct Cloudinary upload
// @access  Private
router.get('/signature', protect, (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'scrolla';

        // Generate signature
        const signature = cloudinary.utils.api_sign_request(
            {
                timestamp: timestamp,
                folder: folder
            },
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            signature: signature,
            timestamp: timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: folder
        });
    } catch (error) {
        console.error('Signature generation error:', error);
        res.status(500).json({ message: 'Error generating upload signature' });
    }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete image from Cloudinary
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
    try {
        const publicId = `scrolla/${req.params.publicId}`;

        const result = await cloudinary.uploader.destroy(publicId);

        res.status(200).json({
            message: 'Image deleted successfully',
            result: result
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting image' });
    }
});

export default router;
