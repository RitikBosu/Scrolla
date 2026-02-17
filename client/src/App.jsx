import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';

function App() {
    return (
        <AuthProvider>
            <AppProvider>
                <Router>
                    <div className="min-h-screen">
                        <Navbar />
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

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

                            {/* Default Redirect */}
                            <Route path="/" element={<Navigate to="/feed" replace />} />
                            <Route path="*" element={<Navigate to="/feed" replace />} />
                        </Routes>
                    </div>
                </Router>
            </AppProvider>
        </AuthProvider>
    );
}

export default App;
