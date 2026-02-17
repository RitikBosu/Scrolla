import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadService } from '../services/uploadService';

const FileUpload = ({ onUpload, maxFiles = 5, existingImages = [] }) => {
    const [images, setImages] = useState(existingImages);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);

        if (files.length + images.length > maxFiles) {
            setError(`Maximum ${maxFiles} images allowed`);
            return;
        }

        setUploading(true);
        setError('');
        setUploadProgress(0);

        try {
            const uploadedImages = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    setError(`${file.name} is not an image file`);
                    continue;
                }

                // Validate file size (10MB)
                if (file.size > 10 * 1024 * 1024) {
                    setError(`${file.name} is too large (max 10MB)`);
                    continue;
                }

                // Upload directly to Cloudinary
                const result = await uploadService.uploadImage(file);
                uploadedImages.push(result.imageUrl);

                // Update progress
                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }

            const newImages = [...images, ...uploadedImages];
            setImages(newImages);
            onUpload(newImages);
            setUploadProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload images. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onUpload(newImages);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
            </label>

            {/* Upload Button */}
            {images.length < maxFiles && (
                <div className="mb-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Upload className="w-5 h-5" />
                        <span>
                            {uploading
                                ? `Uploading... ${uploadProgress}%`
                                : 'Upload Images'}
                        </span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                        Max {maxFiles} images, 10MB each • Direct to Cloudinary
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {images.map((img, index) => (
                        <div key={index} className="relative group">
                            <img
                                src={img}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                                loading="lazy"
                                onError={(e) => {
                                    console.error('Image failed to load:', img);
                                    e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={uploading}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
