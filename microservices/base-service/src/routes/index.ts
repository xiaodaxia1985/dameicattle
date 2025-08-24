import { Router } from 'express';
import basesRouter from './bases';
import barnsRouter from './barns';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'base-service'
  });
});

// 基地管理路由 - 直接处理网关转发的请求（网关已重写路径）
router.use('/bases', basesRouter);
router.use('/barns', barnsRouter);

// 错误处理
router.use((error: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: error.message });
});

export default router;