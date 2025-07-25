import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { CategorizedError, ErrorCategorizer, ErrorCategory, ErrorSeverity } from '@/utils/errorCategories';
import { ValidationError } from '@/middleware/responseWrapper';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Error logging service
class ErrorLogger {
  static logError(error: CategorizedError, req: Request): void {
    const logData = {
      requestId: req.requestId,
      error: {
        name: error.name,
        message: error.message,
        category: error.category,
        severity: error.severity,
        code: error.code,
        statusCode: error.statusCode,
        recoverable: error.recoverable,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      },
      context: error.context,
      details: error.details,
    };

    // Log based on severity
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL ERROR', logData);
        // Could trigger alerts here
        break;
      case ErrorSeverity.HIGH:
        logger.error('HIGH SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('MEDIUM SEVERITY ERROR', logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('LOW SEVERITY ERROR', logData);
        break;
      default:
        logger.error('UNKNOWN SEVERITY ERROR', logData);
    }
  }

  static logUnhandledError(error: Error, req: Request): void {
    logger.error('UNHANDLED ERROR', {
      requestId: req.requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Error response formatter
class ErrorResponseFormatter {
  static formatValidationErrors(error: any): ValidationError[] {
    const validationErrors: ValidationError[] = [];

    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError' && error.errors) {
      error.errors.forEach((err: any) => {
        validationErrors.push({
          field: err.path || err.field || 'unknown',
          message: err.message,
          code: err.validatorKey || 'VALIDATION_ERROR',
          value: err.value,
        });
      });
    }

    // Handle custom validation errors
    if (error.details) {
      // Handle case where details.errors is an array (from ErrorFactory.validation)
      if (error.details.errors && Array.isArray(error.details.errors)) {
        error.details.errors.forEach((detail: any) => {
          if (detail.field && detail.message) {
            validationErrors.push({
              field: detail.field,
              message: detail.message,
              code: detail.code || 'VALIDATION_ERROR',
              value: detail.value,
            });
          }
        });
      }
      // Handle case where details is directly an array
      else if (Array.isArray(error.details)) {
        error.details.forEach((detail: any) => {
          if (detail.field && detail.message) {
            validationErrors.push({
              field: detail.field,
              message: detail.message,
              code: detail.code || 'VALIDATION_ERROR',
              value: detail.value,
            });
          }
        });
      }
    }

    return validationErrors;
  }

  static shouldExposeError(error: CategorizedError, environment: string): boolean {
    // In production, don't expose system errors details
    if (environment === 'production') {
      return error.category !== ErrorCategory.SYSTEM && 
             error.category !== ErrorCategory.DATABASE;
    }
    return true;
  }

  static sanitizeErrorMessage(error: CategorizedError, environment: string): string {
    if (environment === 'production' && !this.shouldExposeError(error, environment)) {
      return 'An internal error occurred. Please try again later.';
    }
    return error.message;
  }
}

// Main error handler middleware
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Skip if response already sent
  if (res.headersSent) {
    return next(err);
  }

  // Categorize the error
  const categorizedError = ErrorCategorizer.categorize(err);
  
  // Add request context to error
  categorizedError.addContext({
    requestId: req.requestId,
    userId: req.user?.id,
    endpoint: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Log the error
  ErrorLogger.logError(categorizedError, req);

  // Format validation errors if present
  const validationErrors = ErrorResponseFormatter.formatValidationErrors(err);

  // Determine if we should expose error details
  const environment = process.env.NODE_ENV || 'development';
  const shouldExposeDetails = ErrorResponseFormatter.shouldExposeError(categorizedError, environment);
  const sanitizedMessage = ErrorResponseFormatter.sanitizeErrorMessage(categorizedError, environment);

  // Use response wrapper if available, otherwise send standard response
  if (res.error) {
    return res.error(
      sanitizedMessage,
      categorizedError.statusCode,
      categorizedError.code,
      validationErrors.length > 0 ? validationErrors : undefined
    );
  }

  // Fallback response format (if response wrapper not available)
  const errorResponse = {
    success: false,
    message: sanitizedMessage,
    code: categorizedError.code,
    errors: validationErrors.length > 0 ? validationErrors : undefined,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
    },
  };

  // Add details in development
  if (environment === 'development' && shouldExposeDetails) {
    (errorResponse as any).details = categorizedError.details;
    (errorResponse as any).stack = categorizedError.stack;
  }

  res.status(categorizedError.statusCode).json(errorResponse);
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled error handlers
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
    });
    
    // Don't exit in production, just log
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    // Exit gracefully
    process.exit(1);
  });
};

// Error metrics collector (for monitoring)
export class ErrorMetrics {
  private static errorCounts: Map<string, number> = new Map();
  private static lastReset: Date = new Date();

  static recordError(error: CategorizedError): void {
    const key = `${error.category}:${error.code}`;
    const current = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, current + 1);
  }

  static getMetrics(): {
    errors: Record<string, number>;
    period: { start: Date; end: Date };
    total: number;
  } {
    const errors: Record<string, number> = {};
    let total = 0;

    this.errorCounts.forEach((count, key) => {
      errors[key] = count;
      total += count;
    });

    return {
      errors,
      period: {
        start: this.lastReset,
        end: new Date(),
      },
      total,
    };
  }

  static reset(): void {
    this.errorCounts.clear();
    this.lastReset = new Date();
  }
}