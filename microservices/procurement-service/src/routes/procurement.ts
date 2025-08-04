import { Router } from 'express';

const router = Router();

// Basic procurement routes
router.get('/orders', (req, res) => {
  res.success([], '获取采购订单成功');
});

router.get('/suppliers', (req, res) => {
  res.success([], '获取供应商列表成功');
});

export default router;