# 肉牛全生命周期管理系统 - 设计文档

## 概述

本设计文档基于需求文档，详细描述了肉牛全生命周期管理系统的技术架构、组件设计、数据模型和实现方案。系统采用现代化的前后端分离架构，支持PC端和移动端多终端访问，具备高可用性、可扩展性和安全性。

## 架构设计

### 系统架构图
```
┌─────────────────────────────────────────────────────────────┐
│                    客户端层 (Client Layer)                    │
├─────────────────────────────────────────────────────────────┤
│  PC Web端        │  微信小程序       │  门户网站              │
│  Vue 3 + TS      │  uni-app         │  Vue 3 + TS           │
│  Element Plus    │  uni-ui          │  响应式设计            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    网关层 (Gateway Layer)                    │
├─────────────────────────────────────────────────────────────┤
│           Nginx (反向代理 + 负载均衡 + SSL终结)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   应用服务层 (Application Layer)              │
├─────────────────────────────────────────────────────────────┤
│  认证服务        │  业务API服务     │  文件服务              │
│  Auth Service    │  Business API    │  File Service          │
│  Node.js + JWT   │  Node.js + Express│  Node.js + Multer     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (Data Layer)                       │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL      │  Redis           │  文件存储              │
│  (主数据库)       │  (缓存/会话)      │  (本地/云存储)          │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈选择

#### 前端技术栈

##### PC Web端
- **框架**: Vue.js 3.x + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **HTTP客户端**: Axios
- **图表库**: ECharts

##### 微信小程序端
- **框架**: uni-app (Vue 3语法)
- **UI组件库**: uni-ui + 自定义组件
- **状态管理**: Pinia (uni-app版本)
- **构建工具**: HBuilderX / Vite
- **HTTP客户端**: uni.request
- **图表库**: uCharts

##### 移动App端 (React Native)
- **框架**: React Native 0.72+
- **UI组件库**: React Native Elements + 自定义组件
- **状态管理**: Redux Toolkit + RTK Query
- **导航**: React Navigation 6
- **HTTP客户端**: Axios
- **图表库**: Victory Native
- **相机功能**: react-native-camera
- **扫码功能**: react-native-qrcode-scanner

#### 后端技术栈
- **运行环境**: Node.js 18+
- **Web框架**: Express.js
- **ORM**: Sequelize
- **身份认证**: JWT + Passport.js
- **文件上传**: Multer
- **API文档**: Swagger/OpenAPI
- **日志**: Winston
- **进程管理**: PM2

#### 数据库技术栈
- **主数据库**: PostgreSQL 14+
- **缓存**: Redis 6+
- **文件存储**: 本地存储 + 阿里云OSS(可选)

#### 部署技术栈
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **CI/CD**: GitHub Actions
- **监控**: Prometheus + Grafana

## 组件和接口设计

### 移动端优先设计策略

#### 微信小程序架构
```
miniprogram/
├── pages/               # 页面
│   ├── index/          # 首页
│   ├── cattle/         # 牛只管理
│   ├── health/         # 健康管理
│   ├── feeding/        # 饲喂管理
│   ├── scan/           # 扫码功能
│   └── profile/        # 个人中心
├── components/          # 自定义组件
│   ├── cattle-card/    # 牛只卡片
│   ├── health-status/  # 健康状态
│   ├── camera-modal/   # 相机组件
│   └── chart/          # 图表组件
├── utils/              # 工具函数
│   ├── request.js      # 网络请求
│   ├── auth.js         # 认证管理
│   └── storage.js      # 本地存储
├── store/              # 状态管理
└── app.js              # 应用入口
```

#### React Native App架构
```
src/
├── screens/            # 页面组件
│   ├── Dashboard/      # 仪表盘
│   ├── CattleList/     # 牛只列表
│   ├── CattleDetail/   # 牛只详情
│   ├── HealthRecord/   # 健康记录
│   ├── Camera/         # 拍照页面
│   └── Scanner/        # 扫码页面
├── components/         # 通用组件
│   ├── CattleCard/     # 牛只卡片
│   ├── HealthChart/    # 健康图表
│   ├── CustomButton/   # 自定义按钮
│   └── LoadingSpinner/ # 加载组件
├── navigation/         # 导航配置
├── services/           # API服务
├── store/              # Redux状态管理
├── utils/              # 工具函数
└── assets/             # 静态资源
```

#### PC Web端组件架构
```
src/
├── components/           # 通用组件
│   ├── basic/           # 基础组件
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Modal/
│   ├── business/        # 业务组件
│   │   ├── CattleCard/
│   │   ├── HealthStatus/
│   │   ├── FeedingRecord/
│   │   └── PurchaseOrder/
│   └── layout/          # 布局组件
│       ├── Header/
│       ├── Sidebar/
│       └── Footer/
├── views/               # 页面组件
│   ├── Dashboard/
│   ├── Purchase/
│   ├── Breeding/
│   ├── Feeding/
│   ├── Health/
│   ├── Sales/
│   └── User/
├── stores/              # 状态管理
├── router/              # 路由配置
├── api/                 # API接口
├── utils/               # 工具函数
└── styles/              # 样式文件
```

#### 核心业务组件设计

##### CattleCard 牛只卡片组件
```typescript
interface CattleCardProps {
  cattle: {
    id: string;
    earTag: string;
    breed: string;
    gender: 'male' | 'female';
    birthDate: string;
    weight: number;
    healthStatus: 'healthy' | 'sick' | 'treatment';
    photo?: string;
  };
  actions?: Array<{
    label: string;
    icon: string;
    onClick: () => void;
  }>;
  selectable?: boolean;
  selected?: boolean;
}
```

##### HealthStatus 健康状态组件
```typescript
interface HealthStatusProps {
  data: {
    healthy: number;
    sick: number;
    treatment: number;
    trend: Array<{
      date: string;
      healthy: number;
      sick: number;
      treatment: number;
    }>;
  };
}
```

### 后端API设计

#### RESTful API规范
```
基础URL: https://api.cattle-management.com/v1

认证方式: Bearer Token (JWT)
Content-Type: application/json
```

#### 核心API接口

##### 认证相关API
```typescript
// 用户登录
POST /auth/login
{
  "username": "string",
  "password": "string"
}
Response: {
  "token": "string",
  "user": UserInfo,
  "permissions": string[]
}

// 刷新Token
POST /auth/refresh
Authorization: Bearer <token>
Response: {
  "token": "string"
}

// 用户登出
POST /auth/logout
Authorization: Bearer <token>
```

##### 牛只管理API
```typescript
// 获取牛只列表
GET /cattle?page=1&limit=20&baseId=1&status=healthy
Response: {
  "data": Cattle[],
  "total": number,
  "page": number,
  "limit": number
}

// 创建牛只记录
POST /cattle
{
  "earTag": "string",
  "breed": "string",
  "gender": "male|female",
  "birthDate": "string",
  "weight": number,
  "baseId": number,
  "barnId": number
}

// 更新牛只信息
PUT /cattle/:id
{
  "weight": number,
  "healthStatus": "string",
  // ... other fields
}

// 批量导入牛只
POST /cattle/batch-import
Content-Type: multipart/form-data
file: Excel/CSV file
```

##### 健康管理API
```typescript
// 创建诊疗记录
POST /health/diagnosis
{
  "cattleId": string,
  "symptoms": string,
  "diagnosis": string,
  "treatment": string,
  "veterinarianId": string,
  "date": string
}

// 获取健康统计
GET /health/statistics?baseId=1&startDate=2024-01-01&endDate=2024-12-31
Response: {
  "healthy": number,
  "sick": number,
  "treatment": number,
  "trend": HealthTrend[]
}
```

##### 饲喂管理API
```typescript
// 创建饲料配方
POST /feeding/formulas
{
  "name": "string",
  "description": "string",
  "ingredients": Array<{
    "name": "string",
    "ratio": number,
    "unit": "string"
  }>
}

// 记录饲喂信息
POST /feeding/records
{
  "formulaId": string,
  "baseId": string,
  "barnId": string,
  "amount": number,
  "date": string,
  "operator": string
}
```

##### 生产物资管理API
```typescript
// 获取物资分类
GET /materials/categories
Response: {
  "data": MaterialCategory[]
}

// 获取生产物资列表
GET /materials?page=1&limit=20&categoryId=1&baseId=1
Response: {
  "data": ProductionMaterial[],
  "total": number,
  "page": number,
  "limit": number
}

// 创建生产物资
POST /materials
{
  "name": "string",
  "code": "string",
  "categoryId": number,
  "unit": "string",
  "specification": "string",
  "supplierId": number,
  "purchasePrice": number,
  "safetyStock": number
}

// 获取库存信息
GET /inventory?baseId=1&materialId=1
Response: {
  "data": InventoryInfo[],
  "alerts": InventoryAlert[]
}

// 库存入库
POST /inventory/inbound
{
  "materialId": number,
  "baseId": number,
  "quantity": number,
  "unitPrice": number,
  "batchNumber": "string",
  "expiryDate": "string",
  "referenceType": "purchase_order",
  "referenceId": number
}

// 库存出库
POST /inventory/outbound
{
  "materialId": number,
  "baseId": number,
  "quantity": number,
  "referenceType": "feeding_record",
  "referenceId": number,
  "remark": "string"
}
```

##### 生产设备管理API
```typescript
// 获取设备分类
GET /equipment/categories
Response: {
  "data": EquipmentCategory[]
}

// 获取生产设备列表
GET /equipment?page=1&limit=20&baseId=1&status=normal
Response: {
  "data": ProductionEquipment[],
  "total": number,
  "page": number,
  "limit": number
}

// 创建设备记录
POST /equipment
{
  "name": "string",
  "code": "string",
  "categoryId": number,
  "baseId": number,
  "barnId": number,
  "brand": "string",
  "model": "string",
  "serialNumber": "string",
  "purchaseDate": "string",
  "purchasePrice": number
}

// 创建维护计划
POST /equipment/:id/maintenance-plans
{
  "maintenanceType": "string",
  "frequencyDays": number,
  "description": "string",
  "checklist": object
}

// 记录维护
POST /equipment/:id/maintenance-records
{
  "planId": number,
  "maintenanceDate": "string",
  "maintenanceType": "string",
  "durationHours": number,
  "cost": number,
  "issuesFound": "string",
  "actionsTaken": "string"
}

// 报告故障
POST /equipment/:id/failures
{
  "failureType": "string",
  "severity": "string",
  "description": "string",
  "impactDescription": "string"
}
```

##### 新闻管理API
```typescript
// 获取新闻分类
GET /news/categories
Response: {
  "data": NewsCategory[]
}

// 获取新闻列表
GET /news?page=1&limit=20&categoryId=1&status=published
Response: {
  "data": NewsArticle[],
  "total": number,
  "page": number,
  "limit": number
}

// 创建新闻文章
POST /news
{
  "title": "string",
  "subtitle": "string",
  "categoryId": number,
  "content": "string",
  "summary": "string",
  "coverImage": "string",
  "tags": "string",
  "status": "draft|published"
}

// 更新新闻文章
PUT /news/:id
{
  "title": "string",
  "content": "string",
  "status": "string"
}

// 获取新闻详情
GET /news/:id
Response: {
  "article": NewsArticle,
  "comments": NewsComment[]
}

// 添加评论
POST /news/:id/comments
{
  "userName": "string",
  "userEmail": "string",
  "content": "string",
  "parentId": number
}

// 点赞文章
POST /news/:id/like
{
  "ipAddress": "string"
}
```

##### 移动端专用API
```typescript
// 文件上传 (照片/视频)
POST /upload/image
Content-Type: multipart/form-data
{
  "file": File,
  "type": "cattle_photo|health_record|feeding_record|equipment_photo",
  "cattleId"?: string,
  "equipmentId"?: string
}
Response: {
  "url": "string",
  "filename": "string",
  "size": number
}

// 扫码识别牛只
GET /cattle/scan/:earTag
Response: {
  "cattle": CattleInfo,
  "recentRecords": {
    "health": HealthRecord[],
    "feeding": FeedingRecord[]
  }
}

// 获取基地GPS坐标
GET /bases/:id/location
Response: {
  "latitude": number,
  "longitude": number,
  "address": "string"
}

// 离线数据同步
POST /sync/offline-data
{
  "records": Array<{
    "type": "feeding|health|cattle_event|inventory|equipment",
    "data": any,
    "timestamp": string,
    "localId": string
  }>
}
Response: {
  "synced": Array<{
    "localId": string,
    "serverId": string,
    "status": "success|failed"
  }>
}

// 微信小程序登录
POST /auth/wechat-login
{
  "code": "string",
  "userInfo": {
    "nickName": "string",
    "avatarUrl": "string"
  }
}
Response: {
  "token": "string",
  "user": UserInfo,
  "isNewUser": boolean
}
```

## 数据模型设计

### 数据库设计

#### 核心数据表

##### 用户和权限表
```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(id),
    base_id INTEGER REFERENCES bases(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 基地表
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    area DECIMAL(10, 2),
    manager_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 牛只相关表
```sql
-- 牛棚表
CREATE TABLE barns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    base_id INTEGER REFERENCES bases(id),
    capacity INTEGER NOT NULL,
    current_count INTEGER DEFAULT 0,
    barn_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 牛只表
CREATE TABLE cattle (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    birth_date DATE,
    weight DECIMAL(6, 2),
    health_status VARCHAR(20) DEFAULT 'healthy',
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 牛只生命周期事件表
CREATE TABLE cattle_events (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER REFERENCES cattle(id),
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    operator_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 健康管理表
```sql
-- 诊疗记录表
CREATE TABLE health_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER REFERENCES cattle(id),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    veterinarian_id INTEGER REFERENCES users(id),
    diagnosis_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ongoing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 疫苗接种记录表
CREATE TABLE vaccination_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER REFERENCES cattle(id),
    vaccine_name VARCHAR(100) NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    veterinarian_id INTEGER REFERENCES users(id),
    batch_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 饲喂管理表
```sql
-- 饲料配方表
CREATE TABLE feed_formulas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    cost_per_kg DECIMAL(8, 2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 饲喂记录表
CREATE TABLE feeding_records (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER REFERENCES feed_formulas(id),
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    amount DECIMAL(8, 2) NOT NULL,
    feeding_date DATE NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 生产物资管理表
```sql
-- 物资分类表
CREATE TABLE material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES material_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生产物资表
CREATE TABLE production_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES material_categories(id),
    unit VARCHAR(20) NOT NULL, -- 单位：kg, 吨, 袋, 瓶等
    specification TEXT, -- 规格说明
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_price DECIMAL(10, 2),
    safety_stock DECIMAL(10, 2) DEFAULT 0, -- 安全库存
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES production_materials(id),
    base_id INTEGER REFERENCES bases(id),
    current_stock DECIMAL(10, 2) DEFAULT 0,
    reserved_stock DECIMAL(10, 2) DEFAULT 0, -- 预留库存
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, base_id)
);

-- 库存变动记录表
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES production_materials(id),
    base_id INTEGER REFERENCES bases(id),
    transaction_type VARCHAR(20) NOT NULL, -- 入库、出库、调拨、盘点
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2),
    reference_type VARCHAR(50), -- 关联单据类型：purchase_order, feeding_record等
    reference_id INTEGER, -- 关联单据ID
    batch_number VARCHAR(50), -- 批次号
    expiry_date DATE, -- 过期日期
    operator_id INTEGER REFERENCES users(id),
    remark TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存预警表
CREATE TABLE inventory_alerts (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES production_materials(id),
    base_id INTEGER REFERENCES bases(id),
    alert_type VARCHAR(20) NOT NULL, -- 低库存、过期、质量问题
    alert_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 生产设备管理表
```sql
-- 设备分类表
CREATE TABLE equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生产设备表
CREATE TABLE production_equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES equipment_categories(id),
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    brand VARCHAR(100), -- 品牌
    model VARCHAR(100), -- 型号
    serial_number VARCHAR(100), -- 序列号
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    warranty_period INTEGER, -- 保修期（月）
    installation_date DATE,
    status VARCHAR(20) DEFAULT 'normal', -- normal, maintenance, broken, retired
    location TEXT, -- 安装位置
    specifications JSONB, -- 技术规格
    photos JSONB, -- 设备照片
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备维护计划表
CREATE TABLE equipment_maintenance_plans (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES production_equipment(id),
    maintenance_type VARCHAR(50) NOT NULL, -- 日常保养、定期检修、大修等
    frequency_days INTEGER NOT NULL, -- 维护频率（天）
    description TEXT,
    checklist JSONB, -- 检查清单
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备维护记录表
CREATE TABLE equipment_maintenance_records (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES production_equipment(id),
    plan_id INTEGER REFERENCES equipment_maintenance_plans(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    duration_hours DECIMAL(4, 2), -- 维护时长
    cost DECIMAL(10, 2), -- 维护成本
    parts_replaced JSONB, -- 更换的零件
    issues_found TEXT, -- 发现的问题
    actions_taken TEXT, -- 采取的措施
    next_maintenance_date DATE, -- 下次维护日期
    status VARCHAR(20) DEFAULT 'completed', -- scheduled, in_progress, completed, cancelled
    photos JSONB, -- 维护照片
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备故障记录表
CREATE TABLE equipment_failures (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES production_equipment(id),
    failure_date TIMESTAMP NOT NULL,
    reported_by INTEGER REFERENCES users(id),
    failure_type VARCHAR(50), -- 机械故障、电气故障、软件故障等
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    description TEXT NOT NULL,
    impact_description TEXT, -- 影响描述
    repair_start_time TIMESTAMP,
    repair_end_time TIMESTAMP,
    repair_cost DECIMAL(10, 2),
    repaired_by INTEGER REFERENCES users(id),
    repair_description TEXT,
    parts_replaced JSONB,
    status VARCHAR(20) DEFAULT 'reported', -- reported, in_repair, resolved, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 采购和销售表
```sql
-- 供应商表
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    rating INTEGER DEFAULT 0,
    supplier_type VARCHAR(50), -- 牛只供应商、物资供应商、设备供应商
    business_license VARCHAR(100), -- 营业执照号
    tax_number VARCHAR(100), -- 税号
    bank_account VARCHAR(100), -- 银行账户
    credit_limit DECIMAL(12, 2) DEFAULT 0, -- 信用额度
    payment_terms VARCHAR(100), -- 付款条件
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 采购订单表
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    base_id INTEGER REFERENCES bases(id),
    order_type VARCHAR(20) NOT NULL, -- cattle, material, equipment
    total_amount DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    contract_number VARCHAR(100),
    remark TEXT,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 采购订单明细表
CREATE TABLE purchase_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES purchase_orders(id),
    item_type VARCHAR(20) NOT NULL, -- cattle, material, equipment
    item_id INTEGER, -- 对应cattle_id, material_id, equipment_id
    item_name VARCHAR(200) NOT NULL,
    specification TEXT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    received_quantity DECIMAL(10, 2) DEFAULT 0,
    quality_status VARCHAR(20) DEFAULT 'pending', -- pending, passed, failed
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客户表
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    credit_rating INTEGER DEFAULT 0,
    customer_type VARCHAR(50), -- 个人、企业、经销商
    business_license VARCHAR(100),
    tax_number VARCHAR(100),
    bank_account VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    payment_terms VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 销售订单表
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    base_id INTEGER REFERENCES bases(id),
    total_amount DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    order_date DATE NOT NULL,
    delivery_date DATE,
    actual_delivery_date DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    payment_method VARCHAR(50),
    contract_number VARCHAR(100),
    logistics_company VARCHAR(100),
    tracking_number VARCHAR(100),
    remark TEXT,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 销售订单明细表
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales_orders(id),
    cattle_id INTEGER REFERENCES cattle(id),
    ear_tag VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    weight DECIMAL(6, 2),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    quality_grade VARCHAR(20), -- 质量等级
    health_certificate VARCHAR(100), -- 健康证明编号
    quarantine_certificate VARCHAR(100), -- 检疫证明编号
    delivery_status VARCHAR(20) DEFAULT 'pending',
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### 新闻管理表
```sql
-- 新闻分类表
CREATE TABLE news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻文章表
CREATE TABLE news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    category_id INTEGER REFERENCES news_categories(id),
    content TEXT NOT NULL,
    summary TEXT, -- 摘要
    cover_image VARCHAR(500), -- 封面图片
    images JSONB, -- 文章图片
    tags VARCHAR(500), -- 标签，逗号分隔
    author_id INTEGER REFERENCES users(id),
    author_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
    is_featured BOOLEAN DEFAULT FALSE, -- 是否推荐
    is_top BOOLEAN DEFAULT FALSE, -- 是否置顶
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    publish_time TIMESTAMP,
    seo_title VARCHAR(200), -- SEO标题
    seo_keywords VARCHAR(500), -- SEO关键词
    seo_description VARCHAR(500), -- SEO描述
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻评论表
CREATE TABLE news_comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id),
    parent_id INTEGER REFERENCES news_comments(id), -- 父评论ID，用于回复
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100),
    user_phone VARCHAR(20),
    content TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, deleted
    is_admin_reply BOOLEAN DEFAULT FALSE, -- 是否管理员回复
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻浏览记录表
CREATE TABLE news_views (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer VARCHAR(500), -- 来源页面
    view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_article_ip (article_id, ip_address),
    INDEX idx_view_time (view_time)
);

-- 新闻点赞记录表
CREATE TABLE news_likes (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, ip_address)
);
```

### 数据关系图
```
Users ──┐
        ├── Bases ── Barns ── Cattle ──┬── Health_Records
        │                              ├── Vaccination_Records
        │                              ├── Cattle_Events
        │                              └── Feeding_Records
        │
        ├── Purchase_Orders ── Suppliers
        ├── Sales_Orders ── Customers
        └── Feed_Formulas
```

## 错误处理

### 错误分类和处理策略

#### HTTP状态码规范
```typescript
// 成功响应
200 OK - 请求成功
201 Created - 资源创建成功
204 No Content - 删除成功

// 客户端错误
400 Bad Request - 请求参数错误
401 Unauthorized - 未认证
403 Forbidden - 权限不足
404 Not Found - 资源不存在
409 Conflict - 资源冲突
422 Unprocessable Entity - 数据验证失败

// 服务器错误
500 Internal Server Error - 服务器内部错误
502 Bad Gateway - 网关错误
503 Service Unavailable - 服务不可用
```

#### 统一错误响应格式
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
  };
}

// 示例
{
  "success": false,
  "error": {
    "code": "CATTLE_NOT_FOUND",
    "message": "指定的牛只不存在",
    "details": {
      "earTag": "CN001234"
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/cattle/CN001234"
  }
}
```

#### 前端错误处理
```typescript
// 全局错误处理器
class ErrorHandler {
  static handle(error: any) {
    if (error.response) {
      // HTTP错误
      const { status, data } = error.response;
      switch (status) {
        case 401:
          // 跳转到登录页
          router.push('/login');
          break;
        case 403:
          // 显示权限不足提示
          ElMessage.error('权限不足');
          break;
        case 422:
          // 显示验证错误
          this.showValidationErrors(data.error.details);
          break;
        default:
          ElMessage.error(data.error.message || '请求失败');
      }
    } else if (error.request) {
      // 网络错误
      ElMessage.error('网络连接失败，请检查网络设置');
    } else {
      // 其他错误
      ElMessage.error('发生未知错误');
    }
  }
}
```

## 测试策略

### 测试金字塔

#### 单元测试 (70%)
- **前端**: Vue Test Utils + Jest
- **后端**: Jest + Supertest
- **覆盖率要求**: ≥80%

#### 集成测试 (20%)
- **API测试**: Postman/Newman
- **数据库测试**: 测试数据库操作
- **第三方服务集成测试**

#### 端到端测试 (10%)
- **工具**: Cypress/Playwright
- **关键业务流程测试**
- **跨浏览器兼容性测试**

### 测试环境配置
```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:14
    environment:
      POSTGRES_DB: cattle_management_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
  
  test-redis:
    image: redis:6-alpine
    ports:
      - "6380:6379"
```

### 测试数据管理
```typescript
// 测试数据工厂
class TestDataFactory {
  static createCattle(overrides = {}) {
    return {
      earTag: `CN${Date.now()}`,
      breed: '西门塔尔牛',
      gender: 'female',
      birthDate: '2023-01-15',
      weight: 450.5,
      healthStatus: 'healthy',
      baseId: 1,
      barnId: 1,
      ...overrides
    };
  }
  
  static createUser(overrides = {}) {
    return {
      username: `user${Date.now()}`,
      password: 'password123',
      realName: '测试用户',
      email: 'test@example.com',
      roleId: 2,
      baseId: 1,
      ...overrides
    };
  }
}
```

## 移动端特有功能设计

### 微信小程序特有功能

#### 微信授权登录
```javascript
// 微信小程序登录流程
wx.login({
  success: (res) => {
    if (res.code) {
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      wx.request({
        url: 'https://api.cattle-management.com/v1/auth/wechat-login',
        method: 'POST',
        data: {
          code: res.code
        },
        success: (loginRes) => {
          // 保存token到本地存储
          wx.setStorageSync('token', loginRes.data.token);
        }
      });
    }
  }
});
```

#### 扫码功能
```javascript
// 扫描牛只耳标
wx.scanCode({
  success: (res) => {
    const earTag = res.result;
    // 调用API获取牛只信息
    this.getCattleInfo(earTag);
  }
});
```

#### 拍照上传
```javascript
// 拍照并上传牛只照片
wx.chooseImage({
  count: 1,
  sizeType: ['compressed'],
  sourceType: ['camera'],
  success: (res) => {
    const tempFilePath = res.tempFilePaths[0];
    wx.uploadFile({
      url: 'https://api.cattle-management.com/v1/upload/image',
      filePath: tempFilePath,
      name: 'file',
      formData: {
        type: 'cattle_photo',
        cattleId: this.data.cattleId
      },
      success: (uploadRes) => {
        const data = JSON.parse(uploadRes.data);
        this.setData({
          photoUrl: data.url
        });
      }
    });
  }
});
```

### React Native App特有功能

#### 相机组件
```typescript
import { RNCamera } from 'react-native-camera';

const CameraScreen = () => {
  const takePicture = async (camera: RNCamera) => {
    const options = { quality: 0.8, base64: true };
    const data = await camera.takePictureAsync(options);
    
    // 上传照片
    const formData = new FormData();
    formData.append('file', {
      uri: data.uri,
      type: 'image/jpeg',
      name: 'cattle_photo.jpg',
    } as any);
    
    const response = await fetch('/api/v1/upload/image', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
  };

  return (
    <RNCamera
      style={styles.preview}
      type={RNCamera.Constants.Type.back}
      flashMode={RNCamera.Constants.FlashMode.off}
      androidCameraPermissionOptions={{
        title: '相机权限',
        message: '需要使用相机拍摄牛只照片',
        buttonPositive: '确定',
        buttonNegative: '取消',
      }}
    >
      {({ camera, status }) => {
        if (status !== 'READY') return <PendingView />;
        return (
          <View style={styles.captureContainer}>
            <TouchableOpacity
              onPress={() => takePicture(camera)}
              style={styles.capture}
            >
              <Text style={styles.captureText}>拍照</Text>
            </TouchableOpacity>
          </View>
        );
      }}
    </RNCamera>
  );
};
```

#### 扫码组件
```typescript
import QRCodeScanner from 'react-native-qrcode-scanner';

const ScannerScreen = () => {
  const onSuccess = (e: any) => {
    const earTag = e.data;
    // 调用API获取牛只信息
    getCattleInfo(earTag);
  };

  return (
    <QRCodeScanner
      onRead={onSuccess}
      flashMode={RNCamera.Constants.FlashMode.torch}
      topContent={
        <Text style={styles.centerText}>
          请将二维码/条形码放入框内扫描
        </Text>
      }
      bottomContent={
        <TouchableOpacity style={styles.buttonTouchable}>
          <Text style={styles.buttonText}>手动输入耳标号</Text>
        </TouchableOpacity>
      }
    />
  );
};
```

### 离线数据同步机制

#### 离线存储设计
```typescript
// 离线数据存储结构
interface OfflineRecord {
  id: string;
  type: 'feeding' | 'health' | 'cattle_event';
  data: any;
  timestamp: string;
  synced: boolean;
  retryCount: number;
}

class OfflineDataManager {
  private storage: AsyncStorage;
  
  async saveOfflineRecord(record: Omit<OfflineRecord, 'id' | 'synced' | 'retryCount'>) {
    const offlineRecord: OfflineRecord = {
      ...record,
      id: generateUUID(),
      synced: false,
      retryCount: 0
    };
    
    const existingRecords = await this.getOfflineRecords();
    existingRecords.push(offlineRecord);
    
    await this.storage.setItem('offline_records', JSON.stringify(existingRecords));
  }
  
  async syncOfflineRecords() {
    const records = await this.getOfflineRecords();
    const unsyncedRecords = records.filter(r => !r.synced);
    
    for (const record of unsyncedRecords) {
      try {
        await this.syncSingleRecord(record);
        record.synced = true;
      } catch (error) {
        record.retryCount++;
        if (record.retryCount >= 3) {
          // 标记为失败，需要人工处理
          record.synced = false;
        }
      }
    }
    
    await this.storage.setItem('offline_records', JSON.stringify(records));
  }
}
```

### GPS定位功能

#### 位置服务集成
```typescript
// React Native 位置服务
import Geolocation from '@react-native-community/geolocation';

const LocationService = {
  getCurrentPosition: (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000
        }
      );
    });
  },
  
  watchPosition: (callback: (position: GeolocationPosition) => void) => {
    return Geolocation.watchPosition(
      callback,
      (error) => console.error('位置监听错误:', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 10, // 10米变化才触发
        interval: 30000, // 30秒间隔
      }
    );
  }
};

// 微信小程序位置服务
const getLocation = () => {
  wx.getLocation({
    type: 'gcj02',
    success: (res) => {
      const { latitude, longitude } = res;
      // 保存位置信息
      this.setData({
        location: { latitude, longitude }
      });
    },
    fail: () => {
      wx.showToast({
        title: '获取位置失败',
        icon: 'none'
      });
    }
  });
};
```

### 推送通知功能

#### 微信小程序订阅消息
```javascript
// 订阅消息模板
const subscribeMessage = () => {
  wx.requestSubscribeMessage({
    tmplIds: [
      'template_id_1', // 疫苗接种提醒
      'template_id_2', // 饲喂提醒
      'template_id_3', // 健康异常提醒
    ],
    success: (res) => {
      console.log('订阅成功', res);
    },
    fail: (err) => {
      console.log('订阅失败', err);
    }
  });
};

// 发送订阅消息（后端）
const sendSubscribeMessage = async (openid, templateId, data) => {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      touser: openid,
      template_id: templateId,
      data: data,
      miniprogram_state: 'formal'
    })
  });
  
  return response.json();
};
```

#### React Native推送通知
```typescript
import PushNotification from 'react-native-push-notification';

const NotificationService = {
  configure: () => {
    PushNotification.configure({
      onRegister: (token) => {
        console.log('推送Token:', token);
        // 将token发送到服务器
        sendTokenToServer(token.token);
      },
      
      onNotification: (notification) => {
        console.log('收到通知:', notification);
        
        if (notification.userInteraction) {
          // 用户点击了通知
          handleNotificationClick(notification);
        }
      },
      
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      
      popInitialNotification: true,
      requestPermissions: true,
    });
  },
  
  showLocalNotification: (title: string, message: string, data?: any) => {
    PushNotification.localNotification({
      title,
      message,
      userInfo: data,
      playSound: true,
      soundName: 'default',
    });
  }
};
```

## 性能优化策略

### 移动端性能优化

#### 图片优化
```typescript
// 图片压缩和懒加载
const ImageOptimizer = {
  compress: async (imageUri: string, quality: number = 0.8) => {
    const compressedImage = await ImageResizer.createResizedImage(
      imageUri,
      800, // 最大宽度
      600, // 最大高度
      'JPEG',
      quality * 100,
      0, // 旋转角度
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );
    
    return compressedImage.uri;
  },
  
  lazyLoad: (imageUrl: string, placeholder: string) => {
    // 实现图片懒加载逻辑
    return {
      uri: imageUrl,
      cache: 'force-cache',
      priority: 'low'
    };
  }
};
```

#### 数据缓存策略
```typescript
// 数据缓存管理
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 默认5分钟
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear() {
    this.cache.clear();
  }
}
```

### 网络优化

#### 请求合并和批处理
```typescript
// API请求批处理
class BatchRequestManager {
  private batchQueue: Array<{
    url: string;
    method: string;
    data: any;
    resolve: Function;
    reject: Function;
  }> = [];
  
  private batchTimer: NodeJS.Timeout | null = null;
  
  request(url: string, method: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ url, method, data, resolve, reject });
      
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, 100); // 100ms内的请求合并处理
    });
  }
  
  private async processBatch() {
    if (this.batchQueue.length === 0) return;
    
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    
    try {
      const response = await fetch('/api/v1/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          requests: batch.map(req => ({
            url: req.url,
            method: req.method,
            data: req.data
          }))
        })
      });
      
      const results = await response.json();
      
      batch.forEach((req, index) => {
        const result = results[index];
        if (result.success) {
          req.resolve(result.data);
        } else {
          req.reject(new Error(result.error));
        }
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
  }
}
```

这个设计文档现在提供了完整的技术架构、移动端特有功能设计、性能优化策略等，确保系统在移动端能够提供优秀的用户体验和性能表现。