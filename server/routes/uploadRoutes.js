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
// @desc    Generate signature for direct Cloudinary upload (image)
// @access  Private
router.get('/signature', protect, (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'scrolla';

        const signature = cloudinary.utils.api_sign_request(
            { timestamp, folder },
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder
        });
    } catch (error) {
        console.error('Signature generation error:', error);
        res.status(500).json({ message: 'Error generating upload signature' });
    }
});

// @route   GET /api/upload/video-signature
// @desc    Generate signature for direct Cloudinary video upload (with optional trim)
// @access  Private
router.get('/video-signature', protect, (req, res) => {
    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        const folder = 'scrolla/videos';

        // Build incoming transformation for trim if provided
        const { trimStart, trimEnd, muted } = req.query;
        const transformParts = [];
        if (trimStart && Number(trimStart) > 0) transformParts.push(`so_${trimStart}`);
        if (trimEnd) transformParts.push(`eo_${trimEnd}`);
        if (muted === 'true') transformParts.push('ac_none');
        const transformation = transformParts.length > 0 ? transformParts.join(',') : undefined;

        // Build params to sign (Cloudinary requires ALL upload params to be signed)
        const paramsToSign = { timestamp, folder };
        if (transformation) paramsToSign.transformation = transformation;

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET
        );

        res.json({
            signature,
            timestamp,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder,
            transformation // undefined if no trim, string if trim specified
        });
    } catch (error) {
        console.error('Video signature generation error:', error);
        res.status(500).json({ message: 'Error generating video upload signature' });
    }
});

// @route   DELETE /api/upload/:publicId
// @desc    Delete media from Cloudinary
// @access  Private
router.delete('/:publicId', protect, async (req, res) => {
    try {
        const { type } = req.query; // 'image' or 'video'
        const publicId = `scrolla/${req.params.publicId}`;

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: type || 'image'
        });

        res.status(200).json({
            message: 'Media deleted successfully',
            result
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Error deleting media' });
    }
});

export default router;
