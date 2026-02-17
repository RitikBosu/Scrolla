import api from './api';

export const postService = {
    getPosts: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/posts?${params}`);
        return response.data;
    },

    getPost: async (id) => {
        const response = await api.get(`/posts/${id}`);
        return response.data;
    },

    createPost: async (postData) => {
        const response = await api.post('/posts', postData);
        return response.data;
    },

    updatePost: async (id, postData) => {
        const response = await api.put(`/posts/${id}`, postData);
        return response.data;
    },

    deletePost: async (id) => {
        const response = await api.delete(`/posts/${id}`);
        return response.data;
    },

    likePost: async (id) => {
        const response = await api.post(`/posts/${id}/like`);
        return response.data;
    },

    savePost: async (id) => {
        const response = await api.post(`/posts/${id}/save`);
        return response.data;
    },

    hidePost: async (id) => {
        const response = await api.post(`/posts/${id}/hide`);
        return response.data;
    },

    reportPost: async (id) => {
        const response = await api.post(`/posts/${id}/report`);
        return response.data;
    }
};

export default postService;
