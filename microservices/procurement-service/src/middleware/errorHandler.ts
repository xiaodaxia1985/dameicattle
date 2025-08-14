import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('全局错误处理:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  })

  // Sequelize 验证错误
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((err: any) => err.message)
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: messages,
      code: 'VALIDATION_ERROR'
    })
  }

  // Sequelize 唯一约束错误
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: '数据已存在',
      code: 'DUPLICATE_ERROR'
    })
  }

  // Sequelize 外键约束错误
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在',
      code: 'FOREIGN_KEY_ERROR'
    })
  }

  // JWT 错误
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '访问令牌已过期',
      code: 'TOKEN_EXPIRED'
    })
  }

  // 默认错误处理
  const status = error.status || error.statusCode || 500
  const message = error.message || '服务器内部错误'
  const code = error.code || 'INTERNAL_SERVER_ERROR'

  res.status(status).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}