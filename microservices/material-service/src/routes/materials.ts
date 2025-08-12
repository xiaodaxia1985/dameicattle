import { Router } from 'express';
import { MaterialController } from '../controllers/MaterialController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// 物资分类路由
router.get('/categories', MaterialController.getCategories);
router.get('/categories/:id', MaterialController.getCategoryById);
router.post('/categories', MaterialController.createCategory);
router.put('/categories/:id', MaterialController.updateCategory);
router.delete('/categories/:id', MaterialController.deleteCategory);

// 供应商路由
router.get('/suppliers', MaterialController.getSuppliers);
router.get('/suppliers/:id', MaterialController.getSupplierById);
router.post('/suppliers', MaterialController.createSupplier);
router.put('/suppliers/:id', MaterialController.updateSupplier);
router.delete('/suppliers/:id', MaterialController.deleteSupplier);

// 物资档案路由
router.get('/materials', MaterialController.getMaterials);
router.get('/materials/:id', MaterialController.getMaterialById);
router.post('/materials', MaterialController.createMaterial);
router.put('/materials/:id', MaterialController.updateMaterial);
router.delete('/materials/:id', MaterialController.deleteMaterial);

// 库存管理路由
router.get('/inventory', dataPermissionMiddleware, MaterialController.getInventory);
router.get('/inventory/:materialId/:baseId', dataPermissionMiddleware, MaterialController.getInventoryByMaterialAndBase);
router.post('/inventory/in', dataPermissionMiddleware, MaterialController.stockIn);
router.post('/inventory/out', dataPermissionMiddleware, MaterialController.stockOut);

// 库存交易记录路由
router.get('/inventory/records', dataPermissionMiddleware, MaterialController.getInventoryRecords);
router.post('/inventory/records', dataPermissionMiddleware, MaterialController.createInventoryTransaction);

// 库存预警路由
router.get('/alerts', dataPermissionMiddleware, MaterialController.getInventoryAlerts);
router.post('/alerts/:id/resolve', dataPermissionMiddleware, MaterialController.resolveInventoryAlert);

// 统计路由
router.get('/statistics', dataPermissionMiddleware, MaterialController.getMaterialStatistics);

export default router;