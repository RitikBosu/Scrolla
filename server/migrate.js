// Run this script once to migrate old user and post data to new schema
// Usage: node migrate.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Update all users: remove ageZone, add kidsMode if missing
        const userResult = await mongoose.connection.db.collection('users').updateMany(
            {},
            {
                $unset: { ageZone: "" },
                $set: { kidsMode: false }
            }
        );
        console.log(`✅ Updated ${userResult.modifiedCount} users`);

        // Update all posts: remove purpose and ageZone, add kidSafe if missing
        const postResult = await mongoose.connection.db.collection('posts').updateMany(
            {},
            {
                $unset: { purpose: "", ageZone: "" },
                $set: { kidSafe: false }
            }
        );
        console.log(`✅ Updated ${postResult.modifiedCount} posts`);

        // Update posts with old mood values to new ones
        const moodMapping = {
            'focused': 'calm',
            'happy': 'entertain',
            'stressed': 'low'
        };

        for (const [oldMood, newMood] of Object.entries(moodMapping)) {
            await mongoose.connection.db.collection('posts').updateMany(
                { mood: oldMood },
                { $set: { mood: newMood } }
            );
        }
        console.log('✅ Updated mood values');

        console.log('\n🎉 Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

migrateData();
