import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// 认证相关路由
router.use('/auth', authRoutes);

export default router;