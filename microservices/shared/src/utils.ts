import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from './types';

// HTTP客户端工具
export const createHttpClient = (baseURL: string, timeout: number = 5000) => {
  return axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// JWT工具
export const generateToken = (payload: JwtPayload, secret: string, expiresIn: any = '24h'): string => {
  return jwt.sign(payload as any, secret, { expiresIn });
};

export const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

// 分页工具
export const calculatePagination = (page: number = 1, limit: number = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit };
};

export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) => {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

// 错误处理工具
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 异步错误捕获装饰器
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};