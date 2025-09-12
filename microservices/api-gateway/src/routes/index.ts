// 添加缺失的createProxyMiddleware导入
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createLogger } from '@cattle-management/shared';
import express from 'express';
import axios from 'axios';

const logger = createLogger('api-gateway-routes');

// 微服务路由配置 - 完整13个微服务配置
const MICROSERVICE_ROUTES: Record<string, any> = {
  // 认证服务
  '/api/v1/auth': {
    target: process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/auth': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 基地服务
  '/api/v1/base': {
    target: process.env.BASE_SERVICE_URL || 'http://127.0.0.1:3002',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/base': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 牛只服务
  '/api/v1/cattle': {
    target: process.env.CATTLE_SERVICE_URL || 'http://127.0.0.1:3003',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/cattle': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 健康服务
  '/api/v1/health': {
    target: process.env.HEALTH_SERVICE_URL || 'http://127.0.0.1:3004',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/health': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 饲养服务
  '/api/v1/feeding': {
    target: process.env.FEEDING_SERVICE_URL || 'http://127.0.0.1:3005',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/feeding': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 设备服务
  '/api/v1/equipment': {
    target: process.env.EQUIPMENT_SERVICE_URL || 'http://127.0.0.1:3006',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/equipment': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 采购服务
  '/api/v1/procurement': {
    target: process.env.PROCUREMENT_SERVICE_URL || 'http://127.0.0.1:3007',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/procurement': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 销售服务
  '/api/v1/sales': {
    target: process.env.SALES_SERVICE_URL || 'http://127.0.0.1:3008',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/sales': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 物料服务
  '/api/v1/material': {
    target: process.env.MATERIAL_SERVICE_URL || 'http://127.0.0.1:3009',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/material': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 通知服务
  '/api/v1/notification': {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:3010',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/notification': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 文件服务
  '/api/v1/file': {
    target: process.env.FILE_SERVICE_URL || 'http://127.0.0.1:3011',
    changeOrigin: true,
    timeout: 60000, // 文件上传下载超时时间更长
    proxyTimeout: 60000,
    pathRewrite: {
      '^/api/v1/file': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 监控服务
  '/api/v1/monitoring': {
    target: process.env.MONITORING_SERVICE_URL || 'http://127.0.0.1:3012',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/monitoring': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  },
  
  // 新闻服务
  '/api/v1/news': {
    target: process.env.NEWS_SERVICE_URL || 'http://127.0.0.1:3013',
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    pathRewrite: {
      '^/api/v1/news': ''
    },
    xfwd: true,
    followRedirects: true,
    selfHandleResponse: false
  }
};

export const setupRoutes = (app: express.Application) => {
  // 1. 首先注册专门的路由处理程序，确保优先级最高
  
  // 专门处理/api/v1/auth/login的路由
  app.post('/api/v1/auth/login', (req: express.Request, res: express.Response) => {
    logger.info(`检测到访问/api/v1/auth/login，使用axios手动转发`);
    
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001';
    
    axios.post(`${authServiceUrl}/login`, req.body, {
      headers: req.headers,
      timeout: 30000
    })
    .then((response: any) => {
      logger.info(`手动转发成功: ${response.status}`);
      res.status(response.status).json(response.data);
    })
    .catch((error: any) => {
      logger.error(`手动转发/api/v1/auth/login请求失败:`, error);
      res.status(503).json({
        success: false,
        message: '服务暂时不可用',
        error: 'SERVICE_UNAVAILABLE',
        details: error.message
      });
    });
  });
  
  // 2. 重定向根路径的/login请求
  app.post('/login', (req: express.Request, res: express.Response) => {
    logger.warn(`检测到直接访问/login，重定向到/api/v1/auth/login`);
    
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:3001';
    
    axios.post(`${authServiceUrl}/login`, req.body, {
      headers: req.headers,
      timeout: 30000
    })
    .then((response: any) => {
      res.status(response.status).json(response.data);
    })
    .catch((error: any) => {
      logger.error(`转发/login请求失败:`, error);
      res.status(503).json({
        success: false,
        message: '服务暂时不可用',
        error: 'SERVICE_UNAVAILABLE',
        details: error.message
      });
    });
  });
  
  // 3. 最后注册所有微服务的通用代理路由
  Object.entries(MICROSERVICE_ROUTES).forEach(([path, config]) => {
    const proxy = createProxyMiddleware({
      target: config.target,
      changeOrigin: true,
      pathRewrite: config.pathRewrite,
      timeout: config.timeout,
      
      // 日志记录
      onProxyReq: (proxyReq: any, req: any, res: any) => {
        logger.info(`代理请求: ${req.method} ${req.url} -> ${config.target}${proxyReq.path}`);
        
        // 设置必要的头信息
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
    });
    
    app.use(path, proxy);
    logger.info(`路由配置: ${path} -> ${config.target}`);
  });
};