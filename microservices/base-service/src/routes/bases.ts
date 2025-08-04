import { Router } from 'express';
import { BaseController } from '../controllers/BaseController';
import { requirePermission } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { dataPermissionMiddleware } from '../middleware/dataPermission';
import { operationLogMiddleware } from '../middleware/operationLog';

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
  baseController.createBase
);

// PUT /api/v1/bases/:id - Update base
router.put(
  '/:id', 
  requirePermission('bases:update'), 
  dataPermissionMiddleware, 
  operationLogMiddleware('update', 'base'),
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