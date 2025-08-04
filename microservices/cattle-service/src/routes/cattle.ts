import { Router } from 'express';
import { CattleController } from '../controllers/CattleController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication and data permission middleware to all routes
router.use(authMiddleware);
router.use(dataPermissionMiddleware);

// Cattle routes
router.get('/', CattleController.getCattleList);
router.get('/statistics', CattleController.getCattleStatistics);
router.get('/scan/:earTag', CattleController.getCattleByEarTag);
router.get('/:id', CattleController.getCattleById);
router.post('/', CattleController.createCattle);
router.put('/:id', CattleController.updateCattle);
router.delete('/:id', CattleController.deleteCattle);

export default router;