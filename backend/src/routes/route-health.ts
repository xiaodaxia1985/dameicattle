import { Router, Request, Response } from 'express';
import { routeRegistry } from '@/config/RouteRegistry';
import { requirePermission } from '@/middleware/auth';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * Get all registered routes
 */
router.get('/routes', requirePermission('system:read'), async (req: Request, res: Response) => {
  try {
    const routes = routeRegistry.getRouteMap();
    
    res.json({
      success: true,
      data: {
        routes,
        total: Object.keys(routes).length
      }
    });
  } catch (error) {
    logger.error('Error getting routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get routes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate all routes for conflicts and issues
 */
router.get('/routes/validate', requirePermission('system:read'), async (req: Request, res: Response) => {
  try {
    const validation = routeRegistry.validateRoutes();
    
    res.json({
      success: validation.success,
      data: validation
    });
  } catch (error) {
    logger.error('Error validating routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate routes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Check health of all routes
 */
router.get('/routes/health', requirePermission('system:read'), async (req: Request, res: Response) => {
  try {
    const healthStatuses = await routeRegistry.checkRouteHealth();
    
    const summary = {
      total: healthStatuses.length,
      healthy: healthStatuses.filter(s => s.status === 'healthy').length,
      warning: healthStatuses.filter(s => s.status === 'warning').length,
      error: healthStatuses.filter(s => s.status === 'error').length
    };
    
    res.json({
      success: true,
      data: {
        summary,
        routes: healthStatuses
      }
    });
  } catch (error) {
    logger.error('Error checking route health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check route health',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get route statistics
 */
router.get('/routes/statistics', requirePermission('system:read'), async (req: Request, res: Response) => {
  try {
    const statistics = routeRegistry.getStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting route statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get route statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Generate API documentation from routes
 */
router.get('/routes/docs', requirePermission('system:read'), async (req: Request, res: Response) => {
  try {
    const docs = routeRegistry.generateApiDocs();
    
    res.json({
      success: true,
      data: docs
    });
  } catch (error) {
    logger.error('Error generating API docs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API documentation',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Rescan route files
 */
router.post('/routes/rescan', requirePermission('system:write'), async (req: Request, res: Response) => {
  try {
    routeRegistry.clear();
    await routeRegistry.scanRouteFiles();
    
    const validation = routeRegistry.validateRoutes();
    
    res.json({
      success: true,
      data: {
        message: 'Routes rescanned successfully',
        validation
      }
    });
  } catch (error) {
    logger.error('Error rescanning routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rescan routes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;