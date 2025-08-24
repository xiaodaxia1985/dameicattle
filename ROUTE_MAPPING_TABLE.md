# 前后端路由映射对照表

## 完整路由映射关系

### 1. 管理后台页面路由 (前端) ↔ 微服务API路由 (后端)

#### 牛场管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/cattle/bases                  -> /api/v1/base/bases                   -> base-service:/bases
/admin/cattle/list                   -> /api/v1/cattle/cattle                -> cattle-service:/cattle
/admin/cattle/detail/:id             -> /api/v1/cattle/cattle/:id            -> cattle-service:/cattle/:id
```

#### 健康管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/health/dashboard              -> /api/v1/health-service/records       -> health-service:/records
/admin/health/records                -> /api/v1/health-service/records       -> health-service:/records
/admin/health/vaccination            -> /api/v1/health-service/vaccines      -> health-service:/vaccines
/admin/health/alerts                 -> /api/v1/health-service/alerts        -> health-service:/alerts
/admin/health/statistics             -> /api/v1/health-service/statistics    -> health-service:/statistics
```

#### 饲喂管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/feeding/dashboard             -> /api/v1/feeding/records              -> feeding-service:/records
/admin/feeding/records               -> /api/v1/feeding/records              -> feeding-service:/records
/admin/feeding/patrol-dashboard      -> /api/v1/feeding/patrol               -> feeding-service:/patrol
/admin/feeding/patrol-tasks          -> /api/v1/feeding/patrol               -> feeding-service:/patrol
/admin/feeding/patrol-records        -> /api/v1/feeding/patrol               -> feeding-service:/patrol
/admin/feeding/formulas              -> /api/v1/feeding/formulas             -> feeding-service:/formulas
/admin/feeding/formula-management    -> /api/v1/feeding/formulas             -> feeding-service:/formulas
/admin/feeding/analysis              -> /api/v1/feeding/statistics           -> feeding-service:/statistics
```

#### 设备管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/equipment/dashboard           -> /api/v1/equipment/equipment          -> equipment-service:/equipment
/admin/equipment/list                -> /api/v1/equipment/equipment          -> equipment-service:/equipment
```

#### 采购管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/purchase/statistics           -> /api/v1/procurement/statistics       -> procurement-service:/statistics
/admin/purchase/orders               -> /api/v1/procurement/orders           -> procurement-service:/orders
/admin/purchase/suppliers            -> /api/v1/procurement/suppliers        -> procurement-service:/suppliers
```

#### 销售管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/sales/statistics              -> /api/v1/sales/statistics             -> sales-service:/statistics
/admin/sales/orders                  -> /api/v1/sales/orders                 -> sales-service:/orders
/admin/sales/orders/new              -> /api/v1/sales/orders                 -> sales-service:/orders
/admin/sales/orders/:id/edit         -> /api/v1/sales/orders/:id             -> sales-service:/orders/:id
/admin/sales/orders/:id              -> /api/v1/sales/orders/:id             -> sales-service:/orders/:id
/admin/sales/customers               -> /api/v1/sales/customers              -> sales-service:/customers
/admin/sales/customers/new           -> /api/v1/sales/customers              -> sales-service:/customers
/admin/sales/customers/:id/edit      -> /api/v1/sales/customers/:id          -> sales-service:/customers/:id
/admin/sales/customers/:id           -> /api/v1/sales/customers/:id          -> sales-service:/customers/:id
```

#### 物资管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/materials/dashboard           -> /api/v1/material/statistics          -> material-service:/statistics
/admin/materials/list                -> /api/v1/material/materials           -> material-service:/materials
/admin/materials/inventory           -> /api/v1/material/inventory            -> material-service:/inventory
```

#### 新闻管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/news/list                     -> /api/v1/news/articles                -> news-service:/articles
/admin/news/create                   -> /api/v1/news/articles                -> news-service:/articles
/admin/news/edit/:id                 -> /api/v1/news/articles/:id            -> news-service:/articles/:id
/admin/news/view/:id                 -> /api/v1/news/articles/:id            -> news-service:/articles/:id
/admin/news/categories               -> /api/v1/news/categories              -> news-service:/categories
```

#### 系统管理模块
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/admin/system/users                  -> /api/v1/auth/users                   -> auth-service:/users
/admin/system/roles                  -> /api/v1/auth/roles                   -> auth-service:/roles
/admin/system/barns                  -> /api/v1/base/barns                   -> base-service:/barns
/admin/system/operation-logs         -> /api/v1/monitoring/logs              -> monitoring-service:/logs
```

### 2. 门户网站路由

#### 公开页面
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/portal                              -> /api/v1/news/public/articles         -> news-service:/public/articles
/portal/about                        -> 静态页面 (无API调用)                   -> 无
/portal/products                     -> 静态页面 (无API调用)                   -> 无
/portal/culture                      -> 静态页面 (无API调用)                   -> 无
/portal/history                      -> 静态页面 (无API调用)                   -> 无
/portal/news                         -> /api/v1/news/public/articles         -> news-service:/public/articles
/portal/news/:id                     -> /api/v1/news/public/articles/:id     -> news-service:/public/articles/:id
/portal/contact                      -> 静态页面 (无API调用)                   -> 无
```

#### 门户管理
```
前端页面路由                          -> 对应API调用                           -> 微服务处理路由
/portal/admin/dashboard              -> /api/v1/monitoring/metrics           -> monitoring-service:/metrics
/portal/admin/content                -> /api/v1/news/articles                -> news-service:/articles
/portal/admin/messages               -> /api/v1/notification/notifications   -> notification-service:/notifications
/portal/admin/inquiries              -> /api/v1/notification/notifications   -> notification-service:/notifications
```

### 3. API网关路径重写规则

```yaml
路径重写规则:
  /api/v1/auth/*        -> 认证服务(3001)/*
  /api/v1/base/*        -> 基地服务(3002)/*
  /api/v1/cattle/*      -> 牛只服务(3003)/*
  /api/v1/health-service/* -> 健康服务(3004)/*
  /api/v1/feeding/*     -> 饲养服务(3005)/*
  /api/v1/equipment/*   -> 设备服务(3006)/*
  /api/v1/procurement/* -> 采购服务(3007)/*
  /api/v1/sales/*       -> 销售服务(3008)/*
  /api/v1/material/*    -> 物料服务(3009)/*
  /api/v1/notification/* -> 通知服务(3010)/*
  /api/v1/file/*        -> 文件服务(3011)/*
  /api/v1/monitoring/*  -> 监控服务(3012)/*
  /api/v1/news/*        -> 新闻服务(3013)/*
```

### 4. 完整请求流程示例

#### 示例1: 获取基地列表
```
1. 用户访问前端页面: /admin/cattle/bases
2. 页面组件调用API: baseServiceApi.getBases()
3. API构建请求URL: /api/v1/base/bases
4. 前端发送请求: GET http://localhost:3000/api/v1/base/bases
5. API网关接收请求: /api/v1/base/bases
6. 网关路径重写: /bases
7. 网关转发请求: GET http://localhost:3002/bases
8. 基地服务处理: router.get('/bases', ...)
9. 返回基地数据: JSON响应
10. 前端页面显示数据
```

#### 示例2: 创建健康记录
```
1. 用户在健康记录页面提交表单: /admin/health/records
2. 页面组件调用API: healthServiceApi.createHealthRecord(data)
3. API构建请求URL: /api/v1/health-service/records
4. 前端发送请求: POST http://localhost:3000/api/v1/health-service/records
5. API网关接收请求: /api/v1/health-service/records
6. 网关路径重写: /records
7. 网关转发请求: POST http://localhost:3004/records
8. 健康服务处理: router.post('/records', ...)
9. 创建健康记录: 保存到数据库
10. 返回成功响应: JSON响应
11. 前端显示成功消息并刷新列表
```

## 路由一致性验证

### ✅ 已验证项目
- [x] API网关路径重写配置正确
- [x] 所有微服务路由配置统一
- [x] 前端API调用路径匹配后端
- [x] 微服务控制器方法存在性验证
- [x] TypeScript编译错误修复
- [x] 健康检查路由统一

### 🔧 修复完成的问题
- [x] 路径重写不一致问题
- [x] 微服务路由匹配失败
- [x] 前端404错误
- [x] 后端编译错误
- [x] 控制器方法不存在

现在整个系统的路由配置已经完全一致和正确！