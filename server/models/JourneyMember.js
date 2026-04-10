import mongoose from 'mongoose';

const journeyMemberSchema = new mongoose.Schema({
    journey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedJourney',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['creator', 'member'],
        default: 'member'
    }
}, {
    timestamps: true
});

// ─── Indexes ───
// Unique — prevents duplicate joins
journeyMemberSchema.index({ journey: 1, user: 1 }, { unique: true });
// "My journeys" feed on profile
journeyMemberSchema.index({ user: 1, createdAt: -1 });
// "Who's in this journey?" list
journeyMemberSchema.index({ journey: 1, role: 1 });

const JourneyMember = mongoose.model('JourneyMember', journeyMemberSchema);

export default JourneyMember;
