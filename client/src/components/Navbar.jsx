import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Baby } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import BrandLogo from './BrandLogo';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { kidsMode, toggleKidsMode } = useApp();

    const location = useLocation();

    // Hide navbar on these routes (pages have their own nav)
    const isHiddenRoute = 
        location.pathname === '/login' || 
        location.pathname === '/register' || 
        location.pathname.startsWith('/profile') ||
        location.pathname === '/feed' ||
        location.pathname === '/create-post' ||
        location.pathname.startsWith('/edit-post');

    if (isHiddenRoute) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="glass border-b border-white/20 py-4 sticky top-0 z-50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/feed" className="flex items-center gap-3">
                        <BrandLogo size="md" />
                    </Link>

                    {/* Navigation */}
                    {user && (
                        <div className="flex items-center gap-4">
                            {/* Kids Mode Toggle */}
                            <button
                                onClick={toggleKidsMode}
                                className={`cyber-btn flex items-center gap-2 ${kidsMode ? 'border-green-400 text-green-400' : 'border-amber-400 text-amber-400'}`}
                            >
                                <Baby className="w-5 h-5" />
                                <span className="font-medium uppercase text-xs tracking-widest">
                                    {kidsMode ? 'Kids✓' : 'Kids'}
                                </span>
                            </button>

                            {/* User Menu */}
                            <button
                                className="cyber-btn flex items-center gap-2 px-3 py-2"
                                onClick={(e) => navigate(`/profile/${user._id}`)}
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-6 h-6 rounded-full border border-current"
                                />
                                <span className="font-mono text-xs uppercase tracking-wider hidden sm:inline">{user.username.slice(0, 8)}</span>
                            </button>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="cyber-btn-destructive flex items-center p-2"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
