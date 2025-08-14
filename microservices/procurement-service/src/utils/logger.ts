import winston from 'winston'
import path from 'path'

// 日志级别
const logLevel = process.env.LOG_LEVEL || 'info'

// 创建日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`
  })
)

// 创建 Winston logger
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // 文件输出
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'procurement-service.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 错误日志单独文件
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'procurement-service-error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
})

// 在非生产环境下，将日志输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

export default logger