import { Router, Request, Response } from 'express';
import { requirePermission } from '@/middleware/auth';
import { 
  createUploadMiddleware, 
  handleUploadError, 
  trackUploadProgress,
  validateUploadedFile,
  cleanupFiles
} from '@/middleware/fileUpload';
import { FileManagementService } from '@/services/FileManagementService';
import { logger } from '@/utils/logger';

const router = Router();
const fileManager = FileManagementService.getInstance();

// Upload progress tracking middleware
router.use(trackUploadProgress);

// Upload image
router.post('/image', 
  requirePermission('upload:image'),
  createUploadMiddleware('image', 'file', false),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
          code: 'NO_FILE_PROVIDED'
        });
      }

      // Validate uploaded file
      validateUploadedFile(file, 'image');

      // Register file with management service
      const userId = (req as any).user?.id;
      const metadata = fileManager.registerFile(file, 'image', userId);

      const fileUrl = `/uploads/images/${file.filename}`;
      
      logger.info('Image uploaded successfully:', {
        fileId: metadata.id,
        filename: file.filename,
        size: file.size,
        userId
      });

      return res.json({
        success: true,
        data: {
          id: metadata.id,
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: metadata.uploadedAt
        },
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      logger.error('Image upload failed:', error);
      
      // Cleanup file if it was uploaded but processing failed
      if (req.file) {
        await cleanupFiles([req.file.path]).catch(() => {});
      }
      
      return res.status(500).json({
        success: false,
        message: 'Image upload failed',
        code: 'IMAGE_UPLOAD_FAILED'
      });
    }
  }
);

// Upload document
router.post('/document',
  requirePermission('upload:document'),
  createUploadMiddleware('document', 'file', false),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
          code: 'NO_FILE_PROVIDED'
        });
      }

      // Validate uploaded file
      validateUploadedFile(file, 'document');

      // Register file with management service
      const userId = (req as any).user?.id;
      const metadata = fileManager.registerFile(file, 'document', userId);

      const fileUrl = `/uploads/documents/${file.filename}`;
      
      logger.info('Document uploaded successfully:', {
        fileId: metadata.id,
        filename: file.filename,
        size: file.size,
        userId
      });

      return res.json({
        success: true,
        data: {
          id: metadata.id,
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: metadata.uploadedAt
        },
        message: 'Document uploaded successfully'
      });
    } catch (error) {
      logger.error('Document upload failed:', error);
      
      // Cleanup file if it was uploaded but processing failed
      if (req.file) {
        await cleanupFiles([req.file.path]).catch(() => {});
      }
      
      return res.status(500).json({
        success: false,
        message: 'Document upload failed',
        code: 'DOCUMENT_UPLOAD_FAILED'
      });
    }
  }
);

// Upload avatar
router.post('/avatar',
  requirePermission('upload:avatar'),
  createUploadMiddleware('avatar', 'file', false),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
          code: 'NO_FILE_PROVIDED'
        });
      }

      // Validate uploaded file
      validateUploadedFile(file, 'avatar');

      // Register file with management service
      const userId = (req as any).user?.id;
      const metadata = fileManager.registerFile(file, 'avatar', userId);

      const fileUrl = `/uploads/avatars/${file.filename}`;
      
      logger.info('Avatar uploaded successfully:', {
        fileId: metadata.id,
        filename: file.filename,
        size: file.size,
        userId
      });

      return res.json({
        success: true,
        data: {
          id: metadata.id,
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: metadata.uploadedAt
        },
        message: 'Avatar uploaded successfully'
      });
    } catch (error) {
      logger.error('Avatar upload failed:', error);
      
      // Cleanup file if it was uploaded but processing failed
      if (req.file) {
        await cleanupFiles([req.file.path]).catch(() => {});
      }
      
      return res.status(500).json({
        success: false,
        message: 'Avatar upload failed',
        code: 'AVATAR_UPLOAD_FAILED'
      });
    }
  }
);

// General file upload
router.post('/file',
  requirePermission('upload:file'),
  createUploadMiddleware('general', 'file', false),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided',
          code: 'NO_FILE_PROVIDED'
        });
      }

      // Validate uploaded file
      validateUploadedFile(file, 'general');

      // Register file with management service
      const userId = (req as any).user?.id;
      const metadata = fileManager.registerFile(file, 'general', userId);

      const fileUrl = `/uploads/files/${file.filename}`;
      
      logger.info('File uploaded successfully:', {
        fileId: metadata.id,
        filename: file.filename,
        size: file.size,
        userId
      });

      return res.json({
        success: true,
        data: {
          id: metadata.id,
          url: fileUrl,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: metadata.uploadedAt
        },
        message: 'File uploaded successfully'
      });
    } catch (error) {
      logger.error('File upload failed:', error);
      
      // Cleanup file if it was uploaded but processing failed
      if (req.file) {
        await cleanupFiles([req.file.path]).catch(() => {});
      }
      
      return res.status(500).json({
        success: false,
        message: 'File upload failed',
        code: 'FILE_UPLOAD_FAILED'
      });
    }
  }
);

// Batch upload
router.post('/batch',
  requirePermission('upload:batch'),
  createUploadMiddleware('general', 'files', true, 10),
  handleUploadError,
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided',
          code: 'NO_FILES_PROVIDED'
        });
      }

      const userId = (req as any).user?.id;
      const uploadedFiles = [];
      const failedFiles = [];

      // Process each file
      for (const file of files) {
        try {
          validateUploadedFile(file, 'general');
          const metadata = fileManager.registerFile(file, 'general', userId);
          
          uploadedFiles.push({
            id: metadata.id,
            url: `/uploads/files/${file.filename}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            uploadedAt: metadata.uploadedAt
          });
        } catch (error) {
          failedFiles.push({
            filename: file.originalname,
            error: (error as Error).message
          });
          
          // Cleanup failed file
          await cleanupFiles([file.path]).catch(() => {});
        }
      }

      logger.info('Batch upload completed:', {
        totalFiles: files.length,
        successful: uploadedFiles.length,
        failed: failedFiles.length,
        userId
      });

      return res.json({
        success: failedFiles.length === 0,
        data: {
          files: uploadedFiles,
          failed: failedFiles,
          summary: {
            total: files.length,
            successful: uploadedFiles.length,
            failed: failedFiles.length
          }
        },
        message: `Batch upload completed: ${uploadedFiles.length} successful, ${failedFiles.length} failed`
      });
    } catch (error) {
      logger.error('Batch upload failed:', error);
      
      // Cleanup all uploaded files on complete failure
      if (req.files) {
        const filePaths = (req.files as Express.Multer.File[]).map(f => f.path);
        await cleanupFiles(filePaths).catch(() => {});
      }
      
      return res.status(500).json({
        success: false,
        message: 'Batch upload failed',
        code: 'BATCH_UPLOAD_FAILED'
      });
    }
  }
);

// Delete file by ID
router.delete('/:fileId',
  requirePermission('upload:delete'),
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const result = await fileManager.deleteFile(fileId);

      if (result.success) {
        logger.info('File deleted successfully:', { fileId });
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      logger.error('File deletion failed:', error);
      return res.status(500).json({
        success: false,
        message: 'File deletion failed',
        code: 'DELETE_FAILED'
      });
    }
  }
);

// Delete file by filename (legacy support)
router.delete('/filename/:filename',
  requirePermission('upload:delete'),
  async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const metadata = fileManager.getFileByFilename(filename);
      
      if (!metadata) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      const result = await fileManager.deleteFile(metadata.id);
      
      if (result.success) {
        logger.info('File deleted by filename:', { filename });
        return res.json(result);
      } else {
        return res.status(500).json(result);
      }
    } catch (error) {
      logger.error('File deletion by filename failed:', error);
      return res.status(500).json({
        success: false,
        message: 'File deletion failed',
        code: 'DELETE_FAILED'
      });
    }
  }
);

// Batch delete files
router.delete('/batch',
  requirePermission('upload:delete'),
  async (req: Request, res: Response) => {
    try {
      const { fileIds } = req.body;
      
      if (!Array.isArray(fileIds) || fileIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'File IDs array is required',
          code: 'INVALID_FILE_IDS'
        });
      }

      const result = await fileManager.deleteFiles(fileIds);
      
      logger.info('Batch delete completed:', {
        fileIds,
        result: result.data
      });

      return res.json(result);
    } catch (error) {
      logger.error('Batch delete failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Batch delete failed',
        code: 'BATCH_DELETE_FAILED'
      });
    }
  }
);

// List files with filtering and pagination
router.get('/files',
  requirePermission('upload:list'),
  async (req: Request, res: Response) => {
    try {
      const {
        category,
        uploadedBy,
        limit = 20,
        offset = 0,
        sortBy = 'uploadedAt',
        sortOrder = 'desc'
      } = req.query;

      const options = {
        category: category as string,
        uploadedBy: uploadedBy as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        sortBy: sortBy as 'uploadedAt' | 'size' | 'filename',
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = fileManager.listFiles(options);

      return res.json({
        success: true,
        data: {
          files: result.files,
          pagination: {
            total: result.total,
            limit: options.limit,
            offset: options.offset,
            totalPages: Math.ceil(result.total / options.limit)
          }
        },
        message: 'Files retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to list files:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list files',
        code: 'LIST_FILES_FAILED'
      });
    }
  }
);

// Get file metadata by ID
router.get('/files/:fileId',
  requirePermission('upload:view'),
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const metadata = fileManager.getFileMetadata(fileId);

      if (!metadata) {
        return res.status(404).json({
          success: false,
          message: 'File not found',
          code: 'FILE_NOT_FOUND'
        });
      }

      return res.json({
        success: true,
        data: metadata,
        message: 'File metadata retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get file metadata:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get file metadata',
        code: 'GET_METADATA_FAILED'
      });
    }
  }
);

// Move file to different category
router.put('/files/:fileId/move',
  requirePermission('upload:manage'),
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      const { category } = req.body;

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category is required',
          code: 'CATEGORY_REQUIRED'
        });
      }

      const result = await fileManager.moveFile(fileId, category);

      if (result.success) {
        logger.info('File moved successfully:', { fileId, category });
        return res.json(result);
      } else {
        return res.status(404).json(result);
      }
    } catch (error) {
      logger.error('Failed to move file:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to move file',
        code: 'MOVE_FILE_FAILED'
      });
    }
  }
);

// Get storage statistics
router.get('/stats',
  requirePermission('upload:stats'),
  async (req: Request, res: Response) => {
    try {
      const stats = fileManager.getStorageStats();

      return res.json({
        success: true,
        data: stats,
        message: 'Storage statistics retrieved successfully'
      });
    } catch (error) {
      logger.error('Failed to get storage stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get storage statistics',
        code: 'GET_STATS_FAILED'
      });
    }
  }
);

// Cleanup old files
router.post('/cleanup',
  requirePermission('upload:cleanup'),
  async (req: Request, res: Response) => {
    try {
      const {
        maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
        maxSize = 100 * 1024 * 1024, // 100MB
        pattern,
        dryRun = false
      } = req.body;

      const options = {
        maxAge: parseInt(maxAge),
        maxSize: parseInt(maxSize),
        pattern: pattern ? new RegExp(pattern) : undefined,
        dryRun: Boolean(dryRun)
      };

      const result = await fileManager.cleanupFiles(options);

      logger.info('File cleanup operation:', {
        options,
        result: result.data
      });

      return res.json(result);
    } catch (error) {
      logger.error('File cleanup failed:', error);
      return res.status(500).json({
        success: false,
        message: 'File cleanup failed',
        code: 'CLEANUP_FAILED'
      });
    }
  }
);

// Validate file integrity
router.post('/validate',
  requirePermission('upload:validate'),
  async (req: Request, res: Response) => {
    try {
      const result = await fileManager.validateFileIntegrity();

      logger.info('File integrity validation:', {
        result: result.data
      });

      return res.json(result);
    } catch (error) {
      logger.error('File validation failed:', error);
      return res.status(500).json({
        success: false,
        message: 'File validation failed',
        code: 'VALIDATION_FAILED'
      });
    }
  }
);

// Health check for file upload system
router.get('/health',
  async (req: Request, res: Response) => {
    try {
      const { staticFileHealthCheck } = await import('@/middleware/staticFileServer');
      const healthResult = await staticFileHealthCheck();
      const stats = fileManager.getStorageStats();

      return res.json({
        success: healthResult.status === 'healthy',
        data: {
          status: healthResult.status,
          details: healthResult.details,
          statistics: {
            totalFiles: stats.totalFiles,
            totalSize: stats.totalSize,
            categories: Object.keys(stats.categories).length
          }
        },
        message: `File upload system is ${healthResult.status}`
      });
    } catch (error) {
      logger.error('File upload health check failed:', error);
      return res.status(500).json({
        success: false,
        message: 'Health check failed',
        code: 'HEALTH_CHECK_FAILED'
      });
    }
  }
);

export default router;