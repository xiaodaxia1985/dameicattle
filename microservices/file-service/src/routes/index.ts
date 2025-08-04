import { Router } from 'express';
import filesRouter from './files';

const router = Router();

router.use('/files', filesRouter);

export default router;