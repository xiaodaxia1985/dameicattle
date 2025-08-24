import express from 'express';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import newsRoutes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3013;

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await connectDatabase();
    
    res.json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        database: dbHealthy
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// 直接路由（支持网关代理后的路径）
app.use('/', newsRoutes);

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 启动服务
const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`news-service is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

startServer();

export default app;