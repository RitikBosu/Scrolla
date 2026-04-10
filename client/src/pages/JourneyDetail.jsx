import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Users, Clock, Lock, Globe, Megaphone, MessageSquare,
    Plus, Loader, X, Copy, CheckCircle, LogOut, XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sharedJourneyService } from '../services/sharedJourneyService';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import './JourneyDetail.css';

// ─── Live countdown (reused from Discover, self-contained) ───
function Countdown({ deadline, closedAt, large }) {
    const [display, setDisplay] = useState('');
    const [urgent, setUrgent] = useState(false);

    useEffect(() => {
        if (closedAt) { setDisplay('Ended'); return; }
        const tick = () => {
            const diff = new Date(deadline) - new Date();
            if (diff <= 0) { setDisplay('Ended'); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setUrgent(diff < 3600000);
            setDisplay(h > 24
                ? `${Math.floor(h / 24)}d ${h % 24}h left`
                : h > 0 ? `${h}h ${m}m ${s}s left`
                : `${m}m ${s}s left`
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline, closedAt]);

    return (
        <span className={`jdetail-countdown ${urgent ? 'urgent' : ''} ${large ? 'large' : ''}`}>
            <Clock size={large ? 16 : 13} /> {display}
        </span>
    );
}

// ─── Invite Code modal ───
function InviteCodeModal({ code, onClose }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.div className="jdetail-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="jdetail-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <button className="jdetail-modal-close" onClick={onClose}><X size={18} /></button>
                <Lock size={36} style={{ color: '#6B7F6E' }} />
                <h3>Private Journey</h3>
                <p>Share this code with people you want to invite.</p>
                <div className="jdetail-code-box">
                    <span className="jdetail-code">{code}</span>
                    <button className="jdetail-copy-btn" onClick={handleCopy}>
                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Recap View (when closed) ───
function RecapView({ journey, history }) {
    return (
        <div className="jdetail-recap">
            <div className="jdetail-recap-icon">🏁</div>
            <h2>Journey Ended</h2>
            <p className="jdetail-recap-title">"{journey.title}"</p>
            <p className="jdetail-recap-prompt italic">Prompt: {journey.prompt}</p>
            <div className="jdetail-recap-stats">
                <div className="jdetail-recap-stat">
                    <span className="jdetail-recap-num">{journey.memberCount}</span>
                    <span className="jdetail-recap-label">Members</span>
                </div>
                <div className="jdetail-recap-stat">
                    <span className="jdetail-recap-num">{journey.postCount}</span>
                    <span className="jdetail-recap-label">Posts Shared</span>
                </div>
            </div>
            <div className="jdetail-recap-note">
                <CheckCircle size={18} style={{ color: '#16a34a' }} />
                <p>All posts from this journey have been removed. Your participation is saved in your <Link to={`/profile/${history?.user}`}>profile history</Link>.</p>
            </div>
        </div>
    );
}

// ─── Members panel ───
function MembersPanel({ journeyId, memberCount }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        sharedJourneyService.getMembers(journeyId)
            .then(setMembers)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [journeyId]);

    return (
        <div className="jdetail-members">
            <h3 className="jdetail-members-title"><Users size={15} /> {memberCount} Members</h3>
            {loading ? <Loader size={16} className="spin" /> : (
                <div className="jdetail-members-list">
                    {members.map(m => (
                        <div key={m._id} className="jdetail-member-row">
                            {m.user?.avatar
                                ? <img src={m.user.avatar} alt="" className="jdetail-member-avatar" />
                                : <div className="jdetail-member-avatar placeholder">{m.user?.username?.[0]?.toUpperCase()}</div>
                            }
                            <span className="jdetail-member-name">@{m.user?.username}</span>
                            {m.role === 'creator' && <span className="jdetail-creator-badge">Creator</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ───
export default function JourneyDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [journey, setJourney] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [postsLoading, setPostsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showMembers, setShowMembers] = useState(false);

    // Fetch journey detail
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await sharedJourneyService.getById(id);
                setJourney(data);
            } catch {
                toast.error('Journey not found');
                navigate('/journeys');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Fetch posts (only if member and active)
    const fetchPosts = useCallback(async (p = 1) => {
        if (!journey?.isMember) return;
        setPostsLoading(true);
        try {
            const data = await sharedJourneyService.getPosts(id, p);
            setPosts(prev => p === 1 ? data : [...prev, ...data]);
            setHasMore(data.length === 20);
            setPage(p);
        } catch {
            toast.error('Failed to load posts');
        } finally {
            setPostsLoading(false);
        }
    }, [id, journey?.isMember]);

    // Load posts on mount when member, and refresh when user returns to this tab
    useEffect(() => {
        if (journey?.isMember && journey?.isActive) {
            fetchPosts(1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [journey?.isMember, journey?.isActive, id]);

    // Refresh feed when user comes back to tab (e.g. after posting in CreatePost)
    useEffect(() => {
        const handleFocus = () => {
            if (journey?.isMember && journey?.isActive) {
                fetchPosts(1);
            }
        };
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') handleFocus();
        });
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [journey?.isMember, journey?.isActive, fetchPosts]);

    const handleJoin = async () => {
        setActionLoading(true);
        try {
            await sharedJourneyService.join(id);
            toast.success('Joined! Welcome 🎉');
            setJourney(prev => ({ ...prev, isMember: true, myRole: 'member', memberCount: prev.memberCount + 1 }));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('Leave this journey? Your posts will remain until the journey closes.')) return;
        setActionLoading(true);
        try {
            await sharedJourneyService.leave(id);
            toast.success('You left the journey');
            setJourney(prev => ({ ...prev, isMember: false, myRole: null, memberCount: prev.memberCount - 1 }));
            setPosts([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to leave');
        } finally {
            setActionLoading(false);
        }
    };

    const handleClose = async () => {
        if (!window.confirm('Close this journey now? This will delete all posts and cannot be undone.')) return;
        setActionLoading(true);
        try {
            await sharedJourneyService.close(id);
            toast.success('Journey closed');
            setJourney(prev => ({ ...prev, closedAt: new Date().toISOString(), isActive: false }));
            setPosts([]);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to close');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="jdetail-page">
            <div className="jdetail-loading">
                <Loader size={28} className="spin" />
                <p>Loading journey...</p>
            </div>
        </div>
    );

    if (!journey) return null;

    const isActive = journey.isActive;
    const isClosed = !isActive;
    const isCreator = journey.myRole === 'creator';
    const canPost = journey.isMember && isActive &&
        (journey.postingMode === 'open' || isCreator);

    // Private journey lock screen for non-members
    if (journey.locked) {
        return (
            <div className="jdetail-page">
                <div className="jdetail-locked">
                    <Lock size={52} style={{ color: '#6B7F6E' }} />
                    <h2>Private Journey</h2>
                    <p>This is a private journey. You need an invite code to join.</p>
                    <Link to="/journeys" className="jd-btn-ghost"><ArrowLeft size={16} /> Back to Journeys</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="jdetail-page">
            <AnimatePresence>
                {showInviteModal && journey.inviteCode && (
                    <InviteCodeModal code={journey.inviteCode} onClose={() => setShowInviteModal(false)} />
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="jdetail-header">
                <Link to="/journeys" className="jd-back"><ArrowLeft size={18} /></Link>
                <div className="jdetail-header-info">
                    <div className="jdetail-header-badges">
                        <span className={`jd-badge ${isActive ? 'live' : 'ended'}`}>
                            {isActive ? '🔴 Live' : '✅ Ended'}
                        </span>
                        <span className="jd-badge mode">
                            {journey.postingMode === 'broadcast'
                                ? <><Megaphone size={10} /> Broadcast</>
                                : <><MessageSquare size={10} /> Open</>}
                        </span>
                        <span className="jd-badge visibility">
                            {journey.visibility === 'private'
                                ? <><Lock size={10} /> Private</>
                                : <><Globe size={10} /> Public</>}
                        </span>
                    </div>
                    <h1 className="jdetail-title">{journey.title}</h1>
                </div>
            </div>

            <div className="jdetail-body">
                {/* Main content */}
                <div className="jdetail-main">
                    {/* Prompt card */}
                    <div className="jdetail-prompt-card">
                        <p className="jdetail-prompt-label">📣 Prompt</p>
                        <p className="jdetail-prompt-text">"{journey.prompt}"</p>
                        {journey.description && <p className="jdetail-desc">{journey.description}</p>}
                        <div className="jdetail-meta-row">
                            <span className="jd-meta-item"><Users size={13} /> {journey.memberCount} members</span>
                            {isActive && <Countdown deadline={journey.deadline} closedAt={journey.closedAt} large />}
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="jdetail-actions">
                        {!journey.isMember && isActive && journey.visibility === 'public' && (
                            <button className="jd-btn-primary" onClick={handleJoin} disabled={actionLoading}>
                                {actionLoading ? <Loader size={14} className="spin" /> : 'Join Journey →'}
                            </button>
                        )}
                        {canPost && (
                            <Link to={`/create-post?journeyId=${id}&journeyTitle=${encodeURIComponent(journey.title)}`} className="jd-btn-primary">
                                <Plus size={16} /> Post to Journey
                            </Link>
                        )}
                        {isCreator && journey.visibility === 'private' && (
                            <button className="jd-btn-ghost" onClick={() => setShowInviteModal(true)}>
                                <Copy size={14} /> Share Invite Code
                            </button>
                        )}
                        {isCreator && isActive && (
                            <button className="jdetail-danger-btn" onClick={handleClose} disabled={actionLoading}>
                                {actionLoading ? <Loader size={14} className="spin" /> : <><XCircle size={14} /> Close Journey</>}
                            </button>
                        )}
                        {journey.isMember && !isCreator && isActive && (
                            <button className="jdetail-ghost-danger" onClick={handleLeave} disabled={actionLoading}>
                                <LogOut size={14} /> Leave
                            </button>
                        )}
                    </div>

                    {/* Feed / Recap */}
                    {isClosed ? (
                        <RecapView journey={journey} history={{ user: user?._id }} />
                    ) : !journey.isMember ? (
                        <div className="jdetail-join-prompt">
                            <p>Join this journey to see what members are sharing. 👀</p>
                        </div>
                    ) : journey.postingMode === 'broadcast' && !isCreator ? (
                        <div className="jdetail-broadcast-note">
                            <Megaphone size={18} /> This is a broadcast journey — only the creator posts.
                        </div>
                    ) : null}

                    {journey.isMember && isActive && (
                        <>
                            {postsLoading && page === 1 ? (
                                <div className="jdetail-posts-loading">
                                    <Loader size={20} className="spin" />
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="jdetail-no-posts">
                                    <p>No posts yet. {canPost ? 'Be the first!' : ''}</p>
                                    {canPost && (
                                        <Link
                                            to={`/create-post?journeyId=${id}&journeyTitle=${encodeURIComponent(journey.title)}`}
                                            className="jd-btn-primary"
                                            style={{ marginTop: '12px', textDecoration: 'none' }}
                                        >
                                            <Plus size={14} /> Write first post
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="jdetail-posts">
                                    {posts.map(post => (
                                        <PostCard key={post._id} post={post} />
                                    ))}
                                    {hasMore && (
                                        <button className="jd-load-more" onClick={() => fetchPosts(page + 1)} disabled={postsLoading}>
                                            {postsLoading ? <Loader size={14} className="spin" /> : 'Load more'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Sidebar — members */}
                <aside className="jdetail-sidebar">
                    {journey.isMember && (
                        <MembersPanel journeyId={id} memberCount={journey.memberCount} />
                    )}
                    {!journey.isMember && isActive && journey.visibility === 'public' && (
                        <div className="jdetail-sidebar-join">
                            <p>Join to see members and posts.</p>
                            <button className="jd-btn-primary" onClick={handleJoin} disabled={actionLoading} style={{ width: '100%', justifyContent: 'center' }}>
                                {actionLoading ? <Loader size={14} className="spin" /> : 'Join Journey'}
                            </button>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}
