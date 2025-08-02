import express from 'express';
import dotenv from 'dotenv';
import { createLogger, responseWrapper, errorHandler } from '@cattle-management/shared';
import { setupRoutes } from './routes';
import { rateLimiter } from './middleware/rateLimiter';
import { cors } from './middleware/cors';

dotenv.config();

const app = express();
const logger = createLogger('api-gateway');
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors);
app.use(rateLimiter);
app.use(responseWrapper);

// 健康检查
app.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  }, 'API Gateway is healthy');
});

// 设置路由
setupRoutes(app);

// 404处理
app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

// 错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;