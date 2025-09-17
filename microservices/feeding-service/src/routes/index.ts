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
// 将子路由挂载到根，避免重复前缀导致的 /records/records 404
router.use('/', feedingRoutes);
router.use('/patrol', patrolRoutes);

export default router;