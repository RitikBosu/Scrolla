import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import JourneyDiscover from './pages/JourneyDiscover';
import JourneyDetail from './pages/JourneyDetail';
import './styles/defi-theme.css';

function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <ThemeProvider>
                    <Router>
                    <div className="min-h-screen">
                        <Toaster position="top-right" />
                        <Navbar />
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<AuthPage />} />
                            <Route path="/register" element={<AuthPage />} />

                            {/* Protected Routes */}
                            <Route
                                path="/feed"
                                element={
                                    <ProtectedRoute>
                                        <Feed />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/create-post"
                                element={
                                    <ProtectedRoute>
                                        <CreatePost />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/edit-post/:id"
                                element={
                                    <ProtectedRoute>
                                        <CreatePost />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile/:id"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/journeys"
                                element={
                                    <ProtectedRoute>
                                        <JourneyDiscover />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/journeys/:id"
                                element={
                                    <ProtectedRoute>
                                        <JourneyDetail />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Default Redirect */}
                            <Route path="/" element={<Navigate to="/feed" replace />} />
                            <Route path="*" element={<Navigate to="/feed" replace />} />
                        </Routes>
                    </div>
                </Router>
                </ThemeProvider>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;
