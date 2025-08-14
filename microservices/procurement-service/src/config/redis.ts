import Redis from 'ioredis'
import { logger } from '../utils/logger'

let redisClient: Redis | null = null

export const initializeRedis = async (): Promise<Redis> => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    })

    redisClient.on('connect', () => {
      logger.info('Redis连接成功')
    })

    redisClient.on('error', (error) => {
      logger.error('Redis连接错误:', error)
    })

    redisClient.on('close', () => {
      logger.warn('Redis连接已关闭')
    })

    await redisClient.connect()
    return redisClient
  } catch (error) {
    logger.error('Redis初始化失败:', error)
    throw error
  }
}

export const getRedisClient = (): Redis | null => {
  return redisClient
}

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    logger.info('Redis连接已关闭')
  }
}