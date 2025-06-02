import Redis from 'ioredis';
import { config } from '../config';

export const redis = new Redis(config.redis.url);

redis.on('error', (error) => {
    console.error('Redis connection error:', error);
});
