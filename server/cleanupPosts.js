// Clean up posts with invalid author references
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const cleanupPosts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Post = mongoose.model('Post');
        const User = mongoose.model('User');

        // Find all posts
        const posts = await Post.find({});
        console.log(`\nFound ${posts.length} posts`);

        let deletedCount = 0;
        let validCount = 0;

        for (const post of posts) {
            // Check if author exists
            const authorExists = await User.findById(post.author);

            if (!authorExists) {
                console.log(`❌ Deleting post ${post._id} - author ${post.author} not found`);
                await Post.deleteOne({ _id: post._id });
                deletedCount++;
            } else {
                validCount++;
            }
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   Valid posts: ${validCount}`);
        console.log(`   Deleted posts: ${deletedCount}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Cleanup error:', error);
        process.exit(1);
    }
};

cleanupPosts();
