import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// @route   POST /api/upload
// @desc    Upload single image
// @access  Private
router.post('/', protect, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            message: 'Image uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading image' });
    }
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images
// @access  Private
router.post('/multiple', protect, upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
        res.status(200).json({
            message: 'Images uploaded successfully',
            imageUrls: imageUrls
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Error uploading images' });
    }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files. Maximum 5 files allowed.' });
        }
    }

    if (error) {
        return res.status(400).json({ message: error.message });
    }

    next();
});

export default router;
