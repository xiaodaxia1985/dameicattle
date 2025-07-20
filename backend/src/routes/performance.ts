import { Router } from 'express';
import { PerformanceController } from '@/controllers/PerformanceController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';

const router = Router();

// 所有路由都需要认证
router.use(auth);

// 性能指标相关路由
router.get('/metrics', 
  permission('system:read'), 
  PerformanceController.getPerformanceMetrics
);

router.get('/metrics/history', 
  permission('system:read'), 
  PerformanceController.getPerformanceHistory
);

router.get('/metrics/realtime', 
  permission('system:read'), 
  PerformanceController.getRealTimeMetrics
);

router.get('/metrics/export', 
  permission('system:read'), 
  PerformanceController.exportPerformanceData
);

// 数据库优化相关路由
router.get('/database/indexes', 
  permission('system:read'), 
  PerformanceController.analyzeIndexUsage
);

router.post('/database/optimize-queries', 
  permission('system:write'), 
  PerformanceController.optimizeQueries
);

router.post('/database/create-indexes', 
  permission('system:write'), 
  PerformanceController.createRecommendedIndexes
);

// 缓存相关路由
router.get('/cache/stats', 
  permission('system:read'), 
  PerformanceController.getCacheStats
);

router.post('/cache/stats/reset', 
  permission('system:write'), 
  PerformanceController.resetCacheStats
);

router.get('/cache/keys', 
  permission('system:read'), 
  PerformanceController.getCacheKeys
);

router.post('/cache/flush', 
  permission('system:write'), 
  PerformanceController.flushCache
);

router.post('/cache/warmup', 
  permission('system:write'), 
  PerformanceController.warmupCache
);

router.post('/cache/optimize', 
  permission('system:write'), 
  PerformanceController.optimizeRedisCache
);

router.post('/cache/clear-query', 
  permission('system:write'), 
  PerformanceController.clearQueryCache
);

// 请求性能相关路由
router.get('/requests/stats', 
  permission('system:read'), 
  PerformanceController.getRequestStats
);

router.get('/alerts', 
  permission('system:read'), 
  PerformanceController.getPerformanceAlerts
);

router.post('/alerts/clear', 
  permission('system:write'), 
  PerformanceController.clearPerformanceAlerts
);

// 优化建议路由
router.get('/recommendations', 
  permission('system:read'), 
  PerformanceController.getOptimizationRecommendations
);

// 分布式锁相关路由
router.post('/lock/acquire', 
  permission('system:write'), 
  PerformanceController.acquireLock
);

router.post('/lock/release', 
  permission('system:write'), 
  PerformanceController.releaseLock
);

export default router;