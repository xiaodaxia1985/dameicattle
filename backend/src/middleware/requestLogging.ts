import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, createContextLogger, logApiRequest, logPerformance } from '@/utils/logger';

// 扩展 Request 接口以包含自定义属性
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      contextLogger?: ReturnType<typeof createContextLogger>;
    }
  }
}

/**
 * 请求日志中间件
 * 为每个请求生成唯一ID并记录请求信息
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // 生成请求ID
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  req.requestId = requestId;
  req.startTime = Date.now();

  // 设置响应头
  res.setHeader('X-Request-ID', requestId);

  // 创建上下文日志记录器
  req.contextLogger = createContextLogger({
    requestId,
    userId: req.user?.id?.toString(),
    module: 'HTTP'
  });

  // 记录请求开始
  req.contextLogger.http('HTTP请求开始', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    headers: {
      'content-type': req.get('Content-Type'),
      'accept': req.get('Accept'),
      'authorization': req.get('Authorization') ? '[REDACTED]' : undefined
    },
    query: req.query,
    body: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined
  });

  // 监听响应完成
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - (req.startTime || 0);
    const statusCode = res.statusCode;

    // 记录API请求
    logApiRequest(
      req.method,
      req.originalUrl,
      statusCode,
      duration,
      {
        requestId,
        userId: req.user?.id?.toString(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        responseSize: data ? Buffer.byteLength(data, 'utf8') : 0
      }
    );

    // 记录性能指标
    logPerformance(
      `${req.method} ${req.route?.path || req.originalUrl}`,
      duration,
      {
        requestId,
        statusCode,
        method: req.method,
        path: req.route?.path || req.originalUrl
      }
    );

    // 记录请求完成
    req.contextLogger?.http('HTTP请求完成', {
      statusCode,
      duration,
      responseSize: data ? Buffer.byteLength(data, 'utf8') : 0
    });

    // 如果响应时间过长，记录警告
    if (duration > 5000) {
      req.contextLogger?.warn('HTTP请求响应时间过长', {
        duration,
        threshold: 5000,
        method: req.method,
        url: req.originalUrl
      });
    }

    // 如果是错误响应，记录错误
    if (statusCode >= 400) {
      const logLevel = statusCode >= 500 ? 'error' : 'warn';
      req.contextLogger?.[logLevel]('HTTP请求错误响应', {
        statusCode,
        method: req.method,
        url: req.originalUrl,
        duration,
        response: statusCode >= 500 ? sanitizeResponseData(data) : undefined
      });
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * 错误日志中间件
 * 记录未捕获的错误
 */
export const errorLoggingMiddleware = (error: any, req: Request, res: Response, next: NextFunction) => {
  const duration = Date.now() - (req.startTime || 0);
  
  // 使用上下文日志记录器记录错误
  const contextLogger = req.contextLogger || createContextLogger({
    requestId: req.requestId,
    userId: req.user?.id?.toString(),
    module: 'HTTP'
  });

  contextLogger.error('HTTP请求处理错误', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: sanitizeHeaders(req.headers),
      query: req.query,
      body: sanitizeRequestBody(req.body),
      params: req.params
    },
    duration,
    timestamp: new Date().toISOString()
  });

  // 记录性能指标（错误情况）
  logPerformance(
    `${req.method} ${req.route?.path || req.originalUrl}`,
    duration,
    {
      requestId: req.requestId,
      statusCode: error.statusCode || 500,
      method: req.method,
      path: req.route?.path || req.originalUrl,
      error: true,
      errorType: error.name
    }
  );

  next(error);
};

/**
 * 慢查询日志中间件
 * 记录执行时间超过阈值的请求
 */
export const slowQueryLoggingMiddleware = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const duration = Date.now() - (req.startTime || 0);
      
      if (duration > threshold) {
        const contextLogger = req.contextLogger || createContextLogger({
          requestId: req.requestId,
          userId: req.user?.id?.toString(),
          module: 'SlowQuery'
        });

        contextLogger.warn('慢查询检测', {
          duration,
          threshold,
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          query: req.query,
          params: req.params,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * 安全事件日志中间件
 * 记录可疑的安全事件
 */
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contextLogger = req.contextLogger || createContextLogger({
    requestId: req.requestId,
    userId: req.user?.id?.toString(),
    module: 'Security'
  });

  // 检查可疑的请求模式
  const suspiciousPatterns = [
    /\.\.\//,  // 路径遍历
    /<script/i, // XSS
    /union.*select/i, // SQL注入
    /javascript:/i, // JavaScript协议
    /data:.*base64/i // Base64数据URI
  ];

  const requestData = JSON.stringify({
    url: req.originalUrl,
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestData)) {
      contextLogger.warn('检测到可疑请求模式', {
        pattern: pattern.toString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        headers: sanitizeHeaders(req.headers),
        query: req.query,
        body: sanitizeRequestBody(req.body)
      });
      break;
    }
  }

  // 检查异常的请求头
  const userAgent = req.get('User-Agent');
  if (!userAgent || userAgent.length < 10) {
    contextLogger.warn('异常的User-Agent', {
      userAgent,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress
    });
  }

  // 检查大量请求体
  const contentLength = parseInt(req.get('Content-Length') || '0');
  if (contentLength > 10 * 1024 * 1024) { // 10MB
    contextLogger.warn('异常大的请求体', {
      contentLength,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress
    });
  }

  next();
};

/**
 * 数据库查询日志中间件工厂
 * 用于记录数据库查询性能
 */
export const createDatabaseLoggingMiddleware = () => {
  return {
    beforeQuery: (query: string, options?: any) => {
      const startTime = Date.now();
      return {
        query: query.substring(0, 500), // 截取前500字符
        startTime,
        options
      };
    },
    
    afterQuery: (queryInfo: any, result?: any, error?: any) => {
      const duration = Date.now() - queryInfo.startTime;
      
      if (error) {
        logger.error('数据库查询错误', {
          query: queryInfo.query,
          duration,
          error: {
            name: error.name,
            message: error.message,
            code: error.code
          },
          options: queryInfo.options
        });
      } else {
        const logLevel = duration > 1000 ? 'warn' : 'debug';
        logger[logLevel]('数据库查询', {
          query: queryInfo.query,
          duration,
          rowCount: result?.rowCount || result?.length,
          options: queryInfo.options
        });
      }
      
      // 记录性能指标
      logPerformance('database_query', duration, {
        query_type: queryInfo.query.split(' ')[0]?.toUpperCase(),
        error: !!error
      });
    }
  };
};

// 辅助函数

/**
 * 清理请求体中的敏感信息
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // 递归处理嵌套对象
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeRequestBody(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * 清理响应数据中的敏感信息
 */
function sanitizeResponseData(data: any): any {
  if (typeof data !== 'string') {
    return data;
  }

  try {
    const parsed = JSON.parse(data);
    return sanitizeRequestBody(parsed);
  } catch {
    // 如果不是JSON，直接返回前200字符
    return data.substring(0, 200);
  }
}

/**
 * 清理请求头中的敏感信息
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

  for (const header of sensitiveHeaders) {
    if (header in sanitized) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}