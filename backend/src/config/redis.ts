import { createClient } from 'redis';
import { logger } from '@/utils/logger';

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_PASSWORD,
  REDIS_DB = '0',
} = process.env;

export const redisClient = createClient({
  socket: {
    host: REDIS_HOST,
    port: parseInt(REDIS_PORT, 10),
    connectTimeout: 10000,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        logger.error('Redis connection failed after 3 retries');
        return false;
      }
      return Math.min(retries * 50, 500);
    }
  },
  password: REDIS_PASSWORD || undefined,
  database: parseInt(REDIS_DB, 10),
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
});

export default redisClient;