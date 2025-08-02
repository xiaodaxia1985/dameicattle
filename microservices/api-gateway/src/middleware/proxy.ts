import { createProxyMiddleware } from 'http-proxy-middleware';
import { services } from '../config/services';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('api-gateway');

export const createServiceProxy = (serviceName: string) => {
  const service = services[serviceName];
  
  if (!service) {
    throw new Error(`Service ${serviceName} not found`);
  }

  return createProxyMiddleware({
    target: service.url,
    changeOrigin: true,
    pathRewrite: {
      [`^/api/v1/${serviceName}`]: '/api/v1'
    },
    timeout: service.timeout,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}`, {
        error: err.message,
        url: req.url,
        method: req.method
      });
      
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          message: `Service ${serviceName} is unavailable`,
          error: 'SERVICE_UNAVAILABLE',
          timestamp: new Date().toISOString()
        });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      // 传递请求ID
      const requestId = req.headers['x-request-id'] || Math.random().toString(36).substring(7);
      proxyReq.setHeader('X-Request-ID', requestId);
      
      // 传递用户信息
      if (req.user) {
        proxyReq.setHeader('X-User-Info', JSON.stringify(req.user));
      }
      
      logger.debug(`Proxying request to ${serviceName}`, {
        requestId,
        method: req.method,
        url: req.url,
        target: service.url
      });
    },
    onProxyRes: (proxyRes, req, res) => {
      const requestId = req.headers['x-request-id'];
      logger.debug(`Proxy response from ${serviceName}`, {
        requestId,
        status: proxyRes.statusCode,
        url: req.url
      });
    }
  });
};