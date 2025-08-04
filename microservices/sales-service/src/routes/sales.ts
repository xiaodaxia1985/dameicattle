import { Router } from 'express';

const router = Router();

// Basic sales routes
router.get('/orders', (req, res) => {
  res.success([], '获取销售订单成功');
});

router.get('/customers', (req, res) => {
  res.success([], '获取客户列表成功');
});

export default router;