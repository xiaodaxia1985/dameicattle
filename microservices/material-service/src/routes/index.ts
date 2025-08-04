import { Router } from 'express';
import materialsRouter from './materials';

const router = Router();

// Mount routes
router.use('/materials', materialsRouter);

export default router;