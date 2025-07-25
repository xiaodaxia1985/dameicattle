import request from 'supertest';
import express from 'express';
import { responseWrapper } from '@/middleware/responseWrapper';
import { errorHandler } from '@/middleware/errorHandler';
import { validateSchema, ValidationTarget } from '@/middleware/schemaValidation';
import { ErrorFactory } from '@/utils/errorCategories';
import Joi from 'joi';

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Task 5 Verification: Standardized API Response Format and Error Handling', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Apply our middleware
    app.use(responseWrapper);

    // Test routes demonstrating all features
    app.get('/api/success', (req, res) => {
      res.success({ message: 'Task 5 implementation working!' }, 'Success response test');
    });

    app.get('/api/paginated', (req, res) => {
      const data = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
      res.paginated(data, { total: 25, page: 1, limit: 5 }, 'Paginated response test');
    });

    app.post('/api/validated', 
      validateSchema(
        Joi.object({
          name: Joi.string().required().min(2).max(50),
          email: Joi.string().email().required(),
          age: Joi.number().integer().min(18).max(120).required(),
        }),
        ValidationTarget.BODY
      ),
      (req, res) => {
        res.success(req.body, 'Validation passed successfully');
      }
    );

    app.get('/api/not-found-error', (req, res, next) => {
      const error = ErrorFactory.notFound('User', 999);
      next(error);
    });

    app.get('/api/validation-error', (req, res, next) => {
      const error = ErrorFactory.validation('Multiple validation errors occurred', {
        errors: [
          { field: 'name', message: 'Name is required', code: 'REQUIRED', value: null },
          { field: 'email', message: 'Invalid email format', code: 'INVALID_EMAIL', value: 'invalid-email' },
        ],
      });
      next(error);
    });

    app.get('/api/system-error', (req, res, next) => {
      const error = ErrorFactory.system('Database connection failed');
      next(error);
    });

    app.get('/api/business-error', (req, res, next) => {
      const error = ErrorFactory.businessLogic('Insufficient inventory for this operation', {
        availableQuantity: 5,
        requestedQuantity: 10,
      });
      next(error);
    });

    // Error handling middleware (must be last)
    app.use(errorHandler);
  });

  describe('Standardized Success Responses', () => {
    it('should return standardized success response format', async () => {
      const response = await request(app)
        .get('/api/success')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Task 5 implementation working!' },
        message: 'Success response test',
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });

      // Verify timestamp is valid ISO string
      expect(new Date(response.body.meta.timestamp).getTime()).not.toBeNaN();
    });

    it('should return standardized paginated response format', async () => {
      const response = await request(app)
        .get('/api/paginated')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({ id: expect.any(Number), name: expect.any(String) })
        ]),
        message: 'Paginated response test',
        pagination: {
          total: 25,
          page: 1,
          limit: 5,
          totalPages: 5,
        },
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });

      expect(response.body.data).toHaveLength(5);
    });
  });

  describe('Request/Response Validation', () => {
    it('should validate and accept valid request data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 30,
      };

      const response = await request(app)
        .post('/api/validated')
        .send(validData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: validData,
        message: 'Validation passed successfully',
        meta: expect.any(Object),
      });
    });

    it('should return validation errors for invalid request data', async () => {
      const invalidData = {
        name: 'A', // Too short
        email: 'invalid-email', // Invalid format
        age: 15, // Too young
      };

      const response = await request(app)
        .post('/api/validated')
        .send(invalidData)
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
            code: expect.any(String),
          }),
        ]),
        meta: expect.any(Object),
      });

      // Should have validation errors for all invalid fields
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should return validation errors for missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe',
        // Missing email and age
      };

      const response = await request(app)
        .post('/api/validated')
        .send(incompleteData)
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('required'),
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.stringContaining('required'),
          }),
        ]),
        meta: expect.any(Object),
      });
    });
  });

  describe('Error Categorization and Handling', () => {
    it('should handle not found errors with proper categorization', async () => {
      const response = await request(app)
        .get('/api/not-found-error')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found with id: 999',
        code: expect.any(String),
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('should handle validation errors with detailed error information', async () => {
      const response = await request(app)
        .get('/api/validation-error')
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Multiple validation errors occurred',
        code: 'VALIDATION_ERROR',
        errors: [
          {
            field: 'name',
            message: 'Name is required',
            code: 'REQUIRED',
            value: null,
          },
          {
            field: 'email',
            message: 'Invalid email format',
            code: 'INVALID_EMAIL',
            value: 'invalid-email',
          },
        ],
        meta: expect.any(Object),
      });
    });

    it('should handle system errors appropriately', async () => {
      const response = await request(app)
        .get('/api/system-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Database connection failed',
        code: expect.any(String),
        meta: expect.any(Object),
      });
    });

    it('should handle business logic errors with context', async () => {
      const response = await request(app)
        .get('/api/business-error')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Insufficient inventory for this operation',
        code: 'BUSINESS_LOGIC_ERROR',
        meta: expect.any(Object),
      });
    });
  });

  describe('HTTP Status Code Consistency', () => {
    it('should use correct HTTP status codes for different error types', async () => {
      // Test various error types and their expected status codes
      const testCases = [
        { endpoint: '/api/not-found-error', expectedStatus: 404 },
        { endpoint: '/api/validation-error', expectedStatus: 422 },
        { endpoint: '/api/system-error', expectedStatus: 500 },
        { endpoint: '/api/business-error', expectedStatus: 400 },
      ];

      for (const testCase of testCases) {
        await request(app)
          .get(testCase.endpoint)
          .expect(testCase.expectedStatus);
      }
    });
  });

  describe('Request ID Tracking', () => {
    it('should generate unique request IDs for tracking', async () => {
      const response1 = await request(app).get('/api/success');
      const response2 = await request(app).get('/api/success');

      expect(response1.body.meta.requestId).toBeDefined();
      expect(response2.body.meta.requestId).toBeDefined();
      expect(response1.body.meta.requestId).not.toBe(response2.body.meta.requestId);
    });

    it('should use provided request ID from headers', async () => {
      const customRequestId = 'test-request-12345';

      const response = await request(app)
        .get('/api/success')
        .set('x-request-id', customRequestId)
        .expect(200);

      expect(response.body.meta.requestId).toBe(customRequestId);
    });

    it('should maintain request ID consistency in error responses', async () => {
      const customRequestId = 'error-test-67890';

      const response = await request(app)
        .get('/api/not-found-error')
        .set('x-request-id', customRequestId)
        .expect(404);

      expect(response.body.meta.requestId).toBe(customRequestId);
    });
  });

  describe('Response Format Consistency', () => {
    it('should always include required fields in all responses', async () => {
      const endpoints = [
        { path: '/api/success', status: 200 },
        { path: '/api/not-found-error', status: 404 },
        { path: '/api/system-error', status: 500 },
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint.path)
          .expect(endpoint.status);

        // All responses should have these fields
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('meta');
        expect(response.body.meta).toHaveProperty('timestamp');
        expect(response.body.meta).toHaveProperty('requestId');
        expect(response.body.meta).toHaveProperty('version');

        // Success field should be boolean
        expect(typeof response.body.success).toBe('boolean');
      }
    });

    it('should have consistent timestamp format across all responses', async () => {
      const response = await request(app)
        .get('/api/success')
        .expect(200);

      const timestamp = response.body.meta.timestamp;
      
      // Should be valid ISO 8601 format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Should be parseable as a valid date
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
      
      // Should be recent (within last minute)
      const now = new Date();
      const timeDiff = now.getTime() - date.getTime();
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
    });
  });
});