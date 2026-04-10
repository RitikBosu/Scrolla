import api from './api';

export const sharedJourneyService = {
    // Browse public journeys (filter: 'active' | 'closed' | 'all')
    getJourneys: async (filter = 'active', page = 1) => {
        const { data } = await api.get('/journeys', { params: { filter, page, limit: 12 } });
        return data;
    },

    // Journeys I created or joined
    getMine: async () => {
        const { data } = await api.get('/journeys/mine');
        return data;
    },

    // Journey history for profile
    getHistory: async () => {
        const { data } = await api.get('/journeys/history');
        return data;
    },

    // Journey detail + my membership status
    getById: async (id) => {
        const { data } = await api.get(`/journeys/${id}`);
        return data;
    },

    // Create a new journey
    create: async (journeyData) => {
        const { data } = await api.post('/journeys', journeyData);
        return data;
    },

    // Join a public journey
    join: async (id) => {
        const { data } = await api.post(`/journeys/${id}/join`);
        return data;
    },

    // Join via invite code (private journey)
    joinByCode: async (code) => {
        const { data } = await api.post('/journeys/join-code', { code });
        return data;
    },

    // Leave a journey
    leave: async (id) => {
        const { data } = await api.delete(`/journeys/${id}/join`);
        return data;
    },

    // Creator closes journey early
    close: async (id) => {
        const { data } = await api.put(`/journeys/${id}/close`);
        return data;
    },

    // Get posts in a journey feed (members only)
    getPosts: async (id, page = 1) => {
        const { data } = await api.get(`/journeys/${id}/posts`, { params: { page, limit: 20 } });
        return data;
    },

    // Get member list
    getMembers: async (id) => {
        const { data } = await api.get(`/journeys/${id}/members`);
        return data;
    }
};

export default sharedJourneyService;
