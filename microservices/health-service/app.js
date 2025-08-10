const express = require('express');
const app = express();
const port = process.env.PORT || 3004;

app.use(express.json());

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'health-service',
    name: 'Health Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway (using /status to avoid conflict)
app.get('/api/v1/health/status', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'health-service',
    name: 'Health Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Health Service API',
    service: 'health-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/health/status', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'health-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API v1 health routes
app.get('/api/v1/health/service-status', (req, res) => {
  res.json({
    service: 'health-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 健康管理路由
// GET /api/v1/health/records - 获取健康记录列表
app.get('/api/v1/health/records', (req, res) => {
  const mockRecords = [
    {
      id: 1,
      cattle_id: 1,
      cattle_ear_tag: 'C001',
      cattle_name: '小花',
      record_type: 'checkup',
      temperature: 38.5,
      heart_rate: 70,
      respiratory_rate: 25,
      weight: 450,
      health_status: 'healthy',
      symptoms: '',
      diagnosis: '健康',
      treatment: '',
      veterinarian: '王医生',
      record_date: '2024-01-15T10:00:00Z',
      next_checkup: '2024-02-15T10:00:00Z',
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      cattle_id: 2,
      cattle_ear_tag: 'C002',
      cattle_name: '大黄',
      record_type: 'treatment',
      temperature: 39.2,
      heart_rate: 80,
      respiratory_rate: 30,
      weight: 520,
      health_status: 'sick',
      symptoms: '食欲不振，精神萎靡',
      diagnosis: '消化不良',
      treatment: '调整饲料，给予益生菌',
      veterinarian: '李医生',
      record_date: '2024-01-20T14:30:00Z',
      next_checkup: '2024-01-25T14:30:00Z',
      created_at: '2024-01-20T14:30:00Z'
    }
  ];

  res.json({
    success: true,
    data: {
      records: mockRecords,
      pagination: {
        total: mockRecords.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    },
    message: '获取健康记录成功'
  });
});

// POST /api/v1/health/records - 创建健康记录
app.post('/api/v1/health/records', (req, res) => {
  const newRecord = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: newRecord,
    message: '创建健康记录成功'
  });
});

// GET /api/v1/health/vaccines - 获取疫苗记录
app.get('/api/v1/health/vaccines', (req, res) => {
  const mockVaccines = [
    {
      id: 1,
      cattle_id: 1,
      cattle_ear_tag: 'C001',
      vaccine_name: '口蹄疫疫苗',
      vaccine_type: 'prevention',
      batch_number: 'V20240101',
      vaccination_date: '2024-01-10T09:00:00Z',
      next_vaccination: '2024-07-10T09:00:00Z',
      veterinarian: '王医生',
      notes: '接种正常，无不良反应',
      created_at: '2024-01-10T09:00:00Z'
    }
  ];

  res.json({
    success: true,
    data: {
      vaccines: mockVaccines,
      pagination: {
        total: mockVaccines.length,
        page: 1,
        limit: 20,
        totalPages: 1
      }
    },
    message: '获取疫苗记录成功'
  });
});

// POST /api/v1/health/vaccines - 创建疫苗记录
app.post('/api/v1/health/vaccines', (req, res) => {
  const newVaccine = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };

  res.json({
    success: true,
    data: newVaccine,
    message: '创建疫苗记录成功'
  });
});

// GET /api/v1/health/statistics - 获取健康统计
app.get('/api/v1/health/statistics', (req, res) => {
  const mockStatistics = {
    total_records: 150,
    healthy_count: 120,
    sick_count: 20,
    treatment_count: 10,
    vaccination_due: 15,
    recent_checkups: 25,
    health_trends: {
      'healthy': 80,
      'sick': 13,
      'treatment': 7
    },
    common_diseases: [
      { name: '消化不良', count: 8 },
      { name: '呼吸道感染', count: 5 },
      { name: '蹄病', count: 3 }
    ]
  };

  res.json({
    success: true,
    data: mockStatistics,
    message: '获取健康统计成功'
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'health-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`health-service listening on port ${port}`);
});
