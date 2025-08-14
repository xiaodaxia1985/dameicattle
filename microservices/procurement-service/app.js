const express = require('express');
const app = express();
const port = process.env.PORT || 3007;

app.use(express.json());

// Mock data for demonstration
let mockOrders = [
  {
    id: 1,
    order_number: 'PO-2025-001',
    supplier_id: 1,
    supplier_name: '优质饲料供应商',
    base_id: 1,
    base_name: '主基地',
    order_type: 'material',
    total_amount: 15000.00,
    tax_amount: 0,
    discount_amount: 0,
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'transfer',
    order_date: '2025-08-10',
    expected_delivery_date: '2025-08-20',
    contract_number: 'CT-2025-001',
    remark: '测试订单',
    created_by: 'admin',
    created_by_name: '管理员',
    created_at: '2025-08-10T10:00:00Z',
    updated_at: '2025-08-10T10:00:00Z',
    items: [
      { 
        id: 1, 
        itemName: '玉米饲料',
        specification: '50kg/袋',
        quantity: 1000, 
        unit: 'kg',
        unitPrice: 15.00,
        totalPrice: 15000.00,
        remark: '优质玉米饲料'
      }
    ]
  }
];

let mockSuppliers = [
  {
    id: 1,
    name: '优质饲料供应商',
    contact_person: '张经理',
    phone: '13800138001',
    address: '北京市朝阳区饲料街123号',
    status: 'active'
  }
];

// Simple auth middleware (mock)
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    });
  }
  next();
};

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'procurement-service',
    name: 'Procurement Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/procurement/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'procurement-service',
    name: 'Procurement Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Procurement Service API',
    service: 'procurement-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/procurement/health', '/api/v1/procurement/orders']
  });
});

// Procurement Orders API
app.get('/api/v1/procurement/orders', authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const paginatedOrders = mockOrders.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      orders: paginatedOrders,
      pagination: {
        total: mockOrders.length,
        page: page,
        limit: limit,
        pages: Math.ceil(mockOrders.length / limit)
      }
    },
    message: '获取采购订单列表成功',
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0.0'
    }
  });
});

app.get('/api/v1/procurement/orders/:id', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = mockOrders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: '采购订单不存在',
      code: 'ORDER_NOT_FOUND'
    });
  }

  res.json({
    success: true,
    data: { order },
    message: '获取采购订单详情成功'
  });
});

app.post('/api/v1/procurement/orders', authMiddleware, (req, res) => {
  const { supplier_name, items, notes } = req.body;

  if (!supplier_name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供供应商名称和订单项目',
      code: 'INVALID_INPUT'
    });
  }

  const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const newOrder = {
    id: mockOrders.length + 1,
    order_number: `PO-2025-${String(mockOrders.length + 1).padStart(3, '0')}`,
    supplier_name,
    total_amount,
    status: 'pending',
    notes: notes || '',
    created_at: new Date().toISOString(),
    items
  };

  mockOrders.push(newOrder);

  res.status(201).json({
    success: true,
    data: { order: newOrder },
    message: '创建采购订单成功'
  });
});

// 更新采购订单
app.put('/api/v1/procurement/orders/:id', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.id);
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '采购订单不存在',
      code: 'ORDER_NOT_FOUND'
    });
  }

  const order = mockOrders[orderIndex];
  
  // 只有待审批状态的订单才能编辑
  if (order.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '只有待审批状态的订单才能编辑',
      code: 'ORDER_NOT_EDITABLE'
    });
  }

  // 更新订单数据
  const updatedOrder = {
    ...order,
    ...req.body,
    id: orderId,
    updated_at: new Date().toISOString()
  };

  mockOrders[orderIndex] = updatedOrder;

  res.json({
    success: true,
    data: { order: updatedOrder },
    message: '更新采购订单成功'
  });
});

// 审批采购订单
app.post('/api/v1/procurement/orders/:id/approve', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.id);
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '采购订单不存在',
      code: 'ORDER_NOT_FOUND'
    });
  }

  const order = mockOrders[orderIndex];
  
  if (order.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: '只有待审批状态的订单才能审批',
      code: 'ORDER_NOT_APPROVABLE'
    });
  }

  // 更新订单状态为已审批
  mockOrders[orderIndex] = {
    ...order,
    status: 'approved',
    approved_by: 'admin',
    approved_by_name: '管理员',
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: { order: mockOrders[orderIndex] },
    message: '审批采购订单成功'
  });
});

// 取消采购订单
app.post('/api/v1/procurement/orders/:id/cancel', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.id);
  const { reason } = req.body;
  const orderIndex = mockOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '采购订单不存在',
      code: 'ORDER_NOT_FOUND'
    });
  }

  const order = mockOrders[orderIndex];
  
  if (!['pending', 'approved'].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: '只有待审批或已审批状态的订单才能取消',
      code: 'ORDER_NOT_CANCELLABLE'
    });
  }

  // 更新订单状态为已取消
  mockOrders[orderIndex] = {
    ...order,
    status: 'cancelled',
    cancel_reason: reason || '用户手动取消',
    cancelled_by: 'admin',
    cancelled_by_name: '管理员',
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: { order: mockOrders[orderIndex] },
    message: '取消采购订单成功'
  });
});

// 批量审批订单
app.post('/api/v1/procurement/orders/batch-approve', authMiddleware, (req, res) => {
  const { orderIds } = req.body;

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供要审批的订单ID列表',
      code: 'INVALID_INPUT'
    });
  }

  const approvedOrders = [];
  const errors = [];

  orderIds.forEach(orderId => {
    const orderIndex = mockOrders.findIndex(o => o.id === parseInt(orderId));
    
    if (orderIndex === -1) {
      errors.push({ orderId, message: '订单不存在' });
      return;
    }

    const order = mockOrders[orderIndex];
    
    if (order.status !== 'pending') {
      errors.push({ orderId, message: '订单状态不允许审批' });
      return;
    }

    // 更新订单状态
    mockOrders[orderIndex] = {
      ...order,
      status: 'approved',
      approved_by: 'admin',
      approved_by_name: '管理员',
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    approvedOrders.push(mockOrders[orderIndex]);
  });

  res.json({
    success: true,
    data: {
      approvedOrders,
      errors,
      summary: {
        total: orderIds.length,
        approved: approvedOrders.length,
        failed: errors.length
      }
    },
    message: `批量审批完成，成功 ${approvedOrders.length} 个，失败 ${errors.length} 个`
  });
});

// Suppliers API
app.get('/api/v1/procurement/suppliers', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      suppliers: mockSuppliers,
      pagination: {
        total: mockSuppliers.length,
        page: 1,
        limit: 20,
        pages: 1
      }
    },
    message: '获取供应商列表成功'
  });
});

// Statistics API
app.get('/api/v1/procurement/statistics', authMiddleware, (req, res) => {
  const totalOrders = mockOrders.length;
  const totalAmount = mockOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = mockOrders.filter(order => order.status === 'pending').length;

  res.json({
    success: true,
    data: {
      totalOrders,
      totalAmount,
      pendingOrders,
      activeSuppliers: mockSuppliers.filter(s => s.status === 'active').length
    },
    message: '获取采购统计数据成功'
  });
});

// Bases API (for dropdown selection)
app.get('/api/v1/procurement/bases', authMiddleware, (req, res) => {
  const mockBases = [
    {
      id: 1,
      name: '主基地',
      address: '北京市朝阳区农业园区1号',
      status: 'active'
    },
    {
      id: 2,
      name: '分基地A',
      address: '河北省廊坊市农业园区2号',
      status: 'active'
    }
  ];

  res.json({
    success: true,
    data: {
      bases: mockBases,
      pagination: {
        total: mockBases.length,
        page: 1,
        limit: 20,
        pages: 1
      }
    },
    message: '获取基地列表成功'
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    service: 'procurement-service',
    path: req.originalUrl,
    code: 'ROUTE_NOT_FOUND'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`procurement-service listening on port ${port}`);
});
