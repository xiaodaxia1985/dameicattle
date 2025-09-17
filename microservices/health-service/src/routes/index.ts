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

// 统计与辅助路由
router.get('/statistics', controller.getAll.bind(controller));
// 前端使用的预警与趋势路由占位，避免404
router.get('/alerts', (req, res) => {
  res.json({ alerts: [], total: 0, critical_count: 0, high_count: 0, medium_count: 0, low_count: 0 })
});
router.get('/trend', (req, res) => {
  res.json({ trends: [] })
});

export default router;