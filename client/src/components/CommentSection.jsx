import { useState, useEffect } from 'react';
import { Send, Edit2, Trash2 } from 'lucide-react';
import { commentService } from '../services/commentService';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/formatDate';
import LoadingSpinner from './LoadingSpinner';

const CommentSection = ({ postId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const data = await commentService.getComments(postId);
            setComments(data);
        } catch (error) {
            console.error('Error fetching comments:', error);
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

    if (loading) return <LoadingSpinner size="sm" />;

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
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} className="flex gap-3">
                            <img
                                src={comment.author.avatar}
                                alt={comment.author.username}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-sm text-gray-800">
                                            {comment.author.username}
                                        </h4>
                                        <span className="text-xs text-gray-500">
                                            {formatDate(comment.createdAt)}
                                        </span>
                                    </div>

                                    {editingId === comment._id ? (
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="flex-1 px-3 py-1 border border-gray-300 rounded"
                                            />
                                            <button
                                                onClick={() => handleEditComment(comment._id)}
                                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="px-3 py-1 bg-gray-300 rounded text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-700 text-sm">{comment.content}</p>
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
                                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteComment(comment._id)}
                                            className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CommentSection;
