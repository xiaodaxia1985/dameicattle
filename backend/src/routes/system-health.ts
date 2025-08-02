import { Router, Request, Response } from 'express';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * GET /api/v1/system-health
 * Public system health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthStatus = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(healthStatus);
    
  } catch (error) {
    logger.error('System health check error:', error);
    
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }
});

export default router;