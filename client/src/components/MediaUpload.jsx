import { useState, useRef } from 'react';
import { Upload, X, Image, Film } from 'lucide-react';
import VideoEditor from './VideoEditor';
import ImageEditor from './ImageEditor';
import { uploadService } from '../services/uploadService';

const MediaUpload = ({ onImagesChange, onVideosChange, existingImages = [], existingVideos = [], maxFiles = 5 }) => {
    const [images, setImages] = useState(existingImages);
    const [videos, setVideos] = useState(existingVideos);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [error, setError] = useState('');

    // Editor state
    const [editingImageFile, setEditingImageFile] = useState(null);
    const [editingVideoFile, setEditingVideoFile] = useState(null);

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // ─── Image Flow ───
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const totalMedia = images.length + videos.length + files.length;
        if (totalMedia > maxFiles) {
            setError(`Maximum ${maxFiles} media items allowed`);
            return;
        }

        // Validate file
        const file = files[0];
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError('Image must be under 10MB');
            return;
        }

        setError('');
        setEditingImageFile(file);

        if (imageInputRef.current) imageInputRef.current.value = '';
    };

    const handleImageEditorSave = async (edits) => {
        // edits = { filter, aspectRatio }
        setUploading(true);
        setUploadStatus('Uploading image...');
        setUploadProgress(0);

        try {
            const result = await uploadService.uploadImage(editingImageFile);

            const newImage = {
                url: result.url,
                publicId: result.publicId,
                filter: edits.filter,
                aspectRatio: edits.aspectRatio,
                width: result.width
            };

            const newImages = [...images, newImage];
            setImages(newImages);
            onImagesChange(newImages);
            setUploadProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload image');
        } finally {
            setUploading(false);
            setUploadStatus('');
            setUploadProgress(0);
            setEditingImageFile(null);
        }
    };

    const handleImageEditorCancel = () => {
        setEditingImageFile(null);
    };

    // ─── Video Flow ───
    const handleVideoSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const totalMedia = images.length + videos.length + files.length;
        if (totalMedia > maxFiles) {
            setError(`Maximum ${maxFiles} media items allowed`);
            return;
        }

        const file = files[0];
        if (!file.type.startsWith('video/')) {
            setError('Please select a video file');
            return;
        }
        if (file.size > 100 * 1024 * 1024) {
            setError('Video must be under 100MB');
            return;
        }

        setError('');
        setEditingVideoFile(file);

        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    const handleVideoEditorSave = async (edits) => {
        // edits = { trimStart, trimEnd, duration, muted, filter, aspectRatio, thumbnailTime }
        setUploading(true);
        setUploadStatus('Uploading video...');
        setUploadProgress(0);

        try {
            // Pass trim options so Cloudinary trims during upload
            const trimOptions = {
                trimStart: edits.trimStart,
                trimEnd: edits.trimEnd,
                muted: edits.muted
            };

            const result = await uploadService.uploadVideo(
                editingVideoFile,
                (progress) => setUploadProgress(progress),
                trimOptions
            );

            const newVideo = {
                url: result.url,
                publicId: result.publicId,
                trimStart: 0,                                              // Already trimmed, starts at 0
                trimEnd: result.duration || (edits.trimEnd - edits.trimStart), // Cloudinary returns trimmed duration
                duration: result.duration || (edits.trimEnd - edits.trimStart),
                muted: edits.muted,
                aspectRatio: edits.aspectRatio,
                thumbnailTime: Math.max(0, edits.thumbnailTime - edits.trimStart), // Offset relative to new start
                filter: edits.filter
            };

            const newVideos = [...videos, newVideo];
            setVideos(newVideos);
            onVideosChange(newVideos);
            setUploadProgress(100);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload video');
        } finally {
            setUploading(false);
            setUploadStatus('');
            setUploadProgress(0);
            setEditingVideoFile(null);
        }
    };

    const handleVideoEditorCancel = () => {
        setEditingVideoFile(null);
    };

    // ─── Remove handlers ───
    const handleRemoveImage = (index) => {
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        onImagesChange(newImages);
    };

    const handleRemoveVideo = (index) => {
        const newVideos = videos.filter((_, i) => i !== index);
        setVideos(newVideos);
        onVideosChange(newVideos);
    };

    // ─── Cloudinary URL builder for display ───
    const getImageDisplayUrl = (img) => {
        if (!img.url) return img; // backward compat: plain URL string
        // For preview, just show the base URL — filters applied via CSS
        return img.url;
    };

    const getImageCssFilter = (img) => {
        const filterMap = {
            'none': 'none',
            'sepia': 'sepia(0.8)',
            'grayscale': 'grayscale(1)',
            'contrast': 'contrast(1.4)',
            'brightness': 'brightness(1.3)',
            'warmth': 'sepia(0.3) saturate(1.5)',
            'cool': 'saturate(0.8) hue-rotate(20deg)',
            'blur': 'blur(2px)',
        };
        return filterMap[img.filter] || 'none';
    };

    const totalMedia = images.length + videos.length;
    const isShowingEditor = editingImageFile || editingVideoFile;

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Media
            </label>

            {/* Image Editor */}
            {editingImageFile && (
                <div className="mb-4">
                    <ImageEditor
                        file={editingImageFile}
                        onSave={handleImageEditorSave}
                        onCancel={handleImageEditorCancel}
                    />
                </div>
            )}

            {/* Video Editor */}
            {editingVideoFile && (
                <div className="mb-4">
                    <VideoEditor
                        file={editingVideoFile}
                        onSave={handleVideoEditorSave}
                        onCancel={handleVideoEditorCancel}
                    />
                </div>
            )}

            {/* Upload Progress */}
            {uploading && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                        {uploadStatus} {uploadProgress}%
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Upload Buttons */}
            {!isShowingEditor && totalMedia < maxFiles && (
                <div className="mb-4 flex gap-3">
                    {/* Image upload */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="image-upload"
                        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Image className="w-5 h-5" />
                        <span className="font-medium">Add Image</span>
                    </label>

                    {/* Video upload */}
                    <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        className="hidden"
                        id="video-upload"
                        disabled={uploading}
                    />
                    <label
                        htmlFor="video-upload"
                        className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Film className="w-5 h-5" />
                        <span className="font-medium">Add Video</span>
                    </label>
                </div>
            )}

            {!isShowingEditor && (
                <p className="text-sm text-gray-500 mb-3">
                    Images: max 10MB • Videos: max 100MB • {totalMedia}/{maxFiles} slots used
                </p>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && !isShowingEditor && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {images.map((img, index) => {
                        const url = typeof img === 'string' ? img : img.url;
                        const cssFilter = typeof img === 'object' ? getImageCssFilter(img) : 'none';

                        return (
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`Upload ${index + 1}`}
                                    className="w-full h-32 object-cover rounded-lg transition-all"
                                    loading="lazy"
                                    style={{ filter: cssFilter !== 'none' ? cssFilter : undefined }}
                                />
                                {typeof img === 'object' && img.filter && img.filter !== 'none' && (
                                    <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                        {img.filter}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Video Previews */}
            {videos.length > 0 && !isShowingEditor && (
                <div className="space-y-3">
                    {videos.map((vid, index) => (
                        <div key={index} className="relative group bg-gray-100 rounded-lg overflow-hidden">
                            <video
                                src={vid.url}
                                className="w-full max-h-48 object-cover"
                                muted
                                preload="metadata"
                            />
                            <div className="absolute bottom-2 left-2 flex gap-1">
                                {vid.muted && (
                                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">🔇 Muted</span>
                                )}
                                {vid.trimStart > 0 || vid.trimEnd < vid.duration ? (
                                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                        ✂️ {Math.round(vid.trimEnd - vid.trimStart)}s
                                    </span>
                                ) : null}
                                {vid.filter && vid.filter !== 'none' && (
                                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                                        🎨 {vid.filter}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemoveVideo(index)}
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

export default MediaUpload;
