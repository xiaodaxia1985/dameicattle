import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../utils/logger'

// 扩展 Request 接口以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        name: string
        role: string
        permissions: string[]
      }
    }
  }
}

/**
 * JWT 认证中间件
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问令牌缺失',
      code: 'TOKEN_MISSING'
    })
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret-key'
    const decoded = jwt.verify(token, jwtSecret) as any

    // 将用户信息添加到请求对象
    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      name: decoded.name || decoded.username,
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    }

    next()
  } catch (error) {
    logger.error('Token验证失败:', error)
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期',
        code: 'TOKEN_EXPIRED'
      })
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌',
        code: 'TOKEN_INVALID'
      })
    }

    return res.status(401).json({
      success: false,
      message: '令牌验证失败',
      code: 'TOKEN_VERIFICATION_FAILED'
    })
  }
}

/**
 * 权限检查中间件
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      })
    }

    // 管理员拥有所有权限
    if (user.role === 'admin') {
      return next()
    }

    // 检查用户是否有指定权限
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: '权限不足',
        code: 'INSUFFICIENT_PERMISSIONS'
      })
    }

    next()
  }
}

/**
 * 角色检查中间件
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证',
        code: 'USER_NOT_AUTHENTICATED'
      })
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '角色权限不足',
        code: 'INSUFFICIENT_ROLE'
      })
    }

    next()
  }
}