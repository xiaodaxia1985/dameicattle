import { Request, Response, NextFunction } from 'express'

// 扩展 Response 接口
declare global {
  namespace Express {
    interface Response {
      success(data?: any, message?: string, code?: string): void
      error(message: string, status?: number, code?: string): void
    }
  }
}

export const responseWrapper = (req: Request, res: Response, next: NextFunction) => {
  // 成功响应包装器
  res.success = function(data?: any, message: string = '操作成功', code: string = 'SUCCESS') {
    return this.json({
      success: true,
      data,
      message,
      code,
      timestamp: new Date().toISOString()
    })
  }

  // 错误响应包装器
  res.error = function(message: string = '操作失败', status: number = 500, code: string = 'ERROR') {
    return this.status(status).json({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString()
    })
  }

  next()
}