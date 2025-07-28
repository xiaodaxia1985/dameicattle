import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { requirePermission } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { dataPermissionMiddleware } from '@/middleware/dataPermission';
import { operationLogMiddleware } from '@/middleware/operationLog';
import { createUserSchema, updateUserSchema, updateProfileSchema } from '@/validators/user';

const router = Router();
const userController = new UserController();

// GET /api/v1/users
router.get('/', requirePermission('user:read'), dataPermissionMiddleware, operationLogMiddleware('read', 'users'), userController.getUsers);

// GET /api/v1/users/:id
router.get('/:id', requirePermission('user:read'), dataPermissionMiddleware, operationLogMiddleware('read', 'user'), userController.getUserById);

// POST /api/v1/users
router.post('/', requirePermission('user:create'), dataPermissionMiddleware, operationLogMiddleware('create', 'user'), validateRequest(createUserSchema), userController.createUser);

// PUT /api/v1/users/:id
router.put('/:id', requirePermission('user:update'), dataPermissionMiddleware, operationLogMiddleware('update', 'user'), validateRequest(updateUserSchema), userController.updateUser);

// DELETE /api/v1/users/:id
router.delete('/:id', requirePermission('user:delete'), dataPermissionMiddleware, operationLogMiddleware('delete', 'user'), userController.deleteUser);

// PUT /api/v1/users/:id/reset-password
router.put('/:id/reset-password', requirePermission('user:reset-password'), dataPermissionMiddleware, operationLogMiddleware('reset-password', 'user'), userController.resetPassword);

// DELETE /api/v1/users/batch
router.delete('/batch', requirePermission('user:delete'), dataPermissionMiddleware, operationLogMiddleware('batch-delete', 'users'), userController.batchDeleteUsers);

// PUT /api/v1/users/:id/status
router.put('/:id/status', requirePermission('user:update'), dataPermissionMiddleware, operationLogMiddleware('toggle-status', 'user'), userController.toggleUserStatus);

// GET /api/v1/users/profile/me
router.get('/profile/me', userController.getProfile);

// PUT /api/v1/users/profile/me
router.put('/profile/me', validateRequest(updateProfileSchema), userController.updateProfile);

export default router;