import { Router } from 'express';
import cattleRouter from './cattle';

const router = Router();

// Health check route for API Gateway
router.get('/cattle/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'cattle-service',
      port: process.env.PORT || 3003
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Mount routes
router.use('/cattle', cattleRouter);

export default router;