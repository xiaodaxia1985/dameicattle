import { Router } from 'express';
import { BarnController } from '../controllers/BarnController';
import { authMiddleware } from '../middleware/auth';
import { dataPermissionMiddleware } from '../middleware/dataPermission';

const router = Router();

// 所有路由都需要认证和数据权限检查
router.use(authMiddleware);
router.use(dataPermissionMiddleware);

// GET /api/v1/barns - 获取牛棚列表
router.get('/', (req, res) => BarnController.getBarns(req as any, res));

// GET /api/v1/barns/statistics - 获取牛棚统计信息
router.get('/statistics', (req, res) => BarnController.getBarnStatistics(req as any, res));

// GET /api/v1/barns/options - 获取牛棚选项（用于下拉选择）
router.get('/options', (req, res) => BarnController.getBarnOptions(req as any, res));

// GET /api/v1/barns/:id - 获取牛棚详情
router.get('/:id', (req, res) => BarnController.getBarn(req as any, res));

// POST /api/v1/barns - 创建牛棚
router.post('/', (req, res) => BarnController.createBarn(req as any, res));

// PUT /api/v1/barns/:id - 更新牛棚
router.put('/:id', (req, res) => BarnController.updateBarn(req as any, res));

// DELETE /api/v1/barns/:id - 删除牛棚
router.delete('/:id', (req, res) => BarnController.deleteBarn(req as any, res));

export default router;