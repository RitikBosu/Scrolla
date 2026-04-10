import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mood: {
        type: String,
        enum: ['calm', 'focused', 'motivated', 'low', 'happy', 'stressed'],
        required: true
    },
    purpose: {
        type: String,
        enum: ['learn', 'relax', 'discuss', 'inspire', 'entertain'],
        required: true
    },
    duration: {
        type: Number, // in minutes
        enum: [5, 10, 20, 30],
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    postsViewed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    completed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    collection: 'focussessions' // explicit collection name
});

focusSessionSchema.index({ user: 1, createdAt: -1 });

const FocusSession = mongoose.model('FocusSession', focusSessionSchema);

export default FocusSession;
