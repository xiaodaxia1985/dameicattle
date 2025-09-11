import { Router } from 'express';
import { BaseController } from '../controllers/BaseController';
import { validate } from '../middleware/validation';
import { createBaseSchema, updateBaseSchema } from '../validators/base';

const router = Router();
const baseController = new BaseController();

// 基地CRUD路由
router.get('/', baseController.getBases.bind(baseController));
router.get('/:id', baseController.getBaseById.bind(baseController));
router.get('/:id/statistics', baseController.getBaseStatistics.bind(baseController));
router.post('/', validate(createBaseSchema), baseController.createBase.bind(baseController));
router.put('/:id', validate(updateBaseSchema), baseController.updateBase.bind(baseController));
router.put('/:id/status', baseController.updateBaseStatus.bind(baseController));
router.delete('/:id', baseController.deleteBase.bind(baseController));

export default router;