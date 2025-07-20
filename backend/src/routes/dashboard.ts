import { Router } from 'express';
import { DashboardController } from '@/controllers/DashboardController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authMiddleware);

// Get key business indicators
router.get('/indicators', DashboardController.getKeyIndicators);

// Get trend analysis
router.get('/trends', DashboardController.getTrendAnalysis);

// Get real-time statistics
router.get('/realtime', DashboardController.getRealTimeStats);

// Get pending tasks
router.get('/tasks', DashboardController.getPendingTasks);

// Get comparative analysis
router.get('/compare', DashboardController.getComparativeAnalysis);

export default router;