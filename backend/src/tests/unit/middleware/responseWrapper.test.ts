import { Request, Response, NextFunction } from 'express';
import { responseWrapper, StandardApiResponse } from '@/middleware/responseWrapper';

// Mock logger
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Response Wrapper Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      method: 'GET',
      path: '/test',
      user: { id: 1 } as any,
      startTime: Date.now(),
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Mock Date.now for consistent timestamps
    jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-02-13T23:31:30.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Middleware Setup', () => {
    it('should add custom methods to response object', () => {
      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.success).toBeDefined();
      expect(mockResponse.error).toBeDefined();
      expect(mockResponse.paginated).toBeDefined();
      expect(typeof mockResponse.success).toBe('function');
      expect(typeof mockResponse.error).toBe('function');
      expect(typeof mockResponse.paginated).toBe('function');
    });

    it('should set request ID and start time', () => {
      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.requestId).toBeDefined();
      expect(mockRequest.startTime).toBeDefined();
    });

    it('should use provided request ID from headers', () => {
      mockRequest.headers = { 'x-request-id': 'custom-request-id' };

      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.requestId).toBe('custom-request-id');
    });

    it('should call next middleware', () => {
      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Success Response Method', () => {
    beforeEach(() => {
      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);
    });

    it('should create success response with data', () => {
      const testData = { id: 1, name: 'Test' };
      const message = 'Success message';

      mockResponse.success!(testData, message);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
        message,
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: expect.any(String),
          version: '1.0.0',
        },
      });
    });

    it('should create success response without data', () => {
      mockResponse.success!();

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: undefined,
        message: undefined,
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: expect.any(String),
          version: '1.0.0',
        },
      });
    });

    it('should use custom status code', () => {
      mockResponse.success!({ id: 1 }, 'Created', 201);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Error Response Method', () => {
    beforeEach(() => {
      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);
    });

    it('should create error response with message', () => {
      const message = 'Error message';
      const statusCode = 400;
      const code = 'BAD_REQUEST';

      mockResponse.error!(message, statusCode, code);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        errors: undefined,
        code,
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: expect.any(String),
          version: '1.0.0',
        },
      });
    });

    it('should create error response with validation errors', () => {
      const message = 'Validation failed';
      const errors = [
        { field: 'name', message: 'Name is required', code: 'REQUIRED', value: null },
      ];

      mockResponse.error!(message, 422, 'VALIDATION_ERROR', errors);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message,
        errors,
        code: 'VALIDATION_ERROR',
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: expect.any(String),
          version: '1.0.0',
        },
      });
    });

    it('should use default status code 500', () => {
      mockResponse.error!('Internal error');

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Paginated Response Method', () => {
    beforeEach(() => {
      responseWrapper(mockRequest as Request, mockResponse as Response, mockNext);
    });

    it('should create paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { total: 10, page: 1, limit: 2 };
      const message = 'Data retrieved';

      mockResponse.paginated!(data, pagination, message);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
        pagination: {
          ...pagination,
          totalPages: 5,
        },
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: expect.any(String),
          version: '1.0.0',
        },
      });
    });

    it('should calculate total pages correctly', () => {
      const data = [{ id: 1 }];
      const pagination = { total: 7, page: 1, limit: 3 };

      mockResponse.paginated!(data, pagination);

      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(callArgs.pagination.totalPages).toBe(3); // Math.ceil(7/3) = 3
    });
  });
});

describe('ApiResponse Helper Class', () => {
  beforeEach(() => {
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-02-13T23:31:30.000Z');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('success method', () => {
    it('should create success response', () => {
      const data = { id: 1, name: 'Test' };
      const message = 'Success';

      const response = require('@/middleware/responseWrapper').ApiResponse.success(data, message);

      expect(response).toEqual({
        success: true,
        data,
        message,
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: 'direct-call',
          version: '1.0.0',
        },
      });
    });
  });

  describe('error method', () => {
    it('should create error response', () => {
      const message = 'Error occurred';
      const code = 'ERROR_CODE';
      const errors = [{ field: 'test', message: 'Test error', code: 'TEST', value: null }];

      const response = require('@/middleware/responseWrapper').ApiResponse.error(message, code, errors);

      expect(response).toEqual({
        success: false,
        message,
        errors,
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: 'direct-call',
          version: '1.0.0',
        },
      });
    });
  });

  describe('paginated method', () => {
    it('should create paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = { total: 10, page: 2, limit: 5 };

      const response = require('@/middleware/responseWrapper').ApiResponse.paginated(data, pagination);

      expect(response).toEqual({
        success: true,
        data,
        pagination: {
          ...pagination,
          totalPages: 2,
        },
        meta: {
          timestamp: '2023-02-13T23:31:30.000Z',
          requestId: 'direct-call',
          version: '1.0.0',
        },
      });
    });
  });
});