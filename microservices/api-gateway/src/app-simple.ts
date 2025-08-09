import express from 'express';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 注释掉这行，因为代理中间件需要处理原始请求体
// app.use(express.json());

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
    },
    {
        path: '/api/v1/equipment',
        target: process.env.EQUIPMENT_SERVICE_URL || 'http://localhost:3006'
    },
    {
        path: '/api/v1/procurement',
        target: process.env.PROCUREMENT_SERVICE_URL || 'http://localhost:3007'
    },
    {
        path: '/api/v1/sales',
        target: process.env.SALES_SERVICE_URL || 'http://localhost:3008'
    },
    {
        path: '/api/v1/material',
        target: process.env.MATERIAL_SERVICE_URL || 'http://localhost:3009'
    },
    {
        path: '/api/v1/notification',
        target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010'
    },
    {
        path: '/api/v1/file',
        target: process.env.FILE_SERVICE_URL || 'http://localhost:3011'
    },
    {
        path: '/api/v1/monitoring',
        target: process.env.MONITORING_SERVICE_URL || 'http://localhost:3012'
    },
    {
        path: '/api/v1/news',
        target: process.env.NEWS_SERVICE_URL || 'http://localhost:3013'
    }
];

// 设置代理路由
routes.forEach(route => {
    const proxy = createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        // 不重写路径，让微服务接收完整的路径
        // pathRewrite: {
        //     [`^${route.path}`]: ''
        // },
        onError: (err, req, res) => {
            console.error(`Proxy error for ${route.path}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({
                    success: false,
                    message: 'Service unavailable',
                    error: 'SERVICE_UNAVAILABLE'
                });
            }
        },
        onProxyReq: (proxyReq, req, res) => {
            console.log(`Proxying ${req.method} ${req.url} to ${route.target}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`Response from ${route.target}: ${proxyRes.statusCode}`);
        },
        timeout: 30000, // 增加超时时间到30秒
        proxyTimeout: 30000,
        // 添加更多配置来处理连接问题
        secure: false,
        ws: false,
        followRedirects: false
    });

    app.use(route.path, proxy);
    console.log(`Route configured: ${route.path} -> ${route.target}`);
});

app.listen(PORT, () => {
    console.log(`🚀 API Gateway is running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;