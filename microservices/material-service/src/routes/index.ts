import { Router } from 'express';
import materialsRoutes from './materials';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'material-service'
  });
});

// 物料、分类、供应商、库存等详细路由
router.use('/', materialsRoutes);

export default router;