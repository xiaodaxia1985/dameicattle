import { Router } from 'express';
import notificationsRouter from './notifications';

const router = Router();

// Health check route for API Gateway
router.get('/notification/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'notification-service',
      port: process.env.PORT || 3010
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

router.use('/notification', notificationsRouter);

export default router;