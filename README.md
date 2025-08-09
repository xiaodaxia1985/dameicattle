# 肉牛全生命周期管理系统

基于微服务架构的现代化肉牛管理系统，包含前端、小程序和13个微服务。

## 项目架构

```
cattle-management-system/
├── frontend/           # Vue.js 前端应用
├── miniprogram/        # 微信小程序
├── microservices/      # 微服务集群
│   ├── api-gateway/    # API网关 (3000)
│   ├── auth-service/   # 认证服务 (3001)
│   ├── base-service/   # 基地管理 (3002)
│   ├── cattle-service/ # 牛只管理 (3003)
│   ├── health-service/ # 健康管理 (3004)
│   ├── feeding-service/# 饲养管理 (3005)
│   ├── equipment-service/ # 设备管理 (3006)
│   ├── procurement-service/ # 采购管理 (3007)
│   ├── sales-service/  # 销售管理 (3008)
│   ├── material-service/ # 物料管理 (3009)
│   ├── notification-service/ # 通知服务 (3010)
│   ├── file-service/   # 文件服务 (3011)
│   ├── monitoring-service/ # 监控服务 (3012)
│   └── news-service/   # 新闻服务 (3013)
├── database/           # 数据库初始化脚本
├── docs/              # 项目文档
└── tests/             # 测试文件
```

## 快速开始

### 前置条件
- Node.js >= 18.0.0
- PostgreSQL (localhost:5432)
- Redis (localhost:6379) - 可选

### 启动微服务
```powershell
# 启动所有13个微服务
npm run dev:microservices

# 或者进入微服务目录手动启动
cd microservices
.\start-services-npm.ps1

# 停止所有微服务
npm run stop:microservices
```

### 启动前端
```bash
# 启动前端开发服务器
npm run dev:frontend

# 构建前端
npm run build:frontend
```

### 启动小程序
```bash
# 启动小程序开发
npm run dev:miniprogram

# 构建小程序
npm run build:miniprogram
```

## 服务端口

| 服务 | 端口 | 描述 |
|------|------|------|
| API Gateway | 3000 | 统一API入口 |
| Auth Service | 3001 | 用户认证 |
| Base Service | 3002 | 基地管理 |
| Cattle Service | 3003 | 牛只管理 |
| Health Service | 3004 | 健康管理 |
| Feeding Service | 3005 | 饲养管理 |
| Equipment Service | 3006 | 设备管理 |
| Procurement Service | 3007 | 采购管理 |
| Sales Service | 3008 | 销售管理 |
| Material Service | 3009 | 物料管理 |
| Notification Service | 3010 | 通知服务 |
| File Service | 3011 | 文件服务 |
| Monitoring Service | 3012 | 监控服务 |
| News Service | 3013 | 新闻服务 |

## API 访问

所有API通过网关访问：
```
http://localhost:3000/api/v1/{service}/...
```

例如：
- 用户登录: `POST http://localhost:3000/api/v1/auth/login`
- 获取牛只列表: `GET http://localhost:3000/api/v1/cattle/list`
- 健康检查: `GET http://localhost:3000/health`

## 开发指南

详细的开发文档请参考 `docs/` 目录。

## 技术栈

- **前端**: Vue.js 3 + TypeScript + Vite
- **小程序**: uni-app
- **微服务**: Node.js + TypeScript + Express
- **数据库**: PostgreSQL
- **缓存**: Redis
- **API网关**: Express + http-proxy-middleware

## 许可证

MIT License