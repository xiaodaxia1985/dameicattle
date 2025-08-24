import { Request, Response, NextFunction } from 'express';
import { Cattle } from '../models';

export class CattleController {
  public async getCattle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cattle = await Cattle.findAll();
      res.json({ data: cattle });
    } catch (error) {
      next(error);
    }
  }

  public async createCattle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cattle = await Cattle.create(req.body);
      res.status(201).json({ data: cattle });
    } catch (error) {
      next(error);
    }
  }

  public async updateCattle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await Cattle.update(req.body, { where: { id } });
      const cattle = await Cattle.findByPk(id);
      res.json({ data: cattle });
    } catch (error) {
      next(error);
    }
  }

  public async deleteCattle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await Cattle.destroy({ where: { id } });
      res.json({ message: '删除成功' });
    } catch (error) {
      next(error);
    }
  }
}