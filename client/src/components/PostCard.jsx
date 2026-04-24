import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import MoodBadge from './MoodBadge';
import ThreeDotMenu from './ThreeDotMenu';
import CommentSection from './CommentSection';
import { formatDate } from '../utils/formatDate';
import { MOODS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useFollow } from '../hooks/useFollow';
import { useLike } from '../hooks/useLike';
import { usePostActions } from '../hooks/usePostActions';
import { getAspectRatio } from '../utils/aspectRatioHelper';

// Cloudinary filter map
const CLOUDINARY_FILTERS = {
    'none': '',
    'sepia': 'e_sepia',
    'grayscale': 'e_grayscale',
    'contrast': 'e_contrast:50',
    'brightness': 'e_brightness:30',
    'warmth': 'e_tint:40:red:yellow',
    'cool': 'e_tint:40:blue:cyan',
    'blur': 'e_blur:200',
    'vignette': 'e_vignette:50',
};

// CSS filter map for client-side preview
const CSS_FILTERS = {
    'none': 'none',
    'sepia': 'sepia(0.8)',
    'grayscale': 'grayscale(1)',
    'contrast': 'contrast(1.4)',
    'brightness': 'brightness(1.3)',
    'warmth': 'sepia(0.3) saturate(1.5)',
    'cool': 'saturate(0.8) hue-rotate(20deg)',
    'blur': 'blur(2px)',
    'vignette': 'none',
};

// Build Cloudinary URL with transformations
const buildCloudinaryUrl = (baseUrl, transformations) => {
    if (!baseUrl || !transformations || transformations.length === 0) return baseUrl;
    const uploadIndex = baseUrl.indexOf('/upload/');
    if (uploadIndex === -1) return baseUrl;
    const before = baseUrl.substring(0, uploadIndex + 8);
    const after = baseUrl.substring(uploadIndex + 8);
    const transformStr = transformations.filter(Boolean).join(',');
    return `${before}${transformStr}/${after}`;
};

// ─── Ripple animation handler ───
const handleLikeWithRipple = (toggleLikeFn, e) => {
    const ring = document.createElement('div');
    ring.className = 'ripple-ring';
    e.currentTarget.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
    toggleLikeFn();
};

// ─── Autoplay Video Component ───
const AutoplayVideo = ({ src, poster, aspectRatio, filterLabel, trimStart = 0, trimEnd }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        const container = containerRef.current;
        if (!video || !container) return;

        // Set initial playback position to trim start
        const handleLoaded = () => {
            if (trimStart > 0) {
                video.currentTime = trimStart;
            }
        };
        video.addEventListener('loadedmetadata', handleLoaded);

        // Enforce trim boundaries during playback
        const handleTimeUpdate = () => {
            if (trimEnd && video.currentTime >= trimEnd) {
                video.currentTime = trimStart;
            }
        };
        video.addEventListener('timeupdate', handleTimeUpdate);

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        if (trimStart > 0 && video.currentTime < trimStart) {
                            video.currentTime = trimStart;
                        }
                        video.play().catch(() => { });
                    } else {
                        video.pause();
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(container);

        return () => {
            observer.disconnect();
            video.pause();
            video.removeEventListener('loadedmetadata', handleLoaded);
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
    }, [src, trimStart, trimEnd]);

    const toggleMute = (e) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            video.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div 
            ref={containerRef} 
            className="relative rounded-lg overflow-hidden" 
            style={{ 
                width: '100%', 
                backgroundColor: '#050505',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
        >
            {/* ─── Blurred background layer ─── */}
            {poster && (
                <div 
                    className="absolute inset-0 w-full h-full"
                    style={{
                        backgroundImage: `url(${poster})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(25px) brightness(0.5)',
                        transform: 'scale(1.2)',
                        zIndex: 0
                    }}
                />
            )}
            
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                muted={isMuted}
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                className="rounded-lg"
                style={{
                    position: 'relative',
                    zIndex: 1,
                    width: '100%',
                    height: 'auto',
                    maxHeight: '650px',
                    objectFit: 'contain',
                    display: 'block',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)'
                }}
            />
            <button
                onClick={toggleMute}
                className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/55 text-white border-none cursor-pointer backdrop-blur flex items-center justify-center z-10"
            >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            {filterLabel && (
                <div className="absolute top-2 left-2 z-10">
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">🎨 {filterLabel}</span>
                </div>
            )}
        </div>
    );
};
// ─── SmartImage: auto-detects real ratio, clamps like Instagram ───
// Min ratio: 1.91:1 (landscape cap) | Max ratio: 4:5 (portrait cap)
const SmartImage = ({ url, cssFilter, roundedClass = 'rounded-xl' }) => {
    const [paddingTop, setPaddingTop] = useState('100%'); // default square while loading

    const handleLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        if (!naturalWidth || !naturalHeight) return;
        const ratio = naturalWidth / naturalHeight;

        // Clamp: no wider than 1.91:1, no taller than 9:16
        const clampedRatio = Math.min(Math.max(ratio, 9 / 16), 1.91);
        // paddingTop drives the container height: (1/ratio)*100%
        setPaddingTop(`${(1 / clampedRatio) * 100}%`);
    };

    return (
        <div className={`relative w-full overflow-hidden ${roundedClass}`} style={{ paddingTop }}>
            <img
                src={url}
                loading="lazy"
                onLoad={handleLoad}
                className="absolute inset-0 w-full h-full object-cover object-center block"
                style={{ filter: cssFilter !== 'none' ? cssFilter : undefined }}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
            />
        </div>
    );
};


const PostCard = ({ post, onUpdate, onDelete, isFollowing: isFollowingProp, onFollowToggle }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [showComments, setShowComments] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const { isFollowing, toggleFollow: handleFollow, loading: followLoading } = useFollow(isFollowingProp, post?.author?._id, onFollowToggle);
    const { liked, likeCount, toggleLike: handleLike } = useLike(post?.isLiked, post?.likeCount, post?._id);
    const { isSaved, handleSave, handleHide, handleReport, handleDelete } = usePostActions(post?._id, post?.isSaved, onUpdate, onDelete);

    // Get mood color based on mood ID
    const getMoodColor = () => {
        if (!post?.mood) return '#E8A88B'; // default peach color
        const moodObj = MOODS.find(m => m.id === post.mood);
        return moodObj?.colorCode || '#E8A88B';
    };

    const shareUrl = `${window.location.origin}/posts/${post?._id}`;
    const isOwnPost = user?._id === post?.author?._id;

    if (!post?.author) {
        console.error('Post author is null:', post);
        return null;
    }

    const handleEdit = () => {
        navigate(`/edit-post/${post._id}`, { state: { post } });
    };

    // ─── Render image dynamically with Premium Glass Background ───
    const renderImage = (image, index) => {
        const isStructured = typeof image === 'object' && image !== null;
        const url = isStructured ? image.url : image;
        const filter = isStructured ? image.filter : 'none';
        const cssFilter = CSS_FILTERS[filter] || 'none';

        return (
            <div 
                key={index} 
                className="post-image-wrapper relative" 
                style={{ 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    width: '100%',
                    backgroundColor: '#050505'
                }}
            >
                {/* ─── Blurred background layer to fill dead space ─── */}
                <div 
                    className="absolute inset-0 w-full h-full"
                    style={{
                        backgroundImage: `url(${url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: 'blur(25px) brightness(0.5)',
                        transform: 'scale(1.2)', // Prevents faded edges from the blur
                        zIndex: 0
                    }}
                />
                
                {/* ─── Actual uncropped image ─── */}
                <img
                    src={url}
                    alt={`Post image ${index + 1}`}
                    loading="lazy"
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: "100%",
                        height: "auto",
                        maxHeight: "650px",
                        objectFit: "contain",
                        filter: cssFilter !== 'none' ? cssFilter : undefined,
                        display: 'block',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)' // Sharpens the separation between image and background
                    }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found'; }}
                    onLoad={(e) => {
                        e.target.classList.add('loaded');
                    }}
                />
            </div>
        );
    };

    // ─── Render video ───
    const renderVideo = (video, index) => {
        const transforms = [];
        if (video.trimStart > 0) transforms.push(`so_${video.trimStart}`);
        if (video.trimEnd && video.trimEnd < video.duration) transforms.push(`eo_${video.trimEnd}`);
        if (video.muted) transforms.push('ac_none');
        if (video.aspectRatio && video.aspectRatio !== 'original') {
            transforms.push(`ar_${video.aspectRatio},c_pad,b_black`);
        }
        if (video.filter && video.filter !== 'none') {
            const cloudFilter = CLOUDINARY_FILTERS[video.filter];
            if (cloudFilter) transforms.push(cloudFilter);
        }
        transforms.push('q_auto', 'f_auto');
        const transformedUrl = buildCloudinaryUrl(video.url, transforms);

        const thumbTransforms = [];
        if (video.thumbnailTime > 0) thumbTransforms.push(`so_${video.thumbnailTime}`);
        thumbTransforms.push('q_auto', 'f_jpg');
        const thumbUrl = buildCloudinaryUrl(video.url, thumbTransforms);

        return (
            <AutoplayVideo
                key={index}
                src={transformedUrl}
                poster={thumbUrl}
                aspectRatio={video.aspectRatio || '16:9'}
                filterLabel={video.filter && video.filter !== 'none' ? video.filter : null}
                trimStart={video.trimStart || 0}
                trimEnd={video.trimEnd}
            />
        );
    };

    return (
        <motion.div
            className="post-card"
            style={{
                borderLeft: `4px solid ${getMoodColor()}`
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{
                scale: 1.02,
                y: -4,
                boxShadow: '0px 24px 48px rgba(0, 0, 0, 0.35), 0 0 32px rgba(51, 200, 232, 0.18)'
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="cursor-pointer flex items-center gap-3"
                        onClick={() => navigate(`/profile/${post.author._id}`)}
                    >
                        <img
                            src={post.author.avatar}
                            alt={post.author.username}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                        />
                        <div>
                            <h3 className="post-author font-semibold">{post.author.username}</h3>
                            <p className="post-time text-sm">{formatDate(post.createdAt)}</p>
                        </div>
                    </div>

                    {/* Follow / Following button — hidden for own posts */}
                    {!isOwnPost && (
                        <button
                            onClick={handleFollow}
                            disabled={followLoading}
                            style={{
                                padding: '4px 14px',
                                borderRadius: '6px',
                                border: isFollowing ? '1px solid var(--color-border-medium)' : '1px solid var(--color-accent-primary)',
                                background: isFollowing ? 'var(--color-bg-tertiary)' : 'var(--color-accent-primary)',
                                color: isFollowing ? 'var(--color-text-secondary)' : 'var(--color-text-inverse)',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: followLoading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s',
                                fontFamily: "'DM Sans', sans-serif",
                                whiteSpace: 'nowrap',
                                opacity: followLoading ? 0.6 : 1,
                                marginLeft: '4px',
                            }}
                        >
                            {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                        </button>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-300" />
                    </button>

                    {showMenu && (
                        <ThreeDotMenu
                            isOwnPost={isOwnPost}
                            isSaved={isSaved}
                            onSave={handleSave}
                            onHide={handleHide}
                            onReport={handleReport}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onClose={() => setShowMenu(false)}
                        />
                    )}
                </div>
            </div>

            {/* Mood Badge */}
            <div className="mb-3">
                <MoodBadge mood={post.mood} />
            </div>

            {/* Content */}
            <p className="post-content mb-4 leading-relaxed">{post.content}</p>

            {/* Images */}
            {post.images && post.images.length > 0 && (
                <div className="mb-4 space-y-3">
                    {post.images.map((image, index) => renderImage(image, index))}
                </div>
            )}

            {/* Videos */}
            {post.videos && post.videos.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                    {post.videos.map((video, index) => renderVideo(video, index))}
                </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.hashtags.map((tag, index) => (
                        <span key={index} className="post-tag text-sm hover:underline cursor-pointer">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="post-divider flex items-center gap-6 pt-4 border-t">
                <motion.button
                    onClick={(e) => handleLikeWithRipple(handleLike, e)}
                    className="post-action-btn like-button flex items-center gap-2 hover:text-[var(--color-accent-danger)] transition-colors group relative"
                    whileTap={{ scale: 1.8 }}
                    animate={{
                        scale: liked ? [1, 1.3, 1] : 1,
                    }}
                    transition={{ duration: 0.4, type: 'spring' }}
                >
                    {liked ? (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.3 }}
                        >
                            <FaHeart className="w-5 h-5 text-red-500" />
                        </motion.div>
                    ) : (
                        <FaRegHeart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="font-medium">{likeCount}</span>
                </motion.button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="post-action-btn flex items-center gap-2 hover:text-[var(--color-accent-info)] transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.commentCount || 0}</span>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="post-action-btn flex items-center gap-2 hover:text-[var(--color-accent-success)] transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-medium">Share</span>
                    </button>

                    {showShareMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-3 flex gap-2 z-10">
                            <FacebookShareButton url={shareUrl}>
                                <div className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">FB</div>
                            </FacebookShareButton>
                            <TwitterShareButton url={shareUrl}>
                                <div className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">TW</div>
                            </TwitterShareButton>
                            <WhatsappShareButton url={shareUrl}>
                                <div className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">WA</div>
                            </WhatsappShareButton>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="post-divider mt-4 pt-4 border-t">
                    <CommentSection postId={post._id} />
                </div>
            )}
        </motion.div>
    );
};

export default PostCard;
