import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
    Edit, UserPlus, UserMinus,
    Home, Search, Map, Bookmark, User, Sun, Moon, Bell,
    ChevronLeft, ChevronRight, Play, Heart, MessageCircle, Send, X,
    Compass, PlusSquare, MoreVertical
} from 'lucide-react';
import PostCard from '../components/PostCard';
import ThreeDotMenu from '../components/ThreeDotMenu';
import LoadingSpinner from '../components/LoadingSpinner';
import BrandLogo from '../components/BrandLogo';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { uploadService } from '../services/uploadService';
import { commentService } from '../services/commentService';
import { sharedJourneyService } from '../services/sharedJourneyService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Profile.css';
import MoodLog from '../components/MoodLog';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [savedPosts, setSavedPosts] = useState([]);
    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'posts');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ username: '', bio: '', avatar: null, location: '', website: '', role: '' });
    const [uploadPreview, setUploadPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // Advanced modal state
    const [expandedPost, setExpandedPost] = useState(null);
    const [currentPostIndex, setCurrentPostIndex] = useState(null);
    const [commentText, setCommentText] = useState('');
    const [liked, setLiked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showAllComments, setShowAllComments] = useState(false);
    const modalRef = useRef(null);

    // Followers/Following modal state
    const [showFollowModal, setShowFollowModal] = useState(false);
    const [followModalTab, setFollowModalTab] = useState('followers'); // 'followers' | 'following'
    const [followersList, setFollowersList] = useState([]);
    const [followingList, setFollowingList] = useState([]);
    const [followModalLoading, setFollowModalLoading] = useState(false);
    const [followActionLoading, setFollowActionLoading] = useState({});
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    const isOwnProfile = String(currentUser?._id) === String(id);

    // Sync tab from URL param when navigating (e.g. ?tab=saved)
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        // Prevent non-owners from accessing the mood tab
        if (tabFromUrl && (tabFromUrl === 'mood' && !isOwnProfile)) {
            setActiveTab('posts');
        } else if (tabFromUrl) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams, isOwnProfile]);

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
        if (currentUser?._id === id) {
            fetchSavedPosts();
            fetchJourneys();
        }
    }, [id, currentUser?._id]);

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
    }, [expandedPost, currentPostIndex, currentMediaIndex]);

    // Modal Navigation Functions
    const openPostModal = async (post) => {
        const index = posts.findIndex(p => p._id === post._id);
        setCurrentPostIndex(index);
        setExpandedPost(post);
        setCurrentMediaIndex(0);
        setLiked(post.isLiked || false);
        setCommentText('');
        setShowAllComments(false);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        
        // Fetch fresh comments when opening modal
        try {
            const comments = await commentService.getComments(post._id);
            setExpandedPost(prev => ({
                ...prev,
                comments: comments || []
            }));
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const closeModal = () => {
        setExpandedPost(null);
        setCurrentPostIndex(null);
        setCommentText('');
        setShowAllComments(false);
        document.body.style.overflow = 'auto'; // Re-enable background scroll
    };

    const navigateToNext = () => {
        const totalMedia = (expandedPost?.videos?.length || 0) + (expandedPost?.images?.length || 0);
        if (totalMedia > 1 && currentMediaIndex < totalMedia - 1) {
            setCurrentMediaIndex(prev => prev + 1);
        }
    };

    const navigateToPrevious = () => {
        if (currentMediaIndex > 0) {
            setCurrentMediaIndex(prev => prev - 1);
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
            console.log('Fetched profile data:', userData);
            setProfile(userData);
            
            // The backend sends a pre-calculated isFollowing boolean if the user is logged in
            setIsFollowing(userData.isFollowing || false);
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

    const fetchSavedPosts = async () => {
        try {
            const saved = await postService.getSavedPosts();
            setSavedPosts(saved);
        } catch (error) {
            console.error('Error fetching saved posts:', error);
        }
    };

    const fetchJourneys = async () => {
        try {
            const userJourneys = await sharedJourneyService.getMine();
            setJourneys(userJourneys);
        } catch (error) {
            console.error('Error fetching journeys:', error);
        }
    };

    const handleFollow = async () => {
        const prevFollowing = isFollowing;
        const prevFollowerCount = profile.followerCount;
        
        // Optimistic UI Update
        setIsFollowing(!prevFollowing);
        setProfile({
            ...profile,
            followerCount: prevFollowing ? prevFollowerCount - 1 : prevFollowerCount + 1
        });

        try {
            if (prevFollowing) {
                await userService.unfollowUser(id);
            } else {
                await userService.followUser(id);
            }
        } catch (error) {
            console.error('Error following/unfollowing:', error);
            // Roll back on failure
            setIsFollowing(prevFollowing);
            setProfile({
                ...profile,
                followerCount: prevFollowerCount
            });
            alert('Failed to update follow status');
        }
    };

    // ── Followers/Following Modal Functions ──
    const openFollowModal = async (tab) => {
        setFollowModalTab(tab);
        setShowFollowModal(true);
        setFollowModalLoading(true);
        document.body.style.overflow = 'hidden';
        try {
            const [followers, following] = await Promise.all([
                userService.getFollowers(id),
                userService.getFollowing(id)
            ]);
            setFollowersList(followers || []);
            setFollowingList(following || []);
        } catch (err) {
            console.error('Error fetching follow lists:', err);
        } finally {
            setFollowModalLoading(false);
        }
    };

    const closeFollowModal = () => {
        setShowFollowModal(false);
        document.body.style.overflow = 'auto';
    };

    const handleFollowFromModal = async (userId) => {
        setFollowActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await userService.followUser(userId);
            // Update the following list to reflect the change
            const updatedUser = followersList.find(u => u._id === userId) || followingList.find(u => u._id === userId);
            if (updatedUser) {
                setFollowingList(prev => [...prev, updatedUser]);
            }
        } catch (err) {
            console.error('Error following user:', err);
        } finally {
            setFollowActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleUnfollowFromModal = async (userId) => {
        setFollowActionLoading(prev => ({ ...prev, [userId]: true }));
        try {
            await userService.unfollowUser(userId);
            setFollowingList(prev => prev.filter(u => u._id !== userId));
        } catch (err) {
            console.error('Error unfollowing user:', err);
        } finally {
            setFollowActionLoading(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleEditProfile = () => {
        setEditForm({ 
            username: profile.username, 
            bio: profile.bio || '',
            avatar: null,
            location: profile.location || '',
            website: profile.website || '',
            role: profile.role || ''
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
                bio: editForm.bio,
                location: editForm.location,
                website: editForm.website,
                role: editForm.role
            };
            if (editForm.avatar) {
                updates.avatar = editForm.avatar;
            }
            console.log('Saving profile updates:', updates);
            await updateProfile(updates);
            // Refetch profile to ensure all data is fresh
            await fetchProfile();
            console.log('Profile after fetch:', profile);
            setShowEditModal(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to update profile');
        }
    };

    const updateProfile = async (updates) => {
        try {
            console.log('Calling updateUser with:', updates);
            const updated = await userService.updateUser(id, updates);
            console.log('Response from updateUser:', updated);
            // Merge updated data with current profile to ensure all fields display
            const updatedProfile = {
                ...profile,
                ...updated
            };
            console.log('Merged profile:', updatedProfile);
            setProfile(updatedProfile);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
            throw error;
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderPostGridItem = (post) => {
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
            {/* INSTAGRAM-STYLE SIDEBAR */}
            <aside className="prof-sidebar">
                {/* Logo */}
                <Link to="/feed" className="prof-sidebar-logo">
                    <BrandLogo size="md" />
                </Link>

                {/* Navigation Menu */}
                <nav className="prof-sidebar-nav">
                    <Link to="/feed" className="prof-sidebar-item" title="Home">
                        <Home size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">Home</span>
                    </Link>

                    <Link to="/feed" className="prof-sidebar-item" title="Explore">
                        <Compass size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">Explore</span>
                    </Link>

                    <Link to="/journeys" className="prof-sidebar-item" title="Journeys">
                        <Map size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">Journeys</span>
                    </Link>

                    <Link to={`/profile/${currentUser?._id}?tab=saved`} className="prof-sidebar-item" title="Saved">
                        <Bookmark size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">Saved</span>
                    </Link>

                    <Link to={`/profile/${currentUser?._id}`} className="prof-sidebar-item prof-sidebar-item--active" title="Profile">
                        <User size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">Profile</span>
                    </Link>

                    <Link to="/notifications" className="prof-sidebar-item" title="Notifications">
                        <Bell size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">Notifications</span>
                    </Link>

                    <Link to="/create-post" className="prof-sidebar-item" title="Create">
                        <PlusSquare size={24} className="prof-sidebar-icon" />
                        <span className="prof-sidebar-label">+ Create</span>
                    </Link>
                </nav>

                {/* Bottom Section - Theme Toggle & Logout */}
                <div className="prof-sidebar-bottom">
                    <button 
                        className="prof-sidebar-item-bottom"
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    >
                        {theme === 'dark' ? (
                            <Sun size={24} className="prof-sidebar-icon" />
                        ) : (
                            <Moon size={24} className="prof-sidebar-icon" />
                        )}
                        <span className="prof-sidebar-label">
                            {theme === 'dark' ? 'Light' : 'Dark'}
                        </span>
                    </button>

                    <button 
                        className="prof-sidebar-item-bottom prof-logout-btn"
                        onClick={handleLogout}
                        title="Logout"
                    >
                        <span className="prof-sidebar-label">Logout</span>
                    </button>
                </div>
            </aside>
            

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
                                {profile.role && profile.role.trim() && (
                                    <>
                                        <span className="prof-sep">•</span>
                                        <span className="prof-role">{profile.role}</span>
                                    </>
                                )}
                            </div>
                            {profile.bio && profile.bio.trim() && <p className="prof-bio">{profile.bio}</p>}
                            <div className="prof-meta">
                                {profile.location && profile.location.trim() && <span>📍 {profile.location}</span>}
                                {profile.createdAt && <span>📅 Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>}
                                {profile.website && profile.website.trim() && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="prof-link">🔗 {profile.website}</a>}
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
                            <div className="prof-stat prof-stat-clickable" onClick={() => openFollowModal('followers')}>
                                <div className="prof-stat-value">{profile.followerCount || 0}</div>
                                <div className="prof-stat-label">FOLLOWERS</div>
                            </div>
                            <div className="prof-stat prof-stat-clickable" onClick={() => openFollowModal('following')}>
                                <div className="prof-stat-value">{profile.followingCount || 0}</div>
                                <div className="prof-stat-label">FOLLOWING</div>
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
                    {isOwnProfile && (
                        <button 
                            className={`prof-tab ${activeTab === 'mood' ? 'active' : ''}`}
                            onClick={() => setActiveTab('mood')}
                        >
                            Mood Log
                        </button>
                    )}
                </div>

                {/* Content Grid - Posts, Saved, Journeys */}
                <div className="prof-posts-grid">
                    {activeTab === 'posts' && (
                        <>
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
                                posts.map((post) => renderPostGridItem(post))
                            )}
                        </>
                    )}

                    {activeTab === 'saved' && (
                        <>
                            {!isOwnProfile ? (
                                <div className="prof-empty-state">
                                    <p className="prof-empty-text">Saved posts are private</p>
                                </div>
                            ) : savedPosts.length === 0 ? (
                                <div className="prof-empty-state">
                                    <p className="prof-empty-text">You haven't saved any posts yet</p>
                                </div>
                            ) : (
                                savedPosts.map((post) => renderPostGridItem(post))
                            )}
                        </>
                    )}

                    {activeTab === 'journeys' && (
                        <>
                            {!isOwnProfile ? (
                                <div className="prof-empty-state">
                                    <p className="prof-empty-text">Journeys are private</p>
                                </div>
                            ) : journeys.length === 0 ? (
                                <div className="prof-empty-state">
                                    <p className="prof-empty-text">You haven't joined or created any journeys yet</p>
                                    <Link to="/journeys" className="prof-btn prof-btn-primary mt-4">
                                        Explore Journeys
                                    </Link>
                                </div>
                            ) : (
                                journeys.map((journey) => (
                                    <div key={journey._id} className="prof-journey-card" style={{
                                        background: 'var(--color-surface-blue)',
                                        border: '1px solid var(--color-border-medium)',
                                        borderRadius: 'var(--radius-lg)',
                                        padding: '1.5rem',
                                        cursor: 'pointer',
                                        transition: 'all .3s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        aspectRatio: '1',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-accent-primary)', fontWeight: 600 }}>
                                            {journey.isActive ? '🔴 LIVE' : journey.closedAt ? '✓ ENDED' : '⏰ CLOSED'}
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {journey.title}
                                        </h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                                            {journey.prompt}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                                            <span>👥 {journey.memberCount}</span>
                                            <span>⏱️ {Math.ceil((new Date(journey.deadline) - new Date()) / (1000 * 60 * 60))}h</span>
                                        </div>
                                        <Link to={`/journeys/${journey._id}`} className="prof-btn prof-btn-primary" style={{ marginTop: 'auto', textAlign: 'center', textDecoration: 'none', fontSize: '0.9rem' }}>
                                            View →
                                        </Link>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {activeTab === 'mood' && (
                        <MoodLog isOwnProfile={isOwnProfile} />
                    )}
                </div>
            </div>

            {/* Helper function to render post grid items */}

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
                            {(() => {
                                const allMedia = [
                                    ...(expandedPost.images || []).map(i => ({ type: 'image', src: typeof i === 'object' ? i.url : i })),
                                    ...(expandedPost.videos || []).map(v => ({ type: 'video', src: typeof v === 'object' ? v.url : v }))
                                ];
                                if (allMedia.length === 0) {
                                    return <img src={expandedPost.image || '/placeholder.jpg'} alt="Post" className="prof-modal-media" />;
                                }
                                const media = allMedia[currentMediaIndex] || allMedia[0];
                                return media.type === 'video' ? (
                                    <video src={media.src} className="prof-modal-media" controls autoPlay muted />
                                ) : (
                                    <img src={media.src} alt="Post" className="prof-modal-media" />
                                );
                            })()}
                            
                            {/* Post Counter - Below Media */}
                            {(() => {
                                const totalMedia = (expandedPost.images?.length || 0) + (expandedPost.videos?.length || 0);
                                if (totalMedia > 1) {
                                    return (
                                        <div className="prof-media-counter">
                                            {currentMediaIndex + 1} / {totalMedia}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* Right Section - Caption, Likes, Comments */}
                        <div className="prof-modal-content-section">
                            {/* Header */}
                            <div className="prof-modal-header-section" style={{ paddingRight: '56px' }}>
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
                                {isOwnProfile && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '8px',
                                                color: '#A8A5A0',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '50%',
                                                transition: 'background-color 0.2s ease'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {showMenu && (
                                            <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 100 }}>
                                                <ThreeDotMenu
                                                    isOwnPost={true}
                                                    onEdit={() => {
                                                        navigate(`/edit-post/${expandedPost._id}`, { state: { post: expandedPost } });
                                                        closeModal();
                                                    }}
                                                    onDelete={async () => {
                                                        if (window.confirm('Are you sure you want to delete this post?')) {
                                                            try {
                                                                await postService.deletePost(expandedPost._id);
                                                                alert('Post deleted!');
                                                                closeModal();
                                                                fetchUserPosts();
                                                            } catch (error) {
                                                                console.error('Error deleting post:', error);
                                                            }
                                                        }
                                                    }}
                                                    onClose={() => setShowMenu(false)}
                                                />
                                            </div>
                                        )}
                                    </div>
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
                                        {expandedPost.comments.slice(0, 3).map((comment, idx) => (
                                            <div key={idx} className="prof-comment-item">
                                                <img 
                                                    src={comment.author?.avatar || comment.userId?.avatar} 
                                                    alt="avatar"
                                                    className="prof-comment-avatar"
                                                    onError={(e) => { e.target.src = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'; }}
                                                />
                                                <div className="prof-comment-content">
                                                    <strong>{comment.author?.username || comment.userId?.username || comment.username}</strong>
                                                    <span>{comment.content || comment.text}</span>
                                                </div>
                                            </div>
                                        ))}
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
                        {(() => {
                            const totalMedia = (expandedPost.images?.length || 0) + (expandedPost.videos?.length || 0);
                            if (totalMedia > 1) {
                                return (
                                    <>
                                        <button 
                                            className="prof-nav-arrow prof-nav-prev"
                                            onClick={navigateToPrevious}
                                            disabled={currentMediaIndex === 0}
                                            title="Previous Media (← arrow key)"
                                        >
                                            <ChevronLeft size={32} />
                                        </button>
                                        <button 
                                            className="prof-nav-arrow prof-nav-next"
                                            onClick={navigateToNext}
                                            disabled={currentMediaIndex === totalMedia - 1}
                                            title="Next Media (→ arrow key)"
                                        >
                                            <ChevronRight size={32} />
                                        </button>
                                    </>
                                );
                            }
                            return null;
                        })()}
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

                            {/* Location Section */}
                            <div className="prof-modal-section">
                                <label className="prof-modal-label">Location</label>
                                <input
                                    type="text"
                                    className="prof-modal-input"
                                    value={editForm.location}
                                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                    placeholder="Enter your location (e.g., Delhi, India)"
                                />
                            </div>

                            {/* Website Section */}
                            <div className="prof-modal-section">
                                <label className="prof-modal-label">Website</label>
                                <input
                                    type="url"
                                    className="prof-modal-input"
                                    value={editForm.website}
                                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>

                            {/* Role Section */}
                            <div className="prof-modal-section">
                                <label className="prof-modal-label">Role / Profession</label>
                                <input
                                    type="text"
                                    className="prof-modal-input"
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    placeholder="e.g., Designer, Developer, Creator"
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

            {/* ═══ FOLLOWERS / FOLLOWING MODAL ═══ */}
            {showFollowModal && (
                <>
                    <div 
                        className="prof-modal-backdrop-blur"
                        onClick={closeFollowModal}
                    ></div>
                    <div className="prof-follow-modal">
                        {/* Modal Header with Tabs */}
                        <div className="prof-follow-modal-header">
                            <button 
                                className={`prof-follow-modal-tab ${followModalTab === 'followers' ? 'active' : ''}`}
                                onClick={() => setFollowModalTab('followers')}
                            >
                                Followers
                                <span className="prof-follow-modal-count">{followersList.length}</span>
                            </button>
                            <button 
                                className={`prof-follow-modal-tab ${followModalTab === 'following' ? 'active' : ''}`}
                                onClick={() => setFollowModalTab('following')}
                            >
                                Following
                                <span className="prof-follow-modal-count">{followingList.length}</span>
                            </button>
                            <button className="prof-follow-modal-close" onClick={closeFollowModal}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* User List */}
                        <div className="prof-follow-modal-list">
                            {followModalLoading ? (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : (
                                <>
                                    {(followModalTab === 'followers' ? followersList : followingList).length === 0 ? (
                                        <div className="prof-follow-modal-empty">
                                            {followModalTab === 'followers' 
                                                ? 'No followers yet' 
                                                : 'Not following anyone yet'}
                                        </div>
                                    ) : (
                                        (followModalTab === 'followers' ? followersList : followingList).map(person => {
                                            const isMe = person._id === currentUser?._id;
                                            const amFollowing = followingList.some(u => u._id === person._id);

                                            return (
                                                <div key={person._id} className="prof-follow-modal-user">
                                                    <div 
                                                        className="prof-follow-modal-user-left"
                                                        onClick={() => { closeFollowModal(); navigate(`/profile/${person._id}`); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="prof-follow-modal-avatar">
                                                            {person.avatar && !person.avatar.includes('dicebear') ? (
                                                                <img src={person.avatar} alt={person.username} />
                                                            ) : (
                                                                <span>{person.username?.charAt(0).toUpperCase()}</span>
                                                            )}
                                                        </div>
                                                        <div className="prof-follow-modal-user-info">
                                                            <span className="prof-follow-modal-username">{person.username}</span>
                                                            {person.bio && (
                                                                <span className="prof-follow-modal-bio">
                                                                    {person.bio.length > 40 ? person.bio.substring(0, 40) + '...' : person.bio}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Profile;
