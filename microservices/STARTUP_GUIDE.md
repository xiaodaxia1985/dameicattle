# 微服务启动指南

## 启动选项

### 1. 标准启动（推荐）
```powershell
.\start-services-npm.ps1
```
- 使用每个服务配置的启动方式
- 适用于日常开发和测试

### 2. 强制重建启动
```powershell
.\start-services-npm.ps1 -Rebuild
```
- 清理所有编译文件
- 重新安装依赖
- 重新编译所有服务
- 然后启动服务
- 适用于：
  - 首次启动
  - 依赖更新后
  - 编译出现问题时

### 3. 仅重建（不启动）
```powershell
.\rebuild-all.ps1
```
- 只重建所有服务，不启动
- 适用于预编译或排查编译问题

## 服务启动方式

微服务使用两种启动方式：

### 编译启动（适用于无TypeScript错误的服务）
- sales-service, api-gateway 等
- 启动脚本：`npm run build && node dist/app.js`
- 每次启动都会编译最新代码

### 直接启动（适用于有TypeScript错误但能运行的服务）
- auth-service, base-service 等
- 启动脚本：`ts-node src/app.ts`
- 直接运行TypeScript代码，跳过编译

## 故障排除

### 编译失败
如果某个服务编译失败：
1. 检查该服务的日志输出
2. 进入服务目录手动执行 `npm run build`
3. 检查 TypeScript 语法错误
4. 确保依赖已正确安装

### 依赖问题
如果遇到依赖问题：
1. 使用 `-Rebuild` 参数重新启动
2. 或手动进入服务目录执行 `npm install`

### 服务启动失败
1. 检查 `logs/` 目录下的日志文件
2. 确保数据库和 Redis 服务正在运行
3. 检查端口是否被占用

## 服务状态检查

启动后可以使用以下脚本检查服务状态：
```powershell
.\check-services-health.ps1
```