import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service'
  });
});

// 认证路由 - 匹配网关转发的路径
router.use('/auth', authRoutes);

// 根路径兼容
router.use('/', authRoutes);

export default router;