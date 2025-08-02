import express from 'express';
import dotenv from 'dotenv';
import { createLogger, responseWrapper, errorHandler, EventBus } from '@cattle-management/shared';


dotenv.config();

const app = express();
const logger = createLogger('monitoring-service');
const PORT = process.env.PORT || 3012;

// 鍩虹涓棿浠?app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

// 鍋ュ悍妫€鏌?app.get('/health', async (req, res) => {
  try {
    const dbHealthy = true;
    
    res.success({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        database: dbHealthy
      }
    }, 'Health check completed');
  } catch (error) {
    res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
  }
});

// TODO: 娣诲姞API璺敱
// app.use('/api/v1', routes);

// 404澶勭悊
app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

// 閿欒澶勭悊
app.use(errorHandler);

// 鍚姩鏈嶅姟
const startServer = async () => {
  try {

    if (process.env.REDIS_URL) {
      const eventBus = new EventBus(process.env.REDIS_URL);
      await eventBus.connect();
      logger.info('Event bus connected');
    }

    app.listen(PORT, () => {
      logger.info(`monitoring-service is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
