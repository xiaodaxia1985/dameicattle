import { Router } from 'express';

const router = Router();

// Basic equipment routes
router.get('/', (req, res) => {
  res.success([], '获取设备列表成功');
});

router.get('/categories', (req, res) => {
  res.success([], '获取设备分类成功');
});

router.get('/maintenance', (req, res) => {
  res.success([], '获取维护记录成功');
});

export default router;