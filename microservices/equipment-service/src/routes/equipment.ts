import { Router } from 'express';
import { EquipmentController } from '../controllers/EquipmentController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Equipment category routes
router.get('/categories', EquipmentController.getCategories);
router.get('/categories/:id', EquipmentController.getCategoryById);
router.post('/categories', EquipmentController.createCategory);
router.put('/categories/:id', EquipmentController.updateCategory);
router.delete('/categories/:id', EquipmentController.deleteCategory);

// Equipment routes
router.get('/', dataPermissionMiddleware, EquipmentController.getEquipment);
router.get('/:id', dataPermissionMiddleware, EquipmentController.getEquipmentById);
router.post('/', dataPermissionMiddleware, EquipmentController.createEquipment);
router.put('/:id', dataPermissionMiddleware, EquipmentController.updateEquipment);
router.delete('/:id', dataPermissionMiddleware, EquipmentController.deleteEquipment);
router.patch('/:id/status', dataPermissionMiddleware, EquipmentController.updateEquipmentStatus);

// Equipment efficiency analysis
router.get('/:id/efficiency', dataPermissionMiddleware, EquipmentController.getEquipmentEfficiency);

// Maintenance plan routes
router.get('/maintenance-plans', dataPermissionMiddleware, EquipmentController.getMaintenancePlans);
router.get('/maintenance-plans/:id', dataPermissionMiddleware, EquipmentController.getMaintenancePlanById);
router.post('/maintenance-plans', dataPermissionMiddleware, EquipmentController.createMaintenancePlan);
router.put('/maintenance-plans/:id', dataPermissionMiddleware, EquipmentController.updateMaintenancePlan);
router.delete('/maintenance-plans/:id', dataPermissionMiddleware, EquipmentController.deleteMaintenancePlan);

// Maintenance record routes
router.get('/maintenance', dataPermissionMiddleware, EquipmentController.getMaintenanceRecords);
router.get('/maintenance/:id', dataPermissionMiddleware, EquipmentController.getMaintenanceRecordById);
router.post('/maintenance', dataPermissionMiddleware, EquipmentController.createMaintenanceRecord);
router.put('/maintenance/:id', dataPermissionMiddleware, EquipmentController.updateMaintenanceRecord);
router.delete('/maintenance/:id', dataPermissionMiddleware, EquipmentController.deleteMaintenanceRecord);

// Equipment failure routes
router.get('/failures', dataPermissionMiddleware, EquipmentController.getFailures);
router.get('/failures/:id', dataPermissionMiddleware, EquipmentController.getFailureById);
router.post('/failures', dataPermissionMiddleware, EquipmentController.reportFailure);
router.patch('/failures/:id/status', dataPermissionMiddleware, EquipmentController.updateFailureStatus);

// Statistics routes
router.get('/statistics', dataPermissionMiddleware, EquipmentController.getEquipmentStatistics);

export default router;