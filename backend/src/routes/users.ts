import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { requirePermission } from '@/middleware/auth';

const router = Router();
const userController = new UserController();

// GET /api/v1/users
router.get('/', requirePermission('users:read'), userController.getUsers);

// GET /api/v1/users/:id
router.get('/:id', requirePermission('users:read'), userController.getUserById);

// POST /api/v1/users
router.post('/', requirePermission('users:create'), userController.createUser);

// PUT /api/v1/users/:id
router.put('/:id', requirePermission('users:update'), userController.updateUser);

// DELETE /api/v1/users/:id
router.delete('/:id', requirePermission('users:delete'), userController.deleteUser);

// GET /api/v1/users/profile/me
router.get('/profile/me', userController.getProfile);

// PUT /api/v1/users/profile/me
router.put('/profile/me', userController.updateProfile);

export default router;