import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    MessageSquare, Bell, Home, Search, Map, Bookmark, User, Plus, X, Sun, Moon 
} from 'lucide-react';
import { MOODS } from '../utils/constants';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MediaUpload from '../components/MediaUpload';
import toast from 'react-hot-toast';
import './CreatePost.css';

// Mood emojis for the side panel grid
const MOOD_EMOJIS = {
    happy: '😄',
    calm: '😌',
    excited: '🤩',
    grateful: '🙏',
    anxious: '�',
    sad: '�',
    angry: '😤',
    reflective: '🤔',
    energetic: '⚡',
    hopeful: '🌈',
};

const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const editPost = location.state?.post;

    // Journey context from URL (e.g. /create-post?journeyId=xxx&journeyTitle=...)
    const journeyId = searchParams.get('journeyId');
    const journeyTitle = searchParams.get('journeyTitle');

    const [formData, setFormData] = useState({
        content: editPost?.content || '',
        mood: editPost?.mood || 'all',
        hashtags: editPost?.hashtags || [],
        images: editPost?.images || [],
        videos: editPost?.videos || [],
        kidSafe: editPost?.kidSafe || false
    });
    const [hashtagInput, setHashtagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddHashtag = (e) => {
        if (e) e.preventDefault();
        if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
            setFormData({
                ...formData,
                hashtags: [...formData.hashtags, hashtagInput.trim().replace('#', '')]
            });
            setHashtagInput('');
        }
    };

    const handleRemoveHashtag = (tag) => {
        setFormData({
            ...formData,
            hashtags: formData.hashtags.filter(t => t !== tag)
        });
    };

    const handleImagesChange = (images) => {
        setFormData({ ...formData, images });
    };

    const handleVideosChange = (videos) => {
        setFormData({ ...formData, videos });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.content.trim()) {
            setError('Please write something in your post');
            return;
        }

        setLoading(true);

        try {
            if (editPost) {
                await postService.updatePost(editPost._id, formData);
                toast.success('Post updated successfully!');
                navigate('/feed');
            } else {
                await postService.createPost({ ...formData, journeyId: journeyId || undefined });
                toast.success(journeyId ? 'Posted to Journey! 🗺️' : 'Post created!');
                navigate(journeyId ? `/journeys/${journeyId}` : '/feed');
            }
        } catch (error) {
            console.error('Error saving post:', error);
            setError(error.response?.data?.message || 'Failed to save post. Please try again.');
            toast.error('Failed to save post');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const selectedMoodLabel = MOODS.find(m => m.id === formData.mood)?.label || 'Select mood';
    const selectedMoodEmoji = MOOD_EMOJIS[formData.mood] || '🙂';

    return (
        <div className="cp-page-wrapper">
            {/* NAV */}
            <nav className="cp-nav">
                <Link to="/feed" className="cp-logo">Scrolla</Link>
                <div className="cp-nav-end">
                    <button className="cp-icon-btn" title="Messages">
                        <MessageSquare className="w-[18px] h-[18px]" />
                    </button>
                    <button className="cp-icon-btn" title="Notifications">
                        <Bell className="w-[18px] h-[18px]" />
                        <div className="cp-notif-dot"></div>
                    </button>
                    <button 
                        className="cp-icon-btn" 
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-[18px] h-[18px]" />
                        ) : (
                            <Moon className="w-[18px] h-[18px]" />
                        )}
                    </button>
                    <div className="cp-nav-divider"></div>
                    <button 
                        className="cp-avatar-sm" 
                        onClick={() => navigate(`/profile/${user?._id}`)}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Me" />
                        ) : (
                            user?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                    </button>
                    <button onClick={handleLogout} className="ml-2 text-xs text-red-500 hover:underline">Logout</button>
                </div>
            </nav>

            <div className="cp-layout">
                {/* SIDEBAR */}
                <aside className="cp-sidebar">
                    <Link to="/feed" className="cp-nav-link">
                        <Home className="w-[16px] h-[16px]" /> Home
                    </Link>
                    <Link to="/explore" className="cp-nav-link">
                        <Search className="w-[16px] h-[16px]" /> Explore
                    </Link>
                    <Link to="/journeys" className="cp-nav-link">
                        <Map className="w-[16px] h-[16px]" /> Journeys
                    </Link>
                    <Link to="/saved" className="cp-nav-link">
                        <Bookmark className="w-[16px] h-[16px]" /> Saved
                    </Link>
                    <Link to="/create-post" className="cp-nav-link active">
                        <Plus className="w-[16px] h-[16px]" /> Create
                    </Link>
                    <div className="cp-sidebar-divider"></div>
                    <Link to={`/profile/${user?._id}`} className="cp-nav-link">
                        <User className="w-[16px] h-[16px]" /> Profile
                    </Link>
                </aside>

                {/* MAIN */}
                <main className="cp-main">
                    {/* Compose Card */}
                    <form className="cp-compose-card" onSubmit={handleSubmit}>
                        <div className="cp-compose-header">
                            <div className="cp-compose-avatar">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.username} />
                                ) : (
                                    user?.username?.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <div className="cp-compose-user">
                                <span className="cp-compose-name">{user?.username || 'User'}</span>
                                <span className="cp-compose-sub">@{user?.username?.toLowerCase().replace(/\s+/g, '') || 'user'}</span>
                            </div>
                            <div className="cp-mood-select-btn">
                                {selectedMoodEmoji} {selectedMoodLabel}
                            </div>
                        </div>

                        {/* Journey context banner */}
                        {journeyId && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(232, 168, 139, 0.1)', border: '1.5px solid var(--primary, #E8A88B)',
                                borderRadius: '10px', padding: '10px 14px',
                                fontSize: '13px', fontWeight: '600', color: 'var(--primary, #E8A88B)',
                                marginBottom: '4px'
                            }}>
                                🗺️ Posting to Journey: <span style={{ fontStyle: 'italic', color: 'var(--text, #F5E6D3)' }}>{journeyTitle || 'Journey'}</span>
                                <Link to={`/journeys/${journeyId}`} style={{ marginLeft: 'auto', fontSize: '12px', color: '#d48b71' }}>← Back to journey</Link>
                            </div>
                        )}

                        {error && <div className="cp-error">{error}</div>}

                        {/* Textarea */}
                        <textarea
                            className="cp-post-textarea"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="What's on your mind today?"
                            maxLength={1000}
                            required
                        />
                        <div className="cp-char-count">{formData.content.length} / 1000</div>

                        {/* Media Upload (Images + Videos with editors) */}
                        <MediaUpload
                            onImagesChange={handleImagesChange}
                            onVideosChange={handleVideosChange}
                            existingImages={formData.images}
                            existingVideos={formData.videos}
                        />

                        {/* Hashtags */}
                        <div className="cp-hashtag-section">
                            <div className="cp-hashtag-input-row">
                                <input
                                    type="text"
                                    className="cp-hashtag-input"
                                    value={hashtagInput}
                                    onChange={(e) => setHashtagInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag(e)}
                                    placeholder="# Add hashtag"
                                />
                                <button 
                                    type="button" 
                                    className="cp-hashtag-add-btn"
                                    onClick={handleAddHashtag}
                                >
                                    Add
                                </button>
                            </div>
                            {formData.hashtags.length > 0 && (
                                <div className="cp-hashtag-tags">
                                    {formData.hashtags.map((tag, index) => (
                                        <span key={index} className="cp-hashtag-tag">
                                            #{tag}
                                            <button 
                                                type="button" 
                                                className="cp-hashtag-remove"
                                                onClick={() => handleRemoveHashtag(tag)}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Options row (visual placeholders) */}
                        <div className="cp-options-row"></div>

                        {/* Footer */}
                        <div className="cp-compose-footer">
                            <div></div>
                            <div className="cp-post-actions-row">
                                <motion.button 
                                    type="button" 
                                    className="cp-btn-cancel"
                                    onClick={() => navigate(-1)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Discard
                                </motion.button>
                                <motion.button 
                                    type="submit" 
                                    className="cp-btn-post"
                                    disabled={loading || !formData.content.trim()}
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    {loading ? 'Saving...' : editPost ? 'Update Post' : 'Post'}
                                </motion.button>
                            </div>
                        </div>
                    </form>
                </main>

                {/* Side Panel */}
                <div className="cp-side-panel">
                    {/* Mood picker */}
                    <div className="cp-side-card">
                        <div className="cp-side-title">How are you feeling?</div>
                        <div className="cp-mood-grid">
                            {MOODS.filter(m => m.id !== 'all').map((mood) => (
                                <button
                                    key={mood.id}
                                    type="button"
                                    className={`cp-mood-option ${formData.mood === mood.id ? 'selected' : ''}`}
                                    onClick={() => setFormData({ ...formData, mood: mood.id })}
                                >
                                    {MOOD_EMOJIS[mood.id] || '🙂'} {mood.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Kid safe */}
                    <div className="cp-side-card">
                        <div className="cp-side-title">Audience</div>
                        <div 
                            className="cp-kids-row"
                            onClick={() => setFormData({ ...formData, kidSafe: !formData.kidSafe })}
                        >
                            <div className={`cp-toggle ${formData.kidSafe ? 'on' : ''}`}></div>
                            <span>Mark as kid-safe</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
