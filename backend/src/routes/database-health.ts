import { Router, Request, Response } from 'express';
import { databaseManager } from '@/config/DatabaseManager';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * GET /api/v1/database-health
 * Get comprehensive database health status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthResult = await databaseManager.performHealthCheck();
    const connectionStatus = databaseManager.getConnectionStatus();
    const poolStatus = databaseManager.getPoolStatus();

    const response = {
      success: true,
      data: {
        status: healthResult.status,
        timestamp: healthResult.timestamp,
        responseTime: healthResult.responseTime,
        connection: {
          isConnected: connectionStatus.isConnected,
          lastConnected: connectionStatus.lastConnected,
          connectionAttempts: connectionStatus.connectionAttempts,
          lastError: connectionStatus.lastError
        },
        pool: {
          total: poolStatus.total,
          active: poolStatus.active,
          idle: poolStatus.idle,
          waiting: poolStatus.waiting
        },
        details: healthResult.details
      }
    };

    // Set appropriate HTTP status based on health
    const statusCode = healthResult.status === 'healthy' ? 200 : 
                      healthResult.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(response);

  } catch (error) {
    logger.error('Database health check endpoint error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;