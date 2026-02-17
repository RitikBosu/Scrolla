import { formatDistanceToNow, format } from 'date-fns';

export const formatDate = (date) => {
    if (!date) return '';

    try {
        const dateObj = new Date(date);
        return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch (error) {
        return '';
    }
};

export const formatFullDate = (date) => {
    if (!date) return '';

    try {
        const dateObj = new Date(date);
        return format(dateObj, 'PPP');
    } catch (error) {
        return '';
    }
};

export default formatDate;
