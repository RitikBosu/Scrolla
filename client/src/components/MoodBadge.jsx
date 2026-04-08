import { MOODS } from '../utils/constants';

// const MoodBadge = ({ mood, size = 'md' }) => {
//     const moodData = MOODS.find(m => m.id === mood);

//     if (!moodData) return null;

//     const Icon = moodData.icon;

//     const sizeClasses = {
//         sm: 'px-2 py-1 text-xs',
//         md: 'px-3 py-1.5 text-sm',
//         lg: 'px-4 py-2 text-base'
//     };

//     return (
//         <span className={`inline-flex items-center gap-1.5 ${moodData.color} ${sizeClasses[size]} rounded-full font-medium border`}>
//             <Icon className="w-4 h-4" />
//             {moodData.label}
//         </span>
//     );
// };

const moodColors = {
  calm: { bg: '#E1F5EE', text: '#0F6E56' },
  low: { bg: '#EEEDFE', text: '#534AB7' },
  motivated: { bg: '#EAF3DE', text: '#3B6D11' },
  energetic: { bg: '#FAECE7', text: '#993C1D' },
};
export const MoodBadge = ({ mood }) => (
  <span style={{ background: moodColors[mood]?.bg, color: moodColors[mood]?.text, padding: '3px 8px', borderRadius: 20, fontSize: 11 }}>
    {mood}
  </span>
);

export default MoodBadge;
