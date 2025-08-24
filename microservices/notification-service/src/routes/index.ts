import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';

const router = Router();
const controller = new NotificationController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'notification-service'
  });
});

// 通知管理路由 - 直接处理网关转发的请求
router.get('/notifications', controller.getAll.bind(controller));
router.post('/notifications', controller.create.bind(controller));

export default router;