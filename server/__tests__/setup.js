import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Setup database before tests
beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
        console.log('✅ Test Database (in-memory MongoDB) connected');
    } catch (error) {
        console.error('❌ Test database connection failed:', error);
        throw error;
    }
});

// Cleanup after tests
afterAll(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('✅ Test database cleanup completed');
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
});

// Clear collections between tests
beforeEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});

