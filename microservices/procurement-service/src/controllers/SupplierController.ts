import { Request, Response } from 'express'
import { Op } from 'sequelize'
import { Supplier } from '../models/Supplier'
import { logger } from '../utils/logger'

export class SupplierController {
  /**
   * 获取供应商列表
   */
  async getSuppliers(req: Request, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        name,
        supplierType,
        status,
        phone,
        contactPerson
      } = req.query

      const offset = (Number(page) - 1) * Number(limit)
      
      // 构建查询条件
      const whereConditions: any = {}
      
      if (name) {
        whereConditions.name = {
          [Op.iLike]: `%${name}%`
        }
      }
      
      if (supplierType) {
        whereConditions.supplierType = supplierType
      }
      
      if (status) {
        whereConditions.status = status
      }
      
      if (phone) {
        whereConditions.phone = {
          [Op.iLike]: `%${phone}%`
        }
      }
      
      if (contactPerson) {
        whereConditions.contactPerson = {
          [Op.iLike]: `%${contactPerson}%`
        }
      }

      // 查询供应商列表
      const { count, rows } = await Supplier.findAndCountAll({
        where: whereConditions,
        order: [['createdAt', 'DESC']],
        limit: Number(limit),
        offset
      })

      res.json({
        success: true,
        data: {
          suppliers: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        },
        message: '获取供应商列表成功'
      })
    } catch (error) {
      logger.error('获取供应商列表失败:', error)
      res.status(500).json({
        success: false,
        message: '获取供应商列表失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取供应商详情
   */
  async getSupplierById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      res.json({
        success: true,
        data: { supplier },
        message: '获取供应商详情成功'
      })
    } catch (error) {
      logger.error('获取供应商详情失败:', error)
      res.status(500).json({
        success: false,
        message: '获取供应商详情失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 创建供应商
   */
  async createSupplier(req: Request, res: Response) {
    try {
      const {
        name,
        contactPerson,
        phone,
        email,
        address,
        supplierType,
        businessLicense,
        taxNumber,
        bankAccount,
        creditLimit = 0,
        paymentTerms,
        rating = 5,
        remark
      } = req.body

      const user = (req as any).user

      // 验证必填字段
      if (!name || !contactPerson || !phone || !address) {
        return res.status(400).json({
          success: false,
          message: '请提供必要的供应商信息',
          code: 'MISSING_REQUIRED_FIELDS'
        })
      }

      // 检查供应商名称是否已存在
      const existingSupplier = await Supplier.findOne({
        where: { name }
      })

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: '供应商名称已存在',
          code: 'SUPPLIER_NAME_EXISTS'
        })
      }

      // 创建供应商
      const supplier = await Supplier.create({
        name,
        contactPerson,
        phone,
        email,
        address,
        supplierType: supplierType || 'material',
        businessLicense,
        taxNumber,
        bankAccount,
        creditLimit: Number(creditLimit),
        paymentTerms,
        rating: Number(rating),
        remark,
        createdBy: user.id,
        createdByName: user.name
      })

      res.status(201).json({
        success: true,
        data: { supplier },
        message: '创建供应商成功'
      })
    } catch (error) {
      logger.error('创建供应商失败:', error)
      res.status(500).json({
        success: false,
        message: '创建供应商失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 更新供应商
   */
  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params
      const {
        name,
        contactPerson,
        phone,
        email,
        address,
        supplierType,
        businessLicense,
        taxNumber,
        bankAccount,
        creditLimit,
        paymentTerms,
        rating,
        status,
        remark
      } = req.body

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      // 如果更新名称，检查是否与其他供应商重复
      if (name && name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          where: { 
            name,
            id: { [Op.ne]: id }
          }
        })

        if (existingSupplier) {
          return res.status(400).json({
            success: false,
            message: '供应商名称已存在',
            code: 'SUPPLIER_NAME_EXISTS'
          })
        }
      }

      // 更新供应商信息
      await supplier.update({
        name: name || supplier.name,
        contactPerson: contactPerson || supplier.contactPerson,
        phone: phone || supplier.phone,
        email: email !== undefined ? email : supplier.email,
        address: address || supplier.address,
        supplierType: supplierType || supplier.supplierType,
        businessLicense: businessLicense !== undefined ? businessLicense : supplier.businessLicense,
        taxNumber: taxNumber !== undefined ? taxNumber : supplier.taxNumber,
        bankAccount: bankAccount !== undefined ? bankAccount : supplier.bankAccount,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : supplier.creditLimit,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : supplier.paymentTerms,
        rating: rating !== undefined ? Number(rating) : supplier.rating,
        status: status || supplier.status,
        remark: remark !== undefined ? remark : supplier.remark
      })

      res.json({
        success: true,
        data: { supplier },
        message: '更新供应商成功'
      })
    } catch (error) {
      logger.error('更新供应商失败:', error)
      res.status(500).json({
        success: false,
        message: '更新供应商失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 删除供应商
   */
  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      // 检查是否有关联的采购订单
      // 这里可以添加检查逻辑，防止删除有订单的供应商

      await supplier.destroy()

      res.json({
        success: true,
        message: '删除供应商成功'
      })
    } catch (error) {
      logger.error('删除供应商失败:', error)
      res.status(500).json({
        success: false,
        message: '删除供应商失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 启用/禁用供应商
   */
  async toggleSupplierStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body

      if (!['active', 'inactive', 'blacklisted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的供应商状态',
          code: 'INVALID_STATUS'
        })
      }

      const supplier = await Supplier.findByPk(id)

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: '供应商不存在',
          code: 'SUPPLIER_NOT_FOUND'
        })
      }

      await supplier.update({ status })

      res.json({
        success: true,
        data: { supplier },
        message: '更新供应商状态成功'
      })
    } catch (error) {
      logger.error('更新供应商状态失败:', error)
      res.status(500).json({
        success: false,
        message: '更新供应商状态失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }

  /**
   * 获取供应商选项列表（用于下拉选择）
   */
  async getSupplierOptions(req: Request, res: Response) {
    try {
      const { supplierType } = req.query

      const whereConditions: any = {
        status: 'active'
      }

      if (supplierType) {
        whereConditions.supplierType = supplierType
      }

      const suppliers = await Supplier.findAll({
        where: whereConditions,
        attributes: ['id', 'name', 'contactPerson', 'phone', 'supplierType'],
        order: [['name', 'ASC']]
      })

      res.json({
        success: true,
        data: { suppliers },
        message: '获取供应商选项成功'
      })
    } catch (error) {
      logger.error('获取供应商选项失败:', error)
      res.status(500).json({
        success: false,
        message: '获取供应商选项失败',
        error: error instanceof Error ? error.message : '未知错误'
      })
    }
  }
}