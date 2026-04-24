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
        colorCode: '#52C77A'
    },
    {
        id: 'calm',
        label: 'Calm',
        emoji: '🧘',
        icon: Droplet,
        color: 'text-blue-600 bg-blue-50 hover:bg-blue-100',
        colorCode: '#3B82F6'
    },
    {
        id: 'motivated',
        label: 'Focused',
        emoji: '🎯',
        icon: Rocket,
        color: 'text-orange-600 bg-orange-50 hover:bg-orange-100',
        colorCode: '#8B5CF6'
    },
    {
        id: 'low',
        label: 'Reflective',
        emoji: '🌿',
        icon: CloudRain,
        color: 'text-gray-600 bg-gray-50 hover:bg-gray-100',
        colorCode: '#14B8A6'
    },
    {
        id: 'entertain',
        label: 'Joyful',
        emoji: '😂',
        icon: Laugh,
        color: 'text-pink-600 bg-pink-50 hover:bg-pink-100',
        colorCode: '#EC4899'
    },
    {
        id: 'energetic',
        label: 'Energetic',
        emoji: '⚡',
        icon: Zap,
        color: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100',
        colorCode: '#F59E0B'
    },
    {
        id: 'discuss',
        label: 'Discuss',
        emoji: '💬',
        icon: MessageCircle,
        color: 'text-green-600 bg-green-50 hover:bg-green-100',
        colorCode: '#06B6D4'
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
