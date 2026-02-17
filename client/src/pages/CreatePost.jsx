import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hash, X, Check } from 'lucide-react';
import { MOODS } from '../utils/constants';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';

const CreatePost = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const editPost = location.state?.post;

    const [formData, setFormData] = useState({
        content: editPost?.content || '',
        mood: editPost?.mood || 'all',
        hashtags: editPost?.hashtags || [],
        images: editPost?.images || [],
        kidSafe: editPost?.kidSafe || false
    });
    const [hashtagInput, setHashtagInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAddHashtag = (e) => {
        e.preventDefault();
        if (hashtagInput.trim() && !formData.hashtags.includes(hashtagInput.trim())) {
            setFormData({
                ...formData,
                hashtags: [...formData.hashtags, hashtagInput.trim().replace('#', '')]
            });
            setHashtagInput('');
        }
    };

    const handleRemoveHashtag = (tag) => {
        setFormData({
            ...formData,
            hashtags: formData.hashtags.filter(t => t !== tag)
        });
    };

    const handleImagesChange = (images) => {
        setFormData({
            ...formData,
            images
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.content.trim()) {
            setError('Please write something in your post');
            return;
        }

        setLoading(true);

        try {
            if (editPost) {
                await postService.updatePost(editPost._id, formData);
                alert('Post updated successfully!');
            } else {
                await postService.createPost(formData);
                alert('Post created successfully!');
            }
            navigate('/feed');
        } catch (error) {
            console.error('Error saving post:', error);
            setError(error.response?.data?.message || 'Failed to save post. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="card animate-slide-up">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">
                        {editPost ? 'Edit Post' : 'Create New Post'}
                    </h1>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                What's on your mind?
                            </label>
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={6}
                                maxLength={1000}
                                className="input-field resize-none"
                                placeholder="Share your thoughts..."
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {formData.content.length}/1000 characters
                            </p>
                        </div>

                        {/* Mood Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Mood
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {MOODS.filter(m => m.id !== 'all').map((mood) => {
                                    const Icon = mood.icon;
                                    const isSelected = formData.mood === mood.id;

                                    return (
                                        <button
                                            key={mood.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, mood: mood.id })}
                                            className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                                    ? `${mood.color} border-current scale-105`
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? '' : 'text-gray-400'}`} />
                                            <span className={`text-sm font-medium ${isSelected ? '' : 'text-gray-600'}`}>
                                                {mood.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Hashtags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hashtags
                            </label>
                            <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={hashtagInput}
                                        onChange={(e) => setHashtagInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleAddHashtag(e)}
                                        className="input-field pl-12"
                                        placeholder="Add hashtag"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddHashtag}
                                    className="btn btn-secondary"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {formData.hashtags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveHashtag(tag)}
                                            className="hover:text-blue-900"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* File Upload */}
                        <FileUpload
                            onUpload={handleImagesChange}
                            existingImages={formData.images}
                        />

                        {/* Kids Safe Toggle */}
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                            <input
                                type="checkbox"
                                id="kidSafe"
                                checked={formData.kidSafe}
                                onChange={(e) => setFormData({ ...formData, kidSafe: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                            <label htmlFor="kidSafe" className="flex-1 cursor-pointer">
                                <span className="font-medium text-gray-800">Kid Safe Content</span>
                                <p className="text-sm text-gray-600">Mark this post as safe for children</p>
                            </label>
                            {formData.kidSafe && <Check className="w-6 h-6 text-green-600" />}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 btn btn-primary"
                            >
                                {loading ? 'Saving...' : editPost ? 'Update Post' : 'Create Post'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
