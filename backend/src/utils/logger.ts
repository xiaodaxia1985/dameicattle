import winston from 'winston';
import path from 'path';
import fs from 'fs';

const { combine, timestamp, errors, json, printf, colorize, splat } = winston.format;

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output with enhanced metadata
const consoleFormat = printf(({ level, message, timestamp, stack, requestId, userId, module, action, ...meta }) => {
  let log = `${timestamp} [${level.toUpperCase()}]`;

  // Add context information
  if (requestId) log += ` [REQ:${requestId}]`;
  if (userId) log += ` [USER:${userId}]`;
  if (module) log += ` [${module}]`;
  if (action) log += ` [${action}]`;

  log += `: ${message}`;

  if (stack) {
    log += `\n${stack}`;
  }

  // Add remaining metadata
  const remainingMeta = { ...meta };
  delete remainingMeta.service;
  if (Object.keys(remainingMeta).length > 0) {
    log += `\n${JSON.stringify(remainingMeta, null, 2)}`;
  }

  return log;
});

// Custom format for file output with structured data
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  splat(),
  json()
);

// Create the main logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: fileFormat,
  defaultMeta: {
    service: 'cattle-management-api',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    // Warning logs
    new winston.transports.File({
      filename: path.join(logsDir, 'warn.log'),
      level: 'warn',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    // All logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 20971520, // 20MB
      maxFiles: 15,
      tailable: true
    }),
    // Access logs for HTTP requests
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      tailable: true
    }),
    // Performance logs
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'debug',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true,
      format: combine(
        timestamp(),
        json(),
        winston.format((info) => {
          return info.type === 'performance' ? info : false;
        })()
      )
    })
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize({ all: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      consoleFormat
    ),
    level: 'debug'
  }));
}

// Create specialized loggers for different purposes
export const accessLogger = winston.createLogger({
  level: 'http',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'access.log'),
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
});

export const performanceLogger = winston.createLogger({
  level: 'debug',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      maxsize: 10485760,
      maxFiles: 5
    })
  ]
});

export const securityLogger = winston.createLogger({
  level: 'warn',
  format: combine(
    timestamp(),
    json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      maxsize: 10485760,
      maxFiles: 10
    })
  ]
});

// Enhanced logging methods with context
export const createContextLogger = (context: {
  module?: string;
  requestId?: string;
  userId?: string;
  action?: string;
}) => {
  return {
    error: (message: string, meta?: any) => logger.error(message, { ...context, ...meta }),
    warn: (message: string, meta?: any) => logger.warn(message, { ...context, ...meta }),
    info: (message: string, meta?: any) => logger.info(message, { ...context, ...meta }),
    debug: (message: string, meta?: any) => logger.debug(message, { ...context, ...meta }),
    http: (message: string, meta?: any) => logger.http(message, { ...context, ...meta })
  };
};

// Performance logging helper
export const logPerformance = (operation: string, duration: number, metadata?: any) => {
  performanceLogger.debug('Performance metric', {
    type: 'performance',
    operation,
    duration_ms: duration,
    ...metadata
  });
};

// Security event logging helper
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', metadata?: any) => {
  securityLogger.warn('Security event', {
    type: 'security',
    event,
    severity,
    timestamp: new Date().toISOString(),
    ...metadata
  });
};

// Database query logging helper
export const logDatabaseQuery = (query: string, duration: number, metadata?: any) => {
  logger.debug('Database query', {
    type: 'database',
    query: query.substring(0, 500), // Truncate long queries
    duration_ms: duration,
    ...metadata
  });
};

// API request logging helper
export const logApiRequest = (method: string, url: string, statusCode: number, duration: number, metadata?: any) => {
  accessLogger.http('API request', {
    type: 'api_request',
    method,
    url,
    status_code: statusCode,
    duration_ms: duration,
    ...metadata
  });
};

export default logger;