import request from 'supertest';
import fs from 'fs';
import path from 'path';
import app from '@/app';
import { FileManagementService } from '@/services/FileManagementService';

describe('File Upload System', () => {
  let authToken: string;
  let fileManager: FileManagementService;
  const testFilesDir = path.join(__dirname, 'test-files');
  const uploadsDir = path.join(process.cwd(), 'uploads');

  beforeAll(async () => {
    // Create test files directory
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test files
    const testImagePath = path.join(testFilesDir, 'test-image.jpg');
    const testDocPath = path.join(testFilesDir, 'test-document.pdf');
    const testTextPath = path.join(testFilesDir, 'test-file.txt');

    // Create dummy files for testing
    fs.writeFileSync(testImagePath, Buffer.from('fake-image-data'));
    fs.writeFileSync(testDocPath, Buffer.from('fake-pdf-data'));
    fs.writeFileSync(testTextPath, 'This is a test file content');

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });

    authToken = loginResponse.body.data.token;
    fileManager = FileManagementService.getInstance();
  });

  afterAll(async () => {
    // Cleanup test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }

    // Cleanup uploads directory
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir, { recursive: true });
      files.forEach(file => {
        const filePath = path.join(uploadsDir, file as string);
        if (fs.statSync(filePath).isFile() && !filePath.includes('.file-registry.json')) {
          fs.unlinkSync(filePath);
        }
      });
    }
  });

  describe('File Upload Middleware', () => {
    test('should upload image successfully', async () => {
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');

      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('url');
      expect(response.body.data).toHaveProperty('filename');
      expect(response.body.data.originalName).toBe('test-image.jpg');
      expect(response.body.message).toBe('Image uploaded successfully');
    });

    test('should upload document successfully', async () => {
      const testDocPath = path.join(testFilesDir, 'test-document.pdf');

      const response = await request(app)
        .post('/api/v1/upload/document')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testDocPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.originalName).toBe('test-document.pdf');
      expect(response.body.message).toBe('Document uploaded successfully');
    });

    test('should upload general file successfully', async () => {
      const testTextPath = path.join(testFilesDir, 'test-file.txt');

      const response = await request(app)
        .post('/api/v1/upload/file')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testTextPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.originalName).toBe('test-file.txt');
      expect(response.body.message).toBe('File uploaded successfully');
    });

    test('should reject upload without file', async () => {
      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_FILE_PROVIDED');
    });

    test('should reject unauthorized upload', async () => {
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');

      const response = await request(app)
        .post('/api/v1/upload/image')
        .attach('file', testImagePath);

      expect(response.status).toBe(401);
    });
  });

  describe('Batch Upload', () => {
    test('should upload multiple files successfully', async () => {
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');
      const testTextPath = path.join(testFilesDir, 'test-file.txt');

      const response = await request(app)
        .post('/api/v1/upload/batch')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('files', testImagePath)
        .attach('files', testTextPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.files).toHaveLength(2);
      expect(response.body.data.summary.successful).toBe(2);
      expect(response.body.data.summary.failed).toBe(0);
    });
  });

  describe('File Management', () => {
    let uploadedFileId: string;

    beforeAll(async () => {
      // Upload a test file for management operations
      const testTextPath = path.join(testFilesDir, 'test-file.txt');
      const response = await request(app)
        .post('/api/v1/upload/file')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testTextPath);

      uploadedFileId = response.body.data.id;
    });

    test('should list files with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/upload/files')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('files');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.files)).toBe(true);
    });

    test('should get file metadata by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/upload/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(uploadedFileId);
    });

    test('should move file to different category', async () => {
      const response = await request(app)
        .put(`/api/v1/upload/files/${uploadedFileId}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ category: 'documents' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.category).toBe('documents');
    });

    test('should get storage statistics', async () => {
      const response = await request(app)
        .get('/api/v1/upload/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalFiles');
      expect(response.body.data).toHaveProperty('totalSize');
      expect(response.body.data).toHaveProperty('categories');
    });

    test('should delete file by ID', async () => {
      const response = await request(app)
        .delete(`/api/v1/upload/${uploadedFileId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/v1/upload/files/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('FILE_NOT_FOUND');
    });
  });

  describe('File Cleanup', () => {
    test('should perform dry run cleanup', async () => {
      const response = await request(app)
        .post('/api/v1/upload/cleanup')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          maxAge: 1000, // Very short age for testing
          dryRun: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Would cleanup');
    });

    test('should validate file integrity', async () => {
      const response = await request(app)
        .post('/api/v1/upload/validate')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBeDefined();
      expect(response.body.data).toHaveProperty('validFiles');
      expect(response.body.data).toHaveProperty('issues');
    });
  });

  describe('Static File Serving', () => {
    let uploadedFile: any;

    beforeAll(async () => {
      // Upload a test file to serve
      const testImagePath = path.join(testFilesDir, 'test-image.jpg');
      const response = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testImagePath);

      uploadedFile = response.body.data;
    });

    test('should serve uploaded file', async () => {
      const response = await request(app)
        .get(uploadedFile.url);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('image');
    });

    test('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/uploads/non-existent-file.jpg');

      expect(response.status).toBe(404);
    });

    test('should prevent directory traversal', async () => {
      const response = await request(app)
        .get('/uploads/../../../etc/passwd');

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('DIRECTORY_TRAVERSAL_DENIED');
    });
  });

  describe('Health Check', () => {
    test('should return file upload system health', async () => {
      const response = await request(app)
        .get('/api/v1/upload/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBeDefined();
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('statistics');
    });
  });

  describe('File Management Service', () => {
    test('should register and retrieve file metadata', () => {
      const mockFile = {
        filename: 'test-file.txt',
        originalname: 'original-test.txt',
        path: '/uploads/test-file.txt',
        size: 1024,
        mimetype: 'text/plain'
      } as Express.Multer.File;

      const metadata = fileManager.registerFile(mockFile, 'test', 'user123');

      expect(metadata).toHaveProperty('id');
      expect(metadata.filename).toBe('test-file.txt');
      expect(metadata.category).toBe('test');
      expect(metadata.uploadedBy).toBe('user123');

      const retrieved = fileManager.getFileMetadata(metadata.id);
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
    });

    test('should get storage statistics', () => {
      const stats = fileManager.getStorageStats();

      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('categories');
      expect(typeof stats.totalFiles).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
    });
  });
});