import { Router } from 'express';
import basesRouter from './bases';
import barnsRouter from './barns';

const router = Router();

// Health check route for API Gateway
router.get('/base/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'base-service',
      port: process.env.PORT || 3002
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Mount routes
router.use('/base/bases', basesRouter);
router.use('/base/barns', barnsRouter);

export default router;