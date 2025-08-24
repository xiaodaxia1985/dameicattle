import { Router } from 'express';
import { BarnController } from '../controllers/BarnController';
import { authenticateToken } from '../middleware/auth';
import { dataPermissionMiddleware } from '../middleware/dataPermission';

const router = Router();
const barnController = new BarnController();

// Apply authentication to all routes
router.use(authenticateToken);

// Barn CRUD routes
router.get('/', dataPermissionMiddleware, barnController.getBarns.bind(barnController));
router.get('/statistics', dataPermissionMiddleware, barnController.getStatistics.bind(barnController));
router.get('/options', dataPermissionMiddleware, barnController.getBarnOptions.bind(barnController));
router.get('/:id', dataPermissionMiddleware, barnController.getBarn.bind(barnController));
router.post('/', dataPermissionMiddleware, barnController.createBarn.bind(barnController));
router.put('/:id', dataPermissionMiddleware, barnController.updateBarn.bind(barnController));
router.delete('/:id', dataPermissionMiddleware, barnController.deleteBarn.bind(barnController));

export default router;