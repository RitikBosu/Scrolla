import api from './api';

export const uploadService = {
    // Get signature from backend for direct Cloudinary upload
    getSignature: async () => {
        const response = await api.get('/upload/signature');
        return response.data;
    },

    // Upload directly to Cloudinary (fast!)
    uploadImage: async (file) => {
        try {
            // Get signature from backend
            const signatureData = await uploadService.getSignature();

            // Create form data for Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('signature', signatureData.signature);
            formData.append('timestamp', signatureData.timestamp);
            formData.append('api_key', signatureData.apiKey);
            formData.append('folder', signatureData.folder);

            // Upload directly to Cloudinary
            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Upload failed');
            }

            return {
                imageUrl: data.secure_url,
                publicId: data.public_id
            };
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    },

    // Upload multiple images
    uploadImages: async (files) => {
        const uploads = files.map(file => uploadService.uploadImage(file));
        return Promise.all(uploads);
    }
};

export default uploadService;
