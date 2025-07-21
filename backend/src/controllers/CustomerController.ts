import { Request, Response } from 'express';
import { Op, fn, col, literal } from 'sequelize';
import { Customer } from '@/models/Customer';
import { CustomerVisitRecord } from '@/models/CustomerVisitRecord';
import { ValidationError, NotFoundError } from '@/utils/errors';

export class CustomerController {
  // 获取客户列表
  static async getCustomers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        customer_type,
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

      if (customer_type) {
        whereClause.customer_type = customer_type;
      }

      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await Customer.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [[sort_by as string, sort_order as string]],
        include: [
          {
            model: CustomerVisitRecord,
            as: 'visit_records',
            attributes: ['id', 'visit_date', 'visit_type', 'purpose'],
            required: false,
            limit: 3,
            order: [['visit_date', 'DESC']]
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
        message: '获取客户列表失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取客户详情
  static async getCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id, {
        include: [
          {
            model: CustomerVisitRecord,
            as: 'visit_records',
            attributes: ['id', 'visit_date', 'visit_type', 'purpose', 'content', 'result', 'status'],
            order: [['visit_date', 'DESC']]
          }
        ]
      });

      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      res.json({
        success: true,
        data: customer
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
          message: '获取客户详情失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 创建客户
  static async createCustomer(req: Request, res: Response) {
    try {
      const {
        name,
        contact_person,
        phone,
        email,
        address,
        customer_type,
        business_license,
        tax_number,
        bank_account,
        credit_limit = 0,
        payment_terms,
        credit_rating = 0
      } = req.body;

      // 验证必填字段
      if (!name) {
        throw new ValidationError('客户名称不能为空');
      }

      // 检查客户名称是否已存在
      const existingCustomer = await Customer.findOne({
        where: { name }
      });

      if (existingCustomer) {
        throw new ValidationError('客户名称已存在');
      }

      const customer = await Customer.create({
        name,
        contact_person,
        phone,
        email,
        address,
        customer_type,
        business_license,
        tax_number,
        bank_account,
        credit_limit,
        payment_terms,
        credit_rating,
        status: 'active'
      });

      res.status(201).json({
        success: true,
        message: '客户创建成功',
        data: customer
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
          message: '创建客户失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 更新客户
  static async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      // 如果更新名称，检查是否重复
      if (updateData.name && updateData.name !== customer.name) {
        const existingCustomer = await Customer.findOne({
          where: { 
            name: updateData.name,
            id: { [Op.ne]: id }
          }
        });

        if (existingCustomer) {
          throw new ValidationError('客户名称已存在');
        }
      }

      await customer.update(updateData);

      res.json({
        success: true,
        message: '客户更新成功',
        data: customer
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
          message: '更新客户失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 删除客户
  static async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      // 检查是否有关联的销售订单
      // const orderCount = await SalesOrder.count({
      //   where: { customer_id: id }
      // });

      // if (orderCount > 0) {
      //   throw new ValidationError('该客户存在关联的销售订单，无法删除');
      // }

      // 软删除：更新状态为inactive
      await customer.update({ status: 'inactive' });
      
      res.json({
        success: true,
        message: '客户已停用'
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
          message: '删除客户失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 获取客户统计信息
  static async getCustomerStatistics(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { start_date, end_date } = req.query;

      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      const whereClause: any = { customer_id: id };
      
      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      // 销售订单统计 (待实现SalesOrder模型后启用)
      // const orderStats = await SalesOrder.findAll({
      //   where: whereClause,
      //   attributes: [
      //     [fn('COUNT', col('id')), 'total_orders'],
      //     [fn('SUM', col('total_amount')), 'total_amount'],
      //     [fn('AVG', col('total_amount')), 'avg_amount'],
      //     'status'
      //   ],
      //   group: ['status'],
      //   raw: true
      // });

      // 回访记录统计
      const visitStats = await CustomerVisitRecord.findAll({
        where: { customer_id: id },
        attributes: [
          [fn('COUNT', col('id')), 'total_visits'],
          'visit_type'
        ],
        group: ['visit_type'],
        raw: true
      });

      // 按月回访统计
      const monthlyVisitStats = await CustomerVisitRecord.findAll({
        where: { customer_id: id },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('visit_date')), 'month'],
          [fn('COUNT', col('id')), 'visit_count']
        ],
        group: [fn('DATE_TRUNC', 'month', col('visit_date'))],
        order: [[fn('DATE_TRUNC', 'month', col('visit_date')), 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          customer,
          // order_statistics: orderStats,
          visit_statistics: visitStats,
          monthly_visit_statistics: monthlyVisitStats
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
          message: '获取客户统计失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 客户信用评级更新
  static async updateCustomerRating(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { credit_rating, comment } = req.body;

      if (credit_rating < 0 || credit_rating > 5) {
        throw new ValidationError('信用评级必须在0-5之间');
      }

      const customer = await Customer.findByPk(id);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      await customer.update({ credit_rating });

      // 这里可以添加评级历史记录的逻辑

      res.json({
        success: true,
        message: '客户信用评级更新成功',
        data: { credit_rating, comment }
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
          message: '更新客户信用评级失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 客户价值分析
  static async analyzeCustomerValue(req: Request, res: Response) {
    try {
      const { start_date, end_date } = req.query;

      const whereClause: any = {};
      
      if (start_date && end_date) {
        whereClause.order_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      // 客户价值分析 (待实现SalesOrder模型后启用)
      // const customerValue = await SalesOrder.findAll({
      //   where: whereClause,
      //   attributes: [
      //     'customer_id',
      //     [fn('COUNT', col('id')), 'order_count'],
      //     [fn('SUM', col('total_amount')), 'total_value'],
      //     [fn('AVG', col('total_amount')), 'avg_order_value'],
      //     [fn('MAX', col('order_date')), 'last_order_date']
      //   ],
      //   group: ['customer_id'],
      //   include: [
      //     {
      //       model: Customer,
      //       as: 'customer',
      //       attributes: ['id', 'name', 'customer_type', 'credit_rating']
      //     }
      //   ],
      //   order: [[fn('SUM', col('total_amount')), 'DESC']],
      //   raw: false
      // });

      // 客户类型分布
      const customerTypeStats = await Customer.findAll({
        where: { status: 'active' },
        attributes: [
          'customer_type',
          [fn('COUNT', col('id')), 'count'],
          [fn('AVG', col('credit_rating')), 'avg_rating']
        ],
        group: ['customer_type'],
        raw: true
      });

      // 信用评级分布
      const creditRatingStats = await Customer.findAll({
        where: { status: 'active' },
        attributes: [
          'credit_rating',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['credit_rating'],
        order: [['credit_rating', 'ASC']],
        raw: true
      });

      res.json({
        success: true,
        data: {
          // customer_value: customerValue,
          customer_type_distribution: customerTypeStats,
          credit_rating_distribution: creditRatingStats,
          period: { start_date, end_date }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '客户价值分析失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 获取客户类型列表
  static async getCustomerTypes(req: Request, res: Response) {
    try {
      const types = await Customer.findAll({
        attributes: [
          [fn('DISTINCT', col('customer_type')), 'customer_type'],
          [fn('COUNT', col('id')), 'count']
        ],
        where: {
          customer_type: { [Op.ne]: null as any },
          status: 'active'
        },
        group: ['customer_type'],
        raw: true
      });

      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '获取客户类型失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 创建客户回访记录
  static async createVisitRecord(req: Request, res: Response) {
    try {
      const { customer_id } = req.params;
      const {
        visit_date,
        visit_type,
        purpose,
        content,
        result,
        next_visit_date
      } = req.body;

      // 验证必填字段
      if (!visit_date || !visit_type || !purpose || !content) {
        throw new ValidationError('回访日期、类型、目的和内容不能为空');
      }

      // 验证客户是否存在
      const customer = await Customer.findByPk(customer_id);
      if (!customer) {
        throw new NotFoundError('客户不存在');
      }

      const visitRecord = await CustomerVisitRecord.create({
        customer_id: Number(customer_id),
        visit_date,
        visit_type,
        visitor_id: req.user?.id || 0, // 从认证中间件获取当前用户ID
        purpose,
        content,
        result,
        next_visit_date,
        status: 'completed'
      });

      res.status(201).json({
        success: true,
        message: '客户回访记录创建成功',
        data: visitRecord
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else if (error instanceof NotFoundError) {
        res.status(404).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: '创建客户回访记录失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  // 获取客户回访记录列表
  static async getVisitRecords(req: Request, res: Response) {
    try {
      const { customer_id } = req.params;
      const {
        page = 1,
        limit = 20,
        visit_type,
        start_date,
        end_date
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = { customer_id: Number(customer_id) };

      if (visit_type) {
        whereClause.visit_type = visit_type;
      }

      if (start_date && end_date) {
        whereClause.visit_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      const { count, rows } = await CustomerVisitRecord.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['visit_date', 'DESC']],
        include: [
          {
            model: Customer,
            as: 'customer',
            attributes: ['id', 'name']
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
        message: '获取客户回访记录失败',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 更新客户回访记录
  static async updateVisitRecord(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const visitRecord = await CustomerVisitRecord.findByPk(id);
      if (!visitRecord) {
        throw new NotFoundError('回访记录不存在');
      }

      await visitRecord.update(updateData);

      res.json({
        success: true,
        message: '客户回访记录更新成功',
        data: visitRecord
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
          message: '更新客户回访记录失败',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }
}