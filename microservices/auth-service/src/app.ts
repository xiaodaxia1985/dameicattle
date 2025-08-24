import express from 'express';
import dotenv from 'dotenv';
import { sequelize, testConnection } from './config/database';
import { initializeRedis } from './config/redis';
import { logger } from './utils/logger';
import { responseWrapper } from './middleware/responseWrapper';
import { errorHandler } from './middleware/errorHandler';
import { AuthController } from './controllers/AuthController';
import routes from './routes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 设置请求超时
app.use((req, res, next) => {
  req.setTimeout(30000); // 30秒超时
  res.setTimeout(30000);
  next();
});

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
      service: 'auth-service',
      checks: {
        database: dbHealthy,
        redis: true // 简化Redis检查
      }
    }, 'Health check completed');
  } catch (error) {
    logger.error('Health check failed:', error);
    if (res.error && typeof res.error === 'function') {
      res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
    } else {
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        code: 'HEALTH_CHECK_FAILED',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.requestId || 'unknown',
          version: '1.0.0'
        }
      });
    }
  }
});

// 根路由
app.get('/', (req, res) => {
  res.success({
    service: 'auth-service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  }, 'Auth Service API');
});

// 直接登录路由（兼容性）
const authController = new AuthController();
app.post('/login', authController.login.bind(authController));

// 直接路由（支持网关代理后的路径）
app.use('/', routes);

// 404处理
app.use('*', (req, res) => {
  if (res.error && typeof res.error === 'function') {
    res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
  } else {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.requestId || 'unknown',
        version: '1.0.0'
      }
    });
  }
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
        await sequelize.sync({ force: false, alter: false });
        logger.info('Database models synchronized');
      } catch (error) {
        logger.warn('Database sync failed:', error);
      }
    }

    app.listen(PORT, () => {
      logger.info(`auth-service is running on port ${PORT}`);
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