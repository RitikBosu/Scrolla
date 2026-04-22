import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const publisher  = new Redis(redisUrl, { tls: { rejectUnauthorized: false } });
export const subscriber = new Redis(redisUrl, { tls: { rejectUnauthorized: false } });

publisher.on('error',  (err) => console.error('Redis publisher error (non-fatal):', err.message || err));
subscriber.on('error', (err) => console.error('Redis subscriber error (non-fatal):', err.message || err));

export const CHANNELS = {
  POST_CREATED: 'post:created',
  POST_DELETED: 'post:deleted',
  USER_UPDATED: 'user:updated',
};
