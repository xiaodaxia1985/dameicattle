import { Router } from 'express';
import { MaterialController } from '../controllers/MaterialController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// 物资档案路由
router.get('/materials', MaterialController.getMaterials);
router.post('/materials', MaterialController.createMaterial);
router.put('/materials/:id', MaterialController.updateMaterial);
router.delete('/materials/:id', MaterialController.deleteMaterial);

// 库存管理路由
router.get('/inventory', dataPermissionMiddleware, MaterialController.getInventory);
router.post('/inventory/in', dataPermissionMiddleware, MaterialController.stockIn);
router.post('/inventory/out', dataPermissionMiddleware, MaterialController.stockOut);
router.get('/inventory/records', dataPermissionMiddleware, MaterialController.getInventoryRecords);

// 统计路由
router.get('/statistics', dataPermissionMiddleware, MaterialController.getMaterialStatistics);

export default router;