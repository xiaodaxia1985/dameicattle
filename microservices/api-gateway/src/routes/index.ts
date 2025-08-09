import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('api-gateway-routes');

// 微服务路由配置
const MICROSERVICE_ROUTES = {
  // 认证服务
  '/api/v1/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 基地服务
  '/api/v1/base': {
    target: process.env.BASE_SERVICE_URL || 'http://base-service:3002',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 牛只服务
  '/api/v1/cattle': {
    target: process.env.CATTLE_SERVICE_URL || 'http://cattle-service:3003',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 健康服务
  '/api/v1/health': {
    target: process.env.HEALTH_SERVICE_URL || 'http://health-service:3004',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 饲养服务
  '/api/v1/feeding': {
    target: process.env.FEEDING_SERVICE_URL || 'http://feeding-service:3005',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 设备服务
  '/api/v1/equipment': {
    target: process.env.EQUIPMENT_SERVICE_URL || 'http://equipment-service:3006',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 采购服务
  '/api/v1/procurement': {
    target: process.env.PROCUREMENT_SERVICE_URL || 'http://procurement-service:3007',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 销售服务
  '/api/v1/sales': {
    target: process.env.SALES_SERVICE_URL || 'http://sales-service:3008',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 物料服务
  '/api/v1/material': {
    target: process.env.MATERIAL_SERVICE_URL || 'http://material-service:3009',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 通知服务
  '/api/v1/notification': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3010',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 文件服务
  '/api/v1/file': {
    target: process.env.FILE_SERVICE_URL || 'http://file-service:3011',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 监控服务
  '/api/v1/monitoring': {
    target: process.env.MONITORING_SERVICE_URL || 'http://monitoring-service:3012',
    changeOrigin: true,
    timeout: 10000
  },
  
  // 新闻服务
  '/api/v1/news': {
    target: process.env.NEWS_SERVICE_URL || 'http://news-service:3013',
    changeOrigin: true,
    timeout: 10000
  }
};

export const setupRoutes = (app: express.Application) => {
  // 设置代理路由
  Object.entries(MICROSERVICE_ROUTES).forEach(([path, config]) => {
    const proxy = createProxyMiddleware({
      target: config.target,
      changeOrigin: config.changeOrigin,
      timeout: config.timeout,
      
      // 请求日志
      onProxyReq: (proxyReq, req, res) => {
        logger.debug(`代理请求: ${req.method} ${req.url} -> ${config.target}`);
      },
      
      // 响应日志
      onProxyRes: (proxyRes, req, res) => {
        logger.debug(`代理响应: ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
      },
      
      // 错误处理
      onError: (err, req, res) => {
        logger.error(`代理错误: ${req.method} ${req.url}`, err);
        res.status(503).json({
          success: false,
          message: '服务暂时不可用',
          error: 'SERVICE_UNAVAILABLE'
        });
      },
      
      // 路径重写（如果需要）
      pathRewrite: path === '/api/v1' ? {} : {
        [`^${path}`]: ''
      }
    });
    
    app.use(path, proxy);
    logger.info(`路由配置: ${path} -> ${config.target}`);
  });
};