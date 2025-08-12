const express = require('express');
const app = express();
const port = process.env.PORT || 3007;

app.use(express.json());

// Mock data for demonstration
let mockOrders = [
  {
    id: 1,
    order_number: 'PO-2025-001',
    supplier_name: '优质饲料供应商',
    total_amount: 15000.00,
    status: 'pending',
    created_at: '2025-08-10T10:00:00Z',
    items: [
      { id: 1, material_name: '玉米饲料', quantity: 1000, unit_price: 15.00 }
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
