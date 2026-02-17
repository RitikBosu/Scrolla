// Quick test to upload a sample image to Cloudinary
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Testing Cloudinary upload...\n');

// Upload a test image from URL
const testImageUrl = 'https://via.placeholder.com/500x500.png?text=Test+Upload';

cloudinary.uploader.upload(testImageUrl, {
    folder: 'scrolla',
    public_id: 'test_upload_' + Date.now()
})
    .then(result => {
        console.log('✅ Upload successful!\n');
        console.log('Image URL:', result.secure_url);
        console.log('Public ID:', result.public_id);
        console.log('\n📁 Check your Cloudinary dashboard:');
        console.log('   https://console.cloudinary.com/console/media_library/folders/scrolla');
        console.log('\nYou should see the test image in the "scrolla" folder!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Upload failed!');
        console.error('Error:', error.message);
        process.exit(1);
    });
