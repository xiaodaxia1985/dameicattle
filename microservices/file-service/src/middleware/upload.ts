import { Request, Response, NextFunction } from 'express';

export const upload = {
  single: (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      next();
    };
  },
  array: (fieldName: string, maxCount?: number) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      next();
    };
  }
};

export const uploadMiddleware = upload;