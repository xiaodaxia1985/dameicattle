const express = require('express');
const app = express();
const port = process.env.PORT || 3008;

app.use(express.json());

// Mock data for demonstration
let mockOrders = [
  {
    id: 1,
    order_number: 'SO-2025-001',
    customer_name: '北京优质肉业有限公司',
    total_amount: 25000.00,
    status: 'confirmed',
    created_at: '2025-08-10T10:00:00Z',
    items: [
      { id: 1, cattle_ear_tag: 'C001', weight: 500, unit_price: 50.00 }
    ]
  }
];

let mockCustomers = [
  {
    id: 1,
    name: '北京优质肉业有限公司',
    contact_person: '李经理',
    phone: '13900139001',
    address: '北京市海淀区肉业街456号',
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
    service: 'sales-service',
    name: 'Sales Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/sales/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sales-service',
    name: 'Sales Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Sales Service API',
    service: 'sales-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/sales/health', '/api/v1/sales/orders']
  });
});

// Sales Orders API
app.get('/api/v1/sales/orders', authMiddleware, (req, res) => {
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
    message: '获取销售订单列表成功',
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0.0'
    }
  });
});

app.get('/api/v1/sales/orders/:id', authMiddleware, (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = mockOrders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: '销售订单不存在',
      code: 'ORDER_NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: { order },
    message: '获取销售订单详情成功'
  });
});

app.post('/api/v1/sales/orders', authMiddleware, (req, res) => {
  const { customer_name, items, notes } = req.body;
  
  if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: '请提供客户名称和订单项目',
      code: 'INVALID_INPUT'
    });
  }
  
  const total_amount = items.reduce((sum, item) => sum + (item.weight * item.unit_price), 0);
  
  const newOrder = {
    id: mockOrders.length + 1,
    order_number: `SO-2025-${String(mockOrders.length + 1).padStart(3, '0')}`,
    customer_name,
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
    message: '创建销售订单成功'
  });
});

// Customers API
app.get('/api/v1/sales/customers', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      customers: mockCustomers,
      pagination: {
        total: mockCustomers.length,
        page: 1,
        limit: 20,
        pages: 1
      }
    },
    message: '获取客户列表成功'
  });
});

// Statistics API
app.get('/api/v1/sales/statistics', authMiddleware, (req, res) => {
  const totalOrders = mockOrders.length;
  const totalAmount = mockOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const confirmedOrders = mockOrders.filter(order => order.status === 'confirmed').length;
  
  res.json({
    success: true,
    data: {
      totalOrders,
      totalAmount,
      confirmedOrders,
      activeCustomers: mockCustomers.filter(c => c.status === 'active').length
    },
    message: '获取销售统计数据成功'
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    service: 'sales-service',
    path: req.originalUrl,
    code: 'ROUTE_NOT_FOUND'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`sales-service listening on port ${port}`);
});
