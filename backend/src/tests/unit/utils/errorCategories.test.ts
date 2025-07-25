import { 
  ErrorCategory, 
  ErrorSeverity, 
  CategorizedError, 
  ErrorFactory, 
  ErrorCategorizer 
} from '@/utils/errorCategories';

describe('Error Categories', () => {
  describe('CategorizedError', () => {
    it('should create categorized error with all properties', () => {
      const error = new CategorizedError(
        'Test error',
        ErrorCategory.VALIDATION,
        422,
        'TEST_ERROR',
        ErrorSeverity.LOW,
        true,
        { field: 'test' }
      );

      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.recoverable).toBe(true);
      expect(error.details).toEqual({ field: 'test' });
      expect(error.context.category).toBe(ErrorCategory.VALIDATION);
      expect(error.context.timestamp).toBeInstanceOf(Date);
    });

    it('should generate error code when not provided', () => {
      const error = new CategorizedError(
        'Test error',
        ErrorCategory.VALIDATION
      );

      expect(error.code).toMatch(/^VALIDATION_\d{6}$/);
    });

    it('should add context to error', () => {
      const error = new CategorizedError('Test error', ErrorCategory.VALIDATION);
      
      error.addContext({
        requestId: 'test-123',
        userId: 456,
      });

      expect(error.context.requestId).toBe('test-123');
      expect(error.context.userId).toBe(456);
    });

    it('should serialize to JSON correctly', () => {
      const error = new CategorizedError(
        'Test error',
        ErrorCategory.VALIDATION,
        422,
        'TEST_ERROR',
        ErrorSeverity.LOW,
        true,
        { field: 'test' }
      );

      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'CategorizedError',
        message: 'Test error',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        statusCode: 422,
        code: 'TEST_ERROR',
        recoverable: true,
        details: { field: 'test' },
      });
      expect(json.context).toBeDefined();
      expect(json.stack).toBeDefined();
    });
  });

  describe('ErrorFactory', () => {
    describe('validation errors', () => {
      it('should create validation error', () => {
        const error = ErrorFactory.validation('Validation failed');

        expect(error.category).toBe(ErrorCategory.VALIDATION);
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.severity).toBe(ErrorSeverity.LOW);
        expect(error.recoverable).toBe(true);
      });

      it('should create required field error', () => {
        const error = ErrorFactory.required('name');

        expect(error.message).toBe('name is required');
        expect(error.code).toBe('REQUIRED_FIELD');
        expect(error.details).toEqual({ field: 'name' });
      });

      it('should create invalid value error', () => {
        const error = ErrorFactory.invalid('age', 'abc');

        expect(error.message).toBe('Invalid value for age');
        expect(error.code).toBe('INVALID_VALUE');
        expect(error.details).toEqual({ field: 'age', value: 'abc' });
      });
    });

    describe('authentication errors', () => {
      it('should create unauthorized error', () => {
        const error = ErrorFactory.unauthorized();

        expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
        expect(error.statusCode).toBe(401);
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.message).toBe('Authentication required');
      });

      it('should create invalid credentials error', () => {
        const error = ErrorFactory.invalidCredentials();

        expect(error.message).toBe('Invalid credentials provided');
        expect(error.code).toBe('INVALID_CREDENTIALS');
      });

      it('should create token expired error', () => {
        const error = ErrorFactory.tokenExpired();

        expect(error.message).toBe('Authentication token has expired');
        expect(error.code).toBe('TOKEN_EXPIRED');
      });
    });

    describe('authorization errors', () => {
      it('should create forbidden error', () => {
        const error = ErrorFactory.forbidden();

        expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
        expect(error.statusCode).toBe(403);
        expect(error.code).toBe('FORBIDDEN');
        expect(error.recoverable).toBe(false);
      });

      it('should create insufficient permissions error', () => {
        const error = ErrorFactory.insufficientPermissions('admin');

        expect(error.message).toBe('Insufficient permissions for admin');
        expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
        expect(error.details).toEqual({ permission: 'admin' });
      });
    });

    describe('not found errors', () => {
      it('should create not found error', () => {
        const error = ErrorFactory.notFound('User');

        expect(error.category).toBe(ErrorCategory.NOT_FOUND);
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
      });

      it('should create not found error with ID', () => {
        const error = ErrorFactory.notFound('User', 123);

        expect(error.message).toBe('User not found with id: 123');
        expect(error.details).toEqual({ resource: 'User', id: 123 });
      });
    });

    describe('conflict errors', () => {
      it('should create conflict error', () => {
        const error = ErrorFactory.conflict('Resource already exists');

        expect(error.category).toBe(ErrorCategory.CONFLICT);
        expect(error.statusCode).toBe(409);
        expect(error.code).toBe('CONFLICT');
      });

      it('should create duplicate resource error', () => {
        const error = ErrorFactory.duplicate('User', 'email');

        expect(error.message).toBe('User already exists with this email');
        expect(error.code).toBe('DUPLICATE_RESOURCE');
        expect(error.details).toEqual({ resource: 'User', field: 'email' });
      });
    });

    describe('business logic errors', () => {
      it('should create business logic error', () => {
        const error = ErrorFactory.businessLogic('Business rule violated');

        expect(error.category).toBe(ErrorCategory.BUSINESS_LOGIC);
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('BUSINESS_LOGIC_ERROR');
      });
    });

    describe('database errors', () => {
      it('should create database error', () => {
        const error = ErrorFactory.database('Query failed');

        expect(error.category).toBe(ErrorCategory.DATABASE);
        expect(error.statusCode).toBe(500);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
        expect(error.recoverable).toBe(false);
      });

      it('should create connection failed error', () => {
        const error = ErrorFactory.connectionFailed();

        expect(error.message).toBe('Database connection failed');
        expect(error.statusCode).toBe(503);
        expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      });
    });

    describe('system errors', () => {
      it('should create system error', () => {
        const error = ErrorFactory.system('System failure');

        expect(error.category).toBe(ErrorCategory.SYSTEM);
        expect(error.statusCode).toBe(500);
        expect(error.severity).toBe(ErrorSeverity.HIGH);
      });

      it('should create internal error', () => {
        const error = ErrorFactory.internal();

        expect(error.message).toBe('Internal server error');
        expect(error.code).toBe('INTERNAL_ERROR');
      });
    });

    describe('external service errors', () => {
      it('should create external service error', () => {
        const error = ErrorFactory.externalService('PaymentAPI');

        expect(error.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
        expect(error.statusCode).toBe(503);
        expect(error.message).toBe('External service PaymentAPI is unavailable');
        expect(error.details).toEqual({ service: 'PaymentAPI' });
      });
    });

    describe('rate limit errors', () => {
      it('should create rate limit error', () => {
        const error = ErrorFactory.rateLimit(100, '1 hour');

        expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
        expect(error.statusCode).toBe(429);
        expect(error.message).toBe('Rate limit exceeded: 100 requests per 1 hour');
        expect(error.details).toEqual({ limit: 100, window: '1 hour' });
      });
    });

    describe('file upload errors', () => {
      it('should create file upload error', () => {
        const error = ErrorFactory.fileUpload('Upload failed');

        expect(error.category).toBe(ErrorCategory.FILE_UPLOAD);
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('FILE_UPLOAD_ERROR');
      });

      it('should create file too large error', () => {
        const error = ErrorFactory.fileTooLarge(1048576);

        expect(error.message).toBe('File size exceeds maximum allowed size of 1048576 bytes');
        expect(error.statusCode).toBe(413);
        expect(error.details).toEqual({ maxSize: 1048576 });
      });

      it('should create invalid file type error', () => {
        const error = ErrorFactory.invalidFileType(['jpg', 'png']);

        expect(error.message).toBe('Invalid file type. Allowed types: jpg, png');
        expect(error.details).toEqual({ allowedTypes: ['jpg', 'png'] });
      });
    });
  });

  describe('ErrorCategorizer', () => {
    it('should return CategorizedError as-is', () => {
      const originalError = ErrorFactory.validation('Test error');
      const categorized = ErrorCategorizer.categorize(originalError);

      expect(categorized).toBe(originalError);
    });

    it('should categorize ValidationError', () => {
      const error = new Error('Validation failed');
      error.name = 'ValidationError';

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.VALIDATION);
      expect(categorized.statusCode).toBe(422);
    });

    it('should categorize SequelizeValidationError', () => {
      const error = new Error('Database validation failed');
      error.name = 'SequelizeValidationError';

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.VALIDATION);
      expect(categorized.message).toBe('Database validation failed');
    });

    it('should categorize SequelizeUniqueConstraintError', () => {
      const error = new Error('Unique constraint violation');
      error.name = 'SequelizeUniqueConstraintError';

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.CONFLICT);
      expect(categorized.statusCode).toBe(409);
    });

    it('should categorize JWT errors', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(categorized.statusCode).toBe(401);
    });

    it('should categorize connection errors', () => {
      const error = new Error('ECONNREFUSED connection failed');

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.DATABASE);
      expect(categorized.statusCode).toBe(503);
    });

    it('should categorize timeout errors', () => {
      const error = new Error('Request timeout occurred');

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.EXTERNAL_SERVICE);
      expect(categorized.message).toBe('Request timeout');
    });

    it('should default to system error for unknown errors', () => {
      const error = new Error('Unknown error type');

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.SYSTEM);
      expect(categorized.statusCode).toBe(500);
    });

    it('should handle errors without messages', () => {
      const error = new Error();

      const categorized = ErrorCategorizer.categorize(error);

      expect(categorized.category).toBe(ErrorCategory.SYSTEM);
      expect(categorized.message).toBe('Unknown error occurred');
    });
  });
});