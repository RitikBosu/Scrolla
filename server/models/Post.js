import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Post content is required'],
        maxlength: [1000, 'Post cannot exceed 1000 characters']
    },
    // Structured image schema (replaces old Mixed type)
    images: [{
        url: { type: String, required: true },
        publicId: String,
        filter: { type: String, default: 'none' },
        aspectRatio: { type: String, default: 'original' }
    }],
    videos: [{
        url: String,
        publicId: String,
        trimStart: { type: Number, default: 0 },
        trimEnd: Number,
        duration: Number,
        muted: { type: Boolean, default: false },
        aspectRatio: { type: String, default: '16:9' },
        thumbnailTime: { type: Number, default: 0 },
        filter: { type: String, default: 'none' }
    }],
    mood: {
        type: String,
        enum: ['all', 'calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss'],
        required: [true, 'Mood is required']
    },
    hashtags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    kidSafe: {
        type: Boolean,
        default: false
    },
    likeCount: {
        type: Number,
        default: 0
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    commentCount: {
        type: Number,
        default: 0
    },
    // Optional: post tagged to a shared Journey
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedJourney',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
postSchema.index({ mood: 1, kidSafe: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ journey: 1, createdAt: -1 }); // Journey feed query

const Post = mongoose.model('Post', postSchema);

export default Post;

