import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import journeyRoutes from './routes/journeyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
try {
    mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
    console.log('Uploads directory already exists');
}

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/upload', uploadRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Scrolla API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            posts: '/api/posts',
            journeys: '/api/journeys',
            upload: '/api/upload'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
