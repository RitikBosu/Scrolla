import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/BrandLogo';
import toast from 'react-hot-toast';
import './AuthPage.css';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, register } = useAuth();
    
    const [isLogin, setIsLogin] = useState(location.pathname === '/login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
            navigate('/feed');
        } catch (error) {
            setError(error.response?.data?.message || 'Login failed. Please try again.');
            toast.error(error.response?.data?.message || 'Login failed');
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
            navigate('/feed');
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed.');
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    // OAuth Stub
    const handleOAuth = () => {
        toast.error('Google login coming soon!');
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-page">
                {/* LEFT PANEL */}
                <div className="auth-left-panel">
                    <div className="auth-left-logo"><BrandLogo size="md" uppercase /></div>

                    <div className="auth-left-content">
                        <div className="auth-left-tagline">A space to scroll<br/>with intention.</div>
                        <div className="auth-left-sub">Share your mood, join journeys, and connect with people who get it — without the noise.</div>
                    </div>

                    <div className="auth-left-features">
                        <div className="auth-feature-item"><div className="auth-feature-dot"></div> Mood-based feed filtering</div>
                        <div className="auth-feature-item"><div className="auth-feature-dot"></div> Time-constrained journeys</div>
                        <div className="auth-feature-item"><div className="auth-feature-dot"></div> Kids mode built in</div>
                        <div className="auth-feature-item"><div className="auth-feature-dot"></div> Scroll budget tracker</div>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="auth-right-panel">
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

                                <button type="button" className="auth-oauth-btn" onClick={handleOAuth}>
                                    <span className="auth-oauth-icon"><FcGoogle /></span>
                                    Continue with Google
                                </button>

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

                                <button type="button" className="auth-oauth-btn" onClick={handleOAuth}>
                                    <span className="auth-oauth-icon"><FcGoogle /></span>
                                    Continue with Google
                                </button>

                                <div className="auth-form-footer">
                                    By signing up you agree to our <Link to="#">Terms</Link> and <Link to="#">Privacy Policy</Link>.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
