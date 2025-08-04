import { Router } from 'express';

const router = Router();

// Basic news routes
router.get('/articles', (req, res) => {
  res.success([], '获取新闻文章成功');
});

router.get('/categories', (req, res) => {
  res.success([], '获取新闻分类成功');
});

export default router;