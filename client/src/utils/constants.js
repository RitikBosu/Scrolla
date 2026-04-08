import {
    Sparkles, Droplet, Rocket, CloudRain, Sun, Zap, MessageCircle, Laugh,
    Clock
} from 'lucide-react';

// Mood categories for feed filtering
export const MOODS = [
    {
        id: 'all',
        label: 'All Posts',
        emoji: '✨',
        icon: Sparkles,
        color: 'text-purple-600 bg-purple-50 hover:bg-purple-100',
        colorCode: '#E8A88B'
    },
    {
        id: 'calm',
        label: 'Calm',
        emoji: '🧘',
        icon: Droplet,
        color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
        colorCode: '#7BA8CC'
    },
    {
        id: 'motivated',
        label: 'Focused',
        emoji: '🎯',
        icon: Rocket,
        color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
        colorCode: '#E8A88B'
    },
    {
        id: 'low',
        label: 'Reflective',
        emoji: '🌿',
        icon: CloudRain,
        color: 'text-gray-600 bg-gray-50 hover:bg-gray-100',
        colorCode: '#A8C9A8'
    },
    {
        id: 'entertain',
        label: 'Joyful',
        emoji: '😂',
        icon: Laugh,
        color: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
        colorCode: '#F4D89F'
    },
    {
        id: 'energetic',
        label: 'Energetic',
        emoji: '⚡',
        icon: Zap,
        color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
        colorCode: '#E8C76A'
    },
    {
        id: 'discuss',
        label: 'Discuss',
        emoji: '💬',
        icon: MessageCircle,
        color: 'text-green-600 bg-green-50 hover:bg-green-100',
        colorCode: '#A8C9A8'
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
