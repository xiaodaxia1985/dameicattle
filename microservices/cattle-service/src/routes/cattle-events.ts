import { Router } from 'express';
import { CattleEventController } from '../controllers/CattleEventController';

const router = Router();
const cattleEventController = new CattleEventController();

// 获取事件列表 - 支持筛选繁殖、转群和生命周期事件
router.get('/', cattleEventController.getEvents.bind(cattleEventController));

// 获取单个事件详情
router.get('/:id', cattleEventController.getEventById.bind(cattleEventController));

// 创建新事件
router.post('/', cattleEventController.createEvent.bind(cattleEventController));

// 更新事件
router.put('/:id', cattleEventController.updateEvent.bind(cattleEventController));

// 删除事件
router.delete('/:id', cattleEventController.deleteEvent.bind(cattleEventController));

// 批量创建事件（用于批量转群等操作）
router.post('/batch', cattleEventController.batchCreateEvents.bind(cattleEventController));

export default router;