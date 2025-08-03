import express from 'express';
import dotenv from 'dotenv';
import { createLogger, responseWrapper, errorHandler, EventBus } from '@cattle-management/shared';
import { connectDatabase } from './config/database';
import newsRoutes from './routes';

dotenv.config();

const app = express();
const logger = createLogger('news-service');
const PORT = process.env.PORT || 3013;

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await connectDatabase();
    
    res.success({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        database: dbHealthy
      }
    }, 'Health check completed');
  } catch (error) {
    res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
  }
});

// API路由
app.use('/api/v1', newsRoutes);

// 404处理
app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

// 错误处理
app.use(errorHandler);

// 启动服务
const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    if (process.env.REDIS_URL) {
      const eventBus = new EventBus(process.env.REDIS_URL);
      await eventBus.connect();
      logger.info('Event bus connected');
    }

    app.listen(PORT, () => {
      logger.info(`news-service is running on port ${PORT}`);
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