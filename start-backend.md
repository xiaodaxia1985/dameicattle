# 启动后端服务指南

## 快速启动

1. 进入后端目录：
```bash
cd backend
```

2. 安装依赖（如果还没有安装）：
```bash
npm install
```

3. 设置环境变量（复制并修改环境配置文件）：
```bash
cp .env.example .env.development
```

4. 启动数据库（如果使用Docker）：
```bash
docker-compose up -d postgres redis
```

5. 初始化数据库：
```bash
npm run db:setup
```

6. 启动开发服务器：
```bash
npm run dev
```

## 验证服务启动

后端服务启动后，你应该能看到：
- 服务运行在 http://localhost:3000
- 健康检查端点：http://localhost:3000/api/v1/health
- 默认管理员账户：admin / Admin123

## 常见问题

### 数据库连接失败
- 确保PostgreSQL服务正在运行
- 检查.env.development文件中的数据库配置

### Redis连接失败
- 确保Redis服务正在运行
- 应用会在没有Redis的情况下继续运行，但会失去缓存功能

### 端口被占用
- 修改.env.development文件中的PORT配置
- 或者停止占用3000端口的其他服务