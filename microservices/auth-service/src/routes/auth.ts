import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));

// 占位管理接口，避免前端未改造前出现404
router.get('/users', (req, res) => res.json({ users: [] }));
router.get('/roles', (req, res) => res.json({ roles: [] }));
router.get('/operation-logs', (req, res) => res.json({ logs: [] }));

export default router;