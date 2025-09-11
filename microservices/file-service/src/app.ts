import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { responseWrapper } from './middleware/responseWrapper';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3011;

// CORS配置 - 允许前端直连
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        filesystem: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// 直接路由（支持网关代理后的路径）
app.use('/', routes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 错误处理
app.use(errorHandler);

// 启动服务
const startServer = async () => {
  try {
    app.listen(PORT, () => {
      logger.info(`file-service is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();

export default app;