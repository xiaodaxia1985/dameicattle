import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const controller = new HealthController();

router.get('/', controller.getAll.bind(controller));
router.post('/', controller.create.bind(controller));

export default router;