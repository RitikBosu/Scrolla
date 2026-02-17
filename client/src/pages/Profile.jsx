import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, UserPlus, UserMinus, Settings } from 'lucide-react';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { userService } from '../services/userService';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('posts');

    const isOwnProfile = currentUser?._id === id;

    useEffect(() => {
        fetchProfile();
        fetchUserPosts();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const userData = await userService.getUser(id);
            setProfile(userData);
            setIsFollowing(userData.followers?.some(f => f._id === currentUser?._id));
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserPosts = async () => {
        try {
            // This would ideally be a dedicated endpoint, but we'll filter client-side for now
            const data = await postService.getPosts({ limit: 50 });
            setPosts(data.posts.filter(p => p.author._id === id));
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    const handleFollow = async () => {
        try {
            if (isFollowing) {
                await userService.unfollowUser(id);
                setIsFollowing(false);
                setProfile({
                    ...profile,
                    followerCount: profile.followerCount - 1
                });
            } else {
                await userService.followUser(id);
                setIsFollowing(true);
                setProfile({
                    ...profile,
                    followerCount: profile.followerCount + 1
                });
            }
        } catch (error) {
            console.error('Error following/unfollowing:', error);
            alert('Failed to update follow status');
        }
    };

    const handleEditProfile = () => {
        const newBio = prompt('Enter new bio:', profile.bio);
        if (newBio !== null) {
            updateProfile({ bio: newBio });
        }
    };

    const updateProfile = async (updates) => {
        try {
            const updated = await userService.updateUser(id, updates);
            setProfile(updated);
            alert('Profile updated!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner message="Loading profile..." />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="card max-w-md">
                    <p className="text-gray-600 text-center">Profile not found</p>
                    <button onClick={() => navigate('/')} className="btn btn-primary w-full mt-4">
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-48"></div>

            <div className="max-w-4xl mx-auto px-4 -mt-20">
                <div className="card">
                    {/* Profile Info */}
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <img
                            src={profile.avatar}
                            alt={profile.username}
                            className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                        />

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                {profile.username}
                            </h1>
                            <p className="text-gray-600 mb-4">{profile.bio || 'No bio yet'}</p>

                            {/* Stats */}
                            <div className="flex gap-8 justify-center md:justify-start mb-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-800">{posts.length}</p>
                                    <p className="text-sm text-gray-600">Posts</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-800">
                                        {profile.followerCount || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Followers</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-800">
                                        {profile.followingCount || 0}
                                    </p>
                                    <p className="text-sm text-gray-600">Following</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 justify-center md:justify-start">
                                {isOwnProfile ? (
                                    <button
                                        onClick={handleEditProfile}
                                        className="btn btn-secondary flex items-center gap-2"
                                    >
                                        <Edit className="w-5 h-5" />
                                        Edit Profile
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleFollow}
                                        className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} flex items-center gap-2`}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <UserMinus className="w-5 h-5" />
                                                Unfollow
                                            </>
                                        ) : (
                                            <>
                                                <UserPlus className="w-5 h-5" />
                                                Follow
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-8 border-b border-gray-200">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('posts')}
                            className={`pb-4 font-semibold transition-colors ${activeTab === 'posts'
                                    ? 'text-blue-600 border-b-2 border-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Posts
                        </button>
                    </div>
                </div>

                {/* Posts Grid */}
                <div className="mt-8 space-y-6">
                    {posts.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-600">
                                {isOwnProfile ? "You haven't posted anything yet" : 'No posts yet'}
                            </p>
                            {isOwnProfile && (
                                <button
                                    onClick={() => navigate('/create-post')}
                                    className="btn btn-primary mt-4"
                                >
                                    Create First Post
                                </button>
                            )}
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                onUpdate={fetchUserPosts}
                                onDelete={(id) => setPosts(posts.filter(p => p._id !== id))}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
