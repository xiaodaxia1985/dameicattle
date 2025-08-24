import { Router } from 'express';
import { FileController } from '../controllers/FileController';

const router = Router();
const controller = new FileController();

// 健康检查
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'file-service'
  });
});

// 文件管理路由 - 直接处理网关转发的请求
router.post('/upload', controller.create.bind(controller));
router.post('/upload/batch', controller.create.bind(controller));
router.get('/files', controller.getAll.bind(controller));
router.get('/files/:id/download', controller.getAll.bind(controller));

export default router;