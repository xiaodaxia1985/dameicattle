import { Router } from 'express';
import { CattleController } from '../controllers/CattleController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication and data permission middleware to all routes
router.use(authMiddleware);
router.use(dataPermissionMiddleware);

// Cattle routes
router.get('/', CattleController.getCattleList);
router.get('/statistics', CattleController.getCattleStatistics);
router.get('/scan/:earTag', CattleController.getCattleByEarTag);
router.get('/:id', CattleController.getCattleById);
router.post('/', CattleController.createCattle);
router.put('/:id', CattleController.updateCattle);
router.delete('/:id', CattleController.deleteCattle);

// Cattle events routes
router.get('/:id/events', CattleController.getCattleEvents);
router.post('/:id/events', CattleController.addCattleEvent);
router.put('/events/:eventId', CattleController.updateCattleEvent);
router.delete('/events/:eventId', CattleController.deleteCattleEvent);

// Batch operations routes
router.post('/batch/import', CattleController.batchImportCattle);
router.get('/batch/export', CattleController.exportCattle);
router.post('/batch/generate-tags', CattleController.generateEarTags);
router.post('/batch/transfer', CattleController.batchTransferCattle);
router.post('/batch/update', CattleController.batchUpdateCattle);
router.delete('/batch', CattleController.batchDeleteCattle);

// Cattle breeding routes
router.get('/:id/breeding', CattleController.getCattleBreedingInfo);
router.post('/:id/breeding', CattleController.addBreedingRecord);
router.put('/breeding/:recordId', CattleController.updateBreedingRecord);

// Cattle weight tracking routes
router.get('/:id/weight', CattleController.getCattleWeightHistory);
router.post('/:id/weight', CattleController.addWeightRecord);

// Cattle photo management routes
router.post('/:id/photos', CattleController.uploadCattlePhotos);
router.delete('/:id/photos/:photoId', CattleController.deleteCattlePhoto);

export default router;