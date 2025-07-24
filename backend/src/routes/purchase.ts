import { Router } from 'express';
import { requirePermission } from '@/middleware/auth';

const router = Router();

// 模拟采购控制器
const purchaseController = {
  // 获取采购订单列表
  getOrders: (req: any, res: any) => {
    const { page = 1, limit = 20, status, supplier_id, start_date, end_date } = req.query;
    
    // 模拟采购订单数据
    const orders = [
      {
        id: 1,
        order_number: 'PO202401001',
        supplier_id: 1,
        supplier_name: '优质饲料供应商',
        total_amount: 15000.00,
        status: 'pending',
        order_date: '2024-01-15',
        expected_delivery_date: '2024-01-25',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 1,
            material_name: '优质玉米饲料',
            quantity: 1000,
            unit_price: 15.00,
            total_price: 15000.00
          }
        ]
      },
      {
        id: 2,
        order_number: 'PO202401002',
        supplier_id: 2,
        supplier_name: '设备供应商',
        total_amount: 25000.00,
        status: 'approved',
        order_date: '2024-01-10',
        expected_delivery_date: '2024-01-20',
        created_at: new Date().toISOString(),
        items: [
          {
            id: 2,
            material_name: '自动饲喂设备',
            quantity: 1,
            unit_price: 25000.00,
            total_price: 25000.00
          }
        ]
      }
    ];

    let filteredOrders = orders;
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }
    if (supplier_id) {
      filteredOrders = filteredOrders.filter(order => order.supplier_id === Number(supplier_id));
    }

    const total = filteredOrders.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedOrders = filteredOrders.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      data: {
        data: paginatedOrders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  },

  // 创建采购订单
  createOrder: (req: any, res: any) => {
    const { supplier_id, items, expected_delivery_date, notes } = req.body;
    
    const newOrder = {
      id: Date.now(),
      order_number: `PO${new Date().getFullYear()}${String(Date.now()).slice(-5)}`,
      supplier_id,
      supplier_name: '新供应商',
      total_amount: items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0),
      status: 'pending',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date,
      notes,
      created_at: new Date().toISOString(),
      items
    };

    res.status(201).json({
      success: true,
      data: newOrder,
      message: '采购订单创建成功'
    });
  },

  // 更新采购订单
  updateOrder: (req: any, res: any) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedOrder = {
      id: Number(id),
      ...updateData,
      updated_at: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedOrder,
      message: '采购订单更新成功'
    });
  },

  // 删除采购订单
  deleteOrder: (req: any, res: any) => {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: '采购订单删除成功'
    });
  },

  // 审批采购订单
  approveOrder: (req: any, res: any) => {
    const { id } = req.params;
    
    const approvedOrder = {
      id: Number(id),
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: req.user?.id
    };

    res.json({
      success: true,
      data: approvedOrder,
      message: '采购订单审批成功'
    });
  },

  // 取消采购订单
  cancelOrder: (req: any, res: any) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const cancelledOrder = {
      id: Number(id),
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancelled_by: req.user?.id,
      cancel_reason: reason
    };

    res.json({
      success: true,
      data: cancelledOrder,
      message: '采购订单取消成功'
    });
  },

  // 批量审批订单
  batchApproveOrders: (req: any, res: any) => {
    const { orderIds } = req.body;
    
    res.json({
      success: true,
      data: {
        approved_count: orderIds.length,
        approved_ids: orderIds
      },
      message: `成功审批 ${orderIds.length} 个采购订单`
    });
  },

  // 获取采购统计数据
  getStatistics: (req: any, res: any) => {
    const { start_date, end_date, supplier_id } = req.query;
    
    const statistics = {
      total_orders: 156,
      total_amount: 2580000.00,
      pending_orders: 12,
      approved_orders: 98,
      completed_orders: 46,
      avg_order_value: 16538.46,
      top_suppliers: [
        {
          supplier_id: 1,
          supplier_name: '优质饲料供应商',
          order_count: 45,
          total_amount: 675000.00
        },
        {
          supplier_id: 2,
          supplier_name: '设备供应商',
          order_count: 23,
          total_amount: 920000.00
        }
      ],
      monthly_trend: [
        { month: '2024-01', order_count: 15, total_amount: 245000.00 },
        { month: '2024-02', order_count: 18, total_amount: 298000.00 },
        { month: '2024-03', order_count: 22, total_amount: 356000.00 }
      ]
    };

    res.json({
      success: true,
      data: statistics
    });
  },

  // 导出采购报表
  exportReport: (req: any, res: any) => {
    // 模拟导出功能
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=purchase-report.xlsx');
    
    // 返回模拟的Excel数据
    const mockExcelData = Buffer.from('Mock Excel Data for Purchase Report');
    res.send(mockExcelData);
  }
};

// 采购订单路由
router.get('/orders', requirePermission('purchase:read'), purchaseController.getOrders);
router.post('/orders', requirePermission('purchase:create'), purchaseController.createOrder);
router.put('/orders/:id', requirePermission('purchase:update'), purchaseController.updateOrder);
router.delete('/orders/:id', requirePermission('purchase:delete'), purchaseController.deleteOrder);
router.post('/orders/:id/approve', requirePermission('purchase:approve'), purchaseController.approveOrder);
router.post('/orders/:id/cancel', requirePermission('purchase:update'), purchaseController.cancelOrder);
router.post('/orders/batch-approve', requirePermission('purchase:approve'), purchaseController.batchApproveOrders);

// 采购统计路由
router.get('/statistics', requirePermission('purchase:read'), purchaseController.getStatistics);

// 导出路由
router.get('/export', requirePermission('purchase:export'), purchaseController.exportReport);

export default router;