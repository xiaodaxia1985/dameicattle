import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validation';
import { authMiddleware } from '../middleware/auth';
import { 
  loginSchema, 
  registerSchema, 
  passwordResetRequestSchema, 
  passwordResetSchema 
} from '../validators/auth';

const router = Router();
const authController = new AuthController();

// POST /login
router.post('/login', validateRequest(loginSchema), authController.login);

// POST /register
router.post('/register', validateRequest(registerSchema), authController.register);

// POST /refresh
router.post('/refresh', authController.refreshToken);

// POST /logout
router.post('/logout', authMiddleware, authController.logout);

// POST /request-password-reset
router.post('/request-password-reset', validateRequest(passwordResetRequestSchema), authController.requestPasswordReset);

// POST /reset-password
router.post('/reset-password', validateRequest(passwordResetSchema), authController.resetPassword);

// GET /profile
router.get('/profile', authMiddleware, authController.getProfile);

export default router;