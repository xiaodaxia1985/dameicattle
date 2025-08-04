import { Router } from 'express';

const router = Router();

// Basic file routes
router.get('/', (req, res) => {
  res.success([], '获取文件列表成功');
});

router.post('/upload', (req, res) => {
  res.success({ id: 1, filename: 'test.jpg', url: '/uploads/test.jpg' }, '文件上传成功', 201);
});

export default router;