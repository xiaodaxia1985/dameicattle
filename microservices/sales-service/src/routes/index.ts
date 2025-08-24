import { Router } from 'express';
import salesRouter from './sales';

const router = Router();

// 统一健康检查路由
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'sales-service',
      port: process.env.PORT || 3008
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 销售管理路由 - 直接处理网关转发的请求
router.use('/', salesRouter);

export default router;