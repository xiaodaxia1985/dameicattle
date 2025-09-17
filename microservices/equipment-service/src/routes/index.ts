import { Router } from 'express';
import equipmentRoutes from './equipment';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'equipment-service'
  });
});

// 设备相关详细路由（设备、分类、维护、统计等）
router.use('/', equipmentRoutes);

export default router;