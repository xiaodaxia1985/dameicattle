import { Router } from 'express';
import monitoringRouter from './monitoring';

const router = Router();

router.use('/monitoring', monitoringRouter);

export default router;