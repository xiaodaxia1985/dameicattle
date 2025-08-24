import { Router } from 'express';
import { EquipmentController } from '../controllers/EquipmentController';

const router = Router();
const controller = new EquipmentController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'equipment-service'
  });
});

// 设备管理路由 - 直接处理网关转发的请求
router.get('/equipment', controller.getAll.bind(controller));
router.post('/equipment', controller.create.bind(controller));

// 维护记录路由
router.get('/maintenance', controller.getAll.bind(controller));
router.post('/maintenance', controller.create.bind(controller));

// 统计路由
router.get('/statistics', controller.getAll.bind(controller));

export default router;