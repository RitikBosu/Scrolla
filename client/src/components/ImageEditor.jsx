import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const FILTERS = [
    { id: 'none', label: 'None', css: 'none', cloudinary: '' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(0.8)', cloudinary: 'e_sepia' },
    { id: 'grayscale', label: 'B&W', css: 'grayscale(1)', cloudinary: 'e_grayscale' },
    { id: 'contrast', label: 'Contrast', css: 'contrast(1.4)', cloudinary: 'e_contrast:50' },
    { id: 'brightness', label: 'Bright', css: 'brightness(1.3)', cloudinary: 'e_brightness:30' },
    { id: 'warmth', label: 'Warm', css: 'sepia(0.3) saturate(1.5)', cloudinary: 'e_tint:40:red:yellow' },
    { id: 'cool', label: 'Cool', css: 'saturate(0.8) hue-rotate(20deg)', cloudinary: 'e_tint:40:blue:cyan' },
    { id: 'blur', label: 'Blur', css: 'blur(2px)', cloudinary: 'e_blur:200' },
    { id: 'vignette', label: 'Vignette', css: 'none', cloudinary: 'e_vignette:50' },
];

const ASPECT_RATIOS = [
    { id: 'original', label: 'Original', icon: '⊡' },
    { id: '1:1', label: '1:1', icon: '◼' },
    { id: '16:9', label: '16:9', icon: '▬' },
    { id: '4:3', label: '4:3', icon: '▭' },
    { id: '9:16', label: '9:16', icon: '▮' },
];

const ImageEditor = ({
    file,
    existingUrl,
    queueFiles = [],
    initialEdits,
    onApply,
    onUpload,
    onCancel,
    queueLength = 1,
    currentIndex = 0,
    onPrevious,
    onNext,
    onSelectImageIndex,
    appliedImageIndices = [],
}) => {
    const [imageUrl, setImageUrl] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [aspectRatio, setAspectRatio] = useState('original');
    const [previewUrls, setPreviewUrls] = useState([]);
    const [showAppliedMessage, setShowAppliedMessage] = useState(false);

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setImageUrl(url);
            setSelectedFilter(initialEdits?.filter || 'none');
            setAspectRatio(initialEdits?.aspectRatio || 'original');
            return () => URL.revokeObjectURL(url);
        } else if (existingUrl) {
            setImageUrl(existingUrl);
        }
    }, [file, existingUrl, initialEdits]);

    useEffect(() => {
        if (!queueFiles.length) {
            setPreviewUrls([]);
            return;
        }

        const urls = queueFiles.map((queuedFile) => URL.createObjectURL(queuedFile));
        setPreviewUrls(urls);

        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [queueFiles]);

    const getCssFilter = () => {
        const filter = FILTERS.find(f => f.id === selectedFilter);
        return filter?.css || 'none';
    };

    const getAspectRatioStyle = () => {
        const map = { 'original': 'auto', '1:1': '1/1', '16:9': '16/9', '4:3': '4/3', '9:16': '9/16' };
        return map[aspectRatio] || 'auto';
    };

    const currentEdits = {
        filter: selectedFilter,
        aspectRatio,
    };

    const handleApply = () => {
        onApply?.(currentEdits);
        setShowAppliedMessage(true);
        setTimeout(() => setShowAppliedMessage(false), 1500);
    };

    const handleUpload = () => {
        onUpload?.(currentEdits);
    };

    const handleSave = () => {
        onUpload?.({
            filter: selectedFilter,
            aspectRatio,
        });
    };

    return (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
            {/* Image Preview */}
            <div className="relative flex items-center justify-center bg-black p-4">
                <div
                    className="relative overflow-hidden rounded-lg max-h-96 w-full flex items-center justify-center"
                    style={{ aspectRatio: getAspectRatioStyle() !== 'auto' ? getAspectRatioStyle() : undefined }}
                >
                    {queueLength > 1 && currentIndex > 0 && (
                        <button
                            type="button"
                            onClick={onPrevious}
                            className="absolute left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/75"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                    )}

                    <img
                        src={imageUrl}
                        alt="Edit preview"
                        className="max-w-full max-h-96 object-cover rounded-lg transition-all duration-200"
                        style={{
                            filter: getCssFilter() !== 'none' ? getCssFilter() : undefined,
                            aspectRatio: getAspectRatioStyle() !== 'auto' ? getAspectRatioStyle() : undefined,
                            objectFit: aspectRatio !== 'original' ? 'cover' : 'contain',
                            width: aspectRatio !== 'original' ? '100%' : undefined,
                        }}
                    />

                    {queueLength > 1 && currentIndex < queueLength - 1 && (
                        <button
                            type="button"
                            onClick={onNext}
                            className="absolute right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/75"
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    )}
                </div>
            </div>

            {queueLength > 1 && (
                <div className="px-4 pb-2 text-center text-xs text-white/60">
                    Image {currentIndex + 1} of {queueLength}
                </div>
            )}

            {/* Aspect Ratio */}
            <div className="px-4 py-3 border-t border-gray-700">
                <p className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Aspect Ratio</p>
                <div className="flex gap-2">
                    {ASPECT_RATIOS.map(ar => (
                        <button
                            type="button"
                            key={ar.id}
                            onClick={() => setAspectRatio(ar.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                aspectRatio === ar.id
                                    ? 'bg-blue-500 text-white scale-105 shadow-lg shadow-blue-500/20'
                                    : 'bg-gray-700 text-white/60 hover:text-white hover:scale-[1.02]'
                            }`}
                        >
                            <span className="mr-1">{ar.icon}</span> {ar.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-t border-gray-700">
                <p className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Filters</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {FILTERS.map(filter => (
                        <button
                            type="button"
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                                selectedFilter === filter.id
                                    ? 'ring-2 ring-blue-500 scale-105 shadow-lg shadow-blue-500/15'
                                    : 'hover:ring-1 hover:ring-white/30 hover:scale-[1.01]'
                            }`}
                        >
                            <img
                                src={imageUrl}
                                alt={filter.label}
                                className="w-full h-16 object-cover"
                                style={{ filter: filter.css !== 'none' ? filter.css : undefined }}
                            />
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white/80 text-xs py-1 text-center">
                                {filter.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {queueLength > 1 && previewUrls.length > 0 && (
                <div className="px-4 py-3 border-t border-gray-700">
                    <p className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Selected Images</p>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {previewUrls.map((url, index) => {
                            const isActive = index === currentIndex;
                            const hasAppliedEdits = appliedImageIndices.includes(index);

                            return (
                                <button
                                    key={`${url}-${index}`}
                                    type="button"
                                    onClick={() => onSelectImageIndex?.(index)}
                                    className={`relative flex-shrink-0 overflow-hidden rounded-xl border transition-all duration-200 ${
                                        isActive
                                            ? 'border-blue-500 scale-105 shadow-xl shadow-blue-500/20'
                                            : 'border-white/10 scale-95 opacity-60 blur-[0.3px] hover:opacity-80 hover:blur-0'
                                    }`}
                                    aria-label={`Select image ${index + 1}`}
                                >
                                    <img
                                        src={url}
                                        alt={`Selected image ${index + 1}`}
                                        className="h-20 w-20 object-cover"
                                        style={{ filter: isActive ? 'none' : 'grayscale(0.05) brightness(0.92)' }}
                                    />
                                    <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                                        {index + 1}
                                    </span>
                                    {hasAppliedEdits && (
                                        <span className="absolute top-1 right-1 rounded-full bg-green-500 w-5 h-5 flex items-center justify-center text-white text-xs font-bold">✓</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Applied Message */}
            {showAppliedMessage && (
                <div className="px-4 py-3 bg-green-500/20 border-t border-green-500/30 text-green-400 text-sm font-medium text-center">
                    ✓ Settings applied for this image!
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-4 py-3 border-t border-gray-700 flex gap-3">
                <button
                    type="button"
                    onClick={handleApply}
                    className="px-6 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                    {appliedImageIndices.includes(currentIndex) ? '✓ Applied' : 'Apply'}
                </button>
                <button
                    type="button"
                    onClick={handleUpload}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                    Upload
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export { FILTERS as IMAGE_FILTERS };
export default ImageEditor;
