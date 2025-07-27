import { Router } from 'express';
import { BaseController } from '@/controllers/BaseController';
import { requirePermission } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { operationLogMiddleware } from '@/middleware/operationLog';
import { createBaseSchema, updateBaseSchema, baseQuerySchema, bulkImportBasesSchema, validateLocationSchema, exportBasesSchema } from '@/validators/base';

const router = Router();
const baseController = new BaseController();

// GET /api/v1/bases/managers/available - Get available managers for base assignment
router.get(
  '/managers/available', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'available_managers'),
  baseController.getAvailableManagers
);

// POST /api/v1/bases/bulk-import - Bulk import bases
router.post(
  '/bulk-import', 
  requirePermission('bases:create'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('create', 'bulk_import_bases'),
  validateRequest(bulkImportBasesSchema),
  baseController.bulkImportBases
);

// GET /api/v1/bases/export - Export bases data
router.get(
  '/export', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'export_bases'),
  validateRequest(exportBasesSchema),
  baseController.exportBases
);

// POST /api/v1/bases/validate-location - Validate base location coordinates
router.post(
  '/validate-location', 
  requirePermission('bases:read'), 
  operationLogMiddleware('read', 'validate_location'),
  validateRequest(validateLocationSchema),
  baseController.validateBaseLocation
);

// GET /api/v1/bases/all - Get all bases without pagination
router.get(
  '/all', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'all_bases'),
  baseController.getAllBases
);

// GET /api/v1/bases - Get all bases with pagination and search
router.get(
  '/', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'bases'),
  validateRequest(baseQuerySchema),
  baseController.getBases
);

// GET /api/v1/bases/:id/statistics - Get base statistics
router.get(
  '/:id/statistics', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'base_statistics'),
  baseController.getBaseStatistics
);

// GET /api/v1/bases/:id/capacity - Get base capacity information
router.get(
  '/:id/capacity', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'base_capacity'),
  baseController.getBaseCapacityInfo
);

// GET /api/v1/bases/:id/barns - Get barns for a specific base
router.get(
  '/:id/barns', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'base_barns'),
  baseController.getBarnsByBaseId
);

// GET /api/v1/bases/:id - Get base by ID
router.get(
  '/:id', 
  requirePermission('bases:read'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('read', 'base'),
  baseController.getBaseById
);

// POST /api/v1/bases - Create new base
router.post(
  '/', 
  requirePermission('bases:create'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('create', 'base'),
  validateRequest(createBaseSchema),
  baseController.createBase
);

// PUT /api/v1/bases/:id - Update base
router.put(
  '/:id', 
  requirePermission('bases:update'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('update', 'base'),
  validateRequest(updateBaseSchema),
  baseController.updateBase
);

// DELETE /api/v1/bases/:id - Delete base
router.delete(
  '/:id', 
  requirePermission('bases:delete'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('delete', 'base'),
  baseController.deleteBase
);

export default router;