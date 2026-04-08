import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SavedPost from './models/SavedPost.js';
import HiddenPost from './models/HiddenPost.js';
import ReportedPost from './models/ReportedPost.js';

dotenv.config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
};

const migrateUserPostRelations = async () => {
    await connectDB();

    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();

    let savedMigrated = 0;
    let hiddenMigrated = 0;
    let reportedMigrated = 0;

    for (const user of users) {
        if (user.savedPosts && user.savedPosts.length > 0) {
            for (const postId of user.savedPosts) {
                try {
                    await SavedPost.updateOne(
                        { user: user._id, post: postId },
                        { $setOnInsert: { user: user._id, post: postId } },
                        { upsert: true }
                    );
                } catch {
                    // Skip malformed legacy relation entries.
                }
            }
            savedMigrated++;
        }

        if (user.hiddenPosts && user.hiddenPosts.length > 0) {
            for (const postId of user.hiddenPosts) {
                try {
                    await HiddenPost.updateOne(
                        { user: user._id, post: postId },
                        { $setOnInsert: { user: user._id, post: postId } },
                        { upsert: true }
                    );
                } catch {
                    // Skip malformed legacy relation entries.
                }
            }
            hiddenMigrated++;
        }

        if (user.reportedPosts && user.reportedPosts.length > 0) {
            for (const postId of user.reportedPosts) {
                try {
                    await ReportedPost.updateOne(
                        { user: user._id, post: postId },
                        { $setOnInsert: { user: user._id, post: postId } },
                        { upsert: true }
                    );
                } catch {
                    // Skip malformed legacy relation entries.
                }
            }
            reportedMigrated++;
        }
    }

    console.log(`\n✅ User Post Relations Migration complete!`);
    console.log(`   Users with saved posts migrated: ${savedMigrated}`);
    console.log(`   Users with hidden posts migrated: ${hiddenMigrated}`);
    console.log(`   Users with reported posts migrated: ${reportedMigrated}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
};

migrateUserPostRelations().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
