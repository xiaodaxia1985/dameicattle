# 肉牛全生命周期管理系统 - API文档

## 概述

本文档描述了肉牛全生命周期管理系统的RESTful API接口规范，包括认证方式、请求格式、响应格式和错误处理等。

### 基础信息
- **API版本**: v1.0
- **基础URL**: `https://api.cattle-management.com/v1`
- **协议**: HTTPS
- **数据格式**: JSON
- **字符编码**: UTF-8

### 认证方式
系统使用JWT (JSON Web Token) 进行身份认证：
```
Authorization: Bearer <token>
```

## 通用规范

### 请求格式
```http
POST /api/v1/resource
Content-Type: application/json
Authorization: Bearer <token>

{
  "field1": "value1",
  "field2": "value2"
}
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 分页响应
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {},
    "timestamp": "2024-01-15T10:30:00Z",
    "path": "/api/v1/resource"
  }
}
```

### HTTP状态码
- `200 OK` - 请求成功
- `201 Created` - 资源创建成功
- `204 No Content` - 删除成功
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 权限不足
- `404 Not Found` - 资源不存在
- `409 Conflict` - 资源冲突
- `422 Unprocessable Entity` - 数据验证失败
- `500 Internal Server Error` - 服务器内部错误

## 认证接口

### 用户登录
```http
POST /auth/login
```

**请求参数**:
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_string",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "管理员",
      "email": "admin@example.com",
      "role": {
        "id": 1,
        "name": "系统管理员",
        "permissions": ["user:read", "user:write"]
      },
      "base": {
        "id": 1,
        "name": "总部基地"
      }
    }
  }
}
```

### 刷新Token
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "new_access_token",
    "expiresIn": 3600
  }
}
```

### 用户登出
```http
POST /auth/logout
Authorization: Bearer <token>
```

## 用户管理接口

### 获取用户列表
```http
GET /users?page=1&limit=20&baseId=1&role=admin
Authorization: Bearer <token>
```

**查询参数**:
- `page` (int): 页码，默认1
- `limit` (int): 每页数量，默认20
- `baseId` (int): 基地ID筛选
- `role` (string): 角色筛选
- `status` (string): 状态筛选 (active/inactive)
- `keyword` (string): 关键词搜索

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "username": "admin",
        "realName": "管理员",
        "email": "admin@example.com",
        "phone": "13800138000",
        "role": {
          "id": 1,
          "name": "系统管理员"
        },
        "base": {
          "id": 1,
          "name": "总部基地"
        },
        "status": "active",
        "lastLoginAt": "2024-01-15T10:30:00Z",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 创建用户
```http
POST /users
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "username": "newuser",
  "password": "password123",
  "realName": "新用户",
  "email": "newuser@example.com",
  "phone": "13800138001",
  "roleId": 2,
  "baseId": 1,
  "status": "active"
}
```

### 更新用户
```http
PUT /users/{id}
Authorization: Bearer <token>
```

### 删除用户
```http
DELETE /users/{id}
Authorization: Bearer <token>
```

## 基础数据接口

### 基地管理

#### 获取基地列表
```http
GET /bases?page=1&limit=20
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "总部基地",
        "code": "BASE001",
        "address": "北京市朝阳区xxx路xxx号",
        "latitude": 39.9042,
        "longitude": 116.4074,
        "area": 1000.5,
        "manager": {
          "id": 2,
          "name": "张经理"
        },
        "statistics": {
          "barnCount": 10,
          "cattleCount": 500,
          "healthyRate": 0.95
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### 创建基地
```http
POST /bases
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "name": "新基地",
  "code": "BASE002",
  "address": "详细地址",
  "latitude": 39.9042,
  "longitude": 116.4074,
  "area": 800.0,
  "managerId": 3
}
```

### 牛棚管理

#### 获取牛棚列表
```http
GET /barns?baseId=1&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建牛棚
```http
POST /barns
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "name": "1号牛棚",
  "code": "BARN001",
  "baseId": 1,
  "capacity": 50,
  "barnType": "育肥棚",
  "facilities": ["自动饮水器", "通风设备"]
}
```

## 牛只管理接口

### 获取牛只列表
```http
GET /cattle?page=1&limit=20&baseId=1&barnId=1&healthStatus=healthy
Authorization: Bearer <token>
```

**查询参数**:
- `baseId` (int): 基地ID
- `barnId` (int): 牛棚ID
- `breed` (string): 品种
- `gender` (string): 性别 (male/female)
- `healthStatus` (string): 健康状态
- `ageMin` (int): 最小年龄（月）
- `ageMax` (int): 最大年龄（月）
- `weightMin` (float): 最小体重
- `weightMax` (float): 最大体重

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "earTag": "CN001234",
        "breed": "西门塔尔",
        "gender": "male",
        "birthDate": "2023-06-15",
        "weight": 450.5,
        "healthStatus": "healthy",
        "base": {
          "id": 1,
          "name": "总部基地"
        },
        "barn": {
          "id": 1,
          "name": "1号牛棚"
        },
        "photos": [
          {
            "id": 1,
            "url": "https://example.com/photo1.jpg",
            "type": "profile",
            "uploadedAt": "2024-01-15T10:30:00Z"
          }
        ],
        "createdAt": "2023-06-15T00:00:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

### 创建牛只档案
```http
POST /cattle
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "earTag": "CN001235",
  "breed": "安格斯",
  "gender": "female",
  "birthDate": "2023-08-20",
  "weight": 380.0,
  "baseId": 1,
  "barnId": 2,
  "photos": [
    {
      "url": "https://example.com/photo2.jpg",
      "type": "profile"
    }
  ]
}
```

### 批量导入牛只
```http
POST /cattle/batch-import
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
- `file`: Excel文件
- `baseId`: 基地ID

### 扫码查询牛只
```http
GET /cattle/scan/{earTag}
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cattle": {
      // 牛只详细信息
    },
    "recentRecords": {
      "health": [
        // 最近健康记录
      ],
      "feeding": [
        // 最近饲喂记录
      ]
    }
  }
}
```

## 健康管理接口

### 诊疗记录

#### 获取诊疗记录
```http
GET /health/records?cattleId=1&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建诊疗记录
```http
POST /health/records
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "cattleIds": [1, 2, 3],
  "symptoms": "食欲不振，精神萎靡",
  "diagnosis": "消化不良",
  "treatment": "调整饲料配方，增加益生菌",
  "medications": [
    {
      "name": "益生菌",
      "dosage": "10g",
      "frequency": "每日2次",
      "duration": "7天"
    }
  ],
  "veterinarianId": 5,
  "diagnosisDate": "2024-01-15",
  "followUpDate": "2024-01-22"
}
```

### 疫苗管理

#### 获取疫苗记录
```http
GET /health/vaccinations?cattleId=1
Authorization: Bearer <token>
```

#### 创建疫苗记录
```http
POST /health/vaccinations
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "cattleIds": [1, 2, 3],
  "vaccineName": "口蹄疫疫苗",
  "manufacturer": "生物制药公司",
  "batchNumber": "20240101",
  "dosage": "2ml",
  "vaccinationDate": "2024-01-15",
  "nextDueDate": "2024-07-15",
  "veterinarianId": 5,
  "site": "颈部肌肉注射"
}
```

### 健康统计
```http
GET /health/statistics?baseId=1&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCattle": 500,
      "healthyCount": 475,
      "sickCount": 20,
      "treatmentCount": 5,
      "healthyRate": 0.95
    },
    "trends": [
      {
        "date": "2024-01-01",
        "healthy": 470,
        "sick": 25,
        "treatment": 5
      }
    ],
    "diseases": [
      {
        "name": "消化不良",
        "count": 15,
        "rate": 0.03
      }
    ]
  }
}
```

## 饲喂管理接口

### 饲料配方

#### 获取配方列表
```http
GET /feeding/formulas?page=1&limit=20
Authorization: Bearer <token>
```

#### 创建配方
```http
POST /feeding/formulas
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "name": "育肥期配方A",
  "description": "适用于6-12月龄育肥牛",
  "targetStage": "fattening",
  "ingredients": [
    {
      "name": "玉米",
      "ratio": 45.0,
      "unit": "%",
      "nutritionValue": {
        "protein": 8.5,
        "energy": 3.4
      },
      "costPerKg": 2.8
    },
    {
      "name": "豆粕",
      "ratio": 20.0,
      "unit": "%",
      "nutritionValue": {
        "protein": 44.0,
        "energy": 2.9
      },
      "costPerKg": 4.2
    }
  ],
  "totalCostPerKg": 3.2,
  "nutritionSummary": {
    "protein": 16.5,
    "energy": 3.1,
    "fiber": 18.0
  }
}
```

### 饲喂记录

#### 获取饲喂记录
```http
GET /feeding/records?baseId=1&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

#### 创建饲喂记录
```http
POST /feeding/records
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "formulaId": 1,
  "baseId": 1,
  "barnId": 2,
  "feedingDate": "2024-01-15",
  "feedingTime": "08:00",
  "amount": 500.0,
  "unit": "kg",
  "cattleCount": 50,
  "operatorId": 3,
  "weather": "晴",
  "temperature": 15,
  "notes": "牛只食欲正常"
}
```

### 饲喂效果分析
```http
GET /feeding/analysis?baseId=1&startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer <token>
```

## 生产物资管理接口

### 物资档案

#### 获取物资列表
```http
GET /materials?categoryId=1&page=1&limit=20
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "玉米",
        "code": "FEED001",
        "category": {
          "id": 1,
          "name": "饲料类"
        },
        "unit": "kg",
        "specification": "水分≤14%，蛋白质≥8%",
        "supplier": {
          "id": 1,
          "name": "农产品供应商"
        },
        "purchasePrice": 2.8,
        "safetyStock": 1000.0,
        "currentStock": 2500.0,
        "status": "active"
      }
    ]
  }
}
```

#### 创建物资档案
```http
POST /materials
Authorization: Bearer <token>
```

### 库存管理

#### 获取库存信息
```http
GET /inventory?baseId=1&materialId=1
Authorization: Bearer <token>
```

#### 入库操作
```http
POST /inventory/inbound
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "materialId": 1,
  "baseId": 1,
  "quantity": 1000.0,
  "unitPrice": 2.8,
  "totalPrice": 2800.0,
  "batchNumber": "20240115001",
  "productionDate": "2024-01-10",
  "expiryDate": "2024-07-10",
  "supplierId": 1,
  "referenceType": "purchase_order",
  "referenceId": 123,
  "operatorId": 2,
  "remark": "质量检验合格"
}
```

#### 出库操作
```http
POST /inventory/outbound
Authorization: Bearer <token>
```

#### 库存预警
```http
GET /inventory/alerts?baseId=1
Authorization: Bearer <token>
```

## 生产设备管理接口

### 设备档案

#### 获取设备列表
```http
GET /equipment?baseId=1&categoryId=1&status=normal
Authorization: Bearer <token>
```

#### 创建设备档案
```http
POST /equipment
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "name": "TMR搅拌机",
  "code": "EQ001",
  "categoryId": 1,
  "baseId": 1,
  "barnId": 1,
  "brand": "某品牌",
  "model": "TMR-500",
  "serialNumber": "SN20240001",
  "purchaseDate": "2024-01-01",
  "purchasePrice": 50000.0,
  "warrantyPeriod": 24,
  "installationDate": "2024-01-05",
  "location": "1号牛棚东侧",
  "specifications": {
    "capacity": "500kg",
    "power": "15kW",
    "voltage": "380V"
  }
}
```

### 维护管理

#### 获取维护计划
```http
GET /equipment/{id}/maintenance-plans
Authorization: Bearer <token>
```

#### 创建维护记录
```http
POST /equipment/{id}/maintenance-records
Authorization: Bearer <token>
```

#### 报告故障
```http
POST /equipment/{id}/failures
Authorization: Bearer <token>
```

## 采购管理接口

### 供应商管理

#### 获取供应商列表
```http
GET /suppliers?type=material&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建供应商
```http
POST /suppliers
Authorization: Bearer <token>
```

### 采购订单

#### 获取采购订单
```http
GET /purchase-orders?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建采购订单
```http
POST /purchase-orders
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "orderNumber": "PO20240115001",
  "supplierId": 1,
  "baseId": 1,
  "orderType": "material",
  "orderDate": "2024-01-15",
  "expectedDeliveryDate": "2024-01-20",
  "paymentMethod": "bank_transfer",
  "items": [
    {
      "itemType": "material",
      "itemId": 1,
      "itemName": "玉米",
      "specification": "水分≤14%",
      "quantity": 1000.0,
      "unit": "kg",
      "unitPrice": 2.8,
      "totalPrice": 2800.0
    }
  ],
  "totalAmount": 2800.0,
  "remark": "请确保质量"
}
```

## 销售管理接口

### 客户管理

#### 获取客户列表
```http
GET /customers?type=enterprise&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建客户
```http
POST /customers
Authorization: Bearer <token>
```

### 销售订单

#### 获取销售订单
```http
GET /sales-orders?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

#### 创建销售订单
```http
POST /sales-orders
Authorization: Bearer <token>
```

## 新闻管理接口

### 新闻分类

#### 获取新闻分类
```http
GET /news/categories
Authorization: Bearer <token>
```

### 新闻文章

#### 获取新闻列表
```http
GET /news?categoryId=1&status=published&page=1&limit=20
```

#### 创建新闻文章
```http
POST /news
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "title": "企业新闻标题",
  "subtitle": "副标题",
  "categoryId": 1,
  "content": "新闻正文内容...",
  "summary": "新闻摘要",
  "coverImage": "https://example.com/cover.jpg",
  "tags": "企业动态,行业新闻",
  "status": "published",
  "isFeatured": true,
  "publishTime": "2024-01-15T10:00:00Z"
}
```

## 文件上传接口

### 图片上传
```http
POST /upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
- `file`: 图片文件
- `type`: 图片类型 (cattle_photo/health_record/equipment_photo等)
- `cattleId`: 牛只ID（可选）
- `equipmentId`: 设备ID（可选）

**响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "url": "https://example.com/uploads/image.jpg",
    "filename": "image.jpg",
    "size": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 文档上传
```http
POST /upload/document
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

## 数据统计接口

### 仪表盘数据
```http
GET /dashboard/overview?baseId=1
Authorization: Bearer <token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "keyMetrics": {
      "totalCattle": 500,
      "healthyRate": 0.95,
      "monthlyRevenue": 1500000,
      "inventoryAlerts": 5
    },
    "trends": {
      "cattleCount": [
        {"date": "2024-01-01", "count": 495},
        {"date": "2024-01-02", "count": 498}
      ],
      "healthRate": [
        {"date": "2024-01-01", "rate": 0.94},
        {"date": "2024-01-02", "rate": 0.95}
      ]
    },
    "alerts": [
      {
        "type": "health",
        "message": "3头牛只需要疫苗接种",
        "priority": "medium",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

## 错误代码

### 认证相关错误
- `AUTH_001`: 用户名或密码错误
- `AUTH_002`: Token已过期
- `AUTH_003`: Token无效
- `AUTH_004`: 权限不足
- `AUTH_005`: 账户已被锁定

### 业务相关错误
- `CATTLE_001`: 牛只不存在
- `CATTLE_002`: 耳标号已存在
- `CATTLE_003`: 牛只状态不允许此操作
- `BASE_001`: 基地不存在
- `BARN_001`: 牛棚不存在
- `BARN_002`: 牛棚容量不足

### 数据验证错误
- `VALID_001`: 必填字段缺失
- `VALID_002`: 数据格式错误
- `VALID_003`: 数据长度超限
- `VALID_004`: 数据值超出范围

### 系统错误
- `SYS_001`: 数据库连接错误
- `SYS_002`: 文件上传失败
- `SYS_003`: 外部服务调用失败

## 版本更新

### v1.1 (计划中)
- 增加批量操作接口
- 优化查询性能
- 增加更多统计维度

### v1.0 (当前版本)
- 基础CRUD接口
- 认证和权限控制
- 文件上传功能
- 基础统计接口

---

*API文档持续更新中，如有疑问请联系开发团队*