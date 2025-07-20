import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Define operation log entry interface
interface OperationLogEntry {
  user_id?: number;
  username?: string;
  operation: string;
  resource: string;
  resource_id?: string;
  method: string;
  path: string;
  ip_address: string;
  user_agent?: string;
  request_body?: any;
  response_status?: number;
  timestamp: Date;
  duration?: number;
}

// In-memory operation log storage (in production, this should be stored in database)
const operationLogs: OperationLogEntry[] = [];

/**
 * Operation logging middleware
 * Logs all user operations for audit purposes
 */
export const operationLog = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const user = req.user as any;
    
    // Create log entry
    const logEntry: OperationLogEntry = {
      user_id: user?.id,
      username: user?.username,
      operation,
      resource: req.baseUrl || req.path,
      resource_id: req.params.id,
      method: req.method,
      path: req.path,
      ip_address: req.ip || req.connection.remoteAddress || 'unknown',
      user_agent: req.get('User-Agent'),
      request_body: req.method !== 'GET' ? req.body : undefined,
      timestamp: new Date(),
    };

    // Override res.json to capture response status
    const originalJson = res.json;
    res.json = function(body: any) {
      logEntry.response_status = res.statusCode;
      logEntry.duration = Date.now() - startTime;
      
      // Store the log entry
      operationLogs.push(logEntry);
      
      // Log to file/console
      logger.info('Operation logged', {
        operation: logEntry.operation,
        resource: logEntry.resource,
        user: logEntry.username,
        status: logEntry.response_status,
        duration: logEntry.duration,
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

export const operationLogMiddleware = (operation: string, resource: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const user = req.user as any;
    
    // Create log entry
    const logEntry: OperationLogEntry = {
      user_id: user?.id,
      username: user?.username,
      operation,
      resource,
      resource_id: req.params.id,
      method: req.method,
      path: req.path,
      ip_address: req.ip || req.connection.remoteAddress || 'unknown',
      user_agent: req.get('User-Agent'),
      request_body: req.method !== 'GET' ? req.body : undefined,
      timestamp: new Date(),
    };

    // Override res.json to capture response status
    const originalJson = res.json;
    res.json = function(body: any) {
      logEntry.response_status = res.statusCode;
      logEntry.duration = Date.now() - startTime;
      
      // Store the log entry
      operationLogs.push(logEntry);
      
      // Log to file/console
      logger.info('Operation logged', {
        operation: logEntry.operation,
        resource: logEntry.resource,
        user: logEntry.username,
        status: logEntry.response_status,
        duration: logEntry.duration,
      });
      
      // Call original json method
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Get operation logs with filtering and pagination
 */
export const getOperationLogs = (filters: {
  user_id?: number;
  operation?: string;
  resource?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}) => {
  let filteredLogs = [...operationLogs];

  // Apply filters
  if (filters.user_id) {
    filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id);
  }

  if (filters.operation) {
    filteredLogs = filteredLogs.filter(log => log.operation.includes(filters.operation!));
  }

  if (filters.resource) {
    filteredLogs = filteredLogs.filter(log => log.resource.includes(filters.resource!));
  }

  if (filters.start_date) {
    filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.start_date!);
  }

  if (filters.end_date) {
    filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.end_date!);
  }

  // Sort by timestamp (newest first)
  filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  // Apply pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;
  const paginatedLogs = filteredLogs.slice(offset, offset + limit);

  return {
    logs: paginatedLogs,
    total: filteredLogs.length,
    page,
    limit,
    totalPages: Math.ceil(filteredLogs.length / limit),
  };
};

/**
 * Clear old operation logs (keep only recent logs)
 */
export const cleanupOperationLogs = (daysToKeep: number = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const initialCount = operationLogs.length;
  
  // Remove logs older than cutoff date
  for (let i = operationLogs.length - 1; i >= 0; i--) {
    if (operationLogs[i].timestamp < cutoffDate) {
      operationLogs.splice(i, 1);
    }
  }
  
  const removedCount = initialCount - operationLogs.length;
  
  if (removedCount > 0) {
    logger.info(`Cleaned up ${removedCount} old operation logs`);
  }
  
  return removedCount;
};

// Schedule periodic cleanup (run every 24 hours)
setInterval(() => {
  cleanupOperationLogs();
}, 24 * 60 * 60 * 1000);