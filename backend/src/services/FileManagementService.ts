import * as fs from 'fs';
import * as path from 'path';
import { logger } from '@/utils/logger';
import { cleanupFile, cleanupFiles } from '@/middleware/fileUpload';

// File metadata interface
export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy?: string;
  category: string;
  checksum?: string;
}

// File operation result
export interface FileOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

// Directory cleanup options
interface CleanupOptions {
  maxAge?: number; // in milliseconds
  maxSize?: number; // in bytes
  pattern?: RegExp;
  dryRun?: boolean;
}

export class FileManagementService {
  private static instance: FileManagementService;
  private uploadsPath: string;
  private fileRegistry: Map<string, FileMetadata> = new Map();

  private constructor() {
    this.uploadsPath = path.join(process.cwd(), 'uploads');
    this.ensureDirectoryStructure();
    this.loadFileRegistry();
  }

  public static getInstance(): FileManagementService {
    if (!FileManagementService.instance) {
      FileManagementService.instance = new FileManagementService();
    }
    return FileManagementService.instance;
  }

  // Ensure upload directory structure exists
  private ensureDirectoryStructure(): void {
    const directories = [
      'uploads',
      'uploads/images',
      'uploads/documents',
      'uploads/avatars',
      'uploads/files',
      'uploads/temp'
    ];

    directories.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        try {
          fs.mkdirSync(fullPath, { recursive: true });
          logger.info(`Created directory: ${fullPath}`);
        } catch (error) {
          logger.error(`Failed to create directory ${fullPath}:`, error);
        }
      }
    });
  }

  // Load file registry from filesystem
  private loadFileRegistry(): void {
    try {
      const registryPath = path.join(this.uploadsPath, '.file-registry.json');
      if (fs.existsSync(registryPath)) {
        const data = fs.readFileSync(registryPath, 'utf8');
        const registry = JSON.parse(data);
        
        Object.entries(registry).forEach(([key, value]) => {
          this.fileRegistry.set(key, value as FileMetadata);
        });
        
        logger.info(`Loaded ${this.fileRegistry.size} files from registry`);
      }
    } catch (error) {
      logger.warn('Failed to load file registry:', error);
    }
  }

  // Save file registry to filesystem
  private saveFileRegistry(): void {
    try {
      const registryPath = path.join(this.uploadsPath, '.file-registry.json');
      const registry = Object.fromEntries(this.fileRegistry);
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    } catch (error) {
      logger.error('Failed to save file registry:', error);
    }
  }

  // Register uploaded file
  public registerFile(file: Express.Multer.File, category: string, uploadedBy?: string): FileMetadata {
    const metadata: FileMetadata = {
      id: this.generateFileId(),
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date(),
      uploadedBy,
      category
    };

    this.fileRegistry.set(metadata.id, metadata);
    this.saveFileRegistry();

    logger.info('File registered:', {
      id: metadata.id,
      filename: metadata.filename,
      size: metadata.size,
      category: metadata.category
    });

    return metadata;
  }

  // Get file metadata
  public getFileMetadata(fileId: string): FileMetadata | null {
    return this.fileRegistry.get(fileId) || null;
  }

  // Get file by filename
  public getFileByFilename(filename: string): FileMetadata | null {
    for (const metadata of Array.from(this.fileRegistry.values())) {
      if (metadata.filename === filename) {
        return metadata;
      }
    }
    return null;
  }

  // List files with filtering
  public listFiles(options: {
    category?: string;
    uploadedBy?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'uploadedAt' | 'size' | 'filename';
    sortOrder?: 'asc' | 'desc';
  } = {}): { files: FileMetadata[]; total: number } {
    let files = Array.from(this.fileRegistry.values());

    // Apply filters
    if (options.category) {
      files = files.filter(f => f.category === options.category);
    }
    if (options.uploadedBy) {
      files = files.filter(f => f.uploadedBy === options.uploadedBy);
    }

    // Sort files
    if (options.sortBy) {
      files.sort((a, b) => {
        const aValue = a[options.sortBy!];
        const bValue = b[options.sortBy!];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return options.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    const total = files.length;

    // Apply pagination
    if (options.offset) {
      files = files.slice(options.offset);
    }
    if (options.limit) {
      files = files.slice(0, options.limit);
    }

    return { files, total };
  }

  // Delete file
  public async deleteFile(fileId: string): Promise<FileOperationResult> {
    try {
      const metadata = this.fileRegistry.get(fileId);
      if (!metadata) {
        return {
          success: false,
          message: 'File not found',
          error: 'FILE_NOT_FOUND'
        };
      }

      // Delete physical file
      if (fs.existsSync(metadata.path)) {
        await cleanupFile(metadata.path);
      }

      // Remove from registry
      this.fileRegistry.delete(fileId);
      this.saveFileRegistry();

      logger.info('File deleted:', {
        id: fileId,
        filename: metadata.filename
      });

      return {
        success: true,
        message: 'File deleted successfully',
        data: { id: fileId }
      };
    } catch (error) {
      logger.error('Failed to delete file:', error);
      return {
        success: false,
        message: 'Failed to delete file',
        error: 'DELETE_FAILED'
      };
    }
  }

  // Batch delete files
  public async deleteFiles(fileIds: string[]): Promise<FileOperationResult> {
    try {
      const results = await Promise.allSettled(
        fileIds.map(id => this.deleteFile(id))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      return {
        success: failed === 0,
        message: `Deleted ${successful} files, ${failed} failed`,
        data: {
          successful,
          failed,
          total: results.length
        }
      };
    } catch (error) {
      logger.error('Batch delete failed:', error);
      return {
        success: false,
        message: 'Batch delete failed',
        error: 'BATCH_DELETE_FAILED'
      };
    }
  }

  // Clean up old or large files
  public async cleanupFiles(options: CleanupOptions = {}): Promise<FileOperationResult> {
    try {
      const {
        maxAge = 30 * 24 * 60 * 60 * 1000, // 30 days
        maxSize = 100 * 1024 * 1024, // 100MB per file
        pattern,
        dryRun = false
      } = options;

      const now = Date.now();
      const filesToCleanup: string[] = [];
      let totalSizeToCleanup = 0;

      for (const [id, metadata] of Array.from(this.fileRegistry.entries())) {
        let shouldCleanup = false;

        // Check age
        if (now - metadata.uploadedAt.getTime() > maxAge) {
          shouldCleanup = true;
        }

        // Check size
        if (metadata.size > maxSize) {
          shouldCleanup = true;
        }

        // Check pattern
        if (pattern && pattern.test(metadata.filename)) {
          shouldCleanup = true;
        }

        if (shouldCleanup) {
          filesToCleanup.push(id);
          totalSizeToCleanup += metadata.size;
        }
      }

      if (dryRun) {
        return {
          success: true,
          message: `Would cleanup ${filesToCleanup.length} files (${this.formatFileSize(totalSizeToCleanup)})`,
          data: {
            fileCount: filesToCleanup.length,
            totalSize: totalSizeToCleanup,
            files: filesToCleanup.map(id => this.fileRegistry.get(id))
          }
        };
      }

      // Perform actual cleanup
      const result = await this.deleteFiles(filesToCleanup);

      logger.info('File cleanup completed:', {
        filesProcessed: filesToCleanup.length,
        totalSizeFreed: totalSizeToCleanup,
        successful: result.data?.successful || 0,
        failed: result.data?.failed || 0
      });

      return {
        success: result.success,
        message: `Cleanup completed: ${result.message}`,
        data: {
          ...result.data,
          totalSizeFreed: totalSizeToCleanup
        }
      };
    } catch (error) {
      logger.error('File cleanup failed:', error);
      return {
        success: false,
        message: 'File cleanup failed',
        error: 'CLEANUP_FAILED'
      };
    }
  }

  // Get storage statistics
  public getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    categories: Record<string, { count: number; size: number }>;
    oldestFile: Date | null;
    newestFile: Date | null;
  } {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      categories: {} as Record<string, { count: number; size: number }>,
      oldestFile: null as Date | null,
      newestFile: null as Date | null
    };

    for (const metadata of Array.from(this.fileRegistry.values())) {
      stats.totalFiles++;
      stats.totalSize += metadata.size;

      // Category stats
      if (!stats.categories[metadata.category]) {
        stats.categories[metadata.category] = { count: 0, size: 0 };
      }
      stats.categories[metadata.category].count++;
      stats.categories[metadata.category].size += metadata.size;

      // Date tracking
      if (!stats.oldestFile || metadata.uploadedAt < stats.oldestFile) {
        stats.oldestFile = metadata.uploadedAt;
      }
      if (!stats.newestFile || metadata.uploadedAt > stats.newestFile) {
        stats.newestFile = metadata.uploadedAt;
      }
    }

    return stats;
  }

  // Validate file integrity
  public async validateFileIntegrity(): Promise<FileOperationResult> {
    try {
      const issues: string[] = [];
      let validFiles = 0;

      for (const [id, metadata] of Array.from(this.fileRegistry.entries())) {
        if (!fs.existsSync(metadata.path)) {
          issues.push(`File missing: ${metadata.filename} (${id})`);
          // Remove from registry
          this.fileRegistry.delete(id);
        } else {
          const stats = fs.statSync(metadata.path);
          if (stats.size !== metadata.size) {
            issues.push(`Size mismatch: ${metadata.filename} (expected: ${metadata.size}, actual: ${stats.size})`);
          } else {
            validFiles++;
          }
        }
      }

      if (issues.length > 0) {
        this.saveFileRegistry(); // Save updated registry
      }

      return {
        success: issues.length === 0,
        message: `Validation completed: ${validFiles} valid files, ${issues.length} issues found`,
        data: {
          validFiles,
          issues,
          totalFiles: validFiles + issues.length
        }
      };
    } catch (error) {
      logger.error('File integrity validation failed:', error);
      return {
        success: false,
        message: 'File integrity validation failed',
        error: 'VALIDATION_FAILED'
      };
    }
  }

  // Generate unique file ID
  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format file size for display
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  // Move file to different category
  public async moveFile(fileId: string, newCategory: string): Promise<FileOperationResult> {
    try {
      const metadata = this.fileRegistry.get(fileId);
      if (!metadata) {
        return {
          success: false,
          message: 'File not found',
          error: 'FILE_NOT_FOUND'
        };
      }

      const oldPath = metadata.path;
      const newDir = path.join(this.uploadsPath, newCategory);
      
      // Ensure new directory exists
      if (!fs.existsSync(newDir)) {
        fs.mkdirSync(newDir, { recursive: true });
      }

      const newPath = path.join(newDir, metadata.filename);

      // Move file
      fs.renameSync(oldPath, newPath);

      // Update metadata
      metadata.category = newCategory;
      metadata.path = newPath;
      this.fileRegistry.set(fileId, metadata);
      this.saveFileRegistry();

      logger.info('File moved:', {
        id: fileId,
        from: oldPath,
        to: newPath,
        category: newCategory
      });

      return {
        success: true,
        message: 'File moved successfully',
        data: metadata
      };
    } catch (error) {
      logger.error('Failed to move file:', error);
      return {
        success: false,
        message: 'Failed to move file',
        error: 'MOVE_FAILED'
      };
    }
  }
}