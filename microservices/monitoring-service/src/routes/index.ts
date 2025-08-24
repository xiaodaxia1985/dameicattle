import { Router } from 'express';
import { MonitoringController } from '../controllers/MonitoringController';

const router = Router();
const controller = new MonitoringController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'monitoring-service'
  });
});

// 监控管理路由 - 直接处理网关转发的请求
router.get('/metrics/system', controller.getAll.bind(controller));
router.get('/metrics/business', controller.getAll.bind(controller));
router.get('/metrics/database', controller.getAll.bind(controller));
router.get('/performance', controller.getAll.bind(controller));
router.get('/logs', controller.getAll.bind(controller));
router.get('/alerts', controller.getAll.bind(controller));
router.post('/alerts', controller.create.bind(controller));

export default router;