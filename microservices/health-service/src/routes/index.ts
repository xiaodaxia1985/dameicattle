import { Router } from 'express';
import healthRouter from './health';

const router = Router();

// Health check route for API Gateway (different from business health routes)
router.get('/health/status', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'health-service',
      port: process.env.PORT || 3004
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
});

// Mount routes
router.use('/health', healthRouter);

export default router;