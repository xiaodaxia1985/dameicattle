import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Standard API response interface
export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Extend Response interface to include our wrapper methods
declare global {
  namespace Express {
    interface Response {
      success<T>(data?: T, message?: string, statusCode?: number): Response;
      error(message: string, statusCode?: number, code?: string, errors?: ValidationError[]): Response;
      paginated<T>(data: T[], pagination: {
        total: number;
        page: number;
        limit: number;
      }, message?: string): Response;
    }
  }
}

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  // Generate unique request ID for tracking
  const requestId = req.headers['x-request-id'] as string || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Store request ID for logging
  req.requestId = requestId;

  // Success response method
  res.success = function<T>(data?: T, message?: string, statusCode: number = 200): Response {
    const response: StandardApiResponse<T> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    // Log successful response
    logger.info('API Success Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      userId: req.user?.id,
      responseTime: Date.now() - (req.startTime || Date.now()),
    });

    return this.status(statusCode).json(response);
  };

  // Error response method
  res.error = function(
    message: string, 
    statusCode: number = 500, 
    code?: string, 
    errors?: ValidationError[]
  ): Response {
    const response: StandardApiResponse = {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    // Add error code if provided
    if (code) {
      (response as any).code = code;
    }

    // Log error response
    logger.error('API Error Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      message,
      code,
      errors,
      userId: req.user?.id,
      responseTime: Date.now() - (req.startTime || Date.now()),
    });

    return this.status(statusCode).json(response);
  };

  // Paginated response method
  res.paginated = function<T>(
    data: T[], 
    pagination: { total: number; page: number; limit: number }, 
    message?: string
  ): Response {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const response: StandardApiResponse<T[]> = {
      success: true,
      data,
      message,
      pagination: {
        ...pagination,
        totalPages,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    // Log paginated response
    logger.info('API Paginated Response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: 200,
      pagination,
      userId: req.user?.id,
      responseTime: Date.now() - (req.startTime || Date.now()),
    });

    return this.status(200).json(response);
  };

  // Store request start time for response time calculation
  req.startTime = Date.now();

  next();
};

// Helper function to create standardized responses outside of middleware
export class ApiResponse {
  static success<T>(data?: T, message?: string): StandardApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'direct-call',
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }

  static error(message: string, code?: string, errors?: ValidationError[]): StandardApiResponse {
    return {
      success: false,
      message,
      errors,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'direct-call',
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }

  static paginated<T>(
    data: T[], 
    pagination: { total: number; page: number; limit: number }
  ): StandardApiResponse<T[]> {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return {
      success: true,
      data,
      pagination: {
        ...pagination,
        totalPages,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: 'direct-call',
        version: process.env.npm_package_version || '1.0.0',
      },
    };
  }
}