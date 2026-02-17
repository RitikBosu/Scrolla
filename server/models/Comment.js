import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        maxlength: [500, 'Comment cannot exceed 500 characters']
    }
}, {
    timestamps: true
});

// Index for efficient post comment retrieval
commentSchema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
