/**
 * Migration: Rename 'journeys' collection → 'focussessions'
 * Run once: node server/migrateJourneyToFocusSession.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const names = collections.map(c => c.name);

    if (!names.includes('journeys')) {
        console.log('ℹ️  No "journeys" collection found — nothing to migrate.');
        return process.exit(0);
    }

    if (names.includes('focussessions')) {
        console.log('ℹ️  "focussessions" collection already exists — skipping.');
        return process.exit(0);
    }

    await db.collection('journeys').rename('focussessions');
    console.log('✅ Renamed "journeys" → "focussessions"');
    process.exit(0);
};

run().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
