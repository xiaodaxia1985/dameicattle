import { Router } from 'express';
import feedingRouter from './feeding';

const router = Router();

// Mount routes
router.use('/feeding', feedingRouter);

export default router;