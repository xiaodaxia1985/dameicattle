import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Supplier } from '@/models/Supplier';
import { PurchaseOrder } from '@/models/PurchaseOrder';
import { PurchaseOrderItem } from '@/models/PurchaseOrderItem';
import { ProductionMaterial } from '@/models/ProductionMaterial';
import { ValidationError, NotFoundError } from '@/utils/errors';

export class SupplierController {
  // 获取供应商列表
  static async getSuppliers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        supplier_type,
        status = 'active',
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // 搜索条件
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { contact_person: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ];
      }

      if (supplier_type) {
        whereClause.supplier_type = supplier_type;
      }

      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await Supplier.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [[sort_by as string, sort_order as string]],
        include: [
          {
            model: ProductionMaterial,
            as: 'materials',
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ]
      });

      res.json({
        success: true,
        data: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取供应商列表失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取供应商详情
  static async getSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findByPk(id, {
        include: [
          {
            model: ProductionMaterial,
            as: 'materials',
            attributes: ['id', 'name', 'code', 'unit', 'purchase_price']
          }
        ]
      });

      if (!supplier) {
        throw new NotFoundError('供应商不存在');
      }

      res.json({
        success: true,
        data: supplier
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '获取供应商详情失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 创建供应商
  static async createSupplier(req: Request, res: Response) {
    try {
      const {
        name,
        contact_person,
        phone,
        email,
        address,
        supplier_type,
        business_license,
        tax_number,
        bank_account,
        credit_limit = 0,
        payment_terms,
        rating = 0
      } = req.body;

      // 验证必填字段
      if (!name) {
        throw new ValidationError('供应商名称不能为空');
      }

      // 检查供应商名称是否已存在
      const existingSupplier = await Supplier.findOne({
        where: { name }
      });

      if (existingSupplier) {
        throw new ValidationError('供应商名称已存在');
      }

      const supplier = await Supplier.create({
        name,
        contact_person,
        phone,
        email,
        address,
        supplier_type,
        business_license,
        tax_number,
        bank_account,
        credit_limit,
        payment_terms,
        rating,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: '供应商创建成功',
        data: supplier
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '创建供应商失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 更新供应商
  static async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        throw new NotFoundError('供应商不存在');
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          where: { 
            name: updateData.name,
            id: { [Op.ne]: id }
          }
        });

        if (existingSupplier) {
          throw new ValidationError('供应商名称已存在');
        }
      }

      await supplier.update(updateData);

      res.json({
        success: true,
        message: '供应商更新成功',
        data: supplier
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新供应商失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 删除供应商
  static async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        throw new NotFoundError('供应商不存在');
      }

      // 检查是否有关联的采购订单
      const orderCount = await PurchaseOrder.count({
        where: { supplier_id: id }
      });

      if (orderCount > 0) {
        throw new ValidationError('该供应商存在关联的采购订单，无法删除');
      }

      // 检查是否有关联的物资
      const materialCount = await ProductionMaterial.count({
        where: { supplier_id: id }
      });

      if (materialCount > 0) {
        // 软删除：更新状态为inactive
        await supplier.update({ status: 'inactive' });
        res.json({
          success: true,
          message: '供应商已停用（存在关联物资）'
        });
      } else {
        // 硬删除
        await supplier.destroy();
        res.json({
          success: true,
          message: '供应商删除成功'
        });
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '删除供应商失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 获取供应商统计信息
  static async getSupplierStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { start_date, end_date } = req.query;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        throw new NotFoundError('供应商不存在');
      }

      const whereClause: any = { supplier_id: id };
      
      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      // 采购订单统计
      const orderStats = await PurchaseOrder.findAll({
        where: whereClause,
        attributes: [
          [fn('COUNT', col('id')), 'total_orders'],
          [fn('SUM', col('total_amount')), 'total_amount'],
          [fn('AVG', col('total_amount')), 'avg_amount'],
          'status'
        ],
        group: ['status'],
        raw: true
      });

      // 按月统计
      const monthlyStats = await PurchaseOrder.findAll({
        where: whereClause,
        attributes: [
          [fn('DATE_TRUNC', 'month', col('order_date')), 'month'],
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount']
        ],
        group: [fn('DATE_TRUNC', 'month', col('order_date'))],
        order: [[fn('DATE_TRUNC', 'month', col('order_date')), 'ASC']],
        raw: true
      });

      // 物资类型统计
      const materialStats = await PurchaseOrderItem.findAll({
        include: [
          {
            model: PurchaseOrder,
            as: 'order',
            where: { supplier_id: id },
            attributes: []
          }
        ],
        attributes: [
          'item_type',
          [fn('COUNT', col('PurchaseOrderItem.id')), 'item_count'],
          [fn('SUM', col('total_price')), 'total_value']
        ],
        group: ['item_type'],
        raw: true
      });

      res.json({
        success: true,
        data: {
          supplier,
          order_statistics: orderStats,
          monthly_statistics: monthlyStats,
          material_statistics: materialStats
        }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '获取供应商统计失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 供应商评级更新
  static async updateSupplierRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;

      if (rating < 0 || rating > 5) {
        throw new ValidationError('评级必须在0-5之间');
      }

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        throw new NotFoundError('供应商不存在');
      }

      await supplier.update({ rating });

      // 这里可以添加评级历史记录的逻辑

      res.json({
        success: true,
        message: '供应商评级更新成功',
        data: { rating, comment }
      });
    } catch (error) {
      if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '更新供应商评级失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 供应商对比分析
  static async compareSuppliers(req: Request, res: Response) {
    try {
      const { supplier_ids, start_date, end_date } = req.body;

      if (!supplier_ids || !Array.isArray(supplier_ids) || supplier_ids.length < 2) {
        throw new ValidationError('请选择至少2个供应商进行对比');
      }

      const whereClause: any = {
        supplier_id: { [Op.in]: supplier_ids }
      };

      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      // 获取供应商基本信息
      const suppliers = await Supplier.findAll({
        where: { id: { [Op.in]: supplier_ids } },
        attributes: ['id', 'name', 'rating', 'supplier_type', 'payment_terms']
      });

      // 采购统计对比
      const comparisonStats = await PurchaseOrder.findAll({
        where: whereClause,
        attributes: [
          'supplier_id',
          [fn('COUNT', col('id')), 'order_count'],
          [fn('SUM', col('total_amount')), 'total_amount'],
          [fn('AVG', col('total_amount')), 'avg_order_amount'],
          [fn('COUNT', literal("CASE WHEN status = 'completed' THEN 1 END")), 'completed_orders'],
          [fn('AVG', literal("CASE WHEN actual_delivery_date IS NOT NULL AND expected_delivery_date IS NOT NULL THEN EXTRACT(DAY FROM actual_delivery_date - expected_delivery_date) END")), 'avg_delivery_delay']
        ],
        group: ['supplier_id'],
        raw: true
      });

      // 合并数据
      const comparison = suppliers.map(supplier => {
        const stats = comparisonStats.find(s => s.supplier_id === supplier.id) || {};
        return {
          ...supplier.toJSON(),
          statistics: {
            order_count: stats.order_count || 0,
            total_amount: stats.total_amount || 0,
            avg_order_amount: stats.avg_order_amount || 0,
            completed_orders: stats.completed_orders || 0,
            completion_rate: stats.order_count ? (stats.completed_orders / stats.order_count * 100).toFixed(2) : 0,
            avg_delivery_delay: stats.avg_delivery_delay || 0
          }
        };
      });

      res.json({
        success: true,
        data: {
          comparison,
          period: { start_date, end_date }
        }
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '供应商对比分析失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 获取供应商类型列表
  static async getSupplierTypes(req: Request, res: Response) {
    try {
      const types = await Supplier.findAll({
        attributes: [
          [fn('DISTINCT', col('supplier_type')), 'supplier_type'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: {
          supplier_type: { [Op.ne]: null },
          status: 'active'
        },
        group: ['supplier_type'],
        raw: true
      });

      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取供应商类型失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}