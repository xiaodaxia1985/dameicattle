import { Router } from 'express';
import basesRouter from './bases';
import barnsRouter from './barns';

const router = Router();

// Mount routes
router.use('/bases', basesRouter);
router.use('/barns', barnsRouter);

export default router;