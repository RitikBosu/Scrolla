import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Plus, X, ArrowLeft, ArrowRight, Clock, Users, Lock, Globe, Megaphone, MessageSquare, Key, ChevronRight, Loader, Home, Bookmark, User, Bell, PlusSquare, Compass, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { sharedJourneyService } from '../services/sharedJourneyService';
import BrandLogo from '../components/BrandLogo';
import toast from 'react-hot-toast';
import './JourneyDiscover.css';

// ─── Duration presets ───
const DURATION_PRESETS = [
    { label: '12 hours', hours: 12 },
    { label: '24 hours', hours: 24 },
    { label: '3 days',   hours: 72 },
    { label: '7 days',   hours: 168 },
];

const MOODS = ['calm', 'motivated', 'energetic', 'discuss', 'entertain', 'low'];
const MOOD_EMOJIS = { calm:'😌', motivated:'💪', energetic:'⚡', discuss:'💬', entertain:'🎭', low:'🌧️' };

// ─── Countdown display ───
function Countdown({ deadline, closedAt }) {
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
            setUrgent(diff < 3600000); // < 1 hour
            setDisplay(h > 24
                ? `${Math.floor(h / 24)}d ${h % 24}h left`
                : h > 0
                    ? `${h}h ${m}m left`
                    : `${m}m ${s}s left`
            );
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [deadline, closedAt]);

    return (
        <span className={`jd-countdown ${urgent ? 'urgent' : ''}`}>
            <Clock size={12} /> {display}
        </span>
    );
}

// ─── Journey Card ───
function JourneyCard({ journey, onJoin, joining }) {
    const navigate = useNavigate();
    const isActive = !journey.closedAt && new Date(journey.deadline) > new Date();
    // Fake progress: member-based for now (real progress would need post tracking)
    const progress = journey.isMember
        ? Math.min(95, Math.round((journey.postCount || 0) / Math.max(journey.memberCount || 1, 1) * 100 + 20))
        : Math.min(90, Math.round((journey.memberCount || 0) / 300 * 100));

    return (
        <motion.div
            className={`jd-card ${!isActive ? 'closed' : ''} ${journey.isMember ? 'member' : ''}`}
            whileHover={isActive ? { y: -3 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={() => navigate(`/journeys/${journey._id}`)}
        >
            {/* Badges row */}
            <div className="jd-card-badges">
                <span className={`jd-badge ${isActive ? 'live' : 'ended'}`}>
                    {isActive ? '● Live' : '✓ Ended'}
                </span>
                <span className="jd-badge mode">
                    {journey.postingMode === 'broadcast'
                        ? <><Megaphone size={9} /> broadcast</>
                        : <><MessageSquare size={9} /> open</>}
                </span>
                <span className="jd-badge visibility">
                    {journey.visibility === 'private'
                        ? <><Lock size={9} /> private</>
                        : <><Globe size={9} /> public</>}
                </span>
                {journey.mood && <span className="jd-mood">{MOOD_EMOJIS[journey.mood]}</span>}
            </div>

            {/* Title + Prompt */}
            <h3 className="jd-card-title">{journey.title}</h3>
            <p className="jd-card-prompt">"{journey.prompt}"</p>

            {isActive && (
                <div className="jd-progress-row">
                    <div className="jd-progress-header">
                        <span className="jd-progress-label">Progress</span>
                        <span className="jd-progress-pct">{progress}%</span>
                    </div>
                    <div className="jd-progress-track">
                        <div className="jd-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* Meta */}
            <div className="jd-card-meta">
                <span className="jd-meta-item"><Users size={13} /> {journey.memberCount} members</span>
                <Countdown deadline={journey.deadline} closedAt={journey.closedAt} />
            </div>

            {/* CTA */}
            {isActive && journey.isMember && (
                <button
                    className="jd-continue-btn"
                    onClick={e => { e.stopPropagation(); navigate(`/journeys/${journey._id}`); }}
                >
                    ▶ Continue Journey
                </button>
            )}
            {isActive && !journey.isMember && (
                <button
                    className="jd-join-btn outline"
                    onClick={e => { e.stopPropagation(); onJoin(journey._id); }}
                    disabled={joining === journey._id}
                >
                    {joining === journey._id ? <Loader size={14} className="spin" /> : 'Join Journey'}
                </button>
            )}
        </motion.div>
    );
}

// ─── Create Journey Wizard ───
function CreateWizard({ onClose, onCreated }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '', prompt: '', description: '',
        postingMode: 'open',
        visibility: 'public',
        durationHours: 24,
        customDeadline: '',
        useCustom: false,
        mood: ''
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleCreate = async () => {
        setLoading(true);
        try {
            let deadline;
            if (form.useCustom && form.customDeadline) {
                deadline = new Date(form.customDeadline).toISOString();
            } else {
                deadline = new Date(Date.now() + form.durationHours * 3600 * 1000).toISOString();
            }
            const journey = await sharedJourneyService.create({
                title: form.title.trim(),
                prompt: form.prompt.trim(),
                description: form.description.trim() || undefined,
                postingMode: form.postingMode,
                visibility: form.visibility,
                mood: form.mood || undefined,
                deadline
            });
            toast.success('Journey created! 🗺️');
            onCreated(journey);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create journey');
        } finally {
            setLoading(false);
        }
    };

    const canNext = () => {
        if (step === 1) return form.title.trim().length > 0 && form.prompt.trim().length > 0;
        if (step === 4) return form.useCustom ? !!form.customDeadline : true;
        return true;
    };

    return (
        <motion.div className="jd-wizard-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
                className="jd-wizard"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
            >
                <div className="jd-wizard-header">
                    <button className="jd-wizard-close" onClick={onClose}><X size={18} /></button>
                    <div className="jd-wizard-steps">
                        {[1,2,3,4].map(s => (
                            <div key={s} className={`jd-step-dot ${step >= s ? 'active' : ''}`} />
                        ))}
                    </div>
                    <div className="jd-step-labels">
                        {['Mission', 'Speak', 'Access', 'Time'].map((label, i) => (
                            <div key={i} className={`jd-step-label ${step === i + 1 ? 'active' : ''}`}>
                                {label}
                            </div>
                        ))}
                    </div>
                    <h2 className="jd-wizard-title">
                        {step === 1 && '✨ The Mission'}
                        {step === 2 && '📢 Who Speaks?'}
                        {step === 3 && '🔒 Who Joins?'}
                        {step === 4 && '⏳ How Long?'}
                    </h2>
                    <p className="jd-wizard-sub">Step {step} of 4</p>
                </div>

                <div className="jd-wizard-body">
                    {step === 1 && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(232, 168, 139, 0.1) 0%, rgba(232, 168, 139, 0.05) 100%)',
                            borderRadius: '16px',
                            padding: '16px 18px',
                            marginBottom: '8px',
                            borderLeft: '4px solid #E8A88B',
                            marginTop: '-10px'
                        }}>
                            <p style={{ margin: 0, fontSize: '13px', color: '#2C2B28', fontWeight: '600', lineHeight: '1.5' }}>
                                💡 <strong>Why this journey matters?</strong><br/>
                                This journey will shape what people share and create meaningful connections.
                            </p>
                        </div>
                    )}
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="s1" className="jd-wizard-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
                                <label className="jd-label">Journey Title <span>*</span></label>
                                <input
                                    className="jd-input"
                                    placeholder="e.g. 7 Days of Gratitude"
                                    maxLength={80}
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                />
                                <label className="jd-label">The Prompt <span>*</span></label>
                                <textarea
                                    className="jd-textarea"
                                    placeholder="What do you want people to share? e.g. 'Share one thing that made you smile today.'"
                                    maxLength={200}
                                    rows={3}
                                    value={form.prompt}
                                    onChange={e => set('prompt', e.target.value)}
                                />
                                <span className="jd-char-count">{form.prompt.length}/200</span>
                                <label className="jd-label">Description <span className="optional">(optional)</span></label>
                                <textarea
                                    className="jd-textarea"
                                    placeholder="Give some context about this journey..."
                                    maxLength={400}
                                    rows={2}
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                />
                                <label className="jd-label">Mood Tag <span className="optional">(optional)</span></label>
                                <div className="jd-mood-grid">
                                    {MOODS.map(m => (
                                        <button
                                            key={m}
                                            className={`jd-mood-btn ${form.mood === m ? 'active' : ''}`}
                                            onClick={() => set('mood', form.mood === m ? '' : m)}
                                        >
                                            {MOOD_EMOJIS[m]} {m}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="s2" className="jd-wizard-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
                                <p className="jd-step-desc">Who can post inside this journey?</p>
                                <div className="jd-option-cards">
                                    <div
                                        className={`jd-option-card ${form.postingMode === 'open' ? 'active' : ''}`}
                                        onClick={() => set('postingMode', 'open')}
                                    >
                                        <MessageSquare size={28} />
                                        <h4>Open</h4>
                                        <p>Everyone who joins can post to the shared feed.</p>
                                    </div>
                                    <div
                                        className={`jd-option-card ${form.postingMode === 'broadcast' ? 'active' : ''}`}
                                        onClick={() => set('postingMode', 'broadcast')}
                                    >
                                        <Megaphone size={28} />
                                        <h4>Broadcast</h4>
                                        <p>Only you post. Others can join and follow along (like a newsletter).</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="s3" className="jd-wizard-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
                                <p className="jd-step-desc">Who can find and join this journey?</p>
                                <div className="jd-option-cards">
                                    <div
                                        className={`jd-option-card ${form.visibility === 'public' ? 'active' : ''}`}
                                        onClick={() => set('visibility', 'public')}
                                    >
                                        <Globe size={28} />
                                        <h4>Public</h4>
                                        <p>Anyone on Scrolla can discover and join.</p>
                                    </div>
                                    <div
                                        className={`jd-option-card ${form.visibility === 'private' ? 'active' : ''}`}
                                        onClick={() => set('visibility', 'private')}
                                    >
                                        <Lock size={28} />
                                        <h4>Private</h4>
                                        <p>Only people with your invite code can join.</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="s4" className="jd-wizard-step" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}>
                                <p className="jd-step-desc">How long should this journey run?</p>
                                <div className="jd-duration-grid">
                                    {DURATION_PRESETS.map(p => {
                                        const endTime = new Date(Date.now() + p.hours * 3600 * 1000);
                                        return (
                                            <button
                                                key={p.hours}
                                                className={`jd-duration-btn ${!form.useCustom && form.durationHours === p.hours ? 'active' : ''}`}
                                                onClick={() => { set('durationHours', p.hours); set('useCustom', false); }}
                                                title={`Ends ${endTime.toLocaleString()}`}
                                            >
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                    <button
                                        className={`jd-duration-btn custom ${form.useCustom ? 'active' : ''}`}
                                        onClick={() => set('useCustom', true)}
                                    >
                                        Custom date
                                    </button>
                                </div>
                                {!form.useCustom && (
                                    <p style={{ fontSize: '12px', color: '#A8A5A0', marginTop: '8px', textAlign: 'center', fontStyle: 'italic' }}>
                                        ⏰ Ends {new Date(Date.now() + form.durationHours * 3600 * 1000).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                                {form.useCustom && (
                                    <input
                                        type="datetime-local"
                                        className="jd-input"
                                        style={{ marginTop: '12px' }}
                                        min={new Date(Date.now() + 3600000).toISOString().slice(0,16)}
                                        value={form.customDeadline}
                                        onChange={e => set('customDeadline', e.target.value)}
                                    />
                                )}
                                <div className="jd-wizard-summary">
                                    <h4>📋 Summary</h4>
                                    <p><strong>"{form.title}"</strong></p>
                                    <p><span style={{ fontSize: '12px', color: '#A8A5A0' }}>Prompt</span><br/>{form.prompt}</p>
                                    <p><span style={{ fontSize: '12px', color: '#A8A5A0' }}>Mode</span><br/>{form.postingMode} • {form.visibility}</p>
                                    <p><span style={{ fontSize: '12px', color: '#A8A5A0' }}>Duration</span><br/>{form.useCustom
                                        ? (form.customDeadline ? new Date(form.customDeadline).toLocaleString() : 'Pick a date')
                                        : DURATION_PRESETS.find(p => p.hours === form.durationHours)?.label
                                    }</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="jd-wizard-footer">
                    {step > 1 && (
                        <button className="jd-btn-ghost" onClick={() => setStep(s => s - 1)}>
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    {step < 4 ? (
                        <button className="jd-btn-primary" onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                            Next <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button className="jd-btn-primary launch" onClick={handleCreate} disabled={loading || !canNext()}>
                            {loading ? <Loader size={16} className="spin" /> : '🚀 Launch Journey'}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Join by code modal ───
function JoinByCodeModal({ onClose, onJoined }) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleJoin = async () => {
        if (!code.trim()) return;
        setLoading(true);
        try {
            const result = await sharedJourneyService.joinByCode(code.trim().toUpperCase());
            toast.success('Joined! Welcome to the journey 🎉');
            onClose();
            navigate(`/journeys/${result.journeyId}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div className="jd-wizard-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="jd-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                <button className="jd-wizard-close" onClick={onClose}><X size={18} /></button>
                <Key size={36} className="jd-modal-icon" />
                <h3>Enter Invite Code</h3>
                <p>Paste the 8-character code shared with you.</p>
                <input
                    className="jd-input code-input"
                    placeholder="A3F9C2E1"
                    maxLength={8}
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                />
                <button className="jd-btn-primary" onClick={handleJoin} disabled={loading || code.length < 4}>
                    {loading ? <Loader size={16} className="spin" /> : 'Join Private Journey'}
                </button>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Page ───
export default function JourneyDiscover() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [journeys, setJourneys] = useState([]);
    const [filter, setFilter] = useState('active');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [joining, setJoining] = useState(null);
    const [showWizard, setShowWizard] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);

    const fetchJourneys = useCallback(async (f = filter, p = 1) => {
        setLoading(true);
        try {
            if (f === 'mine') {
                const data = await sharedJourneyService.getMine();
                setJourneys(data);
                setHasMore(false);
                setPage(1);
            } else {
                const data = await sharedJourneyService.getJourneys(f, p);
                setJourneys(prev => p === 1 ? data.journeys : [...prev, ...data.journeys]);
                setHasMore(p < data.pages);
                setPage(p);
            }
        } catch {
            toast.error('Failed to load journeys');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchJourneys(filter, 1); }, [filter]);

    const handleJoin = async (id) => {
        setJoining(id);
        try {
            await sharedJourneyService.join(id);
            toast.success('Joined! 🎉');
            setJourneys(prev => prev.map(j => j._id === id ? { ...j, isMember: true, memberCount: j.memberCount + 1 } : j));
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join');
        } finally {
            setJoining(null);
        }
    };

    const handleCreated = (journey) => {
        setShowWizard(false);
        navigate(`/journeys/${journey._id}`);
    };

    return (
        <div className="jd-wrapper">
            {/* ─── SIDEBAR ─── */}
            <aside className="jd-sidebar">
                <Link to="/feed" className="jd-sidebar-logo">
                    <BrandLogo size="md" />
                </Link>

                <nav className="jd-sidebar-nav">
                    <Link to="/feed" className="jd-sidebar-item">
                        <Home size={22} /><span>Home</span>
                    </Link>
                    <Link to="/explore" className="jd-sidebar-item">
                        <Compass size={22} /><span>Explore</span>
                    </Link>
                    <Link to="/journeys" className="jd-sidebar-item jd-sidebar-item--active">
                        <Map size={22} /><span>Journeys</span>
                    </Link>
                    <Link to={`/profile/${user?._id}?tab=saved`} className="jd-sidebar-item">
                        <Bookmark size={22} /><span>Saved</span>
                    </Link>
                    <Link to={`/profile/${user?._id}`} className="jd-sidebar-item">
                        <User size={22} /><span>Profile</span>
                    </Link>
                    <Link to="/notifications" className="jd-sidebar-item">
                        <Bell size={22} /><span>Notifications</span>
                    </Link>
                    <button className="jd-sidebar-item" onClick={() => setShowWizard(true)}>
                        <PlusSquare size={22} /><span>+ Create</span>
                    </button>
                </nav>

                <div className="jd-sidebar-bottom">
                    <div className="jd-sidebar-kids">
                        <span>Kids Mode</span>
                        <div className="jd-kids-toggle"><div className="jd-kids-thumb" /></div>
                    </div>
                    <button className="jd-sidebar-item" onClick={toggleTheme}>
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                    </button>
                    <button className="jd-sidebar-logout" onClick={() => { logout(); navigate('/login'); }}>
                        Logout
                    </button>
                </div>
            </aside>

            {/* ─── MAIN ─── */}
            <main className="jd-main">
                <AnimatePresence>
                    {showWizard && <CreateWizard onClose={() => setShowWizard(false)} onCreated={handleCreated} />}
                    {showCodeModal && <JoinByCodeModal onClose={() => setShowCodeModal(false)} onJoined={() => {}} />}
                </AnimatePresence>

                {/* Header */}
                <div className="jd-header">
                    <div>
                        <h1 className="jd-title">Journeys</h1>
                        <p className="jd-subtitle">Shared missions with a deadline</p>
                    </div>
                    <div className="jd-header-actions">
                        <button className="jd-btn-ghost" onClick={() => setShowCodeModal(true)}>
                            <Key size={15} /> Join with code
                        </button>
                        <button className="jd-btn-primary" onClick={() => setShowWizard(true)}>
                            <Plus size={15} /> Create
                        </button>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="jd-filters">
                    {[['active','Active'],['mine','Mine'],['closed','Ended']].map(([val, label]) => (
                        <button
                            key={val}
                            className={`jd-filter-btn ${filter === val ? 'active' : ''}`}
                            onClick={() => setFilter(val)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading && page === 1 ? (
                    <div className="jd-loading">
                        {[1,2,3,4].map(i => <div key={i} className="jd-skeleton" />)}
                    </div>
                ) : journeys.length === 0 ? (
                    <div className="jd-empty">
                        <div className="jd-empty-icon">🗺️</div>
                        <h3>{filter === 'mine' ? 'No journeys yet' : 'No active journeys'}</h3>
                        <p>{filter === 'mine' ? 'Join or create your first journey!' : 'Be the first to start one!'}</p>
                        <button className="jd-btn-primary" onClick={() => setShowWizard(true)}>
                            <Plus size={16} /> Create Journey
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="jd-grid">
                            {journeys.map(j => (
                                <JourneyCard key={j._id} journey={j} onJoin={handleJoin} joining={joining} />
                            ))}
                            <motion.div
                                className="jd-card jd-create-card"
                                whileHover={{ y: -2 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                                onClick={() => setShowWizard(true)}
                            >
                                <div className="jd-create-inner">
                                    <div className="jd-create-icon"><Plus size={28} /></div>
                                    <span className="jd-create-label">Create New Journey</span>
                                </div>
                            </motion.div>
                        </div>
                        {hasMore && (
                            <button className="jd-load-more" onClick={() => fetchJourneys(filter, page + 1)} disabled={loading}>
                                {loading ? <Loader size={16} className="spin" /> : 'Load more'}
                            </button>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
