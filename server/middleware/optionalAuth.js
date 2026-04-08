import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Optional authentication middleware.
 * If a valid Bearer token is present, populates req.user.
 * If no token or invalid token, continues without req.user (no rejection).
 * Use this on routes that behave differently for logged-in vs anonymous users.
 */
export const optionalAuth = async (req, res, next) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
        }
    } catch {
        // Token invalid or expired — continue as unauthenticated
        req.user = null;
    }
    next();
};
