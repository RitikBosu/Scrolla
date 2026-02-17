// Check what's in the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log('📊 Database:', mongoose.connection.db.databaseName);

        const users = await mongoose.connection.db.collection('users').find({}).toArray();
        console.log(`\n👥 Users in database: ${users.length}`);
        if (users.length > 0) {
            users.forEach(u => console.log(`  - ${u.username} (${u.email})`));
        }

        const posts = await mongoose.connection.db.collection('posts').find({}).toArray();
        console.log(`\n📝 Posts in database: ${posts.length}`);

        // List all databases
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('\n🗄️  All databases:');
        dbs.databases.forEach(db => {
            console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkDatabase();
