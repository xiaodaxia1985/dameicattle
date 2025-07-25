// Error categories for systematic error handling
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  BUSINESS_LOGIC = 'business_logic',
  DATABASE = 'database',
  EXTERNAL_SERVICE = 'external_service',
  SYSTEM = 'system',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  FILE_UPLOAD = 'file_upload',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error context interface
export interface ErrorContext {
  requestId?: string;
  userId?: number;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  metadata?: Record<string, any>;
}

// Categorized error class
export class CategorizedError extends Error {
  public category: ErrorCategory;
  public severity: ErrorSeverity;
  public statusCode: number;
  public code: string;
  public recoverable: boolean;
  public context: Partial<ErrorContext>;
  public details?: any;

  constructor(
    message: string,
    category: ErrorCategory,
    statusCode: number = 500,
    code?: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    recoverable: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'CategorizedError';
    this.category = category;
    this.severity = severity;
    this.statusCode = statusCode;
    this.code = code || this.generateErrorCode(category);
    this.recoverable = recoverable;
    this.details = details;
    this.context = {
      timestamp: new Date(),
      category,
      severity,
      recoverable,
    };

    Error.captureStackTrace(this, this.constructor);
  }

  private generateErrorCode(category: ErrorCategory): string {
    const prefix = category.toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}_${timestamp}`;
  }

  public addContext(context: Partial<ErrorContext>): void {
    this.context = { ...this.context, ...context };
  }

  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      statusCode: this.statusCode,
      code: this.code,
      recoverable: this.recoverable,
      context: this.context,
      details: this.details,
      stack: this.stack,
    };
  }
}

// Error factory for creating categorized errors
export class ErrorFactory {
  // Validation errors
  static validation(message: string, details?: any): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.VALIDATION,
      422,
      'VALIDATION_ERROR',
      ErrorSeverity.LOW,
      true,
      details
    );
  }

  static required(field: string): CategorizedError {
    return new CategorizedError(
      `${field} is required`,
      ErrorCategory.VALIDATION,
      422,
      'REQUIRED_FIELD',
      ErrorSeverity.LOW,
      true,
      { field }
    );
  }

  static invalid(field: string, value?: any): CategorizedError {
    return new CategorizedError(
      `Invalid value for ${field}`,
      ErrorCategory.VALIDATION,
      422,
      'INVALID_VALUE',
      ErrorSeverity.LOW,
      true,
      { field, value }
    );
  }

  // Authentication errors
  static unauthorized(message: string = 'Authentication required'): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.AUTHENTICATION,
      401,
      'UNAUTHORIZED',
      ErrorSeverity.MEDIUM,
      true
    );
  }

  static invalidCredentials(): CategorizedError {
    return new CategorizedError(
      'Invalid credentials provided',
      ErrorCategory.AUTHENTICATION,
      401,
      'INVALID_CREDENTIALS',
      ErrorSeverity.MEDIUM,
      true
    );
  }

  static tokenExpired(): CategorizedError {
    return new CategorizedError(
      'Authentication token has expired',
      ErrorCategory.AUTHENTICATION,
      401,
      'TOKEN_EXPIRED',
      ErrorSeverity.MEDIUM,
      true
    );
  }

  // Authorization errors
  static forbidden(message: string = 'Access denied'): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.AUTHORIZATION,
      403,
      'FORBIDDEN',
      ErrorSeverity.MEDIUM,
      false
    );
  }

  static insufficientPermissions(permission?: string): CategorizedError {
    return new CategorizedError(
      `Insufficient permissions${permission ? ` for ${permission}` : ''}`,
      ErrorCategory.AUTHORIZATION,
      403,
      'INSUFFICIENT_PERMISSIONS',
      ErrorSeverity.MEDIUM,
      false,
      { permission }
    );
  }

  // Not found errors
  static notFound(resource: string, id?: any): CategorizedError {
    return new CategorizedError(
      `${resource} not found${id ? ` with id: ${id}` : ''}`,
      ErrorCategory.NOT_FOUND,
      404,
      'NOT_FOUND',
      ErrorSeverity.LOW,
      true,
      { resource, id }
    );
  }

  // Conflict errors
  static conflict(message: string, details?: any): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.CONFLICT,
      409,
      'CONFLICT',
      ErrorSeverity.MEDIUM,
      true,
      details
    );
  }

  static duplicate(resource: string, field?: string): CategorizedError {
    return new CategorizedError(
      `${resource} already exists${field ? ` with this ${field}` : ''}`,
      ErrorCategory.CONFLICT,
      409,
      'DUPLICATE_RESOURCE',
      ErrorSeverity.MEDIUM,
      true,
      { resource, field }
    );
  }

  // Business logic errors
  static businessLogic(message: string, details?: any): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.BUSINESS_LOGIC,
      400,
      'BUSINESS_LOGIC_ERROR',
      ErrorSeverity.MEDIUM,
      true,
      details
    );
  }

  // Database errors
  static database(message: string, details?: any): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.DATABASE,
      500,
      'DATABASE_ERROR',
      ErrorSeverity.HIGH,
      false,
      details
    );
  }

  static connectionFailed(): CategorizedError {
    return new CategorizedError(
      'Database connection failed',
      ErrorCategory.DATABASE,
      503,
      'DB_CONNECTION_FAILED',
      ErrorSeverity.CRITICAL,
      false
    );
  }

  // System errors
  static system(message: string, details?: any): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.SYSTEM,
      500,
      'SYSTEM_ERROR',
      ErrorSeverity.HIGH,
      false,
      details
    );
  }

  static internal(message: string = 'Internal server error'): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.SYSTEM,
      500,
      'INTERNAL_ERROR',
      ErrorSeverity.HIGH,
      false
    );
  }

  // External service errors
  static externalService(service: string, message?: string): CategorizedError {
    return new CategorizedError(
      message || `External service ${service} is unavailable`,
      ErrorCategory.EXTERNAL_SERVICE,
      503,
      'EXTERNAL_SERVICE_ERROR',
      ErrorSeverity.HIGH,
      true,
      { service }
    );
  }

  // Rate limiting errors
  static rateLimit(limit: number, window: string): CategorizedError {
    return new CategorizedError(
      `Rate limit exceeded: ${limit} requests per ${window}`,
      ErrorCategory.RATE_LIMIT,
      429,
      'RATE_LIMIT_EXCEEDED',
      ErrorSeverity.LOW,
      true,
      { limit, window }
    );
  }

  // File upload errors
  static fileUpload(message: string, details?: any): CategorizedError {
    return new CategorizedError(
      message,
      ErrorCategory.FILE_UPLOAD,
      400,
      'FILE_UPLOAD_ERROR',
      ErrorSeverity.MEDIUM,
      true,
      details
    );
  }

  static fileTooLarge(maxSize: number): CategorizedError {
    return new CategorizedError(
      `File size exceeds maximum allowed size of ${maxSize} bytes`,
      ErrorCategory.FILE_UPLOAD,
      413,
      'FILE_TOO_LARGE',
      ErrorSeverity.LOW,
      true,
      { maxSize }
    );
  }

  static invalidFileType(allowedTypes: string[]): CategorizedError {
    return new CategorizedError(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCategory.FILE_UPLOAD,
      400,
      'INVALID_FILE_TYPE',
      ErrorSeverity.LOW,
      true,
      { allowedTypes }
    );
  }
}

// Error categorizer for existing errors
export class ErrorCategorizer {
  static categorize(error: Error): CategorizedError {
    // If already categorized, return as is
    if (error instanceof CategorizedError) {
      return error;
    }

    // Categorize based on error name/type
    switch (error.name) {
      case 'ValidationError':
        return ErrorFactory.validation(error.message);
      
      case 'SequelizeValidationError':
        return ErrorFactory.validation('Database validation failed', { originalError: error.message });
      
      case 'SequelizeUniqueConstraintError':
        return ErrorFactory.duplicate('Resource', 'unique field');
      
      case 'SequelizeForeignKeyConstraintError':
        return ErrorFactory.businessLogic('Referenced resource does not exist');
      
      case 'SequelizeConnectionError':
      case 'SequelizeDatabaseError':
        return ErrorFactory.database(error.message);
      
      case 'JsonWebTokenError':
        return ErrorFactory.unauthorized('Invalid authentication token');
      
      case 'TokenExpiredError':
        return ErrorFactory.tokenExpired();
      
      case 'NotFoundError':
        return ErrorFactory.notFound('Resource');
      
      case 'UnauthorizedError':
        return ErrorFactory.unauthorized(error.message);
      
      case 'ForbiddenError':
        return ErrorFactory.forbidden(error.message);
      
      case 'ConflictError':
        return ErrorFactory.conflict(error.message);
      
      case 'BusinessError':
        return ErrorFactory.businessLogic(error.message);
      
      default:
        // Check for specific error patterns
        if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
          return ErrorFactory.connectionFailed();
        }
        
        if (error.message.includes('timeout')) {
          return ErrorFactory.externalService('Unknown', 'Request timeout');
        }
        
        // Default to system error
        return ErrorFactory.system(error.message || 'Unknown error occurred');
    }
  }
}