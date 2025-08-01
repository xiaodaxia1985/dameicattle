# 巡圈路由配置修复

## 需要在 backend/src/app.ts 中添加的内容

### 1. 导入巡圈路由（在两个位置）

在第254行后添加：
```typescript
const patrolRoutes = (await import('@/routes/patrol')).default;
```

在第536行后添加：
```typescript
const patrolRoutes = (await import('@/routes/patrol')).default;
```

### 2. 添加到routes对象（在两个位置）

在routes对象中添加：
```typescript
patrolRoutes,
```

### 3. 注册路由

在setupRoutes函数中添加：
```typescript
app.use('/api/v1/patrol', authMiddleware, patrolRoutes);
```

## 手动修复步骤

1. 打开 `backend/src/app.ts`
2. 找到 `const feedingRoutes = (await import('@/routes/feeding')).default;` 这一行
3. 在其后添加 `const patrolRoutes = (await import('@/routes/patrol')).default;`
4. 找到 routes 对象的定义
5. 在 `feedingRoutes,` 后添加 `patrolRoutes,`
6. 找到路由注册部分
7. 在 `app.use('/api/v1/feeding', authMiddleware, feedingRoutes);` 后添加 `app.use('/api/v1/patrol', authMiddleware, patrolRoutes);`

这样就完成了巡圈路由的配置。