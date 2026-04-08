import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Bell, Home, Search, Map, Bookmark, User, CheckCircle, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import PostCard from '../components/PostCard';
import SkeletonPostCard from '../components/SkeletonPostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { AlarmClockIcon } from '../components/AlarmClockIcon';
import { TimeUpModal } from '../components/TimeUpModal';
import { MOODS } from '../utils/constants';
import './Feed.css';

const Feed = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { 
        kidsMode, 
        toggleKidsMode, 
        journeyTime, 
        journeyStartTime, 
        startJourney, 
        endJourney,
        // Session Timer states
        sessionActive,
        sessionDuration,
        sessionJourneyName,
        showTimeUpModal,
        startSession,
        endSession,
        showTimeUpAlert,
        setShowTimeUpModal
    } = useApp();

    const alarmRef = useRef(null);
    const { timeRemaining, isActive, formatTime } = useSessionTimer(
        sessionDuration,
        showTimeUpAlert
    );

    const [selectedMood, setSelectedMood] = useState('all');
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [journeyComplete, setJourneyComplete] = useState(false);
    const [activeTab, setActiveTab] = useState('foryou');

    // Animation variants
    const pageVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.6, ease: 'easeOut' }
        }
    };

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    };

    // Suggested users state
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [followingIds, setFollowingIds] = useState(new Set());

    // Load suggested users on mount
    useEffect(() => {
        fetchSuggestedUsers();
        fetchFollowingList();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [selectedMood, kidsMode, activeTab]);

    // Sync session timer with AppContext
    useEffect(() => {
        if (sessionActive && sessionDuration > 0) {
            // Timer is active - no action needed, hook handles it
        }
    }, [sessionActive, sessionDuration]);

    const fetchFollowingList = async () => {
        if (!user?._id) return;
        try {
            const following = await userService.getFollowing(user._id);
            setFollowingIds(new Set(following.map(u => u._id)));
        } catch (err) {
            console.error('Error fetching following list:', err);
        }
    };

    const fetchSuggestedUsers = async () => {
        try {
            const users = await userService.getSuggestedUsers();
            setSuggestedUsers(users);
        } catch (err) {
            console.error('Error fetching suggested users:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const filters = {};

            if (selectedMood !== 'all') {
                filters.mood = selectedMood;
            }

            if (kidsMode) {
                filters.kidSafe = 'true';
            }

            // "For you" / Home = following only, "Explore" = all posts
            if (activeTab === 'foryou') {
                filters.following = 'true';
            }
            // "following" tab also shows followed users
            if (activeTab === 'following') {
                filters.following = 'true';
            }
            // "trending" and "journeys" tabs = all posts (explore)

            filters.limit = 50;

            const data = await postService.getPosts(filters);
            const allPosts = data.posts || [];
            // Don't show current user's own posts in the feed — only on their profile
            setPosts(allPosts.filter(p => p.author?._id !== user?._id));
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFollowUser = async (userId) => {
        try {
            await userService.followUser(userId);
            setFollowingIds(prev => new Set([...prev, userId]));
            // Remove from suggested
            setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
            // Refresh feed if on foryou tab
            if (activeTab === 'foryou' || activeTab === 'following') {
                fetchPosts();
            }
        } catch (err) {
            console.error('Error following user:', err);
        }
    };

    const handleJourneyEnd = () => {
        setJourneyComplete(true);
        endJourney();
    };

    const handleNewJourney = () => {
        setJourneyComplete(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Switch to explore to see all posts
    const handleExploreClick = () => {
        setActiveTab('trending'); // trending = explore = all posts
        setSelectedMood('all');
    };

    if (journeyComplete) {
        return (
            <div className="feed-page-wrapper" style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}}>
                <div style={{background:'white', padding:'32px', borderRadius:'12px', border:'1px solid #E4E0DA', textAlign:'center', maxWidth:'400px', width:'100%'}}>
                    <CheckCircle style={{width:'80px', height:'80px', color:'#6B7F6E', margin:'0 auto 24px'}} />
                    <h1 style={{fontSize:'24px', fontWeight:'bold', color:'#2C2B28', marginBottom:'16px'}}>
                        Journey Complete!
                    </h1>
                    <p style={{color:'#9A9590', marginBottom:'32px'}}>
                        You've completed your mindful journey. Time to take a break!
                    </p>
                    <button
                        onClick={handleNewJourney}
                        style={{width:'100%', padding:'12px', borderRadius:'8px', border:'none', background:'#6B7F6E', color:'white', fontSize:'14px', fontWeight:'500', cursor:'pointer'}}
                    >
                        Continue Browsing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div 
            className="feed-page-wrapper"
            initial="hidden"
            animate="visible"
            variants={pageVariants}
        >
            {/* NAV */}
            <nav className="feed-nav">
                <Link to="/feed" className="feed-logo">Scrolla</Link>
                <div className="feed-nav-end">
                    <button className="feed-icon-btn" title="Messages">
                        <MessageSquare className="w-[18px] h-[18px]" />
                    </button>

                    {/* Session Timer Display */}
                    {sessionActive && (
                        <motion.div 
                            className="flex items-center gap-2 px-3 py-2 border-2 border-cyber-neon-green rounded-none"
                            animate={{
                                boxShadow: [
                                    '0 0 8px rgba(0, 255, 136, 0.2)',
                                    '0 0 16px rgba(0, 255, 136, 0.4)',
                                    '0 0 8px rgba(0, 255, 136, 0.2)',
                                ]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            <AlarmClockIcon 
                                ref={alarmRef}
                                size={18}
                                className="text-cyber-neon-green"
                            />
                            <span className="font-mono text-xs font-bold text-cyber-neon-green uppercase tracking-wider">
                                {formatTime(timeRemaining)}
                            </span>
                        </motion.div>
                    )}

                    <button className="feed-icon-btn" title="Notifications">
                        <Bell className="w-[18px] h-[18px]" />
                        <div className="feed-notif-dot"></div>
                    </button>
                    <button 
                        className="feed-icon-btn" 
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-[18px] h-[18px]" />
                        ) : (
                            <Moon className="w-[18px] h-[18px]" />
                        )}
                    </button>
                    <div className="feed-nav-divider"></div>
                    <button 
                        className="feed-avatar" 
                        onClick={() => navigate(`/profile/${user?._id}`)}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Me" />
                        ) : (
                            user?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                    </button>
                    <button onClick={handleLogout} style={{marginLeft:'8px', fontSize:'14px', color:'#b91c1c', background:'none', border:'none', cursor:'pointer'}}>Logout</button>
                </div>
            </nav>

            <div className="feed-layout">
                {/* SIDEBAR */}
                <aside className="feed-sidebar">
                    <button 
                        className={`feed-nav-link ${activeTab === 'foryou' ? 'active' : ''}`}
                        onClick={() => setActiveTab('foryou')}
                    >
                        <Home className="w-[16px] h-[16px]" /> Home
                    </button>
                    <button 
                        className={`feed-nav-link ${activeTab === 'trending' ? 'active' : ''}`}
                        onClick={handleExploreClick}
                    >
                        <Search className="w-[16px] h-[16px]" /> Explore
                    </button>
                    <Link to="#" className="feed-nav-link">
                        <Map className="w-[16px] h-[16px]" /> Journeys
                    </Link>
                    <Link to="#" className="feed-nav-link">
                        <Bookmark className="w-[16px] h-[16px]" /> Saved
                    </Link>
                    <Link to={`/profile/${user?._id}`} className="feed-nav-link">
                        <User className="w-[16px] h-[16px]" /> Profile
                    </Link>

                    <div className="feed-sidebar-divider"></div>

                    <div className="feed-sidebar-label">Mood</div>
                    
                    <button 
                        className={`feed-mood-item ${selectedMood === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedMood('all')}
                    >
                        <div className="feed-mood-dot"></div> ✨ All moods
                    </button>
                    {MOODS.filter(m => m.id !== 'all').map(mood => (
                        <button 
                            key={mood.id}
                            className={`feed-mood-item ${selectedMood === mood.id ? 'active' : ''}`}
                            onClick={() => setSelectedMood(mood.id)}
                        >
                            <div className="feed-mood-dot"></div> {mood.emoji} {mood.label}
                        </button>
                    ))}

                    <div className="feed-sidebar-divider"></div>

                    <div className="feed-kids-row" onClick={toggleKidsMode}>
                        <div className={`feed-toggle ${kidsMode ? 'on' : ''}`}></div>
                        <span style={{fontSize:'14px', color:'var(--feed-muted)'}}>Kids mode</span>
                    </div>

                    <div className="feed-sidebar-divider"></div>

                    <div className="feed-sidebar-label">Scroll budget</div>
                    <div className="feed-budget-wrap">
                        <div className="feed-budget-label">
                            <span>Today</span>
                            <span>{timeRemaining !== null ? 'Active' : '42 / 60 min'}</span>
                        </div>
                        <div className="feed-budget-bar">
                            <div className="feed-budget-fill" style={{ width: timeRemaining !== null ? '100%' : '70%' }}></div>
                        </div>
                    </div>
                </aside>

                {/* FEED */}
                <main className="feed-main">
                    {/* Compose */}
                    <div className="feed-compose" onClick={() => navigate('/create-post')}>
                        <div className="feed-compose-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Me" />
                            ) : (
                                user?.username?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="feed-compose-placeholder">What's on your mind?</div>
                        <button className="feed-compose-btn" onClick={(e) => { e.stopPropagation(); navigate('/create-post'); }}>
                            + Post
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="feed-tabs">
                        <button 
                            className={`feed-tab ${activeTab === 'foryou' ? 'active' : ''}`}
                            onClick={() => setActiveTab('foryou')}
                        >
                            For you
                        </button>
                        <button 
                            className={`feed-tab ${activeTab === 'following' ? 'active' : ''}`}
                            onClick={() => setActiveTab('following')}
                        >
                            Following
                        </button>
                        <button 
                            className={`feed-tab ${activeTab === 'trending' ? 'active' : ''}`}
                            onClick={() => setActiveTab('trending')}
                        >
                            Explore
                        </button>
                    </div>

                    {/* Posts List */}
                    <motion.div 
                        className="feed-post-list"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {loading ? (
                            <>
                                <SkeletonPostCard />
                                <SkeletonPostCard />
                                <SkeletonPostCard />
                            </>
                        ) : posts.length === 0 ? (
                            <div style={{background:'white', border:'1px solid #E4E0DA', borderRadius:'12px', textAlign:'center', padding:'48px 16px'}}>
                                <p style={{color:'#9A9590', marginBottom:'16px'}}>
                                    {activeTab === 'foryou' || activeTab === 'following'
                                        ? "You're not following anyone yet. Explore posts and follow users!"
                                        : kidsMode
                                            ? 'No kid-safe posts found matching your mood.'
                                            : 'No posts yet for this mood. Be the first to create one!'}
                                </p>
                                {(activeTab === 'foryou' || activeTab === 'following') && (
                                    <button
                                        onClick={handleExploreClick}
                                        style={{padding:'10px 20px', borderRadius:'8px', border:'none', background:'#6B7F6E', color:'white', fontSize:'14px', fontWeight:'500', cursor:'pointer'}}
                                    >
                                        Explore Posts
                                    </button>
                                )}
                            </div>
                        ) : (
                            posts.map((post) => (
                                <motion.div
                                    key={post._id}
                                    variants={itemVariants}
                                >
                                    <PostCard 
                                        post={post} 
                                        onUpdate={fetchPosts} 
                                        onDelete={fetchPosts} 
                                        isFollowing={followingIds.has(post.author?._id)}
                                    />
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </main>

                {/* RIGHT PANEL */}
                <aside className="feed-right">
                    <motion.div 
                        className="feed-panel-section"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className="feed-panel-heading">Active Journeys</div>
                        
                        {/* Deep Focus - 30 min */}
                        <motion.div 
                            className="feed-journey cursor-pointer"
                            onClick={() => !sessionActive && startSession(30, 'Deep Focus')}
                            whileHover={!sessionActive ? { scale: 1.02 } : {}}
                            whileTap={!sessionActive ? { scale: 0.98 } : {}}
                        >
                            <div className="feed-journey-left">
                                <div className="feed-journey-name">Deep Focus (30m)</div>
                                <div className="feed-prog"><div className="feed-prog-fill" style={{width: '0%'}}></div></div>
                                <div className="feed-journey-count">
                                    {sessionActive && sessionJourneyName === 'Deep Focus' ? '⏱️ Active' : 'Click to start'}
                                </div>
                            </div>
                        </motion.div>

                        {/* Digital Detox - 15 min */}
                        <motion.div 
                            className="feed-journey cursor-pointer"
                            onClick={() => !sessionActive && startSession(15, 'Digital Detox')}
                            whileHover={!sessionActive ? { scale: 1.02 } : {}}
                            whileTap={!sessionActive ? { scale: 0.98 } : {}}
                        >
                            <div className="feed-journey-left">
                                <div className="feed-journey-name">Digital Detox (15m)</div>
                                <div className="feed-prog"><div className="feed-prog-fill" style={{width: '0%'}}></div></div>
                                <div className="feed-journey-count">
                                    {sessionActive && sessionJourneyName === 'Digital Detox' ? '⏱️ Active' : 'Click to start'}
                                </div>
                            </div>
                        </motion.div>

                        {/* Quick Break - 5 min */}
                        <motion.div 
                            className="feed-journey cursor-pointer"
                            onClick={() => !sessionActive && startSession(5, 'Quick Break')}
                            whileHover={!sessionActive ? { scale: 1.02 } : {}}
                            whileTap={!sessionActive ? { scale: 0.98 } : {}}
                        >
                            <div className="feed-journey-left">
                                <div className="feed-journey-name">Quick Break (5m)</div>
                                <div className="feed-prog"><div className="feed-prog-fill" style={{width: '0%'}}></div></div>
                                <div className="feed-journey-count">
                                    {sessionActive && sessionJourneyName === 'Quick Break' ? '⏱️ Active' : 'Click to start'}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Suggested Users — real data */}
                    <div className="feed-panel-section">
                        <div className="feed-panel-heading">Suggested</div>
                        {suggestedUsers.length > 0 ? (
                            <div style={{background:'rgba(15, 17, 21, 0.8)', border:'1px solid rgba(247, 147, 26, 0.15)', borderRadius:'12px', padding:'12px 14px'}}>
                                {suggestedUsers.map(sUser => (
                                    <div className="feed-suggest" key={sUser._id}>
                                        <div 
                                            className="feed-sug-avatar" 
                                            style={{cursor:'pointer', overflow:'hidden'}}
                                            onClick={() => navigate(`/profile/${sUser._id}`)}
                                        >
                                            {sUser.avatar && !sUser.avatar.includes('dicebear') ? (
                                                <img src={sUser.avatar} alt={sUser.username} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:'50%'}} />
                                            ) : (
                                                sUser.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="feed-sug-info" style={{cursor:'pointer'}} onClick={() => navigate(`/profile/${sUser._id}`)}>
                                            <span className="feed-sug-name">{sUser.username}</span>
                                            <span className="feed-sug-sub">{sUser.followerCount} followers</span>
                                        </div>
                                        <button 
                                            className="feed-follow"
                                            onClick={() => handleFollowUser(sUser._id)}
                                        >
                                            Follow
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{fontSize:'0.9rem', color:'var(--defi-muted)', padding:'12px 0', textAlign:'center', fontStyle:'italic'}}>
                                You're following everyone! 🎉
                            </div>
                        )}
                    </div>

                    <div className="feed-panel-section">
                        <div className="feed-panel-heading">Mood trends today</div>
                        <div className="feed-trend-row">
                            <span className="feed-trend-label">Happy</span>
                            <div className="feed-trend-bar-wrap"><div className="feed-trend-bar" style={{width: '82%'}}></div></div>
                            <span className="feed-trend-pct">82%</span>
                        </div>
                        <div className="feed-trend-row">
                            <span className="feed-trend-label">Calm</span>
                            <div className="feed-trend-bar-wrap"><div className="feed-trend-bar" style={{width: '61%'}}></div></div>
                            <span className="feed-trend-pct">61%</span>
                        </div>
                        <div className="feed-trend-row">
                            <span className="feed-trend-label">Grateful</span>
                            <div className="feed-trend-bar-wrap"><div className="feed-trend-bar" style={{width: '47%'}}></div></div>
                            <span className="feed-trend-pct">47%</span>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Time Up Modal */}
            <TimeUpModal 
                isOpen={showTimeUpModal}
                journeyName={sessionJourneyName}
                timeSpent={formatTime(sessionDuration - timeRemaining)}
                onContinue={() => {
                    setShowTimeUpModal(false);
                    endSession();
                }}
                onLogout={() => {
                    setShowTimeUpModal(false);
                    endSession();
                    handleLogout();
                }}
            />
        </motion.div>
    );
};

export default Feed;
