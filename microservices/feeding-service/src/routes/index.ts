import { Router } from 'express';
import feedingRouter from './feeding';

const router = Router();

// Health check route for API Gateway
router.get('/feeding/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'feeding-service',
      port: process.env.PORT || 3005
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: (error as Error).message
    });
  }
});

// Mount routes
router.use('/feeding', feedingRouter);

export default router;