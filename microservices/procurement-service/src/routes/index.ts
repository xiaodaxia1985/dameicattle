import { Router } from 'express';
import { ProcurementController } from '../controllers/ProcurementController';

const router = Router();
const controller = new ProcurementController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'procurement-service'
  });
});

// 采购管理路由 - 直接处理网关转发的请求
router.get('/orders', controller.getAll.bind(controller));
router.post('/orders', controller.create.bind(controller));

// 供应商管理路由
router.get('/suppliers', controller.getAll.bind(controller));
router.post('/suppliers', controller.create.bind(controller));

// 统计路由
router.get('/statistics', controller.getAll.bind(controller));

export default router;