import Redis from 'redis';
import { logger } from '../utils/logger';

const {
  REDIS_HOST = 'localhost',
  REDIS_PORT = '6379',
  REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`,
} = process.env;

export const redisClient = Redis.createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis connected successfully');
});

export const initializeRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};