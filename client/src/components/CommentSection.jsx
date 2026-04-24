import { useState, useEffect } from 'react';
import { Send, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/formatDate';
import LoadingSpinner from './LoadingSpinner';

const CommentSection = ({ postId }) => {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showAllComments, setShowAllComments] = useState(false);
    
    const COMMENTS_TO_SHOW = 3; // Show only top 3 comments by default

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const data = await commentService.getComments(postId);
            setComments(data || []);
        } catch (error) {
            console.error('Error fetching comments:', error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const comment = await commentService.addComment(postId, newComment);
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Failed to add comment');
        }
    };

    const handleEditComment = async (id) => {
        if (!editContent.trim()) return;

        try {
            const updatedComment = await commentService.updateComment(id, editContent);
            setComments(comments.map(c => c._id === id ? updatedComment : c));
            setEditingId(null);
            setEditContent('');
        } catch (error) {
            console.error('Error updating comment:', error);
            alert('Failed to update comment');
        }
    };

    const handleDeleteComment = async (id) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            await commentService.deleteComment(id);
            setComments(comments.filter(c => c._id !== id));
        } catch (error) {
            console.error('Error deleting comment:', error);
            alert('Failed to delete comment');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-4">
                <LoadingSpinner size="sm" />
            </div>
        );
    }

    const commentsToDisplay = showAllComments ? comments : comments.slice(0, COMMENTS_TO_SHOW);
    const hasMoreComments = comments.length > COMMENTS_TO_SHOW;

    return (
        <div className="space-y-4">
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
                <img
                    src={user?.avatar}
                    alt={user?.username}
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        style={{
                            backgroundColor: theme === 'light' ? '#ffffff' : '#1f2937',
                            color: theme === 'light' ? '#111827' : '#f3f4f6',
                            borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
                        }}
                        className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none"
                        onFocus={(e) => {
                            e.target.style.borderColor = theme === 'light' ? '#3b82f6' : '#2563eb';
                            e.target.style.boxShadow = `0 0 0 2px ${theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.1)'}`;
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = theme === 'light' ? '#d1d5db' : '#4b5563';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        style={{
                            backgroundColor: !newComment.trim() 
                                ? (theme === 'light' ? '#d1d5db' : '#4b5563')
                                : '#3b82f6',
                            color: '#ffffff',
                            opacity: !newComment.trim() ? 0.6 : 1,
                        }}
                        className="px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p style={{ color: theme === 'light' ? '#666666' : '#a0aec0' }} className="text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                    <>
                        {commentsToDisplay.map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                                <img
                                    src={comment.author.avatar}
                                    alt={comment.author.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div style={{
                                        backgroundColor: theme === 'light' ? '#ffffff' : '#374151',
                                        color: theme === 'light' ? '#111827' : '#f3f4f6',
                                    }} className="rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 style={{ color: theme === 'light' ? '#111827' : '#f3f4f6' }} className="font-semibold text-sm">
                                                {comment.author.username}
                                            </h4>
                                            <span style={{ color: theme === 'light' ? '#666666' : '#9ca3af' }} className="text-xs">
                                                {formatDate(comment.createdAt)}
                                            </span>
                                        </div>

                                        {editingId === comment._id ? (
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    type="text"
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    style={{
                                                        backgroundColor: theme === 'light' ? '#f3f4f6' : '#1f2937',
                                                        color: theme === 'light' ? '#111827' : '#f3f4f6',
                                                        borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
                                                    }}
                                                    className="flex-1 px-3 py-1 border rounded"
                                                />
                                                <button
                                                    onClick={() => handleEditComment(comment._id)}
                                                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    style={{
                                                        backgroundColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
                                                        color: theme === 'light' ? '#111827' : '#f3f4f6',
                                                    }}
                                                    className="px-3 py-1 rounded text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <p style={{ color: theme === 'light' ? '#111827' : '#f3f4f6' }} className="text-sm">{comment.content}</p>
                                        )}
                                    </div>

                                    {/* Edit/Delete buttons for own comments */}
                                    {user?._id === comment.author._id && editingId !== comment._id && (
                                        <div className="flex gap-3 mt-2">
                                            <button
                                                onClick={() => {
                                                    setEditingId(comment._id);
                                                    setEditContent(comment.content);
                                                }}
                                                style={{ color: theme === 'light' ? '#2563eb' : '#60a5fa' }}
                                                className="text-xs flex items-center gap-1"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteComment(comment._id)}
                                                style={{ color: theme === 'light' ? '#dc2626' : '#f87171' }}
                                                className="text-xs flex items-center gap-1"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* View More/Less Button */}
                        {hasMoreComments && (
                            <button
                                onClick={() => setShowAllComments(!showAllComments)}
                                style={{
                                    color: '#3b82f6',
                                    backgroundColor: theme === 'light' ? '#eff6ff' : '#1e3a8a'
                                }}
                                className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:opacity-80"
                            >
                                {showAllComments ? (
                                    <>
                                        <ChevronUp className="w-4 h-4" />
                                        Show Less ({COMMENTS_TO_SHOW} of {comments.length})
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-4 h-4" />
                                        View All Comments ({comments.length})
                                    </>
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
