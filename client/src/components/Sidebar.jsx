import { MOODS } from '../utils/constants';

const Sidebar = ({ selectedMood, onMoodChange }) => {
    return (
        <aside className="w-64 glass border-r border-white/20 p-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Categories</h2>

            <nav className="space-y-2">
                {MOODS.map((mood) => {
                    const Icon = mood.icon;
                    const isActive = selectedMood === mood.id;

                    return (
                        <button
                            key={mood.id}
                            onClick={() => onMoodChange(mood.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                    ? mood.color + ' font-semibold shadow-md scale-105'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{mood.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-500 text-center">
                    Browse content by mood
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
