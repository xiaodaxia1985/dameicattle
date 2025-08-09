import { Router } from 'express';
import equipmentRouter from './equipment';

const router = Router();

// Health check route for API Gateway
router.get('/equipment/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'equipment-service',
      port: process.env.PORT || 3006
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

router.use('/equipment', equipmentRouter);

export default router;