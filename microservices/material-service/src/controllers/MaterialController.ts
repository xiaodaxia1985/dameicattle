import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { ProductionMaterial, MaterialCategory, Inventory, User } from '../models';
import { logger } from '../utils/logger';

export class MaterialController {
  // Get materials with pagination and filtering
  static async getMaterials(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        category_id,
        search,
        status = 'active'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { status };

      if (category_id) {
        whereClause.category_id = category_id;
      }

      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await ProductionMaterial.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: MaterialCategory,
            as: 'category',
            attributes: ['id', 'name']
          }
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']]
      });

      res.success({
        materials: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      }, '获取物料列表成功');
    } catch (error) {
      logger.error('Error fetching materials:', error);
      res.error('获取物料列表失败', 500, 'FETCH_MATERIALS_ERROR');
    }
  }

  // Create material
  static async createMaterial(req: Request, res: Response) {
    try {
      const materialData = req.body;

      // Check if code already exists
      const existingMaterial = await ProductionMaterial.findOne({
        where: { code: materialData.code }
      });

      if (existingMaterial) {
        return res.error('物料编码已存在', 409, 'MATERIAL_CODE_EXISTS');
      }

      const material = await ProductionMaterial.create(materialData);

      // Fetch created material with associations
      const createdMaterial = await ProductionMaterial.findByPk(material.id, {
        include: [
          {
            model: MaterialCategory,
            as: 'category',
            attributes: ['id', 'name']
          }
        ]
      });

      res.success(createdMaterial, '创建物料成功', 201);
    } catch (error) {
      logger.error('Error creating material:', error);
      res.error('创建物料失败', 500, 'CREATE_MATERIAL_ERROR');
    }
  }

  // Get material categories
  static async getCategories(req: Request, res: Response) {
    try {
      const categories = await MaterialCategory.findAll({
        order: [['name', 'ASC']]
      });

      res.success(categories, '获取物料分类成功');
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.error('获取物料分类失败', 500, 'FETCH_CATEGORIES_ERROR');
    }
  }

  // Get inventory statistics
  static async getInventoryStatistics(req: Request, res: Response) {
    try {
      const { base_id } = req.query;

      const whereClause: any = {};

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        if (base_id) {
          whereClause.base_id = base_id;
        }
      } else if (dataPermission.baseId) {
        whereClause.base_id = dataPermission.baseId;
      } else {
        whereClause.base_id = -1;
      }

      const inventories = await Inventory.findAll({
        where: whereClause,
        include: [
          {
            model: ProductionMaterial,
            as: 'material',
            attributes: ['id', 'name', 'unit']
          }
        ]
      });

      // Calculate statistics
      const totalItems = inventories.length;
      const totalValue = inventories.reduce((sum, inv) => sum + (Number(inv.current_stock) * Number(inv.unit_price || 0)), 0);
      const lowStockItems = inventories.filter(inv => inv.current_stock <= inv.min_stock).length;

      const statistics = {
        overview: {
          total_items: totalItems,
          total_value: totalValue,
          low_stock_items: lowStockItems
        },
        items: inventories.map(inv => ({
          material_name: (inv as any).material?.name,
          current_stock: inv.current_stock,
          min_stock: inv.min_stock,
          unit_price: inv.unit_price,
          total_value: Number(inv.current_stock) * Number(inv.unit_price || 0),
          is_low_stock: inv.current_stock <= inv.min_stock
        }))
      };

      res.success(statistics, '获取库存统计信息成功');
    } catch (error) {
      logger.error('Error fetching inventory statistics:', error);
      res.error('获取库存统计信息失败', 500, 'INVENTORY_STATISTICS_ERROR');
    }
  }
}