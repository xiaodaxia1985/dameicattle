import { Router } from 'express';
import cattleRouter from './cattle';

const router = Router();

// Mount routes
router.use('/cattle', cattleRouter);

export default router;