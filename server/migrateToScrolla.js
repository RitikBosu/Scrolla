// Migrate data from 'test' database to 'scrolla' database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateData = async () => {
    try {
        // Connect to test database
        const testUri = process.env.MONGODB_URI.replace('/scrolla', '/test');
        const testConn = await mongoose.createConnection(testUri).asPromise();
        console.log('✅ Connected to TEST database');

        // Connect to scrolla database
        const scrollaUri = process.env.MONGODB_URI;
        const scrollaConn = await mongoose.createConnection(scrollaUri).asPromise();
        console.log('✅ Connected to SCROLLA database');

        // Get all collections from test database
        const collections = ['users', 'posts', 'comments', 'journeys'];

        for (const collectionName of collections) {
            console.log(`\n📦 Migrating ${collectionName}...`);

            try {
                // Get data from test database
                const testCollection = testConn.collection(collectionName);
                const documents = await testCollection.find({}).toArray();

                if (documents.length === 0) {
                    console.log(`   ⚠️  No documents found in ${collectionName}`);
                    continue;
                }

                // Insert into scrolla database
                const scrollaCollection = scrollaConn.collection(collectionName);

                // Clear existing data in scrolla (optional - remove if you want to keep existing data)
                await scrollaCollection.deleteMany({});

                // Insert all documents
                await scrollaCollection.insertMany(documents);

                console.log(`   ✅ Migrated ${documents.length} documents`);
            } catch (error) {
                console.log(`   ⚠️  Collection ${collectionName} might not exist: ${error.message}`);
            }
        }

        console.log('\n🎉 Migration complete!');
        console.log('\nYour data is now in the "scrolla" database.');
        console.log('You can login with your existing account!');

        await testConn.close();
        await scrollaConn.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
};

migrateData();
