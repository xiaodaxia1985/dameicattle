import { Router } from 'express';
import filesRouter from './files';

const router = Router();

// Health check route for API Gateway
router.get('/file/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'file-service',
      port: process.env.PORT || 3011
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

router.use('/file', filesRouter);

export default router;