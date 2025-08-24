import { Request, Response, NextFunction } from 'express';

export class EquipmentController {
  static async getEquipment(req: Request, res: Response) {
    try {
      (res as any).success({
        equipment: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      }, '获取设备列表成功');
    } catch (error) {
      (res as any).error('获取设备列表失败', 500, 'GET_EQUIPMENT_ERROR');
    }
  }

  static async createEquipment(req: Request, res: Response) {
    try {
      (res as any).success({ id: 1, ...req.body }, '创建设备成功', 201);
    } catch (error) {
      (res as any).error('创建设备失败', 500, 'CREATE_EQUIPMENT_ERROR');
    }
  }

  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await EquipmentController.getEquipment(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await EquipmentController.createEquipment(req, res);
    } catch (error) {
      next(error);
    }
  }
}