import { Router } from 'express'
import procurementOrderRoutes from './procurementOrders'
import supplierRoutes from './suppliers'
import baseRoutes from './bases'

const router = Router()

// Health check route for API Gateway
router.get('/procurement/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: 'procurement-service',
      port: process.env.PORT || 3007
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

// 采购模块路由
router.use('/procurement/orders', procurementOrderRoutes)
router.use('/procurement/suppliers', supplierRoutes)
router.use('/procurement/bases', baseRoutes)

// 统计数据路由
router.get('/procurement/statistics', async (req, res) => {
  try {
    // 这里可以调用控制器的统计方法
    res.json({
      success: true,
      data: {
        totalOrders: 0,
        pendingOrders: 0,
        approvedOrders: 0,
        completedOrders: 0,
        totalAmount: 0,
        activeSuppliers: 0
      },
      message: '获取采购统计数据成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取采购统计数据失败'
    })
  }
})

// 临时测试路由 - 创建测试供应商数据（开发环境）
router.post('/procurement/test/create-suppliers', async (req, res) => {
  try {
    const { Supplier } = await import('../models/Supplier')
    
    const testSuppliers = [
      {
        name: 'Guizhou Quality Cattle Supplier',
        contactPerson: 'Manager Zhang',
        phone: '13888888888',
        email: 'zhang@supplier.com',
        address: 'Guiyang, Guizhou',
        supplierType: 'cattle',
        businessLicense: 'BL001',
        taxNumber: 'TX001',
        bankAccount: 'BA001',
        creditLimit: 1000000,
        paymentTerms: 'Monthly 30 days',
        rating: 5,
        status: 'active',
        remark: 'Quality supplier',
        createdBy: 1,
        createdByName: 'Admin'
      },
      {
        name: 'Southwest Material Supply Co.',
        contactPerson: 'Director Li',
        phone: '13999999999',
        email: 'li@material.com',
        address: 'Chengdu, Sichuan',
        supplierType: 'material',
        businessLicense: 'BL002',
        taxNumber: 'TX002',
        bankAccount: 'BA002',
        creditLimit: 500000,
        paymentTerms: 'Cash settlement',
        rating: 4,
        status: 'active',
        remark: 'Material supplier',
        createdBy: 1,
        createdByName: 'Admin'
      },
      {
        name: 'Agricultural Equipment Ltd.',
        contactPerson: 'Manager Wang',
        phone: '13777777777',
        email: 'wang@equipment.com',
        address: 'Yubei, Chongqing',
        supplierType: 'equipment',
        businessLicense: 'BL003',
        taxNumber: 'TX003',
        bankAccount: 'BA003',
        creditLimit: 800000,
        paymentTerms: 'Installment payment',
        rating: 4,
        status: 'active',
        remark: 'Equipment supplier',
        createdBy: 1,
        createdByName: 'Admin'
      }
    ]

    const createdSuppliers = await Supplier.bulkCreate(testSuppliers)
    
    res.json({
      success: true,
      data: { suppliers: createdSuppliers },
      message: '测试供应商数据创建成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建测试供应商数据失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

export default router