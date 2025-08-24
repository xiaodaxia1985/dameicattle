import { Router } from 'express';
import { FeedingController } from '../controllers/FeedingController';
import feedingRoutes from './feeding';
import patrolRoutes from './patrol';

const router = Router();
const controller = new FeedingController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'feeding-service'
  });
});

// 饲养管理路由 - 直接处理网关转发的请求
router.use('/plans', feedingRoutes);
router.use('/formulas', feedingRoutes);
router.use('/records', feedingRoutes);
router.use('/patrol', patrolRoutes);
router.get('/statistics', controller.getAll.bind(controller));

export default router;