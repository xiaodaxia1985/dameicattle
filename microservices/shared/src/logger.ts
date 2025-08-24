import winston from 'winston';

export const createLogger = (serviceName: string) => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level.toUpperCase()}] [${serviceName.toUpperCase()}]: ${message}${metaStr}`;
      })
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            const metaStr = Object.keys(meta).length ? '\n' + JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}] [${serviceName.toUpperCase()}]: ${message}${metaStr}`;
          })
        )
      })
    ]
  });
};