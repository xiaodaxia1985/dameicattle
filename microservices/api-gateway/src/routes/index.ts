import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from '../middleware/auth';

const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  base: process.env.BASE_SERVICE_URL || 'http://base-service:3002',
  cattle: process.env.CATTLE_SERVICE_URL || 'http://cattle-service:3003',
  health: process.env.HEALTH_SERVICE_URL || 'http://health-service:3004',
  feeding: process.env.FEEDING_SERVICE_URL || 'http://feeding-service:3005',
  equipment: process.env.EQUIPMENT_SERVICE_URL || 'http://equipment-service:3006',
  procurement: process.env.PROCUREMENT_SERVICE_URL || 'http://procurement-service:3007',
  sales: process.env.SALES_SERVICE_URL || 'http://sales-service:3008',
  material: process.env.MATERIAL_SERVICE_URL || 'http://material-service:3009',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3010',
  file: process.env.FILE_SERVICE_URL || 'http://file-service:3011',
  monitoring: process.env.MONITORING_SERVICE_URL || 'http://monitoring-service:3012'
};

export const setupRoutes = (app: Express) => {
  // 认证服务路由（不需要认证）
  app.use('/api/v1/auth', createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/auth': '/api/v1'
    }
  }));

  // 需要认证的路由
  app.use('/api/v1/base', authMiddleware, createProxyMiddleware({
    target: services.base,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/base': '/api/v1'
    }
  }));

  app.use('/api/v1/cattle', authMiddleware, createProxyMiddleware({
    target: services.cattle,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/cattle': '/api/v1'
    }
  }));

  app.use('/api/v1/health', authMiddleware, createProxyMiddleware({
    target: services.health,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/health': '/api/v1'
    }
  }));

  app.use('/api/v1/feeding', authMiddleware, createProxyMiddleware({
    target: services.feeding,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/feeding': '/api/v1'
    }
  }));

  app.use('/api/v1/equipment', authMiddleware, createProxyMiddleware({
    target: services.equipment,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/equipment': '/api/v1'
    }
  }));

  app.use('/api/v1/procurement', authMiddleware, createProxyMiddleware({
    target: services.procurement,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/procurement': '/api/v1'
    }
  }));

  app.use('/api/v1/sales', authMiddleware, createProxyMiddleware({
    target: services.sales,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/sales': '/api/v1'
    }
  }));

  app.use('/api/v1/material', authMiddleware, createProxyMiddleware({
    target: services.material,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/material': '/api/v1'
    }
  }));

  app.use('/api/v1/notification', authMiddleware, createProxyMiddleware({
    target: services.notification,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/notification': '/api/v1'
    }
  }));

  app.use('/api/v1/file', authMiddleware, createProxyMiddleware({
    target: services.file,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/file': '/api/v1'
    }
  }));

  app.use('/api/v1/monitoring', authMiddleware, createProxyMiddleware({
    target: services.monitoring,
    changeOrigin: true,
    pathRewrite: {
      '^/api/v1/monitoring': '/api/v1'
    }
  }));
};