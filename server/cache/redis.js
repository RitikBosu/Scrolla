import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  retryStrategy: (times) => Math.min(times * 100, 3000),
  enableOfflineQueue: false,
  lazyConnect: true,
  tls: {
    rejectUnauthorized: false
  }
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('⚠️ Redis error (non-fatal):', err.message || err));

try {
  await redis.connect();
} catch (e) {
  console.warn('Redis unavailable at startup — caching disabled, app continues normally');
}

export default redis;
