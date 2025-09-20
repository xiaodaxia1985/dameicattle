import { Router } from 'express';
import { WeightRecordController } from '../controllers/WeightRecordController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 应用认证中间件
router.use(authenticateToken);

// 体重记录路由
router.get('/', authenticateToken, WeightRecordController.getWeightRecords);
router.get('/:id', authenticateToken, WeightRecordController.getWeightRecordById);
router.post('/', authenticateToken, WeightRecordController.createWeightRecord);
router.put('/:id', authenticateToken, WeightRecordController.updateWeightRecord);
router.delete('/:id', authenticateToken, WeightRecordController.deleteWeightRecord);

// 牛只生长分析路由
router.get('/growth-analysis/:cattle_id', authenticateToken, WeightRecordController.getCattleGrowthAnalysis);

export default router;