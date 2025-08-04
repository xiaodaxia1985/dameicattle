import { Router } from 'express';
import healthRouter from './health';

const router = Router();

// Mount routes
router.use('/health', healthRouter);

export default router;