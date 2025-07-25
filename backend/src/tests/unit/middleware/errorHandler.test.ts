import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '@/middleware/errorHandler';
import { CategorizedError, ErrorFactory, ErrorCategory } from '@/utils/errorCategories';

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      requestId: 'test-request-id',
      method: 'GET',
      path: '/test',
      url: '/test',
      ip: '127.0.0.1',
      user: { id: 1 } as any,
      get: jest.fn().mockReturnValue('test-user-agent'),
    };

    mockResponse = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      error: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Mock environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Error Handling', () => {
    it('should handle CategorizedError correctly', () => {
      const error = ErrorFactory.validation('Test validation error');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Test validation error',
        422,
        expect.any(String),
        undefined
      );
    });

    it('should skip if response headers already sent', () => {
      mockResponse.headersSent = true;
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.error).not.toHaveBeenCalled();
    });

    it('should categorize unknown errors as system errors', () => {
      const error = new Error('Unknown error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Unknown error',
        500,
        expect.any(String),
        undefined
      );
    });
  });

  describe('Specific Error Type Handling', () => {
    it('should handle ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Validation failed',
        422,
        expect.any(String),
        undefined
      );
    });

    it('should handle SequelizeValidationError with validation details', () => {
      const error: any = new Error('Sequelize validation failed');
      error.name = 'SequelizeValidationError';
      error.errors = [
        {
          path: 'name',
          message: 'Name is required',
          validatorKey: 'notNull',
          value: null,
        },
      ];

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Database validation failed',
        422,
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: 'Name is required',
            code: 'notNull',
            value: null,
          }),
        ])
      );
    });

    it('should handle JWT errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Invalid authentication token',
        401,
        expect.any(String),
        undefined
      );
    });

    it('should handle token expired errors', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Authentication token has expired',
        401,
        expect.any(String),
        undefined
      );
    });
  });

  describe('Production Environment Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = 'test';
    });

    it('should sanitize system error messages in production', () => {
      const error = ErrorFactory.system('Internal database connection failed');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'An internal error occurred. Please try again later.',
        500,
        expect.any(String),
        undefined
      );
    });

    it('should not sanitize validation error messages in production', () => {
      const error = ErrorFactory.validation('Name is required');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.error).toHaveBeenCalledWith(
        'Name is required',
        422,
        expect.any(String),
        undefined
      );
    });
  });

  describe('Fallback Response Format', () => {
    beforeEach(() => {
      // Remove the error method to test fallback
      delete mockResponse.error;
    });

    it('should use fallback response format when response wrapper not available', () => {
      const error = ErrorFactory.notFound('User', 123);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found with id: 123',
        code: expect.any(String),
        errors: undefined,
        meta: {
          timestamp: expect.any(String),
          requestId: 'test-request-id',
          version: '1.0.0',
        },
      });
    });

    it('should include stack trace in development fallback', () => {
      process.env.NODE_ENV = 'development';
      const error = ErrorFactory.validation('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs).toHaveProperty('stack');
      expect(callArgs).toHaveProperty('details');

      process.env.NODE_ENV = 'test';
    });
  });

  describe('Error Context Addition', () => {
    it('should add request context to categorized errors', () => {
      const error = ErrorFactory.businessLogic('Business rule violation');
      
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(error.context).toMatchObject({
        requestId: 'test-request-id',
        userId: 1,
        endpoint: '/test',
        method: 'GET',
        ip: '127.0.0.1',
        userAgent: 'test-user-agent',
      });
    });
  });
});

describe('Error Metrics', () => {
  const { ErrorMetrics } = require('@/middleware/errorHandler');

  beforeEach(() => {
    ErrorMetrics.reset();
  });

  it('should record error counts', () => {
    const error1 = ErrorFactory.validation('Error 1');
    const error2 = ErrorFactory.validation('Error 2');
    const error3 = ErrorFactory.notFound('Resource');

    ErrorMetrics.recordError(error1);
    ErrorMetrics.recordError(error2);
    ErrorMetrics.recordError(error3);

    const metrics = ErrorMetrics.getMetrics();

    expect(metrics.total).toBe(3);
    expect(metrics.errors).toHaveProperty('validation:VALIDATION_ERROR', 2);
    expect(metrics.errors).toHaveProperty('not_found:NOT_FOUND', 1);
  });

  it('should reset metrics', () => {
    const error = ErrorFactory.validation('Test error');
    ErrorMetrics.recordError(error);

    let metrics = ErrorMetrics.getMetrics();
    expect(metrics.total).toBe(1);

    ErrorMetrics.reset();
    metrics = ErrorMetrics.getMetrics();
    expect(metrics.total).toBe(0);
  });
});