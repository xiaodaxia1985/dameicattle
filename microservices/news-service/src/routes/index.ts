import { Router } from 'express';
import newsRouter from './news';

const router = Router();

// Health check route for API Gateway
router.get('/news/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'news-service',
      port: process.env.PORT || 3013
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

router.use('/news', newsRouter);

export default router;