import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { Sun, Moon } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import BrandLogo from '../components/BrandLogo';
import toast from 'react-hot-toast';
import api from '../services/api';
import './AuthPage.css';

const MOODS = [
    { key: 'joyful',    emoji: '😄', label: 'Joyful',    color: '#FFF3CD', textColor: '#92620A' },
    { key: 'happy',     emoji: '😊', label: 'Happy',     color: '#FFE4CC', textColor: '#A0522D' },
    { key: 'energised', emoji: '⚡', label: 'Energised', color: '#FFF0B3', textColor: '#7A6000' },
    { key: 'calm',      emoji: '😌', label: 'Calm',      color: '#D4F1E4', textColor: '#1A6B45' },
    { key: 'neutral',   emoji: '😐', label: 'Neutral',   color: '#E8E8E8', textColor: '#555'   },
    { key: 'anxious',   emoji: '😰', label: 'Anxious',   color: '#FFD6D6', textColor: '#A0180A' },
    { key: 'sad',       emoji: '😢', label: 'Sad',       color: '#D6E4FF', textColor: '#1A3A7A' },
    { key: 'angry',     emoji: '😠', label: 'Angry',     color: '#FFB8B8', textColor: '#8B0000' },
];

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night'; 
}

const AuthPage = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const { user, login, register, setUser } = useAuth();
    
    const [isLogin, setIsLogin] = useState(location.pathname === '/login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [pendingLink, setPendingLink] = useState(null);
    const [linkLoading, setLinkLoading] = useState(false);

    // Mood logger state
    const [showMoodLogger, setShowMoodLogger] = useState(false);
    const [selectedMood, setSelectedMood] = useState('');
    const [note, setNote] = useState('');
    const [energy, setEnergy] = useState(3);
    const [timeOfDay, setTimeOfDay] = useState('');
    const [savingMood, setSavingMood] = useState(false);

    const promptMoodLogger = () => {
        setTimeOfDay(getTimeOfDay());
        setShowMoodLogger(true);
    };

    const handleMoodSubmit = async () => {
        if (!selectedMood) { toast.error('Pick a mood first!'); return; }
        setSavingMood(true);
        try {
            await api.post('/moods', { mood: selectedMood, timeOfDay, loginSession: true });
        } catch (err) {
            console.error(err);
        } finally {
            setSavingMood(false);
            setShowMoodLogger(false);
            navigate('/feed');
        }
    };

    const handleSkipMood = () => {
        setShowMoodLogger(false);
        navigate('/feed');
    };

    // Update state if URL changes
    useEffect(() => {
        setIsLogin(location.pathname === '/login');
        setError('');
    }, [location.pathname]);

    const handleTabSwitch = (toLogin) => {
        if (toLogin !== isLogin) {
            navigate(toLogin ? '/login' : '/register');
        }
    };

    // --- Login State ---
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(loginData);
            promptMoodLogger();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
            const isGoogleOnly = error.response?.data?.loginMethod === 'google_only';
            
            if (isGoogleOnly) {
                setError(errorMessage + ' Please use the "Continue with Google" button below.');
                toast.error('Use Google to login to this account');
            } else {
                setError(errorMessage);
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Register State ---
    const [registerData, setRegisterData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (registerData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword: _confirmPassword, ...dataToSend } = registerData;
            await register(dataToSend);  // AuthContext register handles API + sets user state
            promptMoodLogger();
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed.');
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // OAuth Handler
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const token = credentialResponse.credential;
            
            // Send token to backend
            const res = await api.post('/auth/google', {
                token
            });

            // Check if account linking confirmation needed
            if (res.data.status === 'pending_link') {
                // Show confirmation modal
                setPendingLink({
                    googleToken: token,
                    existingUser: res.data.existingUser,
                    googleData: res.data.googleData
                });
                toast('Found existing account! Confirm to link.', {
                    icon: '🔗'
                });
                return;
            }

            // Direct login/new account
            if (res.data.status === 'success' || res.data.token) {
                // setUser (from AuthContext's updateUser) persists to both state + localStorage
                setUser(res.data);

                toast.success('Login successful!');
                promptMoodLogger();
            }
        } catch (error) {
            console.error('Google login error:', error);
            const errorMessage = error.response?.data?.message || 'Google login failed';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Confirm account linking
    const handleConfirmLink = async () => {
        if (!pendingLink) return;
        
        setLinkLoading(true);
        try {
            const res = await api.post(
                '/auth/google/confirm-link',
                {
                    userId: pendingLink.existingUser._id,
                    token: pendingLink.googleToken
                }
            );

            // setUser (from AuthContext's updateUser) persists to both state + localStorage
            setUser(res.data);

            toast.success('Google account linked! Welcome back.');
            setPendingLink(null);
            promptMoodLogger();
        } catch (error) {
            console.error('Link error:', error);
            toast.error(error.response?.data?.message || 'Failed to link account');
        } finally {
            setLinkLoading(false);
        }
    };

    const handleCancelLink = () => {
        setPendingLink(null);
        toast('Account linking cancelled', {
            icon: '❌'
        });
    };

    const handleGoogleError = () => {
        toast.error('Google login failed');
    };

    const loginGoogle = useGoogleLogin({
        onSuccess: (tokenResponse) => {
            handleGoogleSuccess({ credential: tokenResponse.access_token });
        },
        onError: handleGoogleError
    });

    return (
        <div className="auth-page-wrapper">
            <div className="auth-page">
                {/* LEFT PANEL */}
                <div className="auth-left-panel">
                    <div className="auth-left-logo"><BrandLogo size="5xl" forceDark={true} /></div>

                    <div className="auth-left-content">
                        <div className="auth-left-tagline">
                            Scroll to what<br/>
                            <span style={{color: 'var(--auth-orange-primary)'}}>actually</span><br/>
                            matters.
                        </div>
                        <div className="auth-left-sub">A mindful social platform that respects your attention and curates content worth keeping.</div>
                    </div>

                    <div className="auth-left-features">
                        <div className="auth-feature-item">
                            <div className="auth-feature-dot">🎯</div> 
                            Mood-based feed filtering
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-dot">⏱️</div> 
                            Scroll budget tracker
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-dot">🚀</div> 
                            Journey mode
                        </div>
                        <div className="auth-feature-item">
                            <div className="auth-feature-dot">👶</div> 
                            Kids mode built in
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-right-panel">
                    {/* Theme Toggle */}
                    <button 
                        className="auth-theme-toggle"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        onClick={toggleTheme}
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-5 h-5" />
                        ) : (
                            <Moon className="w-5 h-5" />
                        )}
                    </button>

                    <div className="auth-form-box">
                        <div className="auth-form-tabs">
                            <button
                                type="button"
                                className={`auth-form-tab ${isLogin ? 'active' : ''}`}
                                onClick={() => handleTabSwitch(true)}
                            >
                                Log in
                            </button>
                            <button
                                type="button"
                                className={`auth-form-tab ${!isLogin ? 'active' : ''}`}
                                onClick={() => handleTabSwitch(false)}
                            >
                                Create account
                            </button>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        {/* LOGIN FORM */}
                        {isLogin ? (
                            <div className="auth-login-form animate-fade-in">
                                <div className="auth-form-heading">Welcome back</div>
                                <div className="auth-form-sub">Log in to continue your journey.</div>

                                <form onSubmit={handleLoginSubmit}>
                                    <div className="auth-field">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            value={loginData.email}
                                            onChange={handleLoginChange}
                                            required
                                        />
                                    </div>
                                    <div className="auth-field">
                                        <label>Password</label>
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="••••••••"
                                            value={loginData.password}
                                            onChange={handleLoginChange}
                                            required
                                        />
                                    </div>

                                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                                        {loading ? 'Logging in...' : 'Log in'}
                                    </button>
                                </form>

                                <div className="auth-divider">or</div>

                                <div className="auth-google-login">
                                    <button 
                                        type="button" 
                                        className="auth-custom-google-btn" 
                                        onClick={() => loginGoogle()}
                                    >
                                        <FcGoogle size={22} />
                                        <span>Continue with Google</span>
                                    </button>
                                </div>

                                <div className="auth-form-footer">
                                    <Link to="#">Forgot password?</Link>
                                    &nbsp;·&nbsp;
                                    No account? <button type="button" onClick={() => handleTabSwitch(false)} className="bg-transparent border-none text-[var(--auth-accent)] font-medium cursor-pointer hover:underline p-0 m-0">Sign up</button>
                                </div>
                            </div>
                        ) : (
                            /* REGISTER FORM */
                            <div className="auth-register-form animate-fade-in">
                                <div className="auth-form-heading">Create account</div>
                                <div className="auth-form-sub">Join Scrolla and start scrolling mindfully.</div>

                                <form onSubmit={handleRegisterSubmit}>
                                    <div className="auth-field">
                                        <label>Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="cool.user"
                                            value={registerData.username}
                                            onChange={handleRegisterChange}
                                            required
                                            minLength={3}
                                            maxLength={30}
                                        />
                                    </div>

                                    <div className="auth-field">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            value={registerData.email}
                                            onChange={handleRegisterChange}
                                            required
                                        />
                                    </div>

                                    <div className="auth-field-row">
                                        <div className="auth-field">
                                            <label>Password</label>
                                            <input
                                                type="password"
                                                name="password"
                                                placeholder="Min 6 chars"
                                                value={registerData.password}
                                                onChange={handleRegisterChange}
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <div className="auth-field">
                                            <label>Confirm</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                placeholder="Confirm"
                                                value={registerData.confirmPassword}
                                                onChange={handleRegisterChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                                        {loading ? 'Creating Account...' : 'Create account'}
                                    </button>
                                </form>

                                <div className="auth-divider">or</div>

                                <div className="auth-google-login">
                                    <button 
                                        type="button" 
                                        className="auth-custom-google-btn" 
                                        onClick={() => loginGoogle()}
                                    >
                                        <FcGoogle size={22} />
                                        <span>Continue with Google</span>
                                    </button>
                                </div>

                                <div className="auth-form-footer">
                                    By signing up you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Account Linking Confirmation Modal */}
            {pendingLink && (
                <div className="auth-link-modal-overlay" onClick={handleCancelLink}>
                    <div className="auth-link-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="auth-link-modal-header">
                            <h3>Link Your Account?</h3>
                            <button 
                                className="auth-link-modal-close" 
                                onClick={handleCancelLink}
                                type="button"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="auth-link-modal-content">
                            <div className="auth-link-info">
                                <p className="auth-link-label">Existing Account:</p>
                                <div className="auth-link-user-card">
                                    <img 
                                        src={pendingLink.existingUser.avatar} 
                                        alt="Existing" 
                                        className="auth-link-avatar"
                                    />
                                    <div>
                                        <p className="auth-link-username">{pendingLink.existingUser.username}</p>
                                        <p className="auth-link-email">{pendingLink.existingUser.email}</p>
                                        <p className="auth-link-date">Created {new Date(pendingLink.existingUser.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="auth-link-divider">+</div>

                            <div className="auth-link-info">
                                <p className="auth-link-label">Google Account:</p>
                                <div className="auth-link-user-card">
                                    <img 
                                        src={pendingLink.googleData.picture} 
                                        alt="Google" 
                                        className="auth-link-avatar"
                                    />
                                    <div>
                                        <p className="auth-link-username">{pendingLink.googleData.name}</p>
                                        <p className="auth-link-email">{pendingLink.googleData.email}</p>
                                        <p className="auth-link-google">Google Account</p>
                                    </div>
                                </div>
                            </div>

                            <div className="auth-link-message">
                                <p>✓ All your posts, followers & data will be preserved</p>
                                <p>✓ You can use Google to sign in next time</p>
                                <p>✓ Your password still works</p>
                            </div>
                        </div>

                        <div className="auth-link-modal-actions">
                            <button 
                                className="auth-link-btn-cancel" 
                                onClick={handleCancelLink}
                                disabled={linkLoading}
                                type="button"
                            >
                                Cancel
                            </button>
                            <button 
                                className="auth-link-btn-confirm" 
                                onClick={handleConfirmLink}
                                disabled={linkLoading}
                                type="button"
                            >
                                {linkLoading ? 'Linking...' : 'Confirm & Link'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mood Logger Modal */}
            {showMoodLogger && (
                <div className="auth-link-modal-overlay" style={{ zIndex: 1000, background: 'rgba(0,0,0,0.8)' }}>
                    <div className="auth-link-modal" style={{ maxWidth: '420px', background: '#1A1814', color: '#FFF', borderRadius: '16px', padding: '32px 24px', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '1.4rem', margin: '0 0 8px 0', fontWeight: 'bold' }}>
                                Hey {user?.username || 'there'}, how are you feeling?
                            </h3>
                            <p style={{ color: '#888', margin: 0, fontSize: '0.95rem' }}>Your feed will match your mood</p>
                        </div>

                        {/* Mood Picker */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
                            {MOODS.map(m => {
                                const isSelected = selectedMood === m.key;
                                return (
                                    <button
                                        key={m.key}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                            padding: '16px 8px', borderRadius: '12px',
                                            border: `1px solid ${isSelected ? '#F7931A' : '#333'}`,
                                            background: isSelected ? 'rgba(247, 147, 26, 0.05)' : '#222',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        onClick={() => setSelectedMood(m.key)}
                                    >
                                        <span style={{ fontSize: '28px', marginBottom: '8px' }}>{m.emoji}</span>
                                        <span style={{ fontSize: '12px', fontWeight: isSelected ? '600' : '500', color: isSelected ? '#F7931A' : '#888' }}>{m.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Time of day picker */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', background: '#222', padding: '8px 16px', borderRadius: '12px' }}>
                            <span style={{ fontSize: '12px', color: '#888', fontWeight: '500' }}>Time of day</span>
                            <div style={{ display: 'flex', gap: '8px', flex: 1, justifyContent: 'flex-end' }}>
                                {['morning', 'afternoon', 'evening', 'night'].map(time => {
                                    const isSelected = timeOfDay === time;
                                    return (
                                        <button
                                            key={time}
                                            style={{
                                                padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
                                                border: `1px solid ${isSelected ? '#F7931A' : 'transparent'}`,
                                                background: isSelected ? 'rgba(247, 147, 26, 0.05)' : 'transparent',
                                                color: isSelected ? '#F7931A' : '#888',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => setTimeOfDay(time)}
                                        >
                                            {capitalize(time)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <button
                                style={{ 
                                    background: '#222', border: '1px solid #444', padding: '14px', borderRadius: '12px', 
                                    color: '#FFF', fontWeight: '600', fontSize: '1rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    opacity: (!selectedMood || savingMood) ? 0.5 : 1
                                }}
                                onClick={handleMoodSubmit}
                                disabled={!selectedMood || savingMood}
                            >
                                {savingMood ? 'Entering...' : 'Enter Scrolla'} <span style={{ fontSize: '1.2rem' }}>→</span>
                            </button>
                            <button
                                style={{ 
                                    background: 'transparent', border: '1px solid #444', padding: '14px', borderRadius: '12px', 
                                    color: '#CCC', fontWeight: '500', fontSize: '0.95rem', cursor: 'pointer' 
                                }}
                                onClick={handleSkipMood}
                            >
                                Skip for now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
