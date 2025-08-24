import { Router } from 'express';
import { NewsController } from '../controllers/NewsController';

const router = Router();
const controller = new NewsController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'news-service'
  });
});

// 新闻管理路由 - 直接处理网关转发的请求
router.get('/articles', controller.getAll.bind(controller));
router.post('/articles', controller.create.bind(controller));
router.get('/categories', controller.getAll.bind(controller));
router.post('/categories', controller.create.bind(controller));

export default router;