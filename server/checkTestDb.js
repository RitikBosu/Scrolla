// Check what's in the 'test' database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Override URI to look at 'test' database
const uri = process.env.MONGODB_URI.replace('/scrolla', '/test');

const checkDatabase = async () => {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB (test database)');
        console.log('📊 Database:', mongoose.connection.db.databaseName);

        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`\n👥 Users in database: ${users.length}`);
        if (users.length > 0) {
            users.forEach(u => console.log(`  - ${u.username} (${u.email})`));
        }

        const posts = await mongoose.connection.db.collection('posts').find({}).toArray();
        console.log(`\n📝 Posts in database: ${posts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkDatabase();
