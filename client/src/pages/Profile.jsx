import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    Edit, UserPlus, UserMinus, MessageSquare, Bell, 
    Home, Search, Map, Bookmark, User, Sun, Moon, 
    ChevronLeft, ChevronRight, Play, Heart, MessageCircle, Send, X
} from 'lucide-react';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import BrandLogo from '../components/BrandLogo';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { uploadService } from '../services/uploadService';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Profile.css';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '', avatar: null });
    const [uploadPreview, setUploadPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Advanced modal state
    const [expandedPost, setExpandedPost] = useState(null);
    const [currentPostIndex, setCurrentPostIndex] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [liked, setLiked] = useState(false);
    const modalRef = useRef(null);

    const isOwnProfile = currentUser?._id === id;

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, [id]);

    // Keyboard navigation for modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!expandedPost) return;
            
            if (e.key === 'Escape') {
                closeModal();
            } else if (e.key === 'ArrowLeft') {
                navigateToPrevious();
            } else if (e.key === 'ArrowRight') {
                navigateToNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [expandedPost, currentPostIndex]);

    // Modal Navigation Functions
    const openPostModal = (post) => {
        const index = posts.findIndex(p => p._id === post._id);
        setCurrentPostIndex(index);
        setExpandedPost(post);
        setLiked(post.isLiked || false);
        setCommentText('');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    const closeModal = () => {
        setExpandedPost(null);
        setCurrentPostIndex(null);
        setCommentText('');
        document.body.style.overflow = 'auto'; // Re-enable background scroll
    };

    const navigateToNext = () => {
        if (currentPostIndex !== null && currentPostIndex < posts.length - 1) {
            const nextPost = posts[currentPostIndex + 1];
            setExpandedPost(nextPost);
            setCurrentPostIndex(currentPostIndex + 1);
            setLiked(nextPost.isLiked || false);
            setCommentText('');
        }
    };

    const navigateToPrevious = () => {
        if (currentPostIndex !== null && currentPostIndex > 0) {
            const prevPost = posts[currentPostIndex - 1];
            setExpandedPost(prevPost);
            setCurrentPostIndex(currentPostIndex - 1);
            setLiked(prevPost.isLiked || false);
            setCommentText('');
        }
    };

    // Handle adding a comment
    const handleAddComment = async () => {
        if (!commentText.trim() || !expandedPost) return;

        try {
            // Call comment service to add comment
            const response = await commentService.addComment(expandedPost._id, commentText);

            // Update expanded post with new comment
            const newComment = response.comment || {
                _id: Date.now(),
                userId: { username: currentUser?.username, _id: currentUser?._id },
                text: commentText,
                createdAt: new Date()
            };

            const updatedPost = {
                ...expandedPost,
                comments: [...(expandedPost.comments || []), newComment]
            };
            setExpandedPost(updatedPost);

            // Update posts array
            const updatedPosts = posts.map(p => 
                p._id === expandedPost._id ? updatedPost : p
            );
            setPosts(updatedPosts);

            // Clear input
            setCommentText('');
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const fetchProfile = async () => {
        try {
            const userData = await userService.getUser(id);
            setProfile(userData);
            setIsFollowing(userData.followers?.some(f => f._id === currentUser?._id));
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        try {
            const userPosts = await postService.getUserPosts(id);
            setPosts(userPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await userService.unfollowUser(id);
                setIsFollowing(false);
                setProfile({
                    ...profile,
                    followerCount: profile.followerCount - 1
                });
            } else {
                await userService.followUser(id);
                setIsFollowing(true);
                setProfile({
                    ...profile,
                    followerCount: profile.followerCount + 1
                });
            }
        } catch (error) {
            console.error('Error following/unfollowing:', error);
            alert('Failed to update follow status');
        }
    };

    const handleEditProfile = () => {
        setEditForm({ 
            username: profile.username, 
            bio: profile.bio || '',
            avatar: null
        });
        setUploadPreview(profile.avatar);
        setShowEditModal(true);
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsUploading(true);
            try {
                // Show preview while uploading
                const reader = new FileReader();
                reader.onloadend = () => {
                    setUploadPreview(reader.result);
                };
                reader.readAsDataURL(file);

                // Upload to Cloudinary
                const uploadResult = await uploadService.uploadImage(file);
                setEditForm({ ...editForm, avatar: uploadResult.url });
            } catch (error) {
                console.error('Avatar upload error:', error);
                alert('Failed to upload image. Please try again.');
                setUploadPreview(null);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleSaveProfile = async () => {
        try {
            if (!editForm.username.trim()) {
                alert('Username cannot be empty');
                return;
            }
            const updates = {
                username: editForm.username,
                bio: editForm.bio
            };
            if (editForm.avatar) {
                updates.avatar = editForm.avatar;
            }
            await updateProfile(updates);
            setShowEditModal(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to update profile');
        }
    };

    const updateProfile = async (updates) => {
        try {
            const updated = await userService.updateUser(id, updates);
            setProfile(updated);
            // alert('Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F1ED]">
                <LoadingSpinner message="Loading profile..." />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F1ED]">
                <div className="bg-white p-8 rounded-xl border border-[#E4E0DA] text-center max-w-md w-full">
                    <p className="text-[#2C2B28] font-medium mb-4">Profile not found</p>
                    <button onClick={() => navigate('/feed')} className="prof-btn-primary w-full">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page-wrapper">
            
            {/* NAV */}
            <nav className="prof-nav">
                <Link to="/feed" className="prof-logo">
                    <BrandLogo size="md" />
                </Link>
                <div className="prof-nav-end">
                    <button className="prof-icon-btn" title="Messages"><MessageSquare className="w-[18px] h-[18px]" /></button>
                    <button className="prof-icon-btn" title="Notifications">
                        <Bell className="w-[18px] h-[18px]" />
                        <div className="prof-notif-dot"></div>
                    </button>
                    <button 
                        className="prof-icon-btn" 
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-[18px] h-[18px]" />
                        ) : (
                            <Moon className="w-[18px] h-[18px]" />
                        )}
                    </button>
                    <div className="prof-nav-divider"></div>
                    <button 
                        className="prof-avatar-sm" 
                        onClick={() => navigate(`/profile/${currentUser?._id}`)}
                        title="Go to my profile"
                    >
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} alt="Me" />
                        ) : (
                            currentUser?.username?.[0]?.toUpperCase() || 'U'
                        )}
                    </button>
                    <button onClick={handleLogout} className="ml-2 text-xs text-red-500 hover:underline">Logout</button>
                </div>
            </nav>

            <div className="prof-layout">
                {/* PROFILE HEADER */}
                <div className="prof-header">
                    {/* Avatar + User Info */}
                    <div className="prof-header-left">
                        <div className="prof-profile-avatar">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.username} />
                            ) : (
                                <div className="prof-avatar-placeholder">
                                    {profile.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="prof-online-indicator"></div>
                        </div>

                        <div className="prof-header-info">
                            <h1 className="prof-username">{profile.username}</h1>
                            <div className="prof-subtitle">
                                <span className="prof-handle">@{profile.username.toLowerCase().replace(/\s+/g, '')}</span>
                                <span className="prof-sep">•</span>
                                <span className="prof-role">Scrolla creator</span>
                            </div>
                            <p className="prof-bio">{profile.bio || 'Sharing moments of mindful scrolling.'} 🕊️ Building things that matter</p>
                            <div className="prof-meta">
                                <span>📍 Delhi, India</span>
                                <span>📅 Joined March 2024</span>
                                <a href="#scrolla" className="prof-link">🔗 scrolla.app</a>
                            </div>
                        </div>
                    </div>

                    {/* Stats + Buttons */}
                    <div className="prof-header-right">
                        {/* Stats */}
                        <div className="prof-stats">
                            <div className="prof-stat">
                                <div className="prof-stat-value">{posts.length}</div>
                                <div className="prof-stat-label">POSTS</div>
                            </div>
                            <div className="prof-stat">
                                <div className="prof-stat-value">{profile.followerCount || 0}</div>
                                <div className="prof-stat-label">FOLLOWERS</div>
                            </div>
                            <div className="prof-stat">
                                <div className="prof-stat-value">{profile.followingCount || 0}</div>
                                <div className="prof-stat-label">FOLLOWING</div>
                            </div>
                            <div className="prof-stat">
                                <div className="prof-stat-value">87%</div>
                                <div className="prof-stat-label">AVG MOOD</div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="prof-header-actions">
                            {isOwnProfile ? (
                                <button onClick={handleEditProfile} className="prof-btn prof-btn-primary">
                                    Edit Profile
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollow} 
                                    className={isFollowing ? 'prof-btn prof-btn-secondary' : 'prof-btn prof-btn-primary'}
                                >
                                    {isFollowing ? 'Unfollow' : 'Follow'}
                                </button>
                            )}
                            <button className="prof-btn prof-btn-secondary">Share</button>
                            <button className="prof-btn prof-btn-icon">...</button>
                        </div>
                    </div>
                </div>

                {/* Interest Tags */}
                <div className="prof-interests">
                    <span className="prof-interest-tag">🏔️ Mountains</span>
                    <span className="prof-interest-tag">💻 Tech</span>
                    <span className="prof-interest-tag">🧘 Mindfulness</span>
                    <span className="prof-interest-tag">🍵 Chai enjoyer</span>
                    <span className="prof-interest-tag">🚗 Road trips</span>
                </div>

                {/* Highlights Section */}
                <div className="prof-highlights">
                    <h3 className="prof-highlights-title">HIGHLIGHTS</h3>
                    <div className="prof-highlights-grid">
                        <button className="prof-highlight-add">+</button>
                        <div className="prof-highlight">
                            <div className="prof-highlight-avatar">🏔️</div>
                            <span>Mountains</span>
                        </div>
                        <div className="prof-highlight">
                            <div className="prof-highlight-avatar">🧘</div>
                            <span>Calm</span>
                        </div>
                        <div className="prof-highlight">
                            <div className="prof-highlight-avatar">🚗</div>
                            <span>Road trips</span>
                        </div>
                        <div className="prof-highlight">
                            <div className="prof-highlight-avatar">☕</div>
                            <span>Daily chat</span>
                        </div>
                        <div className="prof-highlight">
                            <div className="prof-highlight-avatar">💻</div>
                            <span>Tech</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="prof-tabs">
                    <button 
                        className={`prof-tab ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        Posts
                    </button>
                    <button 
                        className={`prof-tab ${activeTab === 'saved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('saved')}
                    >
                        Saved
                    </button>
                    <button 
                        className={`prof-tab ${activeTab === 'journeys' ? 'active' : ''}`}
                        onClick={() => setActiveTab('journeys')}
                    >
                        Journeys
                    </button>
                    <button 
                        className={`prof-tab ${activeTab === 'mood' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mood')}
                    >
                        Mood Log
                    </button>
                </div>

                {/* Posts Grid - Media Thumbnails */}
                <div className="prof-posts-grid">
                    {posts.length === 0 ? (
                        <div className="prof-empty-state">
                            <p className="prof-empty-text">
                                {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                            </p>
                            {isOwnProfile && (
                                <Link to="/create-post" className="prof-btn prof-btn-primary mt-4">
                                    Create First Post
                                </Link>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => {
                            // Get first image or video
                            const hasImages = post.images && post.images.length > 0;
                            const hasVideos = post.videos && post.videos.length > 0;
                            
                            let mediaUrl = null;
                            let isVideo = false;
                            
                            if (hasImages) {
                                const image = post.images[0];
                                mediaUrl = typeof image === 'object' && image.url ? image.url : image;
                            } else if (hasVideos) {
                                const video = post.videos[0];
                                mediaUrl = typeof video === 'object' && video.url ? video.url : video;
                                isVideo = true;
                            }
                            
                            // Fallback to old post.image or post.media structure if needed
                            if (!mediaUrl) {
                                mediaUrl = post.image || (post.media && post.media[0]) || '/placeholder.jpg';
                                isVideo = mediaUrl?.includes('.mp4') || mediaUrl?.includes('.webm') || mediaUrl?.includes('.mov');
                            }
                            
                            return (
                                <div 
                                    key={post._id}
                                    className="prof-media-grid-item"
                                    onClick={() => openPostModal(post)}
                                    onMouseEnter={(e) => {
                                        if (isVideo) {
                                            const video = e.currentTarget.querySelector('video');
                                            if (video) video.play();
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (isVideo) {
                                            const video = e.currentTarget.querySelector('video');
                                            if (video) {
                                                video.pause();
                                                video.currentTime = 0;
                                            }
                                        }
                                    }}
                                >
                                    {/* Media Thumbnail */}
                                    {isVideo ? (
                                        <>
                                            <video 
                                                src={mediaUrl} 
                                                className="prof-media-thumbnail"
                                                muted
                                            />
                                            <div className="prof-video-overlay">
                                                <Play size={48} className="prof-play-icon" />
                                            </div>
                                        </>
                                    ) : (
                                        <img 
                                            src={mediaUrl} 
                                            alt="Post thumbnail"
                                            className="prof-media-thumbnail"
                                        />
                                    )}
                                    
                                    {/* Hover Stats Overlay */}
                                    <div className="prof-media-overlay">
                                        <div className="prof-stats-overlay">
                                            <div className="prof-stat-item">
                                                <Heart size={18} />
                                                <span>{post.likes?.length || post.likeCount || 0}</span>
                                            </div>
                                            <div className="prof-stat-item">
                                                <MessageCircle size={18} />
                                                <span>{post.comments?.length || post.commentCount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* INSTAGRAM-STYLE MEDIA VIEWER MODAL */}
            {expandedPost && (
                <>
                    {/* Blurred Backdrop */}
                    <div 
                        className="prof-modal-backdrop-blur"
                        onClick={closeModal}
                    ></div>
                    
                    {/* Modal Container */}
                    <div className="prof-media-modal" ref={modalRef}>
                        {/* Close Button */}
                        <button 
                            className="prof-modal-close-btn"
                            onClick={closeModal}
                            title="Close (ESC)"
                        >
                            <X size={32} />
                        </button>

                        {/* Left Section - Media */}
                        <div className="prof-modal-media-section">
                            {expandedPost.videos && expandedPost.videos.length > 0 ? (
                                <video 
                                    src={typeof expandedPost.videos[0] === 'object' ? expandedPost.videos[0].url : expandedPost.videos[0]} 
                                    className="prof-modal-media"
                                    controls
                                    autoPlay
                                    muted
                                />
                            ) : expandedPost.images && expandedPost.images.length > 0 ? (
                                <img 
                                    src={typeof expandedPost.images[0] === 'object' ? expandedPost.images[0].url : expandedPost.images[0]}
                                    alt="Post"
                                    className="prof-modal-media"
                                />
                            ) : (
                                <img 
                                    src={expandedPost.image || '/placeholder.jpg'}
                                    alt="Post"
                                    className="prof-modal-media"
                                />
                            )}
                            
                            {/* Post Counter - Below Media */}
                            {currentPostIndex !== null && (
                                <div className="prof-media-counter">
                                    {currentPostIndex + 1} / {posts.length}
                                </div>
                            )}
                        </div>

                        {/* Right Section - Caption, Likes, Comments */}
                        <div className="prof-modal-content-section">
                            {/* Header */}
                            <div className="prof-modal-header-section">
                                <div className="prof-modal-user-info">
                                    <img 
                                        src={profile?.avatar || '/avatar.png'} 
                                        alt={profile?.username}
                                        className="prof-modal-avatar"
                                    />
                                    <div className="prof-modal-user-details">
                                        <p className="prof-modal-username">{profile?.username}</p>
                                        <p className="prof-modal-timestamp">
                                            {expandedPost.createdAt ? new Date(expandedPost.createdAt).toLocaleDateString() : ''}
                                        </p>
                                    </div>
                                </div>
                                {!isOwnProfile && (
                                    <button className="prof-follow-btn">
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>

                            {/* Caption */}
                            <div className="prof-modal-caption">
                                <p className="prof-caption-text">
                                    {expandedPost.content || expandedPost.caption || expandedPost.thoughts || 'No caption'}
                                </p>
                            </div>

                            {/* Likes */}
                            <div className="prof-modal-likes">
                                <strong>{expandedPost.likes?.length || expandedPost.likeCount || 0} likes</strong>
                            </div>

                            {/* Comments Section */}
                            <div className="prof-modal-comments">
                                {expandedPost.comments && expandedPost.comments.length > 0 ? (
                                    <div className="prof-comments-list">
                                        {expandedPost.comments.slice(0, 5).map((comment, idx) => (
                                            <div key={idx} className="prof-comment-item">
                                                <strong>{comment.userId?.username || comment.username}</strong>
                                                <span>{comment.text || comment.content}</span>
                                            </div>
                                        ))}
                                        {expandedPost.comments.length > 5 && (
                                            <button className="prof-view-all-comments">
                                                View all {expandedPost.comments.length} comments
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <p className="prof-no-comments">No comments yet</p>
                                )}
                            </div>

                            {/* Actions - Like, Comment */}
                            <div className="prof-modal-actions">
                                <button 
                                    className={`prof-action-btn ${liked ? 'active' : ''}`}
                                    onClick={() => setLiked(!liked)}
                                    title="Like"
                                >
                                    <Heart size={24} fill={liked ? 'currentColor' : 'none'} />
                                    <span className="prof-action-count">
                                        {expandedPost.likes?.length || expandedPost.likeCount || 0}
                                    </span>
                                </button>
                                <button className="prof-action-btn" title="Comments">
                                    <MessageCircle size={24} />
                                    <span className="prof-action-count">
                                        {expandedPost.comments?.length || expandedPost.commentCount || 0}
                                    </span>
                                </button>
                                <button className="prof-action-btn" title="Share">
                                    <Send size={24} />
                                </button>
                            </div>

                            {/* Add Comment Input */}
                            <div className="prof-modal-comment-input">
                                <input 
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="prof-comment-input-field"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && commentText.trim()) {
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <button 
                                    className="prof-submit-comment-btn"
                                    disabled={!commentText.trim()}
                                    onClick={handleAddComment}
                                >
                                    Post
                                </button>
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        {currentPostIndex !== null && (
                            <>
                                <button 
                                    className="prof-nav-arrow prof-nav-prev"
                                    onClick={navigateToPrevious}
                                    disabled={currentPostIndex === 0}
                                    title="Previous (← arrow key)"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button 
                                    className="prof-nav-arrow prof-nav-next"
                                    onClick={navigateToNext}
                                    disabled={currentPostIndex === posts.length - 1}
                                    title="Next (→ arrow key)"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* EDIT PROFILE MODAL */}
            {showEditModal && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="prof-modal-backdrop"
                        onClick={() => setShowEditModal(false)}
                    ></div>
                    
                    {/* Modal */}
                    <div className="prof-edit-modal">
                        <div className="prof-modal-header">
                            <h2 className="prof-modal-title">Edit Profile</h2>
                            <button 
                                className="prof-modal-close"
                                onClick={() => setShowEditModal(false)}
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="prof-modal-content">
                            {/* Avatar Upload Section */}
                            <div className="prof-modal-section">
                                <label className="prof-modal-label">Profile Picture</label>
                                <div className="prof-avatar-upload">
                                    <div className="prof-avatar-preview">
                                        {uploadPreview ? (
                                            <img src={uploadPreview} alt="Preview" />
                                        ) : (
                                            <div className="prof-avatar-placeholder">
                                                {editForm.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        {isUploading && <div className="prof-upload-loading">Uploading...</div>}
                                    </div>
                                    <input
                                        type="file"
                                        id="avatar-input"
                                        className="prof-file-input"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={isUploading}
                                    />
                                    <label htmlFor="avatar-input" className={`prof-btn-upload ${isUploading ? 'uploading' : ''}`}>
                                        {isUploading ? 'Uploading...' : 'Choose Image'}
                                    </label>
                                </div>
                            </div>

                            {/* Username Section */}
                            <div className="prof-modal-section">
                                <label className="prof-modal-label">Username</label>
                                <input
                                    type="text"
                                    className="prof-modal-input"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                    placeholder="Enter your username"
                                />
                            </div>

                            {/* Bio Section */}
                            <div className="prof-modal-section">
                                <label className="prof-modal-label">Bio</label>
                                <textarea
                                    className="prof-modal-textarea"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    placeholder="Tell us about yourself..."
                                    rows="4"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="prof-modal-actions">
                                <button 
                                    className="prof-btn-cancel"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="prof-btn-save"
                                    onClick={handleSaveProfile}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;
