import { Router } from 'express';
import { EquipmentController } from '@/controllers/EquipmentController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermissionMiddleware as dataPermission } from '@/middleware/dataPermission';
import { validateRequest } from '@/middleware/validation';
import { equipmentValidation } from '@/validators/equipment';

const router = Router();

// Equipment Categories
router.get('/categories', auth, EquipmentController.getCategories);
router.post('/categories', auth, permission('equipment:create'), validateRequest(equipmentValidation.createCategory), EquipmentController.createCategory);
router.put('/categories/:id', auth, permission('equipment:update'), validateRequest(equipmentValidation.updateCategory), EquipmentController.updateCategory);
router.delete('/categories/:id', auth, permission('equipment:delete'), EquipmentController.deleteCategory);

// Production Equipment
router.get('/', auth, dataPermission, EquipmentController.getEquipment);
router.get('/statistics', auth, dataPermission, EquipmentController.getEquipmentStatistics);
router.get('/:id', auth, dataPermission, EquipmentController.getEquipmentById);
router.post('/', auth, permission('equipment:create'), validateRequest(equipmentValidation.createEquipment), EquipmentController.createEquipment);
router.put('/:id', auth, permission('equipment:update'), validateRequest(equipmentValidation.updateEquipment), EquipmentController.updateEquipment);
router.patch('/:id/status', auth, permission('equipment:update'), validateRequest(equipmentValidation.updateStatus), EquipmentController.updateEquipmentStatus);
router.delete('/:id', auth, permission('equipment:delete'), EquipmentController.deleteEquipment);

// Maintenance Plans
router.get('/maintenance-plans', auth, dataPermission, EquipmentController.getMaintenancePlans);
router.post('/maintenance-plans', auth, permission('equipment:create'), validateRequest(equipmentValidation.createMaintenancePlan), EquipmentController.createMaintenancePlan);
router.put('/maintenance-plans/:id', auth, permission('equipment:update'), validateRequest(equipmentValidation.updateMaintenancePlan), EquipmentController.updateMaintenancePlan);
router.delete('/maintenance-plans/:id', auth, permission('equipment:delete'), EquipmentController.deleteMaintenancePlan);

// Maintenance Records
router.get('/maintenance-records', auth, dataPermission, EquipmentController.getMaintenanceRecords);
router.post('/maintenance-records', auth, permission('equipment:create'), validateRequest(equipmentValidation.createMaintenanceRecord), EquipmentController.createMaintenanceRecord);
router.put('/maintenance-records/:id', auth, permission('equipment:update'), validateRequest(equipmentValidation.updateMaintenanceRecord), EquipmentController.updateMaintenanceRecord);

// Equipment Failures
router.get('/failures', auth, dataPermission, EquipmentController.getEquipmentFailures);
router.post('/failures', auth, permission('equipment:create'), validateRequest(equipmentValidation.reportFailure), EquipmentController.reportFailure);
router.patch('/failures/:id/status', auth, permission('equipment:update'), validateRequest(equipmentValidation.updateFailureStatus), EquipmentController.updateFailureStatus);

// Equipment Efficiency Analysis
router.get('/:id/efficiency', auth, dataPermission, EquipmentController.getEquipmentEfficiency);

export default router;