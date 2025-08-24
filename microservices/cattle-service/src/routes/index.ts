import { Router } from 'express';
import cattleRouter from './cattle';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cattle-service'
  });
});

// 牛只管理路由 - 直接处理网关转发的请求（网关已重写路径）
router.use('/cattle', cattleRouter);

// 错误处理
router.use((error: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: error.message });
});

export default router;