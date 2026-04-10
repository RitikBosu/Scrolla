import mongoose from 'mongoose';
import crypto from 'crypto';

const sharedJourneySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        maxlength: [80, 'Title cannot exceed 80 characters'],
        trim: true
    },
    description: {
        type: String,
        maxlength: [400, 'Description cannot exceed 400 characters'],
        trim: true
    },
    prompt: {
        type: String,
        required: [true, 'Prompt is required'],
        maxlength: [200, 'Prompt cannot exceed 200 characters'],
        trim: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    closedAt: {
        type: Date, // set when creator closes early
        default: null
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    postingMode: {
        type: String,
        enum: ['open', 'broadcast'], // open = all members, broadcast = creator only
        default: 'open'
    },

    // Short invite code for private journeys (auto-generated, indexed via schema.index below)
    inviteCode: {
        type: String,
        default: null
    },

    // Cached counts — updated with $inc (avoids countDocuments on every read)
    memberCount: { type: Number, default: 0 },
    postCount:   { type: Number, default: 0 },

    mood: {
        type: String,
        enum: ['calm', 'motivated', 'low', 'entertain', 'energetic', 'discuss', null],
        default: null
    },
    coverImage: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// ─── Virtual: isActive ───
// Derive status at read time — no stale stored field to update
sharedJourneySchema.virtual('isActive').get(function () {
    return !this.closedAt && this.deadline > new Date();
});

// ─── Indexes ───
sharedJourneySchema.index({ deadline: 1, closedAt: 1 });         // Active discovery sort
sharedJourneySchema.index({ creator: 1, createdAt: -1 });         // My created journeys
sharedJourneySchema.index({ visibility: 1, closedAt: 1, deadline: 1 }); // Public active filter
sharedJourneySchema.index({ inviteCode: 1 }, { sparse: true, unique: true }); // Code lookup

// ─── Static: generate invite code ───
sharedJourneySchema.statics.generateInviteCode = function () {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F9C2E1"
};

const SharedJourney = mongoose.model('SharedJourney', sharedJourneySchema);

export default SharedJourney;
