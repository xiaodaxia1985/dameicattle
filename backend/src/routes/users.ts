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
router.get('/', requirePermission('users:read'), dataPermissionMiddleware, operationLogMiddleware('read', 'users'), userController.getUsers);

// GET /api/v1/users/:id
router.get('/:id', requirePermission('users:read'), dataPermissionMiddleware, operationLogMiddleware('read', 'user'), userController.getUserById);

// POST /api/v1/users
router.post('/', requirePermission('users:create'), dataPermissionMiddleware, operationLogMiddleware('create', 'user'), validateRequest(createUserSchema), userController.createUser);

// PUT /api/v1/users/:id
router.put('/:id', requirePermission('users:update'), dataPermissionMiddleware, operationLogMiddleware('update', 'user'), validateRequest(updateUserSchema), userController.updateUser);

// DELETE /api/v1/users/:id
router.delete('/:id', requirePermission('users:delete'), dataPermissionMiddleware, operationLogMiddleware('delete', 'user'), userController.deleteUser);

// GET /api/v1/users/profile/me
router.get('/profile/me', userController.getProfile);

// PUT /api/v1/users/profile/me
router.put('/profile/me', validateRequest(updateProfileSchema), userController.updateProfile);

export default router;