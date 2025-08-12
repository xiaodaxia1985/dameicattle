import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// 简单的健康检查 - 支持两种路径
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'auth-service',
    port: PORT
  });
});

app.get('/api/v1/auth/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    service: 'auth-service',
    port: PORT
  });
});

// 简单的认证端点 - 生成真正的JWT令牌
app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空',
      code: 'MISSING_CREDENTIALS'
    });
  }
  
  // 简单的测试认证
  if (username === 'admin' && password === 'admin123') {
    // 生成真正的JWT令牌
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'cattle-management-secret-key-2024';
    
    const token = jwt.sign(
      {
        id: 1,
        username: 'admin',
        role_id: 1,
        base_id: null // admin can access all bases
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: 1,
          username: 'admin',
          role: 'admin',
          role_id: 1,
          base_id: null
        }
      }
    });
  }
  
  res.status(401).json({
    success: false,
    message: '用户名或密码错误',
    code: 'INVALID_CREDENTIALS'
  });
});

app.get('/api/v1/auth/profile', (req, res) => {
  res.json({
    success: true,
    message: '获取用户信息成功',
    data: {
      id: 1,
      username: 'admin',
      role: 'admin'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'ROUTE_NOT_FOUND'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 auth-service is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/v1/auth/login`);
});

export default app;