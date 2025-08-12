import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// System metrics routes
router.get('/metrics/system', MonitoringController.getSystemMetrics);
router.get('/metrics/business', MonitoringController.getBusinessMetrics);
router.get('/metrics/database', MonitoringController.getDatabaseMetrics);
router.get('/metrics/redis', MonitoringController.getRedisMetrics);

// Performance monitoring routes
router.get('/performance', MonitoringController.getPerformanceMetrics);
router.get('/performance/history', MonitoringController.getPerformanceHistory);

// Service health monitoring routes
router.get('/health/services', MonitoringController.getServiceHealth);
router.get('/health/dependencies', MonitoringController.getDependencyHealth);

// Log management routes
router.get('/logs', MonitoringController.getLogs);
router.get('/logs/errors', MonitoringController.getErrorLogs);
router.get('/logs/access', MonitoringController.getAccessLogs);

// Alert management routes
router.get('/alerts', MonitoringController.getAlerts);
router.post('/alerts', MonitoringController.createAlert);
router.put('/alerts/:id', MonitoringController.updateAlert);
router.delete('/alerts/:id', MonitoringController.deleteAlert);
router.post('/alerts/:id/acknowledge', MonitoringController.acknowledgeAlert);

// Dashboard data routes
router.get('/dashboard/overview', MonitoringController.getDashboardOverview);
router.get('/dashboard/charts', MonitoringController.getDashboardCharts);

// Report generation routes
router.get('/reports/system', MonitoringController.generateSystemReport);
router.get('/reports/performance', MonitoringController.generatePerformanceReport);
router.get('/reports/business', MonitoringController.generateBusinessReport);

export default router;