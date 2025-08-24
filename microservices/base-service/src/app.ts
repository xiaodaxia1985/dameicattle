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
const PORT = process.env.PORT || 3002;

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(responseWrapper);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await testConnection();
    
    res.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'base-service',
      checks: {
        database: dbHealthy,
        redis: true
      }
    }, 'Health check completed');
  } catch (error) {
    logger.error('Health check failed:', error);
    res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
  }
});

// 根路由
app.get('/', (req, res) => {
  res.success({
    service: 'base-service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  }, 'Base Service API');
});

// 直接路由（支持网关代理后的路径）
app.use('/', routes);

// 404处理
app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

// 错误处理
app.use(errorHandler);

// 启动服务
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // 初始化Redis连接
    try {
      await initializeRedis();
      logger.info('Redis connection established');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error);
    }

    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      try {
        // 使用 authenticate 替代 sync 来避免修改现有表结构
        await sequelize.authenticate();
        logger.info('Database connection verified');
      } catch (error) {
        logger.warn('Database authentication failed:', error);
        // 继续启动服务，不因数据库验证失败而退出
      }
    }

    app.listen(PORT, () => {
      logger.info(`base-service is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database: ${process.env.DB_NAME}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
  process.exit(0);
});

startServer();

export default app;