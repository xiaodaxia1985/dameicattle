# 肉牛管理系统微服务架构

## 架构概述

本项目采用微服务架构，将原有的单体应用拆分为多个独立的服务，每个服务负责特定的业务领域。

## 服务列表

### 核心业务服务
- **auth-service** (端口: 3001) - 用户认证与授权
- **base-service** (端口: 3002) - 基地与牛舍管理
- **cattle-service** (端口: 3003) - 牛只管理
- **health-service** (端口: 3004) - 健康管理
- **feeding-service** (端口: 3005) - 饲养管理
- **equipment-service** (端口: 3006) - 设备管理
- **procurement-service** (端口: 3007) - 采购管理
- **sales-service** (端口: 3008) - 销售管理
- **material-service** (端口: 3009) - 物料管理

### 支撑服务
- **api-gateway** (端口: 3000) - API网关
- **notification-service** (端口: 3010) - 通知服务
- **file-service** (端口: 3011) - 文件服务
- **monitoring-service** (端口: 3012) - 监控服务

## 技术栈

- **运行时**: Node.js + TypeScript
- **框架**: Express.js
- **数据库**: PostgreSQL (每个服务独立数据库)
- **缓存**: Redis
- **消息队列**: Redis Pub/Sub
- **服务发现**: Consul (可选)
- **容器化**: Docker
- **编排**: Docker Compose

## 服务间通信

- **同步通信**: HTTP/REST API
- **异步通信**: Redis Pub/Sub
- **服务发现**: 环境变量配置 + 健康检查

## 数据一致性

- **最终一致性**: 通过事件驱动架构
- **分布式事务**: Saga模式
- **数据同步**: 事件发布/订阅

## 部署方式

### 使用 npm 直接启动（推荐）

```powershell
# 启动所有13个微服务
.\start-services-npm.ps1

# 停止所有微服务
.\stop-services.ps1

# 或者手动启动单个服务
cd auth-service
npm start
```

### 前置条件
- Node.js 已安装
- PostgreSQL 运行在 localhost:5432
- Redis 运行在 localhost:6379（可选）

### 服务端口分配
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Base Service: http://localhost:3002
- Cattle Service: http://localhost:3003
- Health Service: http://localhost:3004
- Feeding Service: http://localhost:3005
- Equipment Service: http://localhost:3006
- Procurement Service: http://localhost:3007
- Sales Service: http://localhost:3008
- Material Service: http://localhost:3009
- Notification Service: http://localhost:3010
- File Service: http://localhost:3011
- Monitoring Service: http://localhost:3012
- News Service: http://localhost:3013

### 健康检查
所有服务都提供健康检查端点：
```
GET http://localhost:{port}/health
```

### API 访问
通过 API Gateway 访问所有服务：
```
http://localhost:3000/api/v1/{service-name}/...
```

例如：
- 认证: http://localhost:3000/api/v1/auth/login
- 基地管理: http://localhost:3000/api/v1/base/...
- 牛只管理: http://localhost:3000/api/v1/cattle/...

## 开发指南

每个微服务都是独立的Node.js应用，具有：
- 独立的package.json
- 独立的数据库
- 独立的配置文件
- 统一的接口规范
- 健康检查端点
- 日志记录
- 错误处理

## 监控与运维

- 健康检查: `/health`
- 指标收集: `/metrics`
- 日志聚合: 统一日志格式
- 分布式追踪: 请求ID传递