import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadService } from '../services/uploadService';

const FileUpload = ({ onUpload, maxFiles = 5, existingImages = [] }) => {
    const [images, setImages] = useState(existingImages);
    const [uploading, setUploading] = useState(false);
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

        try {
            const uploadedImages = [];

            for (const file of files) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    setError(`${file.name} is not an image file`);
                    continue;
                }

                // Validate file size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    setError(`${file.name} is too large (max 5MB)`);
                    continue;
                }

                // Upload to server
                const result = await uploadService.uploadImage(file);
                uploadedImages.push(result.imageUrl);
            }

            const newImages = [...images, ...uploadedImages];
            setImages(newImages);
            onUpload(newImages);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload images. Please try again.');
        } finally {
            setUploading(false);
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
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Upload className="w-5 h-5" />
                        <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1">
                        Max {maxFiles} images, 5MB each
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
                                src={img.startsWith('http') ? img : `http://localhost:5000${img}`}
                                alt={`Upload ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
