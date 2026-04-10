import mongoose from 'mongoose';

// Preserved record after Journey closes and posts are deleted.
// Lightweight snapshot so users can recall participation on their profile.
const journeyHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Keep journey reference (journey doc stays in DB even after closing)
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedJourney',
        required: true
    },
    // Snapshots — stored so profile works even if journey doc is later deleted
    journeyTitle:  { type: String, required: true },
    journeyPrompt: { type: String, required: true },
    role:          { type: String, enum: ['creator', 'member'], required: true },

    // Stats at close time
    userPostCount:  { type: Number, default: 0 }, // how many posts this user made
    totalMembers:   { type: Number, default: 0 },
    totalPosts:     { type: Number, default: 0 },

    joinedAt:  { type: Date, required: true },
    closedAt:  { type: Date, required: true }
}, {
    timestamps: true
});

// Profile history — newest first
journeyHistorySchema.index({ user: 1, closedAt: -1 });
// Prevent duplicate history records per user per journey
journeyHistorySchema.index({ user: 1, journey: 1 }, { unique: true });

const JourneyHistory = mongoose.model('JourneyHistory', journeyHistorySchema);

export default JourneyHistory;
