const express = require('express');
const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cattle-service',
    name: 'Cattle Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/cattle/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cattle-service',
    name: 'Cattle Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Cattle Service API',
    service: 'cattle-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/cattle/health', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'cattle-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API v1 cattle routes
app.get('/api/v1/cattle/status', (req, res) => {
  res.json({
    service: 'cattle-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 牛只管理路由
// GET /api/v1/cattle/cattle - 获取牛只列表
app.get('/api/v1/cattle/cattle', (req, res) => {
  // 模拟牛只数据
  const mockCattle = [
    {
      id: 1,
      ear_tag: 'C001',
      name: '小花',
      breed: '荷斯坦奶牛',
      gender: 'female',
      birth_date: '2023-01-15',
      weight: 450,
      health_status: 'healthy',
      barn_id: 1,
      barn_name: '1号牛舍',
      base_id: 1,
      base_name: '北京养殖基地',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      ear_tag: 'C002',
      name: '大黄',
      breed: '西门塔尔牛',
      gender: 'male',
      birth_date: '2023-02-20',
      weight: 520,
      health_status: 'healthy',
      barn_id: 1,
      barn_name: '1号牛舍',
      base_id: 1,
      base_name: '北京养殖基地',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  res.json({
    success: true,
    data: {
      cattle: mockCattle,
      pagination: {
        total: mockCattle.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    },
    message: '获取牛只列表成功'
  });
});

// GET /api/v1/cattle/cattle/:id - 获取牛只详情
app.get('/api/v1/cattle/cattle/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const mockCattle = {
    id: id,
    ear_tag: `C${id.toString().padStart(3, '0')}`,
    name: `牛只${id}`,
    breed: '荷斯坦奶牛',
    gender: 'female',
    birth_date: '2023-01-15',
    weight: 450,
    health_status: 'healthy',
    barn_id: 1,
    barn_name: '1号牛舍',
    base_id: 1,
    base_name: '北京养殖基地',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  res.json({
    success: true,
    data: mockCattle,
    message: '获取牛只详情成功'
  });
});

// GET /api/v1/cattle/cattle/scan/:earTag - 通过耳标扫描获取牛只
app.get('/api/v1/cattle/cattle/scan/:earTag', (req, res) => {
  const earTag = req.params.earTag;
  const mockCattle = {
    id: 1,
    ear_tag: earTag,
    name: '扫描牛只',
    breed: '荷斯坦奶牛',
    gender: 'female',
    birth_date: '2023-01-15',
    weight: 450,
    health_status: 'healthy',
    barn_id: 1,
    barn_name: '1号牛舍',
    base_id: 1,
    base_name: '北京养殖基地',
    status: 'active',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  res.json({
    success: true,
    data: mockCattle,
    message: '扫描牛只成功'
  });
});

// POST /api/v1/cattle/cattle - 创建牛只
app.post('/api/v1/cattle/cattle', (req, res) => {
  const newCattle = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: newCattle,
    message: '创建牛只成功'
  });
});

// PUT /api/v1/cattle/cattle/:id - 更新牛只
app.put('/api/v1/cattle/cattle/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updatedCattle = {
    id: id,
    ...req.body,
    updated_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: updatedCattle,
    message: '更新牛只成功'
  });
});

// DELETE /api/v1/cattle/cattle/:id - 删除牛只
app.delete('/api/v1/cattle/cattle/:id', (req, res) => {
  res.json({
    success: true,
    message: '删除牛只成功'
  });
});

// GET /api/v1/cattle/cattle/statistics - 获取牛只统计
app.get('/api/v1/cattle/cattle/statistics', (req, res) => {
  const mockStatistics = {
    total_count: 1250,
    healthy_count: 1200,
    sick_count: 30,
    quarantine_count: 20,
    by_breed: {
      '荷斯坦奶牛': 800,
      '西门塔尔牛': 300,
      '安格斯牛': 150
    },
    by_gender: {
      'male': 400,
      'female': 850
    },
    by_age_group: {
      'calf': 200,
      'young': 400,
      'adult': 650
    }
  };

  res.json({
    success: true,
    data: mockStatistics,
    message: '获取牛只统计成功'
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'cattle-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`cattle-service listening on port ${port}`);
});
