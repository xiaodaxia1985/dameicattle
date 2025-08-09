import { Router } from 'express';
import monitoringRouter from './monitoring';

const router = Router();

// Health check route for API Gateway
router.get('/monitoring/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'monitoring-service',
      port: process.env.PORT || 3012
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

router.use('/monitoring', monitoringRouter);

export default router;