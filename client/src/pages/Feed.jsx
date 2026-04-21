import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MessageSquare, Bell, Home, Search, Map, Bookmark, User, CheckCircle, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import PostCard from '../components/PostCard';
import SkeletonPostCard from '../components/SkeletonPostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import BrandLogo from '../components/BrandLogo';
import { postService } from '../services/postService';
import { userService } from '../services/userService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useMoodFilter } from '../context/MoodFilterContext';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { AlarmClockIcon } from '../components/AlarmClockIcon';
import { TimeUpModal } from '../components/TimeUpModal';
import MoodFeedBanner from '../components/MoodFeedBanner';
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
        sessionStartTime,
        showTimeUpModal,
        startSession,
        endSession,
        showTimeUpAlert,
        setShowTimeUpModal
    } = useApp();

    const alarmRef = useRef(null);
    const { timeRemaining, isActive, formatTime } = useSessionTimer(
        sessionDuration,
        showTimeUpAlert,
        sessionStartTime
    );

    const { activeMood: selectedMood, setMoodFilter: setSelectedMood } = useMoodFilter();
    const [posts, setPosts] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [journeyComplete, setJourneyComplete] = useState(false);
    const [activeTab, setActiveTab] = useState('foryou');
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    const WelcomeCard = () => (
        <div style={{background:'var(--defi-surface)', border:'1px solid rgba(255, 255, 255, 0.08)', borderRadius:'14px', padding:'24px', marginBottom:'24px', textAlign:'center'}}>
            <h2 style={{color:'var(--defi-fg)', fontSize:'1.2rem', marginBottom:'16px', fontWeight:'700'}}>Welcome to Scrolla! 🎉</h2>
            <p style={{color:'var(--defi-muted)', marginBottom:'24px'}}>Your feed is empty because you aren't following anyone yet. Let's fix that!</p>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <button onClick={handleExploreClick} className="feed-compose-btn" style={{width:'100%', padding:'12px', textAlign:'center'}}>
                    Follow a few people
                </button>
                <button onClick={() => navigate('/journeys')} className="feed-compose-btn" style={{width:'100%', padding:'12px', background:'transparent', border:'1px solid rgba(247, 147, 26, 0.4)', color:'var(--defi-orange-primary)', textAlign:'center'}}>
                    Join a Journey
                </button>
                <button onClick={() => navigate('/create-post')} className="feed-compose-btn" style={{width:'100%', padding:'12px', background:'transparent', border:'1px solid rgba(247, 147, 26, 0.4)', color:'var(--defi-orange-primary)', textAlign:'center'}}>
                    Make your first post
                </button>
            </div>
        </div>
    );

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
        fetchUnreadCount();
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

    const fetchUnreadCount = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const r = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/notifications`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!r.ok) return;
            const data = await r.json();
            setUnreadNotifCount(data.unreadCount || 0);
        } catch { /* silent */ }
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

            filters.limit = 50;
            
            let currentFollowingIds = followingIds;
            if (user?._id && followingIds.size === 0) {
                try {
                    const following = await userService.getFollowing(user._id);
                    currentFollowingIds = new Set(following.map(u => u._id));
                    setFollowingIds(currentFollowingIds);
                } catch (err) {
                    console.error('Error fetching following list:', err);
                }
            }

            let mainPosts = [];
            let extraPosts = [];

            if (activeTab === 'foryou') {
                if (currentFollowingIds.size === 0) {
                    const data = await postService.getPosts(filters);
                    extraPosts = data.posts || [];
                } else {
                    const data = await postService.getPosts({ ...filters, following: 'true' });
                    mainPosts = data.posts || [];

                    if (mainPosts.length < 5) {
                        const allData = await postService.getPosts(filters);
                        extraPosts = allData.posts || [];
                    }
                }
            } else if (activeTab === 'following') {
                const data = await postService.getPosts({ ...filters, following: 'true' });
                mainPosts = data.posts || [];
            } else {
                const data = await postService.getPosts(filters);
                mainPosts = data.posts || [];
            }

            mainPosts = mainPosts.filter(p => p.author?._id !== user?._id);
            extraPosts = extraPosts.filter(p => 
                p.author?._id !== user?._id && 
                !mainPosts.some(fp => fp._id === p._id) &&
                !currentFollowingIds.has(p.author?._id)
            );

            setPosts(mainPosts);
            setCommunityPosts(extraPosts);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
            setCommunityPosts([]);
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
                        Session Complete!
                    </h1>
                    <p style={{color:'#9A9590', marginBottom:'32px'}}>
                        Your time is up, you can stop scrolling now.
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
                <Link to="/feed" className="feed-logo">
                    <BrandLogo size="md" />
                </Link>
                <div className="feed-nav-end">

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

                    <button
                        id="feed-notif-bell"
                        className="feed-icon-btn"
                        title="Notifications"
                        onClick={() => navigate('/notifications')}
                        style={{ position: 'relative' }}
                    >
                        <Bell className="w-[18px] h-[18px]" />
                        {unreadNotifCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                width: '8px',
                                height: '8px',
                                background: 'var(--defi-orange-primary)',
                                borderRadius: '50%',
                                boxShadow: '0 0 6px rgba(247,147,26,0.7)',
                                display: 'block'
                            }} />
                        )}
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
                    <Link to="/journeys" className="feed-nav-link">
                        <Map className="w-[16px] h-[16px]" /> Journeys
                    </Link>
                    <Link to="/notifications" className="feed-nav-link" style={{ position: 'relative' }}>
                        <Bell className="w-[16px] h-[16px]" />
                        Notifications
                        {unreadNotifCount > 0 && (
                            <span style={{
                                width: '7px', height: '7px',
                                background: 'var(--defi-orange-primary)',
                                borderRadius: '50%',
                                boxShadow: '0 0 5px rgba(247,147,26,0.7)',
                                marginLeft: 'auto',
                                flexShrink: 0,
                                display: 'inline-block'
                            }} />
                        )}
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


                </aside>

                {/* FEED */}
                <main className="feed-main">
                    {/* Compose */}
                    <div className="feed-compose">
                        <div className="feed-compose-avatar">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Me" />
                            ) : (
                                user?.username?.charAt(0).toUpperCase() || 'U'
                            )}
                        </div>
                        <div className="feed-compose-placeholder">What's on your mind?</div>
                        <button className="feed-compose-btn" onClick={() => navigate('/create-post')}>
                            + Post
                        </button>
                    </div>


                    {/* Mood Banner */}
                    <MoodFeedBanner />

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
                            ) : (
                                <>
                                    {/* Welcome Card if not following anyone and on foryou/following tab */}
                                    {(activeTab === 'foryou' || activeTab === 'following') && followingIds.size === 0 && (
                                        <WelcomeCard />
                                    )}

                                    {/* Main posts */}
                                    {posts.length > 0 && posts.map((post) => (
                                        <motion.div key={post._id} variants={itemVariants}>
                                            <PostCard 
                                                post={post} 
                                                onUpdate={fetchPosts} 
                                                onDelete={fetchPosts} 
                                                isFollowing={followingIds.has(post.author?._id)}
                                                onFollowToggle={(isFollowing, userId) => {
                                                    if (isFollowing) {
                                                        setFollowingIds(prev => new Set([...prev, userId]));
                                                        setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
                                                    } else {
                                                        const newSet = new Set(followingIds);
                                                        newSet.delete(userId);
                                                        setFollowingIds(newSet);
                                                    }
                                                    if (activeTab === 'foryou' || activeTab === 'following') {
                                                        fetchPosts();
                                                    }
                                                }}
                                            />
                                        </motion.div>
                                    ))}

                                    {/* Empty state if absolutely no posts to show */}
                                    {posts.length === 0 && communityPosts.length === 0 && followingIds.size > 0 && (
                                        <div style={{background:'var(--defi-surface)', border:'1px solid rgba(255, 255, 255, 0.08)', borderRadius:'14px', textAlign:'center', padding:'48px 16px'}}>
                                            <p style={{color:'var(--defi-muted)', marginBottom:'16px'}}>
                                                {activeTab === 'foryou' || activeTab === 'following'
                                                    ? selectedMood !== 'all' 
                                                        ? `No posts from people you follow match the "${selectedMood}" mood. Try changing it!`
                                                        : "You're not following anyone yet, or they haven't posted. Explore posts and follow users!"
                                                    : kidsMode
                                                        ? 'No kid-safe posts found matching your mood.'
                                                        : 'No posts yet for this mood. Be the first to create one!'}
                                            </p>
                                            {(activeTab === 'foryou' || activeTab === 'following') && (
                                                <button
                                                    onClick={handleExploreClick}
                                                    className="feed-compose-btn"
                                                    style={{padding:'10px 20px', fontSize:'14px'}}
                                                >
                                                    Explore Posts
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Community Filler Posts */}
                                    {communityPosts.length > 0 && activeTab === 'foryou' && (
                                        <>
                                            {posts.length > 0 && (
                                                <div style={{
                                                    textAlign: 'center', 
                                                    margin: '32px 0 24px', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '16px',
                                                    color: 'var(--defi-muted)',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    <div style={{flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)'}} />
                                                    More from the community
                                                    <div style={{flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)'}} />
                                                </div>
                                            )}
                                            {communityPosts.map((post) => (
                                                <motion.div key={post._id} variants={itemVariants}>
                                                    <PostCard 
                                                        post={post} 
                                                        onUpdate={fetchPosts} 
                                                        onDelete={fetchPosts} 
                                                        isFollowing={followingIds.has(post.author?._id)}
                                                        onFollowToggle={(isFollowing, userId) => {
                                                            if (isFollowing) {
                                                                setFollowingIds(prev => new Set([...prev, userId]));
                                                                setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
                                                            } else {
                                                                const newSet = new Set(followingIds);
                                                                newSet.delete(userId);
                                                                setFollowingIds(newSet);
                                                            }
                                                            if (activeTab === 'foryou' || activeTab === 'following') {
                                                                fetchPosts();
                                                            }
                                                        }}
                                                    />
                                                </motion.div>
                                            ))}
                                        </>
                                    )}
                                </>
                            )}
                        </motion.div>
                </main>

                {/* RIGHT PANEL */}
                <aside className="feed-right">
                    {/* ── Focus Sessions ── */}
                    <div className="feed-panel-section" style={{ padding: 0, border: 'none', background: 'none' }}>
                        <div className="fs-card">
                            <div className="fs-heading">
                                Focus Sessions
                            </div>

                            {[
                                { name: 'Deep Focus', dur: 30, icon: '🧠', color: '#8B5CF6', bg: 'rgba(139,92,246,0.18)' },
                                { name: 'Digital Detox', dur: 15, icon: '☕', color: '#22C55E', bg: 'rgba(34,197,94,0.18)' },
                                { name: 'Quick Break', dur: 5, icon: '⚡', color: '#3B82F6', bg: 'rgba(59,130,246,0.18)' },
                            ].map(({ name, dur, icon, color, bg }) => {
                                const isThisActive = sessionActive && sessionJourneyName === name;
                                return (
                                    <motion.div
                                        key={name}
                                        className={`fs-row ${isThisActive ? 'fs-row-active' : ''}`}
                                        onClick={() => !sessionActive ? startSession(dur, name) : (isThisActive && endSession())}
                                        whileHover={!sessionActive ? { x: 3 } : {}}
                                        whileTap={!sessionActive ? { scale: 0.98 } : {}}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="fs-icon" style={{ background: bg, color }}>
                                            <span style={{ fontSize: 18 }}>{icon}</span>
                                        </div>
                                        <div className="fs-info">
                                            <div className="fs-name">{name}</div>
                                            <div className="fs-dur" style={{ color }}>
                                                {isThisActive
                                                    ? <><span style={{ fontSize: 10 }}>⏱</span> {formatTime(timeRemaining)} left</>
                                                    : `${dur}m`}
                                            </div>
                                        </div>
                                        <button
                                            className="fs-star"
                                            onClick={e => { e.stopPropagation(); }}
                                            title="Favourite"
                                            aria-label={`Favourite ${name}`}
                                        >
                                            {isThisActive
                                                ? <span style={{ color: '#F7931A', fontSize: 15 }}>⏹</span>
                                                : <span style={{ color: 'var(--defi-muted)', fontSize: 15 }}>☆</span>}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Suggested Users — real data */}
                    <div className="feed-panel-section">
                        <div className="feed-panel-heading">Suggested</div>
                        {suggestedUsers.length > 0 ? (
                            <div className="feed-suggest-container">
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
