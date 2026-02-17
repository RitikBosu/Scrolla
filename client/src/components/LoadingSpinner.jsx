import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', message = '' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-16 h-16'
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-500`} />
            {message && <p className="mt-4 text-gray-600">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;
