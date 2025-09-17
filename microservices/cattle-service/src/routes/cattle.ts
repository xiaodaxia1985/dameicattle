import { Router } from 'express';
import { CattleController } from '../controllers/CattleController';

const router = Router();
const cattleController = new CattleController();

router.get('/', cattleController.getCattle.bind(cattleController));
// add get by id route to support /cattle/:id
router.get('/:id', cattleController.getCattleById?.bind?.(cattleController) || ((req, res) => res.status(501).json({ message: 'Not Implemented' })));
router.post('/', cattleController.createCattle.bind(cattleController));
router.put('/:id', cattleController.updateCattle.bind(cattleController));
router.delete('/:id', cattleController.deleteCattle.bind(cattleController));

export default router;