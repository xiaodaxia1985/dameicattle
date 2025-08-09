import express from 'express';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'api-gateway',
    port: PORT
  });
});

// 微服务路由配置
const routes = [
  {
    path: '/api/v1/auth',
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
  },
  {
    path: '/api/v1/base',
    target: process.env.BASE_SERVICE_URL || 'http://localhost:3002'
  },
  {
    path: '/api/v1/cattle',
    target: process.env.CATTLE_SERVICE_URL || 'http://localhost:3003'
  },
  {
    path: '/api/v1/health',
    target: process.env.HEALTH_SERVICE_URL || 'http://localhost:3004'
  },
  {
    path: '/api/v1/feeding',
    target: process.env.FEEDING_SERVICE_URL || 'http://localhost:3005'
  }
];

// 设置代理路由
routes.forEach(route => {
  const proxy = createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    pathRewrite: {
      [`^${route.path}`]: ''
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${route.path}:`, err.message);
      res.status(503).json({
        success: false,
        message: 'Service unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }
  });
  
  app.use(route.path, proxy);
  console.log(`Route configured: ${route.path} -> ${route.target}`);
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;