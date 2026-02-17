import { MOODS } from '../utils/constants';

const MoodBadge = ({ mood, size = 'md' }) => {
    const moodData = MOODS.find(m => m.id === mood);

    if (!moodData) return null;

    const Icon = moodData.icon;

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <span className={`inline-flex items-center gap-1.5 ${moodData.color} ${sizeClasses[size]} rounded-full font-medium border`}>
            <Icon className="w-4 h-4" />
            {moodData.label}
        </span>
    );
};

export default MoodBadge;
