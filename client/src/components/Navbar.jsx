import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Baby } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { kidsMode, toggleKidsMode } = useApp();

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
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">S</span>
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Scrolla
                        </span>
                    </Link>

                    {/* Navigation */}
                    {user && (
                        <div className="flex items-center gap-4">
                            {/* Kids Mode Toggle */}
                            <button
                                onClick={toggleKidsMode}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${kidsMode
                                        ? 'bg-green-500 text-white shadow-lg scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Baby className="w-5 h-5" />
                                <span className="font-medium">
                                    {kidsMode ? 'Kids Mode ON' : 'Kids Mode'}
                                </span>
                            </button>

                            {/* User Menu */}
                            <Link
                                to={`/profile/${user._id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                            >
                                <img
                                    src={user.avatar}
                                    alt={user.username}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="font-medium text-gray-800">{user.username}</span>
                            </Link>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
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
