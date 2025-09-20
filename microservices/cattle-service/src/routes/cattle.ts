import { Router } from 'express';
import { CattleController } from '../controllers/CattleController';
import { CattleEventController } from '../controllers/CattleEventController';

const router = Router();
const cattleController = new CattleController();
const cattleEventController = new CattleEventController();

router.get('/', cattleController.getCattle.bind(cattleController));
// add get by id route to support /cattle/:id
router.get('/:id', cattleController.getCattleById?.bind?.(cattleController) || ((req, res) => res.status(501).json({ message: 'Not Implemented' })));
router.post('/', cattleController.createCattle.bind(cattleController));
router.put('/:id', cattleController.updateCattle.bind(cattleController));
router.delete('/:id', cattleController.deleteCattle.bind(cattleController));

// 牛只事件路由 - 支持 /cattle/:id/events 路径
router.get('/:id/events', (req, res, next) => {
  // 将cattleId从URL参数传递给查询参数
  req.query.cattleId = req.params.id;
  cattleEventController.getEvents.bind(cattleEventController)(req, res, next);
});

router.post('/:id/events', (req, res, next) => {
  // 设置cattleId
  req.body.cattleId = req.params.id;
  cattleEventController.createEvent.bind(cattleEventController)(req, res, next);
});

export default router;