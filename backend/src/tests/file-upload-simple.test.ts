import { FileManagementService } from '@/services/FileManagementService';
import * as fs from 'fs';
import * as path from 'path';

describe('File Upload System - Simple Tests', () => {
  let fileManager: FileManagementService;
  const testUploadsDir = path.join(process.cwd(), 'test-uploads');

  beforeAll(() => {
    // Create test uploads directory
    if (!fs.existsSync(testUploadsDir)) {
      fs.mkdirSync(testUploadsDir, { recursive: true });
    }

    fileManager = FileManagementService.getInstance();
  });

  afterAll(() => {
    // Cleanup test uploads directory
    if (fs.existsSync(testUploadsDir)) {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    }
  });

  describe('FileManagementService', () => {
    test('should be a singleton', () => {
      const instance1 = FileManagementService.getInstance();
      const instance2 = FileManagementService.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('should register file metadata', () => {
      const mockFile = {
        filename: 'test-file.txt',
        originalname: 'original-test.txt',
        path: path.join(testUploadsDir, 'test-file.txt'),
        size: 1024,
        mimetype: 'text/plain'
      } as Express.Multer.File;

      // Create the actual file for testing
      fs.writeFileSync(mockFile.path, 'test content');

      const metadata = fileManager.registerFile(mockFile, 'test', 'user123');

      expect(metadata).toHaveProperty('id');
      expect(metadata.filename).toBe('test-file.txt');
      expect(metadata.originalName).toBe('original-test.txt');
      expect(metadata.category).toBe('test');
      expect(metadata.uploadedBy).toBe('user123');
      expect(metadata.size).toBe(1024);
      expect(metadata.mimetype).toBe('text/plain');
    });

    test('should retrieve file metadata by ID', () => {
      const mockFile = {
        filename: 'test-file-2.txt',
        originalname: 'original-test-2.txt',
        path: path.join(testUploadsDir, 'test-file-2.txt'),
        size: 2048,
        mimetype: 'text/plain'
      } as Express.Multer.File;

      // Create the actual file for testing
      fs.writeFileSync(mockFile.path, 'test content 2');

      const metadata = fileManager.registerFile(mockFile, 'test', 'user456');
      const retrieved = fileManager.getFileMetadata(metadata.id);

      expect(retrieved).toEqual(metadata);
    });

    test('should retrieve file by filename', () => {
      const mockFile = {
        filename: 'unique-test-file.txt',
        originalname: 'unique-original.txt',
        path: path.join(testUploadsDir, 'unique-test-file.txt'),
        size: 512,
        mimetype: 'text/plain'
      } as Express.Multer.File;

      // Create the actual file for testing
      fs.writeFileSync(mockFile.path, 'unique test content');

      const metadata = fileManager.registerFile(mockFile, 'test', 'user789');
      const retrieved = fileManager.getFileByFilename('unique-test-file.txt');

      expect(retrieved).toEqual(metadata);
    });

    test('should list files with filtering', () => {
      const result = fileManager.listFiles({
        category: 'test',
        limit: 10,
        offset: 0
      });

      expect(result).toHaveProperty('files');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.files)).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    test('should get storage statistics', () => {
      const stats = fileManager.getStorageStats();

      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('categories');
      expect(typeof stats.totalFiles).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
      expect(stats.totalFiles).toBeGreaterThan(0);
    });

    test('should move file to different category', async () => {
      const mockFile = {
        filename: 'movable-file.txt',
        originalname: 'movable-original.txt',
        path: path.join(testUploadsDir, 'movable-file.txt'),
        size: 256,
        mimetype: 'text/plain'
      } as Express.Multer.File;

      // Create the actual file for testing
      fs.writeFileSync(mockFile.path, 'movable content');

      const metadata = fileManager.registerFile(mockFile, 'test', 'user999');
      
      // Create the target directory
      const newCategoryDir = path.join(testUploadsDir, 'documents');
      if (!fs.existsSync(newCategoryDir)) {
        fs.mkdirSync(newCategoryDir, { recursive: true });
      }

      const result = await fileManager.moveFile(metadata.id, 'documents');

      expect(result.success).toBe(true);
      expect(result.data?.category).toBe('documents');
    });

    test('should validate file integrity', async () => {
      const result = await fileManager.validateFileIntegrity();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('validFiles');
      expect(result.data).toHaveProperty('issues');
      expect(typeof result.data.validFiles).toBe('number');
      expect(Array.isArray(result.data.issues)).toBe(true);
    });
  });

  describe('File Upload Configuration', () => {
    test('should have proper file type configurations', () => {
      const { getFileConfig } = require('@/middleware/fileUpload');
      
      const imageConfig = getFileConfig('image');
      expect(imageConfig).toHaveProperty('maxFileSize');
      expect(imageConfig).toHaveProperty('allowedMimeTypes');
      expect(imageConfig).toHaveProperty('allowedExtensions');
      expect(imageConfig.allowedMimeTypes).toContain('image/jpeg');
      expect(imageConfig.allowedExtensions).toContain('.jpg');

      const documentConfig = getFileConfig('document');
      expect(documentConfig.allowedMimeTypes).toContain('application/pdf');
      expect(documentConfig.allowedExtensions).toContain('.pdf');
    });
  });
});