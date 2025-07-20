import { Router } from 'express';
import multer from 'multer';
import { CattleController } from '@/controllers/CattleController';
import { CattleEventController } from '@/controllers/CattleEventController';
import { CattleBatchController } from '@/controllers/CattleBatchController';
import { validateCattle, validateCattleEvent } from '@/validators/cattleValidator';
import { permissionMiddleware } from '@/middleware/permission';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel和CSV文件'));
    }
  }
});

// Batch operations routes (must come before parameterized routes)
router.get('/batch/template', CattleBatchController.getImportTemplate);
router.post('/batch/import', permissionMiddleware(['cattle:create']), upload.single('file'), CattleBatchController.batchImportCattle);
router.get('/batch/export', permissionMiddleware(['cattle:read']), CattleBatchController.exportCattle);
router.post('/batch/generate-tags', permissionMiddleware(['cattle:create']), CattleBatchController.generateEarTags);
router.post('/batch/transfer', permissionMiddleware(['cattle:update']), CattleBatchController.batchTransferCattle);

// Cattle routes
router.get('/', CattleController.getCattleList);
router.get('/statistics', CattleController.getCattleStatistics);
router.get('/scan/:earTag', CattleController.getCattleByEarTag);
router.get('/:id', CattleController.getCattleById);
router.post('/', permissionMiddleware(['cattle:create']), validateCattle, CattleController.createCattle);
router.put('/:id', permissionMiddleware(['cattle:update']), validateCattle, CattleController.updateCattle);
router.delete('/:id', permissionMiddleware(['cattle:delete']), CattleController.deleteCattle);

// Cattle events routes
router.get('/:cattleId/events', CattleEventController.getCattleEvents);
router.post('/:cattleId/events', permissionMiddleware(['cattle:update']), validateCattleEvent, CattleEventController.createCattleEvent);
router.get('/events/types', CattleEventController.getEventTypes);
router.get('/events/:id', CattleEventController.getCattleEventById);
router.put('/events/:id', permissionMiddleware(['cattle:update']), validateCattleEvent, CattleEventController.updateCattleEvent);
router.delete('/events/:id', permissionMiddleware(['cattle:delete']), CattleEventController.deleteCattleEvent);

export default router;