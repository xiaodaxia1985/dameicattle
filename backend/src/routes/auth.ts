import { Router } from 'express';
import { AuthController } from '@/controllers/AuthController';
import { validateRequest } from '@/middleware/validation';
import { authMiddleware } from '@/middleware/auth';
import { 
  loginSchema, 
  registerSchema, 
  passwordResetRequestSchema, 
  passwordResetSchema, 
  wechatLoginSchema,
  bindUserSchema 
} from '@/validators/auth';

const router = Router();
const authController = new AuthController();

// POST /api/v1/auth/login
router.post('/login', validateRequest(loginSchema), authController.login);

// POST /api/v1/auth/register
router.post('/register', validateRequest(registerSchema), authController.register);

// POST /api/v1/auth/refresh
router.post('/refresh', authMiddleware, authController.refreshToken);

// POST /api/v1/auth/logout
router.post('/logout', authMiddleware, authController.logout);

// POST /api/v1/auth/request-password-reset
router.post('/request-password-reset', validateRequest(passwordResetRequestSchema), authController.requestPasswordReset);

// POST /api/v1/auth/reset-password
router.post('/reset-password', validateRequest(passwordResetSchema), authController.resetPassword);

// POST /api/v1/auth/wechat-login
router.post('/wechat-login', validateRequest(wechatLoginSchema), authController.wechatLogin);

// POST /api/v1/auth/bind-user
router.post('/bind-user', authMiddleware, validateRequest(bindUserSchema), authController.bindUserToBase);

// GET /api/v1/auth/profile
router.get('/profile', authMiddleware, authController.getWechatUserProfile);

export default router;