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
    images: [{
        type: String
    }],
    mood: {
        type: String,
        enum: ['all', 'calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss'],
        required: [true, 'Mood is required']
    },
    hashtags: [{
        type: String,
        trim: true
    }],
    kidSafe: {
        type: Boolean,
        default: false
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
postSchema.index({ mood: 1, kidSafe: 1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);

export default Post;
