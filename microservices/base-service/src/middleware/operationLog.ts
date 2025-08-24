import { Request, Response, NextFunction } from 'express';

export const operationLog = (req: Request, res: Response, next: NextFunction): void => {
  next();
};