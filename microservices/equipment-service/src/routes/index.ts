import { Router } from 'express';
import equipmentRouter from './equipment';

const router = Router();

router.use('/equipment', equipmentRouter);

export default router;