import api from './api';

export const userService = {
    getUser: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    updateUser: async (id, userData) => {
        const response = await api.put(`/users/${id}`, userData);
        return response.data;
    },

    followUser: async (id) => {
        const response = await api.post(`/users/${id}/follow`);
        return response.data;
    },

    unfollowUser: async (id) => {
        const response = await api.delete(`/users/${id}/follow`);
        return response.data;
    },

    getFollowers: async (id) => {
        const response = await api.get(`/users/${id}/followers`);
        return response.data;
    },

    getFollowing: async (id) => {
        const response = await api.get(`/users/${id}/following`);
        return response.data;
    }
};

export default userService;
