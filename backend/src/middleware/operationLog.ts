import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

// Define operation log entry interface
interface OperationLogEntry {
  id: number;
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

// Counter for generating unique IDs
let logIdCounter = 1;

// In-memory operation log storage (in production, this should be stored in database)
const operationLogs: OperationLogEntry[] = [];

// Initialize with some test data for demonstration
const initializeTestData = () => {
  const testLogs: OperationLogEntry[] = [
    {
      id: logIdCounter++,
      user_id: 1,
      username: 'admin',
      operation: 'login',
      resource: 'user',
      resource_id: '1',
      method: 'POST',
      path: '/auth/login',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      request_body: { username: 'admin' },
      response_status: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      duration: 150
    },
    {
      id: logIdCounter++,
      user_id: 1,
      username: 'admin',
      operation: 'create',
      resource: 'user',
      resource_id: '2',
      method: 'POST',
      path: '/users',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      request_body: { username: 'testuser', real_name: '测试用户' },
      response_status: 201,
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      duration: 200
    },
    {
      id: logIdCounter++,
      user_id: 2,
      username: 'testuser',
      operation: 'login',
      resource: 'user',
      resource_id: '2',
      method: 'POST',
      path: '/auth/login',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      request_body: { username: 'testuser' },
      response_status: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      duration: 120
    },
    {
      id: logIdCounter++,
      user_id: 1,
      username: 'admin',
      operation: 'update',
      resource: 'role',
      resource_id: '1',
      method: 'PUT',
      path: '/roles/1',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      request_body: { name: '超级管理员', permissions: ['user:create', 'user:read'] },
      response_status: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      duration: 180
    },
    {
      id: logIdCounter++,
      user_id: 2,
      username: 'testuser',
      operation: 'read',
      resource: 'cattle',
      method: 'GET',
      path: '/cattle',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      response_status: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      duration: 80
    },
    {
      id: logIdCounter++,
      user_id: 1,
      username: 'admin',
      operation: 'delete',
      resource: 'user',
      resource_id: '3',
      method: 'DELETE',
      path: '/users/3',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      response_status: 200,
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      duration: 100
    }
  ];
  
  operationLogs.push(...testLogs);
};

// Initialize test data when module loads
initializeTestData();

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
      id: logIdCounter++,
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
      id: logIdCounter++,
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