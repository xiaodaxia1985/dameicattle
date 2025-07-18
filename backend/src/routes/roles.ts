import { Router } from 'express';
import { RoleController } from '@/controllers/RoleController';
import { requirePermission } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { operationLogMiddleware } from '@/middleware/operationLog';
import { roleSchema, roleUpdateSchema, assignUsersSchema } from '@/validators/role';

const router = Router();
const roleController = new RoleController();

// GET /api/v1/roles
router.get('/', requirePermission('roles:read'), operationLogMiddleware('read', 'roles'), roleController.getRoles);

// GET /api/v1/roles/permissions
router.get('/permissions', requirePermission('roles:read'), operationLogMiddleware('read', 'permissions'), roleController.getPermissions);

// GET /api/v1/roles/:id
router.get('/:id', requirePermission('roles:read'), operationLogMiddleware('read', 'role'), roleController.getRoleById);

// POST /api/v1/roles
router.post('/', requirePermission('roles:create'), operationLogMiddleware('create', 'role'), validateRequest(roleSchema), roleController.createRole);

// PUT /api/v1/roles/:id
router.put('/:id', requirePermission('roles:update'), operationLogMiddleware('update', 'role'), validateRequest(roleUpdateSchema), roleController.updateRole);

// DELETE /api/v1/roles/:id
router.delete('/:id', requirePermission('roles:delete'), operationLogMiddleware('delete', 'role'), roleController.deleteRole);

// POST /api/v1/roles/:id/assign-users
router.post('/:id/assign-users', requirePermission('roles:update'), operationLogMiddleware('assign', 'role-users'), validateRequest(assignUsersSchema), roleController.assignUsersToRole);

// POST /api/v1/roles/:id/remove-users
router.post('/:id/remove-users', requirePermission('roles:update'), operationLogMiddleware('remove', 'role-users'), validateRequest(assignUsersSchema), roleController.removeUsersFromRole);

export default router;