import { Request, Response, NextFunction } from 'express';

export class HealthController {
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: [] });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(201).json({ data: req.body });
    } catch (error) {
      next(error);
    }
  }
}