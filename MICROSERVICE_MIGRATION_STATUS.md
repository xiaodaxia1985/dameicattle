# 微服务业务逻辑迁移状态

## 迁移映射表

| 微服务 | Backend对应模块 | 主要Controller | 主要Model | 主要Route | 迁移状态 |
|--------|----------------|---------------|-----------|-----------|----------|
| auth-service | 认证授权 | AuthController, UserController, RoleController | User, Role, SecurityLog | auth, users, roles | ✅ 已完成 |
| base-service | 基地管理 | BaseController, BarnController | Base, Barn | bases, barns | ✅ 已完成 |
| cattle-service | 牛只管理 | CattleController, CattleBatchController, CattleEventController | Cattle, CattleEvent | cattle | ✅ 已完成 |
| health-service | 健康管理 | HealthController | HealthRecord, VaccinationRecord | health | ✅ 已完成 |
| feeding-service | 饲料管理 | FeedingController | FeedingRecord, FeedFormula | feeding | ✅ 已完成 |
| equipment-service | 设备管理 | EquipmentController | ProductionEquipment, EquipmentCategory, EquipmentMaintenanceRecord | equipment | ✅ 已完成 |
| procurement-service | 采购管理 | PurchaseOrderController, SupplierController | PurchaseOrder, PurchaseOrderItem, Supplier | purchase, purchaseOrders, suppliers | ✅ 已完成 |
| sales-service | 销售管理 | SalesOrderController, CustomerController | SalesOrder, SalesOrderItem, Customer | salesOrders, customers | ✅ 已完成 |
| material-service | 物料管理 | MaterialController, InventoryController | ProductionMaterial, MaterialCategory, Inventory | materials | ✅ 已完成 |
| notification-service | 通知系统 | NotificationController | Notification | notifications | ✅ 已完成 |
| file-service | 文件管理 | FileController | FileRecord | files | ✅ 已完成 |
| monitoring-service | 监控系统 | MonitoringController, PerformanceController | IoTDevice | monitoring, performance | ✅ 已完成 |
| news-service | 新闻系统 | NewsController | NewsArticle, NewsCategory, NewsComment | news | ✅ 已完成 |
| api-gateway | API网关 | GatewayController | - | gateway | ✅ 已完成 |

## 迁移优先级

### 第一批（核心业务）
1. base-service - 基地管理是基础
2. cattle-service - 牛只管理是核心
3. health-service - 健康管理是关键

### 第二批（业务支撑）
4. feeding-service - 饲料管理
5. material-service - 物料管理
6. equipment-service - 设备管理

### 第三批（业务扩展）
7. procurement-service - 采购管理
8. sales-service - 销售管理
9. news-service - 新闻系统

### 第四批（系统支撑）
10. file-service - 文件管理
11. notification-service - 通知系统
12. monitoring-service - 监控系统
13. api-gateway - API网关

## 迁移检查清单

每个微服务需要迁移的内容：
- [ ] Controllers - 控制器逻辑
- [ ] Models - 数据模型
- [ ] Routes - 路由配置
- [ ] Validators - 数据验证
- [ ] Services - 业务服务（如果有）
- [ ] Middleware - 中间件（如果有特殊的）
- [ ] Types - 类型定义（如果有）