import { Router } from 'express';
import procurementRoutes from './procurement';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'procurement-service'
  });
});

// 采购管理详细路由（供应商、订单、统计、趋势等）
router.use('/', procurementRoutes);

export default router;