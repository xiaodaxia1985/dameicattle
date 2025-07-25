import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { configManager } from '@/config/ConfigManager';

// File upload configuration interface
interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  uploadPath: string;
  createDirectories: boolean;
}

// Default configurations for different file types
const FILE_CONFIGS: Record<string, FileUploadConfig> = {
  image: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    uploadPath: 'uploads/images',
    createDirectories: true
  },
  document: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
    uploadPath: 'uploads/documents',
    createDirectories: true
  },
  avatar: {
    maxFileSize: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
    uploadPath: 'uploads/avatars',
    createDirectories: true
  },
  general: {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [], // Will be validated by extension
    allowedExtensions: [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv',
      '.zip', '.rar', '.7z'
    ],
    uploadPath: 'uploads/files',
    createDirectories: true
  }
};

// File upload error types
export class FileUploadError extends Error {
  public code: string;
  public statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.name = 'FileUploadError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Ensure directory exists
const ensureDirectoryExists = (dirPath: string): void => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Created upload directory: ${dirPath}`);
    }
  } catch (error) {
    logger.error(`Failed to create directory ${dirPath}:`, error);
    throw new FileUploadError(
      'Failed to create upload directory',
      'DIRECTORY_CREATION_FAILED',
      500
    );
  }
};

// Generate unique filename
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  
  // Sanitize filename
  const sanitizedBaseName = baseName
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 50);
  
  return `${sanitizedBaseName}_${timestamp}_${randomSuffix}${ext}`;
};

// Validate file type
const validateFileType = (file: Express.Multer.File, config: FileUploadConfig): void => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const fileMimeType = file.mimetype.toLowerCase();

  // Check extension
  if (config.allowedExtensions.length > 0 && !config.allowedExtensions.includes(fileExtension)) {
    throw new FileUploadError(
      `File extension ${fileExtension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
      'INVALID_FILE_EXTENSION'
    );
  }

  // Check MIME type (if specified)
  if (config.allowedMimeTypes.length > 0 && !config.allowedMimeTypes.includes(fileMimeType)) {
    throw new FileUploadError(
      `File type ${fileMimeType} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
      'INVALID_MIME_TYPE'
    );
  }
};

// Create multer storage configuration
const createStorage = (fileType: string = 'general') => {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.general;

  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        const uploadPath = path.join(process.cwd(), config.uploadPath);
        
        if (config.createDirectories) {
          ensureDirectoryExists(uploadPath);
        }
        
        cb(null, uploadPath);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      try {
        const uniqueFilename = generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
      } catch (error) {
        cb(error as Error, '');
      }
    }
  });
};

// Create file filter
const createFileFilter = (fileType: string = 'general') => {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.general;

  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    try {
      validateFileType(file, config);
      cb(null, true);
    } catch (error) {
      cb(error as Error);
    }
  };
};

// Create multer upload middleware
export const createUploadMiddleware = (
  fileType: string = 'general',
  fieldName: string = 'file',
  multiple: boolean = false,
  maxCount: number = 10
) => {
  const config = FILE_CONFIGS[fileType] || FILE_CONFIGS.general;
  
  const upload = multer({
    storage: createStorage(fileType),
    limits: {
      fileSize: config.maxFileSize,
      files: multiple ? maxCount : 1
    },
    fileFilter: createFileFilter(fileType)
  });

  if (multiple) {
    return upload.array(fieldName, maxCount);
  } else {
    return upload.single(fieldName);
  }
};

// File upload progress tracking middleware
export const trackUploadProgress = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const contentLength = parseInt(req.get('content-length') || '0');

  // Add progress tracking to request
  (req as any).uploadProgress = {
    startTime,
    contentLength,
    bytesReceived: 0
  };

  // Track bytes received
  req.on('data', (chunk) => {
    (req as any).uploadProgress.bytesReceived += chunk.length;
  });

  next();
};

// Error handling middleware for file uploads
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let code = 'UPLOAD_ERROR';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum allowed limit';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE_FIELD';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in multipart form';
        code = 'TOO_MANY_PARTS';
        break;
      default:
        message = error.message;
    }

    logger.warn('Multer upload error:', {
      code: error.code,
      message: error.message,
      field: error.field
    });

    return res.status(400).json({
      success: false,
      message,
      code,
      details: {
        field: error.field,
        originalError: error.code
      }
    });
  }

  if (error instanceof FileUploadError) {
    logger.warn('File upload validation error:', {
      code: error.code,
      message: error.message
    });

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code
    });
  }

  // Generic error
  logger.error('Unexpected file upload error:', error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error during file upload',
    code: 'INTERNAL_UPLOAD_ERROR'
  });
};

// File cleanup utility
export const cleanupFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (error) => {
      if (error && error.code !== 'ENOENT') {
        logger.error(`Failed to cleanup file ${filePath}:`, error);
        reject(error);
      } else {
        logger.info(`File cleaned up: ${filePath}`);
        resolve();
      }
    });
  });
};

// Batch file cleanup
export const cleanupFiles = async (filePaths: string[]): Promise<void> => {
  const cleanupPromises = filePaths.map(filePath => 
    cleanupFile(filePath).catch(error => {
      logger.warn(`Failed to cleanup file ${filePath}:`, error);
    })
  );
  
  await Promise.all(cleanupPromises);
};

// Get file configuration
export const getFileConfig = (fileType: string): FileUploadConfig => {
  return FILE_CONFIGS[fileType] || FILE_CONFIGS.general;
};

// Validate uploaded file
export const validateUploadedFile = (file: Express.Multer.File, fileType: string = 'general'): void => {
  if (!file) {
    throw new FileUploadError('No file provided', 'NO_FILE_PROVIDED');
  }

  const config = getFileConfig(fileType);
  validateFileType(file, config);

  // Additional validation can be added here
  if (file.size === 0) {
    throw new FileUploadError('Empty file is not allowed', 'EMPTY_FILE');
  }
};