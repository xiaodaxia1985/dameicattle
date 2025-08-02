-- 连接到认证数据库
\c auth_db;

-- 创建用户表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 创建默认管理员用户（密码: admin123）
INSERT INTO users (username, email, password, role, "isActive", "createdAt", "updatedAt") 
VALUES (
  'admin',
  'admin@cattle-management.com',
  '$2a$12$PtRlhVprejN61LqMTgh.IeqXuP2VbNXMDzezW/sKKmmb9eWiZ7OpG',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- 创建测试用户（密码: manager123）
INSERT INTO users (username, email, password, role, "isActive", "createdAt", "updatedAt") 
VALUES (
  'manager',
  'manager@cattle-management.com',
  '$2a$12$D88YULXCEukiN/l5NvrkGOEjjMFPIoIqGHKqSuZj9NNnnUU9vseiW',
  'manager',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;