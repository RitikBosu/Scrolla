import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical } from 'lucide-react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';
import MoodBadge from './MoodBadge';
import ThreeDotMenu from './ThreeDotMenu';
import CommentSection from './CommentSection';
import { formatDate } from '../utils/formatDate';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ post, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likeCount || 0);
    const [showComments, setShowComments] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const shareUrl = `${window.location.origin}/posts/${post._id}`;
    const isOwnPost = user?._id === post.author?._id;

    // Safety check - if post.author is null, don't render
    if (!post.author) {
        console.error('Post author is null:', post);
        return null;
    }

    useEffect(() => {
        setLiked(post.likes?.includes(user?._id));
    }, [post.likes, user?._id]);

    const handleLike = async () => {
        try {
            const response = await postService.likePost(post._id);
            setLiked(response.liked);
            setLikeCount(response.likeCount);
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleSave = async () => {
        try {
            await postService.savePost(post._id);
            alert('Post saved!');
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    const handleHide = async () => {
        try {
            await postService.hidePost(post._id);
            alert('Post hidden!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error hiding post:', error);
        }
    };

    const handleReport = async () => {
        try {
            await postService.reportPost(post._id);
            alert('Post reported. Thank you for helping keep Scrolla safe!');
        } catch (error) {
            console.error('Error reporting post:', error);
        }
    };

    const handleEdit = () => {
        navigate(`/edit-post/${post._id}`, { state: { post } });
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                await postService.deletePost(post._id);
                alert('Post deleted!');
                if (onDelete) onDelete(post._id);
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    return (
        <div className="card animate-slide-up">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${post.author._id}`)}
                >
                    <img
                        src={post.author.avatar}
                        alt={post.author.username}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                    />
                    <div>
                        <h3 className="font-semibold text-gray-800">{post.author.username}</h3>
                        <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                    </div>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {showMenu && (
                        <ThreeDotMenu
                            isOwnPost={isOwnPost}
                            onSave={handleSave}
                            onHide={handleHide}
                            onReport={handleReport}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onClose={() => setShowMenu(false)}
                        />
                    )}
                </div>
            </div>

            {/* Mood Badge */}
            <div className="mb-3">
                <MoodBadge mood={post.mood} />
            </div>

            {/* Content */}
            <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>

            {/* Images - Display Cloudinary URLs directly */}
            {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 mb-4 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {post.images.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full rounded-lg object-cover max-h-80"
                            loading="lazy"
                            onError={(e) => {
                                console.error('Image failed to load');
                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.hashtags.map((tag, index) => (
                        <span key={index} className="text-blue-600 text-sm hover:underline cursor-pointer">
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t border-gray-200">
                <button
                    onClick={handleLike}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors group"
                >
                    {liked ? (
                        <FaHeart className="w-5 h-5 text-red-500" />
                    ) : (
                        <FaRegHeart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    <span className="font-medium">{likeCount}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{post.commentCount || 0}</span>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowShareMenu(!showShareMenu)}
                        className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
                    >
                        <Share2 className="w-5 h-5" />
                        <span className="font-medium">Share</span>
                    </button>

                    {showShareMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-3 flex gap-2 z-10">
                            <FacebookShareButton url={shareUrl}>
                                <div className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    FB
                                </div>
                            </FacebookShareButton>
                            <TwitterShareButton url={shareUrl}>
                                <div className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors">
                                    TW
                                </div>
                            </TwitterShareButton>
                            <WhatsappShareButton url={shareUrl}>
                                <div className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                    WA
                                </div>
                            </WhatsappShareButton>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <CommentSection postId={post._id} />
                </div>
            )}
        </div>
    );
};

export default PostCard;
