import { useState, useRef, useEffect, useCallback } from 'react';
import { Scissors, Volume2, VolumeX, Play, Pause, RotateCcw } from 'lucide-react';

const FILTERS = [
    { id: 'none', label: 'None', css: 'none', cloudinary: '' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(0.8)', cloudinary: 'e_sepia' },
    { id: 'grayscale', label: 'B&W', css: 'grayscale(1)', cloudinary: 'e_grayscale' },
    { id: 'contrast', label: 'Contrast', css: 'contrast(1.4)', cloudinary: 'e_contrast:50' },
    { id: 'brightness', label: 'Bright', css: 'brightness(1.3)', cloudinary: 'e_brightness:30' },
    { id: 'warmth', label: 'Warm', css: 'sepia(0.3) saturate(1.5)', cloudinary: 'e_tint:40:red:yellow' },
    { id: 'cool', label: 'Cool', css: 'saturate(0.8) hue-rotate(20deg)', cloudinary: 'e_tint:40:blue:cyan' },
    { id: 'vignette', label: 'Vignette', css: 'none', cloudinary: 'e_vignette:50' },
];

const ASPECT_RATIOS = [
    { id: '16:9', label: '16:9', icon: '▬' },
    { id: '1:1', label: '1:1', icon: '◼' },
    { id: '9:16', label: '9:16', icon: '▮' },
    { id: '4:3', label: '4:3', icon: '▭' },
];

const VideoEditor = ({ file, initialEdits, onApply, onUpload, onCancel }) => {
    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [trimStart, setTrimStart] = useState(0);
    const [trimEnd, setTrimEnd] = useState(0);
    const [muted, setMuted] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('none');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [thumbnailTime, setThumbnailTime] = useState(0);
    const [dragging, setDragging] = useState(null); // 'start', 'end', or null
    const [showAppliedMessage, setShowAppliedMessage] = useState(false);

    // Create object URL for preview
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    useEffect(() => {
        if (!initialEdits) return;
        setTrimStart(initialEdits.trimStart || 0);
        setTrimEnd(initialEdits.trimEnd || 0);
        setMuted(initialEdits.muted || false);
        setSelectedFilter(initialEdits.filter || 'none');
        setAspectRatio(initialEdits.aspectRatio || '16:9');
        setThumbnailTime(initialEdits.thumbnailTime || 0);
    }, [initialEdits]);

    // Update duration when video loads
    const handleLoadedMetadata = () => {
        const video = videoRef.current;
        if (video) {
            setDuration(video.duration);
            setTrimEnd((prev) => (prev > 0 ? Math.min(prev, video.duration) : video.duration));
        }
    };

    // Time update
    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video) {
            setCurrentTime(video.currentTime);
            // Stop at trim end
            if (video.currentTime >= trimEnd) {
                video.pause();
                video.currentTime = trimStart;
                setIsPlaying(false);
            }
        }
    };

    // Play/pause
    const togglePlay = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
        } else {
            if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
                video.currentTime = trimStart;
            }
            video.play();
        }
        setIsPlaying(!isPlaying);
    };

    // Reset trim
    const resetTrim = () => {
        setTrimStart(0);
        setTrimEnd(duration);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
        }
    };

    // Timeline drag handlers
    const handleTimelineMouseDown = (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(type);
    };

    const handleTimelineMouseMove = useCallback((e) => {
        if (!dragging || !timelineRef.current) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const time = (x / rect.width) * duration;

        if (dragging === 'start') {
            const newStart = Math.max(0, Math.min(time, trimEnd - 0.5));
            setTrimStart(newStart);
            if (videoRef.current) videoRef.current.currentTime = newStart;
        } else if (dragging === 'end') {
            const newEnd = Math.min(duration, Math.max(time, trimStart + 0.5));
            setTrimEnd(newEnd);
        }
    }, [dragging, duration, trimStart, trimEnd]);

    const handleTimelineMouseUp = useCallback(() => {
        setDragging(null);
    }, []);

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleTimelineMouseMove);
            window.addEventListener('mouseup', handleTimelineMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleTimelineMouseMove);
                window.removeEventListener('mouseup', handleTimelineMouseUp);
            };
        }
    }, [dragging, handleTimelineMouseMove, handleTimelineMouseUp]);

    // Set thumbnail time to current time
    const setThumbnailHere = () => {
        setThumbnailTime(currentTime);
    };

    // Format time mm:ss
    const formatTime = (t) => {
        const mins = Math.floor(t / 60);
        const secs = Math.floor(t % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Get CSS filter for current selection
    const getCssFilter = () => {
        const filter = FILTERS.find(f => f.id === selectedFilter);
        return filter?.css || 'none';
    };

    // Get aspect ratio CSS
    const getAspectRatioStyle = () => {
        const map = { '16:9': '16/9', '1:1': '1/1', '9:16': '9/16', '4:3': '4/3' };
        return map[aspectRatio] || '16/9';
    };

    // Save handler
    const currentEdits = {
        trimStart: Math.round(trimStart * 10) / 10,
        trimEnd: Math.round(trimEnd * 10) / 10,
        duration: Math.round(duration * 10) / 10,
        muted,
        filter: selectedFilter,
        aspectRatio,
        thumbnailTime: Math.round(thumbnailTime * 10) / 10,
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
            trimStart: Math.round(trimStart * 10) / 10,
            trimEnd: Math.round(trimEnd * 10) / 10,
            duration: Math.round(duration * 10) / 10,
            muted,
            filter: selectedFilter,
            aspectRatio,
            thumbnailTime: Math.round(thumbnailTime * 10) / 10,
        });
    };

    return (
        <div className="bg-gray-900 rounded-xl overflow-hidden">
            {/* Video Preview */}
            <div className="relative flex items-center justify-center bg-black p-4">
                <div style={{ aspectRatio: getAspectRatioStyle(), maxHeight: '360px', width: '100%' }}
                     className="relative overflow-hidden rounded-lg">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={() => setIsPlaying(false)}
                        muted={muted}
                        className="w-full h-full object-contain"
                        style={{ filter: getCssFilter() !== 'none' ? getCssFilter() : undefined }}
                    />
                </div>

                {/* Play overlay */}
                <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
                >
                    {isPlaying ? (
                        <Pause className="w-16 h-16 text-white/80" />
                    ) : (
                        <Play className="w-16 h-16 text-white/80" />
                    )}
                </button>
            </div>

            {/* Timeline Trimmer */}
            <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <Scissors className="w-4 h-4 text-blue-400" />
                    <span className="text-white/80 text-sm font-medium">Trim</span>
                    <span className="text-white/50 text-xs ml-auto">
                        {formatTime(trimStart)} — {formatTime(trimEnd)} ({formatTime(trimEnd - trimStart)})
                    </span>
                    <button type="button" onClick={resetTrim} className="text-white/50 hover:text-white p-1" title="Reset trim">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>

                <div
                    ref={timelineRef}
                    className="relative h-10 bg-gray-800 rounded-lg cursor-pointer select-none"
                >
                    {/* Trimmed region overlay */}
                    <div
                        className="absolute top-0 h-full bg-blue-500/30 border-y-2 border-blue-500 rounded"
                        style={{
                            left: `${(trimStart / duration) * 100}%`,
                            width: `${((trimEnd - trimStart) / duration) * 100}%`
                        }}
                    />

                    {/* Current time indicator */}
                    <div
                        className="absolute top-0 h-full w-0.5 bg-white z-10"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                    />

                    {/* Start handle */}
                    <div
                        className="absolute top-0 h-full w-4 bg-blue-500 rounded-l cursor-col-resize z-20 flex items-center justify-center hover:bg-blue-400 transition-colors"
                        style={{ left: `calc(${(trimStart / duration) * 100}% - 8px)` }}
                        onMouseDown={(e) => handleTimelineMouseDown(e, 'start')}
                    >
                        <div className="w-0.5 h-4 bg-white rounded" />
                    </div>

                    {/* End handle */}
                    <div
                        className="absolute top-0 h-full w-4 bg-blue-500 rounded-r cursor-col-resize z-20 flex items-center justify-center hover:bg-blue-400 transition-colors"
                        style={{ left: `calc(${(trimEnd / duration) * 100}% - 8px)` }}
                        onMouseDown={(e) => handleTimelineMouseDown(e, 'end')}
                    >
                        <div className="w-0.5 h-4 bg-white rounded" />
                    </div>
                </div>
            </div>

            {/* Controls Row */}
            <div className="px-4 py-3 flex flex-wrap gap-3 border-t border-gray-700">
                {/* Mute Toggle */}
                <button
                    type="button"
                    onClick={() => setMuted(!muted)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        muted ? 'bg-red-500/20 text-red-400' : 'bg-gray-700 text-white/70 hover:text-white'
                    }`}
                >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {muted ? 'Muted' : 'Audio On'}
                </button>

                {/* Thumbnail */}
                <button
                    type="button"
                    onClick={setThumbnailHere}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-white/70 hover:text-white transition-colors"
                >
                    🖼️ Set Thumbnail Here ({formatTime(thumbnailTime)})
                </button>
            </div>

            {/* Aspect Ratio */}
            <div className="px-4 py-3 border-t border-gray-700">
                <p className="text-white/60 text-xs mb-2 font-medium uppercase tracking-wide">Aspect Ratio</p>
                <div className="flex gap-2">
                    {ASPECT_RATIOS.map(ar => (
                        <button
                            type="button"
                            key={ar.id}
                            onClick={() => setAspectRatio(ar.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                aspectRatio === ar.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-700 text-white/60 hover:text-white'
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
                <div className="grid grid-cols-4 gap-2">
                    {FILTERS.map(filter => (
                        <button
                            type="button"
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter.id)}
                            className={`relative p-2 rounded-lg text-center transition-all ${
                                selectedFilter === filter.id
                                    ? 'ring-2 ring-blue-500 bg-gray-700'
                                    : 'bg-gray-800 hover:bg-gray-700'
                            }`}
                        >
                            <div
                                className="w-full h-8 rounded bg-gradient-to-br from-blue-400 to-purple-500 mb-1"
                                style={{ filter: filter.css !== 'none' ? filter.css : undefined }}
                            />
                            <span className="text-white/70 text-xs">{filter.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Applied Message */}
            {showAppliedMessage && (
                <div className="px-4 py-2 bg-green-500 text-white text-sm font-medium text-center">
                    ✓ Settings applied for this video!
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-4 py-3 border-t border-gray-700 flex gap-3">
                <button
                    type="button"
                    onClick={handleApply}
                    className="px-6 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition-colors"
                >
                    Apply
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

export { FILTERS as VIDEO_FILTERS };
export default VideoEditor;
