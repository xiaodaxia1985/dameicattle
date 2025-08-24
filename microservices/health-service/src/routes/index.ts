import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const controller = new HealthController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'health-service'
  });
});

// 健康管理路由 - 直接处理网关转发的请求
router.get('/records', controller.getAll.bind(controller));
router.post('/records', controller.create.bind(controller));
// 移除了不存在的方法



// 疫苗管理路由
router.get('/vaccines', controller.getAll.bind(controller));
router.post('/vaccines', controller.create.bind(controller));

// 疾病管理路由
router.get('/diseases', controller.getAll.bind(controller));
router.post('/diseases', controller.create.bind(controller));

// 统计路由
router.get('/statistics', controller.getAll.bind(controller));

export default router;