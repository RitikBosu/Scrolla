import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';

export const useFollow = (initialIsFollowing = false, userId, onToggle) => {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    const toggleFollow = useCallback(async (e) => {
        if (e) e.stopPropagation();
        if (loading || !userId) return;
        
        setLoading(true);
        try {
            if (isFollowing) {
                await userService.unfollowUser(userId);
                setIsFollowing(false);
                if (onToggle) onToggle(false, userId);
            } else {
                await userService.followUser(userId);
                setIsFollowing(true);
                if (onToggle) onToggle(true, userId);
            }
        } catch (err) {
            console.error('Follow/unfollow error:', err);
        } finally {
            setLoading(false);
        }
    }, [isFollowing, loading, userId]);

    return { isFollowing, toggleFollow, loading };
};
