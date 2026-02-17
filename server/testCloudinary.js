// Test Cloudinary configuration
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '✓ Set' : '✗ Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '✓ Set' : '✗ Missing');

// Test connection
cloudinary.api.ping()
    .then(result => {
        console.log('✅ Cloudinary connection successful!');
        console.log('Result:', result);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Cloudinary connection failed!');
        console.error('Error:', error.message);
        process.exit(1);
    });
