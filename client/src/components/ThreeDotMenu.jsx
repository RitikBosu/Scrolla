import { Save, EyeOff, Flag, Edit, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

const ThreeDotMenu = ({ isOwnPost, onSave, onHide, onReport, onEdit, onDelete, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 animate-fade-in"
        >
            {isOwnPost ? (
                <>
                    <button
                        onClick={() => { onEdit(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-blue-50 transition-colors"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Edit Post</span>
                    </button>
                    <button
                        onClick={() => { onDelete(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Post</span>
                    </button>
                </>
            ) : (
                <>
                    <button
                        onClick={() => { onSave(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Post</span>
                    </button>
                    <button
                        onClick={() => { onHide(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <EyeOff className="w-4 h-4" />
                        <span>Hide Post</span>
                    </button>
                    <button
                        onClick={() => { onReport(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <Flag className="w-4 h-4" />
                        <span>Report Post</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default ThreeDotMenu;
