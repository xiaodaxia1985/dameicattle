import { Router } from 'express';
import { MaterialController } from '../controllers/MaterialController';

const router = Router();
const controller = new MaterialController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'material-service'
  });
});

// 物料管理路由 - 直接处理网关转发的请求
router.get('/materials', controller.getAll.bind(controller));
router.post('/materials', controller.create.bind(controller));

// 库存管理路由
router.get('/inventory', controller.getAll.bind(controller));
router.post('/inventory/in', controller.create.bind(controller));
router.post('/inventory/out', controller.create.bind(controller));

// 预警管理路由
router.get('/alerts', controller.getAll.bind(controller));

// 统计路由
router.get('/statistics', controller.getAll.bind(controller));

export default router;