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

describe('Error Handling Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(responseWrapper);

    // Test routes
    app.get('/success', (req, res) => {
      res.success({ message: 'Hello World' }, 'Operation successful');
    });

    app.get('/paginated', (req, res) => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { total: 10, page: 1, limit: 2 };
      res.paginated(data, pagination, 'Data retrieved');
    });

    app.get('/error', (req, res, next) => {
      const error = ErrorFactory.notFound('User', 123);
      next(error);
    });

    app.get('/validation-error', (req, res, next) => {
      const error = ErrorFactory.validation('Validation failed', {
        errors: [
          { field: 'name', message: 'Name is required', code: 'REQUIRED' },
          { field: 'email', message: 'Invalid email', code: 'INVALID_EMAIL' },
        ],
      });
      next(error);
    });

    app.get('/system-error', (req, res, next) => {
      const error = ErrorFactory.system('Database connection failed');
      next(error);
    });

    app.post('/with-validation', 
      validateSchema(
        Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          age: Joi.number().integer().min(0).max(120).required(),
        }),
        ValidationTarget.BODY
      ),
      (req, res) => {
        res.success(req.body, 'Validation passed');
      }
    );

    app.get('/throw-error', (req, res, next) => {
      throw new Error('Unexpected error');
    });

    // Error handling middleware (must be last)
    app.use(errorHandler);
  });

  describe('Success Responses', () => {
    it('should return standardized success response', async () => {
      const response = await request(app)
        .get('/success')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: { message: 'Hello World' },
        message: 'Operation successful',
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('should return standardized paginated response', async () => {
      const response = await request(app)
        .get('/paginated')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        message: 'Data retrieved',
        pagination: {
          total: 10,
          page: 1,
          limit: 2,
          totalPages: 5,
        },
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });
  });

  describe('Error Responses', () => {
    it('should return standardized error response for not found', async () => {
      const response = await request(app)
        .get('/error')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'User not found with id: 123',
        code: expect.any(String),
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('should return validation errors in standardized format', async () => {
      const response = await request(app)
        .get('/validation-error')
        .expect(422);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Validation failed',
        code: expect.any(String),
        errors: [
          { field: 'name', message: 'Name is required', code: 'REQUIRED' },
          { field: 'email', message: 'Invalid email', code: 'INVALID_EMAIL' },
        ],
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('should handle system errors appropriately', async () => {
      const response = await request(app)
        .get('/system-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Database connection failed',
        code: expect.any(String),
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });

    it('should handle thrown errors', async () => {
      const response = await request(app)
        .get('/throw-error')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Unexpected error',
        code: expect.any(String),
        meta: {
          timestamp: expect.any(String),
          requestId: expect.any(String),
          version: expect.any(String),
        },
      });
    });
  });

  describe('Schema Validation Integration', () => {
    it('should validate request and return success', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const response = await request(app)
        .post('/with-validation')
        .send(validData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: validData,
        message: 'Validation passed',
      });
    });

    it('should return validation errors for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty string
        email: 'invalid-email', // Invalid: not a valid email
        age: 150, // Invalid: exceeds max age
      };

      const response = await request(app)
        .post('/with-validation')
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
      });
    });

    it('should return validation errors for missing required fields', async () => {
      const incompleteData = {
        name: 'John Doe',
        // Missing email and age
      };

      const response = await request(app)
        .post('/with-validation')
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
      });
    });
  });

  describe('Request ID Tracking', () => {
    it('should use provided request ID from headers', async () => {
      const customRequestId = 'custom-test-request-id';

      const response = await request(app)
        .get('/success')
        .set('x-request-id', customRequestId)
        .expect(200);

      expect(response.body.meta.requestId).toBe(customRequestId);
    });

    it('should generate request ID when not provided', async () => {
      const response = await request(app)
        .get('/success')
        .expect(200);

      expect(response.body.meta.requestId).toBeDefined();
      expect(typeof response.body.meta.requestId).toBe('string');
      expect(response.body.meta.requestId.length).toBeGreaterThan(0);
    });

    it('should maintain same request ID in error responses', async () => {
      const customRequestId = 'error-test-request-id';

      const response = await request(app)
        .get('/error')
        .set('x-request-id', customRequestId)
        .expect(404);

      expect(response.body.meta.requestId).toBe(customRequestId);
    });
  });

  describe('Response Consistency', () => {
    it('should always include meta information', async () => {
      const successResponse = await request(app)
        .get('/success')
        .expect(200);

      const errorResponse = await request(app)
        .get('/error')
        .expect(404);

      // Both responses should have meta
      expect(successResponse.body.meta).toBeDefined();
      expect(errorResponse.body.meta).toBeDefined();

      // Meta should have required fields
      ['timestamp', 'requestId', 'version'].forEach(field => {
        expect(successResponse.body.meta[field]).toBeDefined();
        expect(errorResponse.body.meta[field]).toBeDefined();
      });
    });

    it('should always include success field', async () => {
      const successResponse = await request(app)
        .get('/success')
        .expect(200);

      const errorResponse = await request(app)
        .get('/error')
        .expect(404);

      expect(successResponse.body.success).toBe(true);
      expect(errorResponse.body.success).toBe(false);
    });

    it('should have consistent timestamp format', async () => {
      const response = await request(app)
        .get('/success')
        .expect(200);

      const timestamp = response.body.meta.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      // Should be a valid date
      const date = new Date(timestamp);
      expect(date.getTime()).not.toBeNaN();
    });
  });
});