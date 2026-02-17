import {
    Sparkles, Droplet, Rocket, CloudRain, Sun, Zap, MessageCircle, Laugh,
    Clock
} from 'lucide-react';

// Mood categories for feed filtering
export const MOODS = [
    {
        id: 'all',
        label: 'All Posts',
        icon: Sparkles,
        color: 'text-purple-600 bg-purple-50 hover:bg-purple-100'
    },
    {
        id: 'calm',
        label: 'Calm',
        icon: Droplet,
        color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'
    },
    {
        id: 'motivated',
        label: 'Motivated',
        icon: Rocket,
        color: 'text-orange-600 bg-orange-50 hover:bg-orange-100'
    },
    {
        id: 'low',
        label: 'Low',
        icon: CloudRain,
        color: 'text-gray-600 bg-gray-50 hover:bg-gray-100'
    },
    {
        id: 'entertain',
        label: 'Entertain',
        icon: Laugh,
        color: 'text-pink-600 bg-pink-50 hover:bg-pink-100'
    },
    {
        id: 'energetic',
        label: 'Energetic',
        icon: Zap,
        color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
    },
    {
        id: 'discuss',
        label: 'Discuss',
        icon: MessageCircle,
        color: 'text-green-600 bg-green-50 hover:bg-green-100'
    }
];

// Time options for journey duration (in minutes)
export const TIME_OPTIONS = [
    { value: 5, label: '5 mins', icon: Clock },
    { value: 10, label: '10 mins', icon: Clock },
    { value: 20, label: '20 mins', icon: Clock },
    { value: 30, label: '30 mins', icon: Clock }
];

// Get mood by ID
export const getMoodById = (id) => {
    return MOODS.find(mood => mood.id === id);
};
