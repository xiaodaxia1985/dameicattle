# 开发环境指南

## 概述

本文档介绍如何设置和使用肉牛全生命周期管理系统的开发环境。

## 系统要求

### 必需软件

- **Node.js**: 18.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Docker**: 最新版本
- **Docker Compose**: 最新版本
- **Git**: 最新版本

### 推荐软件

- **Visual Studio Code**: 推荐的IDE
- **PostgreSQL客户端**: 如DBeaver、pgAdmin
- **Redis客户端**: 如RedisInsight

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd cattle-management-system
```

### 2. 环境设置

#### Windows用户
```bash
scripts\dev-setup.bat
```

#### Linux/macOS用户
```bash
bash scripts/dev-setup.sh
```

### 3. 启动开发服务

```bash
# 启动所有服务
npm run dev:all

# 或者使用Docker
npm run dev:docker
```

### 4. 访问应用

- **前端应用**: http://localhost:5173
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api-docs
- **数据库管理**: http://localhost:8080

## 项目结构

```
cattle-management-system/
├── backend/                 # 后端API服务
│   ├── src/                # 源代码
│   ├── tests/              # 测试文件
│   ├── logs/               # 日志文件
│   └── uploads/            # 上传文件
├── frontend/               # 前端Web应用
│   ├── src/                # 源代码
│   ├── tests/              # 测试文件
│   └── dist/               # 构建输出
├── miniprogram/            # 微信小程序
│   ├── pages/              # 页面
│   ├── components/         # 组件
│   └── utils/              # 工具函数
├── nginx/                  # Nginx配置
├── scripts/                # 开发脚本
├── docs/                   # 文档
└── docker-compose.yml      # Docker编排文件
```

## 开发工作流

### 分支策略

请参考 [Git工作流程文档](./git-workflow.md)

### 代码规范

#### 提交消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加牛只管理功能
fix: 修复登录验证问题
docs: 更新API文档
style: 代码格式调整
refactor: 重构用户服务
test: 添加单元测试
chore: 更新依赖包
```

#### 代码风格

- **后端**: ESLint + Prettier
- **前端**: ESLint + Prettier
- **提交前检查**: Husky + lint-staged

### 开发命令

#### 根目录命令

```bash
# 开发服务
npm run dev:all          # 启动所有服务
npm run dev:backend      # 仅启动后端
npm run dev:frontend     # 仅启动前端
npm run dev:miniprogram  # 启动小程序开发

# 构建
npm run build:all        # 构建所有项目
npm run build:backend    # 构建后端
npm run build:frontend   # 构建前端

# 测试
npm run test:all         # 运行所有测试
npm run test:backend     # 运行后端测试
npm run test:frontend    # 运行前端测试
npm run test:watch       # 监视模式测试

# 代码质量
npm run lint:all         # 检查所有代码
npm run lint:fix:all     # 修复代码问题
npm run format:all       # 格式化代码

# 数据库
npm run db:setup         # 初始化数据库
npm run db:reset         # 重置数据库
npm run db:backup        # 备份数据库
npm run db:restore       # 恢复数据库

# Docker
npm run docker:up        # 启动Docker服务
npm run docker:down      # 停止Docker服务
npm run docker:logs      # 查看Docker日志
npm run docker:clean     # 清理Docker资源
```

#### 后端命令

```bash
cd backend

# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建项目
npm run start            # 启动生产服务器

# 测试
npm run test             # 运行测试
npm run test:watch       # 监视模式测试
npm run test:coverage    # 生成覆盖率报告

# 代码质量
npm run lint             # 代码检查
npm run lint:fix         # 修复代码问题
npm run format           # 格式化代码

# 数据库
npm run migrate          # 运行迁移
npm run db:setup         # 设置数据库
npm run db:reset         # 重置数据库
```

#### 前端命令

```bash
cd frontend

# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建项目
npm run preview          # 预览构建结果

# 测试
npm run test             # 运行测试
npm run test:watch       # 监视模式测试
npm run test:coverage    # 生成覆盖率报告

# 代码质量
npm run lint             # 代码检查
npm run format           # 格式化代码
```

## 环境配置

### 环境变量

#### 后端环境变量

```bash
# .env.development
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cattle_management_dev
DB_USER=cattle_user
DB_PASSWORD=cattle_password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
```

#### 前端环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_TITLE=肉牛管理系统
```

### 数据库配置

#### PostgreSQL

- **主机**: localhost
- **端口**: 5432
- **数据库**: cattle_management_dev
- **用户**: cattle_user
- **密码**: cattle_password

#### Redis

- **主机**: localhost
- **端口**: 6379
- **密码**: 无

## 调试指南

### 后端调试

#### VS Code调试配置

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/backend/src/app.ts",
  "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
  "runtimeArgs": ["-r", "ts-node/register"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### 日志调试

```typescript
import logger from '@/utils/logger';

logger.debug('调试信息', { data });
logger.info('一般信息', { data });
logger.warn('警告信息', { data });
logger.error('错误信息', { error });
```

### 前端调试

#### Vue DevTools

安装 Vue DevTools 浏览器扩展进行调试。

#### 控制台调试

```typescript
console.log('调试信息', data);
console.warn('警告信息', data);
console.error('错误信息', error);
```

### 数据库调试

#### 查看SQL日志

在开发环境中，Sequelize会输出SQL查询日志。

#### 数据库客户端

使用DBeaver或pgAdmin连接数据库进行调试。

## 测试指南

详细的测试指南请参考 [测试指南文档](./testing-guide.md)

### 快速测试

```bash
# 运行所有测试
npm run test:all

# 运行特定测试
npm run test:backend -- --testPathPattern=cattle
npm run test:frontend -- components/CattleCard

# 生成覆盖率报告
npm run test:coverage
```

## 部署指南

### 开发环境部署

```bash
# 使用Docker Compose
docker-compose up -d

# 检查服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 生产环境部署

详细的部署指南请参考部署文档。

## 故障排除

### 常见问题

#### 1. 端口冲突

```bash
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :5173

# 杀死进程
taskkill /PID <PID> /F
```

#### 2. 数据库连接失败

- 检查PostgreSQL服务是否启动
- 验证数据库配置
- 检查防火墙设置

#### 3. 依赖安装失败

```bash
# 清理缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 4. Docker问题

```bash
# 重启Docker服务
docker-compose down
docker-compose up -d

# 清理Docker资源
docker system prune -a
```

### 日志查看

#### 应用日志

```bash
# 后端日志
tail -f backend/logs/app.log

# Docker日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### 系统日志

- Windows: 事件查看器
- Linux: `/var/log/`
- macOS: 控制台应用

## 性能优化

### 开发环境优化

1. **启用热重载**: 已配置Vite和Nodemon
2. **使用缓存**: Redis缓存配置
3. **数据库索引**: 开发环境也应使用索引
4. **代码分割**: Vite自动代码分割

### 监控工具

- **后端**: Winston日志 + 性能监控
- **前端**: Vue DevTools + 浏览器开发者工具
- **数据库**: PostgreSQL慢查询日志

## 团队协作

### 代码审查

- 使用Pull Request进行代码审查
- 至少需要1个审查者批准
- 通过所有CI检查后才能合并

### 沟通渠道

- **技术讨论**: GitHub Issues
- **代码审查**: GitHub Pull Requests
- **文档更新**: 及时更新相关文档

## 学习资源

### 技术文档

- [Node.js官方文档](https://nodejs.org/docs/)
- [Vue.js官方文档](https://vuejs.org/)
- [PostgreSQL文档](https://www.postgresql.org/docs/)
- [Docker文档](https://docs.docker.com/)

### 最佳实践

- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)
- [Vue.js风格指南](https://vuejs.org/style-guide/)
- [Git工作流](https://www.atlassian.com/git/tutorials/comparing-workflows)

## 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 搜索已有的GitHub Issues
3. 创建新的Issue并提供详细信息
4. 联系团队成员获取帮助