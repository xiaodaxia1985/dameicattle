# 微服务路由完整总结

本文档总结了所有微服务的完整路由结构，确保与前端业务逻辑完全匹配。

## 1. 认证服务 (auth-service) - 端口 3001

**基础路径**: `/api/v1/auth`

### 路由列表
- `POST /login` - 用户登录
- `POST /logout` - 用户登出
- `POST /refresh` - 刷新token
- `GET /profile` - 获取用户信息
- `PUT /profile` - 更新用户信息

## 2. 基地服务 (base-service) - 端口 3002

**基础路径**: `/api/v1/base`

### 基地管理路由
- `GET /bases` - 获取基地列表
- `GET /bases/:id` - 获取基地详情
- `POST /bases` - 创建基地
- `PUT /bases/:id` - 更新基地
- `DELETE /bases/:id` - 删除基地
- `GET /bases/:id/statistics` - 获取基地统计信息

### 牛舍管理路由
- `GET /barns` - 获取牛舍列表
- `GET /barns/:id` - 获取牛舍详情
- `POST /barns` - 创建牛舍
- `PUT /barns/:id` - 更新牛舍
- `DELETE /barns/:id` - 删除牛舍
- `GET /barns/:id/capacity` - 获取牛舍容量信息

### 批量操作路由
- `POST /barns/batch` - 批量创建牛舍
- `PUT /barns/batch` - 批量更新牛舍

## 3. 牛只服务 (cattle-service) - 端口 3003

**基础路径**: `/api/v1/cattle`

### 牛只管理路由
- `GET /cattle` - 获取牛只列表
- `GET /cattle/:id` - 获取牛只详情
- `POST /cattle` - 创建牛只
- `PUT /cattle/:id` - 更新牛只
- `DELETE /cattle/:id` - 删除牛只
- `GET /cattle/statistics` - 获取牛只统计
- `GET /cattle/scan/:earTag` - 通过耳标获取牛只

### 牛只事件路由
- `GET /cattle/:id/events` - 获取牛只事件
- `POST /cattle/:id/events` - 添加牛只事件
- `PUT /cattle/events/:eventId` - 更新牛只事件
- `DELETE /cattle/events/:eventId` - 删除牛只事件

### 批量操作路由
- `POST /cattle/batch/import` - 批量导入牛只
- `GET /cattle/batch/export` - 导出牛只数据
- `POST /cattle/batch/generate-tags` - 生成耳标
- `POST /cattle/batch/transfer` - 批量转移牛只
- `POST /cattle/batch/update` - 批量更新牛只
- `DELETE /cattle/batch` - 批量删除牛只

### 繁殖管理路由
- `GET /cattle/:id/breeding` - 获取繁殖信息
- `POST /cattle/:id/breeding` - 添加繁殖记录
- `PUT /cattle/breeding/:recordId` - 更新繁殖记录

### 体重跟踪路由
- `GET /cattle/:id/weight` - 获取体重历史
- `POST /cattle/:id/weight` - 添加体重记录

### 照片管理路由
- `POST /cattle/:id/photos` - 上传牛只照片
- `DELETE /cattle/:id/photos/:photoId` - 删除牛只照片

## 4. 健康服务 (health-service) - 端口 3004

**基础路径**: `/api/v1/health`

### 健康记录路由
- `GET /records` - 获取健康记录列表
- `GET /records/:id` - 获取健康记录详情
- `POST /records` - 创建健康记录
- `PUT /records/:id` - 更新健康记录
- `DELETE /records/:id` - 删除健康记录

### 疫苗记录路由
- `GET /vaccines` - 获取疫苗记录列表
- `GET /vaccines/:id` - 获取疫苗记录详情
- `POST /vaccines` - 创建疫苗记录
- `PUT /vaccines/:id` - 更新疫苗记录
- `DELETE /vaccines/:id` - 删除疫苗记录

### 疾病记录路由
- `GET /diseases` - 获取疾病记录列表
- `GET /diseases/:id` - 获取疾病记录详情
- `POST /diseases` - 创建疾病记录
- `PUT /diseases/:id` - 更新疾病记录
- `DELETE /diseases/:id` - 删除疾病记录

### 健康预警路由
- `GET /alerts` - 获取健康预警
- `POST /alerts/notify` - 发送健康预警通知

### 健康分析路由
- `GET /trend` - 获取健康趋势分析
- `GET /cattle/:cattleId/profile` - 获取牛只健康档案
- `GET /statistics` - 获取健康统计数据

## 5. 饲喂服务 (feeding-service) - 端口 3005

**基础路径**: `/api/v1/feeding`

### 饲料配方路由
- `GET /formulas` - 获取饲料配方列表
- `GET /formulas/:id` - 获取饲料配方详情
- `POST /formulas` - 创建饲料配方
- `PUT /formulas/:id` - 更新饲料配方
- `DELETE /formulas/:id` - 删除饲料配方

### 饲喂记录路由
- `GET /records` - 获取饲喂记录列表
- `GET /records/:id` - 获取饲喂记录详情
- `POST /records` - 创建饲喂记录
- `PUT /records/:id` - 更新饲喂记录
- `DELETE /records/:id` - 删除饲喂记录

### 饲喂计划路由
- `GET /plans` - 获取饲喂计划列表
- `GET /plans/:id` - 获取饲喂计划详情
- `POST /plans` - 创建饲喂计划
- `PUT /plans/:id` - 更新饲喂计划
- `DELETE /plans/:id` - 删除饲喂计划
- `POST /plans/generate` - 生成饲喂计划

### 饲喂分析路由
- `GET /trend` - 获取饲喂趋势数据
- `GET /statistics` - 获取饲喂统计数据

## 6. 设备服务 (equipment-service) - 端口 3006

**基础路径**: `/api/v1/equipment`

### 设备分类路由
- `GET /categories` - 获取设备分类列表
- `GET /categories/:id` - 获取设备分类详情
- `POST /categories` - 创建设备分类
- `PUT /categories/:id` - 更新设备分类
- `DELETE /categories/:id` - 删除设备分类

### 设备管理路由
- `GET /equipment` - 获取设备列表
- `GET /equipment/:id` - 获取设备详情
- `POST /equipment` - 创建设备
- `PUT /equipment/:id` - 更新设备
- `DELETE /equipment/:id` - 删除设备
- `PATCH /equipment/:id/status` - 更新设备状态
- `GET /equipment/:id/efficiency` - 获取设备效率分析

### 维护计划路由
- `GET /maintenance-plans` - 获取维护计划列表
- `GET /maintenance-plans/:id` - 获取维护计划详情
- `POST /maintenance-plans` - 创建维护计划
- `PUT /maintenance-plans/:id` - 更新维护计划
- `DELETE /maintenance-plans/:id` - 删除维护计划

### 维护记录路由
- `GET /maintenance` - 获取维护记录列表
- `GET /maintenance/:id` - 获取维护记录详情
- `POST /maintenance` - 创建维护记录
- `PUT /maintenance/:id` - 更新维护记录
- `DELETE /maintenance/:id` - 删除维护记录

### 设备故障路由
- `GET /failures` - 获取设备故障列表
- `GET /failures/:id` - 获取设备故障详情
- `POST /failures` - 报告设备故障
- `PATCH /failures/:id/status` - 更新故障状态

### 统计路由
- `GET /statistics` - 获取设备统计数据

## 7. 采购服务 (procurement-service) - 端口 3007

**基础路径**: `/api/v1/procurement`

### 采购订单路由
- `GET /orders` - 获取采购订单列表
- `GET /orders/:id` - 获取采购订单详情
- `POST /orders` - 创建采购订单
- `PUT /orders/:id` - 更新采购订单
- `DELETE /orders/:id` - 删除采购订单

### 采购订单状态管理路由
- `POST /orders/:id/approve` - 审批采购订单
- `POST /orders/:id/cancel` - 取消采购订单
- `POST /orders/:id/delivery` - 确认收货

### 供应商管理路由
- `GET /suppliers` - 获取供应商列表
- `GET /suppliers/:id` - 获取供应商详情
- `POST /suppliers` - 创建供应商
- `PUT /suppliers/:id` - 更新供应商
- `DELETE /suppliers/:id` - 删除供应商
- `GET /suppliers/:id/statistics` - 获取供应商统计

### 分析和导出路由
- `GET /trend` - 获取采购趋势分析
- `GET /orders/export` - 导出采购订单
- `GET /suppliers/export` - 导出供应商列表
- `GET /statistics` - 获取采购统计数据

## 8. 销售服务 (sales-service) - 端口 3008

**基础路径**: `/api/v1/sales`

### 销售订单路由
- `GET /orders` - 获取销售订单列表
- `GET /orders/:id` - 获取销售订单详情
- `POST /orders` - 创建销售订单
- `PUT /orders/:id` - 更新销售订单
- `DELETE /orders/:id` - 删除销售订单

### 销售订单状态管理路由
- `POST /orders/:id/approve` - 审批销售订单
- `POST /orders/:id/cancel` - 取消销售订单
- `POST /orders/:id/delivery` - 更新交付状态
- `POST /orders/:id/payment` - 更新付款状态

### 客户管理路由
- `GET /customers` - 获取客户列表
- `GET /customers/:id` - 获取客户详情
- `POST /customers` - 创建客户
- `PUT /customers/:id` - 更新客户
- `DELETE /customers/:id` - 删除客户
- `PUT /customers/:id/rating` - 更新客户信用评级
- `GET /customers/:id/statistics` - 获取客户统计信息

### 客户回访路由
- `GET /customers/:customerId/visits` - 获取客户回访记录
- `POST /customers/:customerId/visits` - 创建客户回访记录
- `PUT /customers/visits/:id` - 更新客户回访记录

### 客户分析路由
- `GET /customers/types` - 获取客户类型列表
- `GET /customers/value-analysis` - 获取客户价值分析

### 数据支持路由
- `GET /bases` - 获取基地列表（用于销售订单）
- `GET /cattle` - 获取牛只列表（用于销售订单）
- `GET /statistics` - 获取销售统计数据

## 9. 物资服务 (material-service) - 端口 3009

**基础路径**: `/api/v1/material`

### 物资分类路由
- `GET /categories` - 获取物资分类列表
- `GET /categories/:id` - 获取物资分类详情
- `POST /categories` - 创建物资分类
- `PUT /categories/:id` - 更新物资分类
- `DELETE /categories/:id` - 删除物资分类

### 供应商路由
- `GET /suppliers` - 获取供应商列表
- `GET /suppliers/:id` - 获取供应商详情
- `POST /suppliers` - 创建供应商
- `PUT /suppliers/:id` - 更新供应商
- `DELETE /suppliers/:id` - 删除供应商

### 物资档案路由
- `GET /materials` - 获取物资列表
- `GET /materials/:id` - 获取物资详情
- `POST /materials` - 创建物资
- `PUT /materials/:id` - 更新物资
- `DELETE /materials/:id` - 删除物资

### 库存管理路由
- `GET /inventory` - 获取库存列表
- `GET /inventory/:materialId/:baseId` - 获取特定物资和基地的库存
- `POST /inventory/in` - 入库操作
- `POST /inventory/out` - 出库操作

### 库存交易记录路由
- `GET /inventory/records` - 获取库存交易记录
- `POST /inventory/records` - 创建库存交易记录

### 库存预警路由
- `GET /alerts` - 获取库存预警
- `POST /alerts/:id/resolve` - 解决库存预警

### 统计路由
- `GET /statistics` - 获取物资统计数据

## 10. 通知服务 (notification-service) - 端口 3010

**基础路径**: `/api/v1/notification`

### 通知管理路由
- `GET /notifications` - 获取通知列表
- `GET /notifications/:id` - 获取通知详情
- `POST /notifications` - 创建通知
- `PUT /notifications/:id` - 更新通知
- `DELETE /notifications/:id` - 删除通知

### 通知状态管理路由
- `PUT /notifications/:id/read` - 标记通知为已读
- `PUT /notifications/:id/unread` - 标记通知为未读
- `PUT /notifications/read-all` - 标记所有通知为已读

### 通知发送路由
- `POST /notifications/send` - 发送通知
- `POST /notifications/send/batch` - 批量发送通知

### 通知模板路由
- `GET /notifications/templates` - 获取通知模板列表
- `POST /notifications/templates` - 创建通知模板
- `PUT /notifications/templates/:id` - 更新通知模板
- `DELETE /notifications/templates/:id` - 删除通知模板

### 通知设置路由
- `GET /notifications/settings` - 获取通知设置
- `PUT /notifications/settings` - 更新通知设置

### 统计路由
- `GET /notifications/statistics` - 获取通知统计数据

## 11. 文件服务 (file-service) - 端口 3011

**基础路径**: `/api/v1/file`

### 文件上传路由
- `POST /upload` - 上传单个文件
- `POST /upload/batch` - 批量上传文件

### 文件管理路由
- `GET /files` - 获取文件列表
- `GET /files/:id` - 获取文件详情
- `DELETE /files/:id` - 删除文件

### 文件下载路由
- `GET /files/:id/download` - 下载文件
- `GET /files/:id/preview` - 预览文件

### 文件分类路由
- `GET /categories` - 获取文件分类列表
- `POST /categories` - 创建文件分类
- `PUT /categories/:id` - 更新文件分类
- `DELETE /categories/:id` - 删除文件分类

### 文件共享路由
- `POST /files/:id/share` - 共享文件
- `GET /shared/:token` - 获取共享文件

### 统计路由
- `GET /statistics` - 获取文件统计数据

## 12. 监控服务 (monitoring-service) - 端口 3012

**基础路径**: `/api/v1/monitoring`

### 系统指标路由
- `GET /metrics/system` - 获取系统指标
- `GET /metrics/business` - 获取业务指标
- `GET /metrics/database` - 获取数据库指标
- `GET /metrics/redis` - 获取Redis指标

### 性能监控路由
- `GET /performance` - 获取性能指标
- `GET /performance/history` - 获取性能历史

### 服务健康监控路由
- `GET /health/services` - 获取服务健康状态
- `GET /health/dependencies` - 获取依赖健康状态

### 日志管理路由
- `GET /logs` - 获取日志
- `GET /logs/errors` - 获取错误日志
- `GET /logs/access` - 获取访问日志

### 告警管理路由
- `GET /alerts` - 获取告警列表
- `POST /alerts` - 创建告警
- `PUT /alerts/:id` - 更新告警
- `DELETE /alerts/:id` - 删除告警
- `POST /alerts/:id/acknowledge` - 确认告警

### 仪表板路由
- `GET /dashboard/overview` - 获取仪表板概览
- `GET /dashboard/charts` - 获取仪表板图表

### 报告生成路由
- `GET /reports/system` - 生成系统报告
- `GET /reports/performance` - 生成性能报告
- `GET /reports/business` - 生成业务报告

## 13. 新闻服务 (news-service) - 端口 3013

**基础路径**: `/api/v1/news`

### 公开接口路由（门户网站使用）
- `GET /public/articles` - 获取公开新闻列表
- `GET /public/articles/:id` - 获取公开新闻详情
- `GET /public/categories` - 获取公开新闻分类
- `POST /public/articles/:id/view` - 增加新闻浏览量

### 新闻文章路由（需要认证）
- `GET /articles` - 获取新闻文章列表
- `GET /articles/:id` - 获取新闻文章详情
- `POST /articles` - 创建新闻文章
- `PUT /articles/:id` - 更新新闻文章
- `DELETE /articles/:id` - 删除新闻文章

### 新闻文章发布管理路由
- `POST /articles/:id/publish` - 发布新闻文章
- `POST /articles/:id/unpublish` - 取消发布新闻文章
- `POST /articles/:id/feature` - 设置精选文章
- `POST /articles/:id/top` - 设置置顶文章

### 新闻文章搜索路由
- `GET /articles/search` - 搜索新闻文章
- `POST /articles/:id/view` - 增加新闻浏览量

### 新闻分类路由
- `GET /categories` - 获取新闻分类列表
- `GET /categories/:id` - 获取新闻分类详情
- `POST /categories` - 创建新闻分类
- `PUT /categories/:id` - 更新新闻分类
- `DELETE /categories/:id` - 删除新闻分类

### 新闻评论路由
- `GET /articles/:articleId/comments` - 获取新闻评论
- `POST /articles/:articleId/comments` - 创建新闻评论
- `PUT /comments/:id` - 更新新闻评论
- `DELETE /comments/:id` - 删除新闻评论
- `POST /comments/:id/approve` - 审批新闻评论
- `POST /comments/:id/reject` - 拒绝新闻评论

### 统计路由
- `GET /statistics` - 获取新闻统计数据

## 总结

所有微服务的路由已经完整补充，确保与前端业务逻辑完全匹配。每个微服务都包含：

1. **基础CRUD操作** - 创建、读取、更新、删除
2. **业务特定功能** - 根据各服务的业务需求定制
3. **批量操作** - 提高操作效率
4. **统计和分析** - 支持数据分析和报表
5. **状态管理** - 支持业务流程状态变更
6. **搜索和过滤** - 支持复杂查询需求

所有路由都遵循RESTful API设计原则，并包含适当的认证和权限控制中间件。