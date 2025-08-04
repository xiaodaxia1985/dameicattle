import { Router } from 'express';
import { MaterialController } from '../controllers/MaterialController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Material routes
router.get('/', MaterialController.getMaterials);
router.post('/', MaterialController.createMaterial);

// Category routes
router.get('/categories', MaterialController.getCategories);

// Inventory routes
router.get('/inventory/statistics', dataPermissionMiddleware, MaterialController.getInventoryStatistics);

export default router;