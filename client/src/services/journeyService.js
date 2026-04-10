import api from './api';

// Focus Session service (the scroll-timer feature, formerly called "journeys")
export const journeyService = {
    startJourney: async (journeyData) => {
        const response = await api.post('/sessions/start', journeyData);
        return response.data;
    },

    completeJourney: async (id, postsViewed) => {
        const response = await api.put(`/sessions/${id}/complete`, { postsViewed });
        return response.data;
    },

    getHistory: async () => {
        const response = await api.get('/sessions/history');
        return response.data;
    }
};

export default journeyService;
