// 在文件顶部添加express导入
import express from 'express';
import { createLogger, responseWrapper, errorHandler } from '@cattle-management/shared';
import { cors } from './middleware/cors';
import { setupRoutes } from './routes/index';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const logger = createLogger('api-gateway');
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors);
app.use(responseWrapper);

// 健康检查
app.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    message: 'API Gateway - 代理模式已启用'
  }, 'API Gateway is healthy');
});

// 微服务状态检查
app.get('/services/status', async (req, res) => {
  const services = [
    { name: 'auth-service', port: 3001 },
    { name: 'base-service', port: 3002 },
    { name: 'cattle-service', port: 3003 },
    { name: 'health-service', port: 3004 },
    { name: 'feeding-service', port: 3005 },
    { name: 'equipment-service', port: 3006 },
    { name: 'procurement-service', port: 3007 },
    { name: 'sales-service', port: 3008 },
    { name: 'material-service', port: 3009 },
    { name: 'notification-service', port: 3010 },
    { name: 'file-service', port: 3011 },
    { name: 'monitoring-service', port: 3012 },
    { name: 'news-service', port: 3013 }
  ];

  const status = await Promise.allSettled(
    services.map(async (service) => {
      try {
        const response = await fetch(`http://localhost:${service.port}/health`, { 
          signal: AbortSignal.timeout(2000) 
        });
        return {
          name: service.name,
          port: service.port,
          status: response.ok ? 'healthy' : 'unhealthy',
          url: `http://localhost:${service.port}`
        };
      } catch {
        return {
          name: service.name,
          port: service.port,
          status: 'offline',
          url: `http://localhost:${service.port}`
        };
      }
    })
  );

  res.success({
    services: status.map(s => s.status === 'fulfilled' ? s.value : s.reason),
    timestamp: new Date().toISOString()
  }, 'Services status check completed');
});

// 重新启用代理路由配置
setupRoutes(app);

// 404处理
app.use('*', (req, res) => {
  res.error('请求的资源不存在', 404, 'NOT_FOUND');
});

// 错误处理
app.use(errorHandler);

// 启动服务
app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('代理模式已启用，前端请求将通过API网关转发');
});

export default app;