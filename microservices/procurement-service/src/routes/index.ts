import { Router } from 'express';
import procurementRouter from './procurement';

const router = Router();

// Health check route for API Gateway
router.get('/procurement/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'procurement-service',
      port: process.env.PORT || 3007
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

router.use('/procurement', procurementRouter);

export default router;