import { Router } from 'express';
import { CattleController } from '../controllers/CattleController';

const router = Router();
const cattleController = new CattleController();

router.get('/', cattleController.getCattle.bind(cattleController));
router.post('/', cattleController.createCattle.bind(cattleController));
router.put('/:id', cattleController.updateCattle.bind(cattleController));
router.delete('/:id', cattleController.deleteCattle.bind(cattleController));

export default router;