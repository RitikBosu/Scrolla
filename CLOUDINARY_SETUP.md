# Cloudinary Setup Guide

## Step 1: Create Free Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up with email
3. Verify your email
4. You'll get **25GB storage** and **25GB bandwidth/month** for free!

## Step 2: Get Your Credentials

After signing up:
1. Go to Dashboard
2. You'll see:
   - **Cloud Name**: (e.g., `dxxxxx`)
   - **API Key**: (e.g., `123456789012345`)
   - **API Secret**: (e.g., `abcdefghijklmnopqrstuvwxyz`)

## Step 3: Add to Your .env File

Open `server/.env` and add these lines:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace with your actual values from the dashboard.

## Step 4: Install Dependencies

I'll run this command for you:
```bash
npm install cloudinary multer-storage-cloudinary
```

## Step 5: I'll Update the Code

After you add the credentials, I'll update:
- `uploadRoutes.js` - to upload to Cloudinary
- The code will automatically work with your frontend

## What You'll Get

✅ Fast image uploads (multipart, not base64)
✅ Images served from CDN (fast worldwide)
✅ Automatic optimization
✅ Ready for videos later
✅ No MongoDB size limits
✅ Free 25GB storage

## Ready?

Once you've:
1. Created your Cloudinary account
2. Added the 3 credentials to `.env`

Let me know and I'll update the code!
