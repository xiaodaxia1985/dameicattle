import { Router } from 'express';

const router = Router();

// Basic notification routes
router.get('/', (req, res) => {
  res.success([], '获取通知列表成功');
});

router.post('/', (req, res) => {
  res.success({ id: 1, message: '通知创建成功' }, '创建通知成功', 201);
});

export default router;