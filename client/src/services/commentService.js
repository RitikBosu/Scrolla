import api from './api';

export const commentService = {
    getComments: async (postId) => {
        const response = await api.get(`/comments/${postId}/comments`);
        return response.data;
    },

    addComment: async (postId, content) => {
        const response = await api.post(`/comments/${postId}/comments`, { content });
        return response.data;
    },

    updateComment: async (id, content) => {
        const response = await api.put(`/comments/${id}`, { content });
        return response.data;
    },

    deleteComment: async (id) => {
        const response = await api.delete(`/comments/${id}`);
        return response.data;
    }
};

export default commentService;
