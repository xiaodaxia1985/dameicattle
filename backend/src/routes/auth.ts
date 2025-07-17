import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';
import { loginSchema, registerSchema } from '@/validators/auth';

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/login
router.post('/login', validateRequest(loginSchema), authController.login);

// POST /api/v1/auth/register
router.post('/register', validateRequest(registerSchema), authController.register);

// POST /api/v1/auth/refresh
router.post('/refresh', authController.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', authController.logout);

export default router;