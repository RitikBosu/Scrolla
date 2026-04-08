import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Like from './models/Like.js';

dotenv.config();

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
};

const migrateLikes = async () => {
    await connectDB();

    // Get all posts, we use the naked collection because the schema dropped `likes` array
    const posts = await mongoose.connection.db.collection('posts').find({}).toArray();

    let migratedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
        if (!post.likes || post.likes.length === 0) {
            skippedCount++;
            continue;
        }

        for (const userId of post.likes) {
            try {
                await Like.updateOne(
                    { user: userId, post: post._id },
                    { $setOnInsert: { user: userId, post: post._id } },
                    { upsert: true }
                );
            } catch (err) {
                console.error(`Error migrating like ${userId} -> ${post._id}:`, err);
            }
        }
        
        // Ensure likeCount matches length
        await mongoose.connection.db.collection('posts').updateOne(
            { _id: post._id },
            { $set: { likeCount: post.likes.length } }
        );
        
        migratedCount++;
        console.log(`  Migrated post ${post._id} (${post.likes.length} likes)`);
    }

    console.log(`\n✅ Like Migration complete!`);
    console.log(`   Posts with likes migrated: ${migratedCount}`);
    console.log(`   Posts skipped (no likes): ${skippedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
};

migrateLikes().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
});
