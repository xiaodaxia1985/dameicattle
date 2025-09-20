import { Request, Response, NextFunction } from 'express';
import { Cattle, Base, Barn } from '../models';
import { Op } from 'sequelize';

export class CattleController {
  public async getCattle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 构建查询条件
      const whereConditions: any = {};
      
      // 处理基地ID查询参数
      if (req.query.base_id) {
        whereConditions.base_id = req.query.base_id;
      }
      
      // 处理牛棚ID查询参数
      if (req.query.barn_id) {
        whereConditions.barn_id = req.query.barn_id;
      }
      
      // 处理健康状态查询参数
      if (req.query.health_status) {
        whereConditions.health_status = req.query.health_status;
      }
      
      // 处理性别查询参数
      if (req.query.gender) {
        whereConditions.gender = req.query.gender;
      }
      
      // 处理状态查询参数
      if (req.query.status) {
        whereConditions.status = req.query.status;
      }
      
      // 处理耳标查询参数（模糊匹配）
      if (req.query.ear_tag) {
        whereConditions.ear_tag = {
          [Op.like]: `%${req.query.ear_tag}%`
        };
      }
      
      // 使用Sequelize的where条件筛选数据，并包含关联的base和barn信息
      const cattle = await Cattle.findAll({
        where: whereConditions,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          }
        ]
      });
      
      res.json({ data: cattle });
    } catch (error) {
      next(error);
    }
  }

  public async getCattleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const item = await Cattle.findByPk(id, {
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['id', 'name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['id', 'name', 'code']
          }
        ]
      });
      if (!item) {
        res.status(404).json({ message: 'Not Found' });
        return;
      }
      res.json({ data: item });
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