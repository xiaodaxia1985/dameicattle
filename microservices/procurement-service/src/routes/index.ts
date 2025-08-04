import { Router } from 'express';
import procurementRouter from './procurement';

const router = Router();

router.use('/procurement', procurementRouter);

export default router;