import express from 'express';
import dotenv from 'dotenv';
import { sequelize, testConnection } from './config/database';
import { initializeRedis } from './config/redis';
import { logger } from './utils/logger';
import { responseWrapper } from './middleware/responseWrapper';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3010;

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    res.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        redis: true // notification service主要依赖Redis
      }
    }, 'Health check completed');
  } catch (error) {
    res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
  }
});

// Mount routes
app.use('/api/v1', routes);

// 404处理
app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

// 错误处理
app.use(errorHandler);

// 启动服务
const startServer = async () => {
  try {
    // 初始化Redis连接
    try {
      await initializeRedis();
      logger.info('Redis connection established');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error);
    }

    app.listen(PORT, () => {
      logger.info(`notification-service is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;