import { Router } from 'express';

const router = Router();

// Basic monitoring routes
router.get('/metrics', (req, res) => {
  res.success({
    cpu_usage: 45.2,
    memory_usage: 67.8,
    disk_usage: 23.1,
    uptime: process.uptime()
  }, '获取系统指标成功');
});

router.get('/performance', (req, res) => {
  res.success({
    response_time: 120,
    throughput: 1500,
    error_rate: 0.02
  }, '获取性能指标成功');
});

export default router;