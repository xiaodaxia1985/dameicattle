import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  next();
};

export const authMiddleware = authenticateToken;
export const dataPermissionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  next();
};