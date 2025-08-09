import { Router } from 'express';
import materialsRouter from './materials';

const router = Router();

// Health check route for API Gateway
router.get('/material/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'material-service',
      port: process.env.PORT || 3009
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Mount routes
router.use('/material', materialsRouter);

export default router;