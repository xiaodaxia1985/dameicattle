import express from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { createLogger } from '@cattle-management/shared';
import { IncomingMessage, ServerResponse } from 'http';

const logger = createLogger('api-gateway-routes');

// 微服务路由配置
const MICROSERVICE_ROUTES: Record<string, any> = {
  // 认证服务
  '/api/v1/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/auth': ''
    }
  },
  
  // 基地服务
  '/api/v1/base': {
    target: process.env.BASE_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/base': ''
    }
  },
  
  // 牛只服务
  '/api/v1/cattle': {
    target: process.env.CATTLE_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/cattle': ''
    }
  },
  
  // 健康服务
  '/api/v1/health-service': {
    target: process.env.HEALTH_SERVICE_URL || 'http://localhost:3004',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/health-service': ''
    }
  },
  
  // 饲养服务
  '/api/v1/feeding': {
    target: process.env.FEEDING_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/feeding': ''
    }
  },
  
  // 设备服务
  '/api/v1/equipment': {
    target: process.env.EQUIPMENT_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/equipment': ''
    }
  },
  
  // 采购服务
  '/api/v1/procurement': {
    target: process.env.PROCUREMENT_SERVICE_URL || 'http://localhost:3007',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/procurement': ''
    }
  },
  
  // 销售服务
  '/api/v1/sales': {
    target: process.env.SALES_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/sales': ''
    }
  },
  
  // 物料服务
  '/api/v1/material': {
    target: process.env.MATERIAL_SERVICE_URL || 'http://localhost:3009',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/material': ''
    }
  },
  
  // 通知服务
  '/api/v1/notification': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/notification': ''
    }
  },
  
  // 文件服务
  '/api/v1/file': {
    target: process.env.FILE_SERVICE_URL || 'http://localhost:3011',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/file': ''
    }
  },
  
  // 监控服务
  '/api/v1/monitoring': {
    target: process.env.MONITORING_SERVICE_URL || 'http://localhost:3012',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/monitoring': ''
    }
  },
  
  // 新闻服务
  '/api/v1/news': {
    target: process.env.NEWS_SERVICE_URL || 'http://localhost:3013',
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: {
      '^/api/v1/news': ''
    }
  }
};

export const setupRoutes = (app: express.Application) => {
  // 设置代理路由
  Object.entries(MICROSERVICE_ROUTES).forEach(([path, config]) => {
    const proxy = createProxyMiddleware({
      target: config.target,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      pathRewrite: config.pathRewrite,
      
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        logger.info(`代理请求: ${req.method} ${req.url} -> ${config.target}${proxyReq.path}`);
        proxyReq.setHeader('X-Forwarded-For', req.ip || 'unknown');
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol || 'http');
        proxyReq.setHeader('X-Forwarded-Host', req.get('host') || 'localhost');
      },
      
      onProxyRes: (proxyRes: any, req: any, res: any) => {
        logger.info(`代理响应: ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
      },
      
      onError: (err: any, req: any, res: any) => {
        logger.error(`代理错误: ${req.method} ${req.url}`, {
          error: err.message,
          code: err.code,
          target: config.target
        });
        
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: '服务暂时不可用',
            error: 'SERVICE_UNAVAILABLE',
            details: err.message
          });
        }
      }
    } as any);
    
    app.use(path, proxy);
    logger.info(`路由配置: ${path} -> ${config.target}`);
  });
};