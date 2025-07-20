import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { SecurityService } from '@/services/SecurityService';
import { logger } from '@/utils/logger';

/**
 * 安全头部中间件
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false, // 根据需要调整
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "no-referrer" },
  xssFilter: true
});

/**
 * 速率限制中间件
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP在窗口期内最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('速率限制触发', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });

    // 记录安全事件
    SecurityService.logSecurityEvent({
      event_type: 'suspicious_activity',
      ip_address: req.ip || '',
      user_agent: req.get('User-Agent') || '',
      details: {
        reason: 'rate_limit_exceeded',
        url: req.url,
        method: req.method
      },
      risk_level: 'medium',
      timestamp: new Date()
    });

    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * 登录速率限制中间件
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 限制每个IP在窗口期内最多5次登录尝试
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: '登录尝试过于频繁，请稍后再试',
    error: 'LOGIN_RATE_LIMIT_EXCEEDED'
  },
  handler: (req: Request, res: Response) => {
    logger.warn('登录速率限制触发', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 记录安全事件
    SecurityService.logSecurityEvent({
      event_type: 'brute_force_attempt',
      ip_address: req.ip || '',
      user_agent: req.get('User-Agent') || '',
      details: {
        reason: 'login_rate_limit_exceeded',
        attempted_username: req.body.username
      },
      risk_level: 'high',
      timestamp: new Date()
    });

    res.status(429).json({
      success: false,
      message: '登录尝试过于频繁，请稍后再试',
      error: 'LOGIN_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * IP白名单/黑名单检查中间件
 */
export const ipFilter = (req: Request, res: Response, next: NextFunction): void => {
  const ipAddress = req.ip || req.connection.remoteAddress || '';

  if (!SecurityService.isIpAllowed(ipAddress)) {
    logger.warn('IP地址被拒绝', {
      ip: ipAddress,
      userAgent: req.get('User-Agent'),
      url: req.url
    });

    // 记录安全事件
    SecurityService.logSecurityEvent({
      event_type: 'permission_denied',
      ip_address: ipAddress,
      user_agent: req.get('User-Agent') || '',
      details: {
        reason: 'ip_not_allowed',
        url: req.url,
        method: req.method
      },
      risk_level: 'high',
      timestamp: new Date()
    });

    res.status(403).json({
      success: false,
      message: '访问被拒绝',
      error: 'IP_NOT_ALLOWED'
    });
    return;
  }

  next();
};

/**
 * 输入验证和清理中间件
 */
export const inputSanitization = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 检测和阻止SQL注入尝试
    const checkSqlInjection = (obj: any): boolean => {
      if (typeof obj === 'string') {
        const sqlPatterns = [
          /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
          /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
          /(\'|\"|;|--|\*|\|)/,
          /(\bSCRIPT\b)/i
        ];
        return sqlPatterns.some(pattern => pattern.test(obj));
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(value => checkSqlInjection(value));
      }
      
      return false;
    };

    // 检测XSS尝试
    const checkXss = (obj: any): boolean => {
      if (typeof obj === 'string') {
        const xssPatterns = [
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/i,
          /on\w+\s*=/i,
          /<iframe/i,
          /<object/i,
          /<embed/i
        ];
        return xssPatterns.some(pattern => pattern.test(obj));
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(value => checkXss(value));
      }
      
      return false;
    };

    // 检查请求体和查询参数
    if (checkSqlInjection(req.body) || checkSqlInjection(req.query)) {
      logger.warn('SQL注入尝试检测', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        body: req.body,
        query: req.query
      });

      SecurityService.detectThreat(req, {
        type: 'sql_injection',
        detected_in: 'input_sanitization_middleware'
      });

      res.status(400).json({
        success: false,
        message: '请求包含非法内容',
        error: 'INVALID_INPUT'
      });
      return;
    }

    if (checkXss(req.body) || checkXss(req.query)) {
      logger.warn('XSS尝试检测', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        body: req.body,
        query: req.query
      });

      SecurityService.detectThreat(req, {
        type: 'xss_attempt',
        detected_in: 'input_sanitization_middleware'
      });

      res.status(400).json({
        success: false,
        message: '请求包含非法内容',
        error: 'INVALID_INPUT'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('输入验证中间件错误:', error);
    next();
  }
};

/**
 * HTTPS重定向中间件
 */
export const httpsRedirect = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    logger.info('HTTP请求重定向到HTTPS', {
      ip: req.ip,
      url: req.url
    });

    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  
  next();
};

/**
 * 请求日志中间件（用于安全审计）
 */
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // 记录请求开始
  const requestId = Math.random().toString(36).substr(2, 9);
  (req as any).requestId = requestId;

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    const user = (req as any).user;

    // 记录审计日志
    try {
      await SecurityService.logAudit({
        audit_type: 'access',
        user_id: user?.id,
        resource_type: 'api_endpoint',
        resource_id: req.url,
        action: req.method,
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: res.statusCode < 400,
        error_message: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined
      });
    } catch (error) {
      logger.error('记录审计日志失败:', error);
    }

    // 记录安全相关的请求
    if (res.statusCode === 401 || res.statusCode === 403) {
      await SecurityService.logSecurityEvent({
        event_type: 'permission_denied',
        user_id: user?.id,
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        details: {
          url: req.url,
          method: req.method,
          status_code: res.statusCode,
          duration
        },
        risk_level: 'medium',
        timestamp: new Date()
      });
    }
  });

  next();
};

/**
 * CSRF保护中间件
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // 对于状态改变的请求（POST, PUT, DELETE等），检查CSRF令牌
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const sessionToken = (req as any).session?.csrfToken;

    if (!token || !sessionToken || token !== sessionToken) {
      logger.warn('CSRF令牌验证失败', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method
      });

      SecurityService.detectThreat(req, {
        type: 'csrf_attempt',
        detected_in: 'csrf_protection_middleware'
      });

      res.status(403).json({
        success: false,
        message: 'CSRF令牌验证失败',
        error: 'CSRF_TOKEN_INVALID'
      });
      return;
    }
  }

  next();
};

/**
 * 会话安全中间件
 */
export const sessionSecurity = (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as any).user;
  
  if (user) {
    // 检查会话是否过期
    const sessionStart = (req as any).session?.startTime;
    const maxDuration = SecurityService.getSecurityPolicy().session_policy.max_duration_hours * 60 * 60 * 1000;
    
    if (sessionStart && Date.now() - sessionStart > maxDuration) {
      logger.info('会话超时', {
        userId: user.id,
        sessionDuration: Date.now() - sessionStart
      });

      res.status(401).json({
        success: false,
        message: '会话已过期，请重新登录',
        error: 'SESSION_EXPIRED'
      });
      return;
    }

    // 更新最后活动时间
    (req as any).session.lastActivity = Date.now();
  }

  next();
};

/**
 * 文件上传安全中间件
 */
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction): void => {
  if (req.file || req.files) {
    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];
    
    for (const file of files) {
      if (!file) continue;

      // 检查文件类型
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        logger.warn('不允许的文件类型上传', {
          ip: req.ip,
          userId: (req as any).user?.id,
          filename: file.originalname,
          mimetype: file.mimetype
        });

        res.status(400).json({
          success: false,
          message: '不允许的文件类型',
          error: 'INVALID_FILE_TYPE'
        });
        return;
      }

      // 检查文件大小
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        logger.warn('文件大小超限', {
          ip: req.ip,
          userId: (req as any).user?.id,
          filename: file.originalname,
          size: file.size
        });

        res.status(400).json({
          success: false,
          message: '文件大小超过限制',
          error: 'FILE_TOO_LARGE'
        });
        return;
      }

      // 检查文件名
      const dangerousPatterns = [
        /\.\./,  // 路径遍历
        /[<>:"|?*]/,  // 危险字符
        /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i  // 可执行文件
      ];

      if (dangerousPatterns.some(pattern => pattern.test(file.originalname))) {
        logger.warn('危险文件名检测', {
          ip: req.ip,
          userId: (req as any).user?.id,
          filename: file.originalname
        });

        res.status(400).json({
          success: false,
          message: '文件名包含非法字符',
          error: 'INVALID_FILENAME'
        });
        return;
      }
    }
  }

  next();
};