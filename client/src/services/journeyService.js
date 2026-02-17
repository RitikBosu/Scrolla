import api from './api';

export const journeyService = {
    startJourney: async (journeyData) => {
        const response = await api.post('/journeys/start', journeyData);
        return response.data;
    },

    completeJourney: async (id, postsViewed) => {
        const response = await api.put(`/journeys/${id}/complete`, { postsViewed });
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get('/journeys/history');
        return response.data;
    }
};

export default journeyService;
