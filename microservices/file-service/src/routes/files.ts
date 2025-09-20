import express from 'express';
import { FileController } from '../controllers/FileController';
import { authMiddleware } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// File upload routes
router.post('/upload', uploadMiddleware.single('file'), FileController.uploadFile);
router.post('/upload/batch', uploadMiddleware.array('files', 10), FileController.uploadMultipleFiles);

// File management routes
router.get('/', FileController.getFiles);
router.get('/:id', FileController.getFileById);
router.delete('/:id', FileController.deleteFile);

// File download routes
router.get('/:id/download', FileController.downloadFile);
router.get('/:id/preview', FileController.previewFile);

// File category routes
router.get('/categories', FileController.getFileCategories);
router.post('/categories', FileController.createFileCategory);
router.put('/categories/:id', FileController.updateFileCategory);
router.delete('/categories/:id', FileController.deleteFileCategory);

// File sharing routes
router.post('/:id/share', FileController.shareFile);
router.get('/shared/:token', FileController.getSharedFile);

// File statistics
router.get('/statistics', FileController.getFileStatistics);

export default router;