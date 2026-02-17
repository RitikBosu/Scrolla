import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, CheckCircle } from 'lucide-react';
import PostCard from '../components/PostCard';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { postService } from '../services/postService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { TIME_OPTIONS } from '../utils/constants';

const Feed = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { kidsMode, journeyTime, journeyStartTime, startJourney, endJourney } = useApp();

    const [selectedMood, setSelectedMood] = useState('all');
    const [selectedTime, setSelectedTime] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [journeyComplete, setJourneyComplete] = useState(false);
    const [showTimeSelector, setShowTimeSelector] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, [selectedMood, kidsMode]);

    useEffect(() => {
        // Set up timer if journey is active
        if (journeyTime && journeyStartTime) {
            const endTime = journeyStartTime + journeyTime * 60000;

            const timer = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, endTime - now);
                setTimeRemaining(remaining);

                if (remaining === 0) {
                    handleJourneyEnd();
                    clearInterval(timer);
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [journeyTime, journeyStartTime]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const filters = {};

            // Don't filter by mood if "all" is selected
            if (selectedMood !== 'all') {
                filters.mood = selectedMood;
            }

            // Only add kidSafe filter if kids mode is ON
            if (kidsMode) {
                filters.kidSafe = 'true';
            }

            filters.limit = 50;

            console.log('Fetching posts with filters:', filters);

            const data = await postService.getPosts(filters);
            console.log('Received posts:', data);
            setPosts(data.posts || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleJourneyEnd = () => {
        setJourneyComplete(true);
        endJourney();
    };

    const handleNewJourney = () => {
        setJourneyComplete(false);
        setSelectedTime(null);
    };

    const handleTimeSelect = (time) => {
        setSelectedTime(time);
        startJourney(time);
        setShowTimeSelector(false);
    };

    const formatTime = (ms) => {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (journeyComplete) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="card max-w-md w-full text-center animate-slide-up">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">
                        Journey Complete!
                    </h1>
                    <p className="text-gray-600 mb-8">
                        You've completed your {selectedTime}-minute mindful journey. Time to take a break!
                    </p>
                    <button
                        onClick={handleNewJourney}
                        className="btn btn-primary w-full"
                    >
                        Continue Browsing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                selectedMood={selectedMood}
                onMoodChange={setSelectedMood}
            />

            {/* Main Content */}
            <div className="flex-1">
                {/* Header with Time Control */}
                <div className="glass border-b border-white/20 py-4 sticky top-16 z-40 backdrop-blur-xl">
                    <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {selectedMood === 'all' ? 'All Posts' : selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)}
                            {kidsMode && <span className="ml-3 text-sm font-normal text-green-600">(Kids Mode)</span>}
                        </h1>

                        <div className="flex items-center gap-4">
                            {/* Time Selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowTimeSelector(!showTimeSelector)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                >
                                    <Clock className="w-5 h-5" />
                                    <span className="font-medium">
                                        {selectedTime ? `${selectedTime} mins` : 'Set Time'}
                                    </span>
                                </button>

                                {showTimeSelector && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg p-2 space-y-1">
                                        {TIME_OPTIONS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => handleTimeSelect(option.value)}
                                                className="w-full px-4 py-2 text-left rounded hover:bg-gray-100 transition-colors"
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Timer Display */}
                            {timeRemaining !== null && (
                                <div className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full">
                                    <Clock className="w-5 h-5" />
                                    <span className="font-bold text-lg">{formatTime(timeRemaining)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Feed Content */}
                <div className="max-w-3xl mx-auto px-4 py-8">
                    {loading ? (
                        <LoadingSpinner message="Loading posts..." />
                    ) : posts.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600 mb-4">
                                {kidsMode
                                    ? 'No kid-safe posts found. Try creating one!'
                                    : 'No posts yet. Be the first to create one!'}
                            </p>
                            <button
                                onClick={() => navigate('/create-post')}
                                className="btn btn-primary"
                            >
                                Create First Post
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {posts.map((post) => (
                                <PostCard
                                    key={post._id}
                                    post={post}
                                    onUpdate={fetchPosts}
                                    onDelete={(id) => setPosts(posts.filter(p => p._id !== id))}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => navigate('/create-post')}
                className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center z-50"
            >
                <Plus className="w-8 h-8" />
            </button>
        </div>
    );
};

export default Feed;
