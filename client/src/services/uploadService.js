import api from './api';

export const uploadService = {
    // Get signature from backend for direct Cloudinary image upload
    getSignature: async () => {
        const response = await api.get('/upload/signature');
        return response.data;
    },

    // Get signature for direct Cloudinary video upload
    getVideoSignature: async () => {
        const response = await api.get('/upload/video-signature');
        return response.data;
    },

    // Upload image directly to Cloudinary
    uploadImage: async (file) => {
        try {
            const signatureData = await uploadService.getSignature();

            const formData = new FormData();
            formData.append('file', file);
            formData.append('signature', signatureData.signature);
            formData.append('timestamp', signatureData.timestamp);
            formData.append('api_key', signatureData.apiKey);
            formData.append('folder', signatureData.folder);

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`;

            const response = await fetch(cloudinaryUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Image upload failed');
            }

            return {
                url: data.secure_url,
                publicId: data.public_id,
                width: data.width,
                height: data.height
            };
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    },

    // Upload video directly to Cloudinary (with optional server-side trim)
    uploadVideo: async (file, onProgress, trimOptions = {}) => {
        try {
            console.log('📹 Getting video signature...');

            // Build query string with trim params for signature
            const queryParams = new URLSearchParams();
            if (trimOptions.trimStart > 0) queryParams.set('trimStart', trimOptions.trimStart);
            if (trimOptions.trimEnd) queryParams.set('trimEnd', trimOptions.trimEnd);
            if (trimOptions.muted) queryParams.set('muted', 'true');
            const queryStr = queryParams.toString();
            const signatureUrl = `/upload/video-signature${queryStr ? `?${queryStr}` : ''}`;

            const signatureData = await api.get(signatureUrl).then(r => r.data);
            console.log('📹 Got signature:', { cloudName: signatureData.cloudName, folder: signatureData.folder, transformation: signatureData.transformation });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('signature', signatureData.signature);
            formData.append('timestamp', signatureData.timestamp);
            formData.append('api_key', signatureData.apiKey);
            formData.append('folder', signatureData.folder);

            // Include transformation in upload for server-side trim
            if (signatureData.transformation) {
                formData.append('transformation', signatureData.transformation);
            }

            const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/video/upload`;
            console.log('📹 Uploading video to:', cloudinaryUrl);

            // Use XMLHttpRequest for upload progress
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable && onProgress) {
                        const progress = Math.round((e.loaded / e.total) * 100);
                        onProgress(progress);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const data = JSON.parse(xhr.responseText);
                        console.log('📹 Video uploaded successfully:', data.secure_url);
                        resolve({
                            url: data.secure_url,
                            publicId: data.public_id,
                            duration: data.duration,
                            width: data.width,
                            height: data.height
                        });
                    } else {
                        console.error('📹 Video upload failed with status:', xhr.status);
                        console.error('📹 Response:', xhr.responseText);
                        try {
                            const errorData = JSON.parse(xhr.responseText);
                            reject(new Error(errorData.error?.message || 'Video upload failed'));
                        } catch {
                            reject(new Error('Video upload failed'));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.open('POST', cloudinaryUrl);
                xhr.send(formData);
            });
        } catch (error) {
            console.error('Video upload error:', error);
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
