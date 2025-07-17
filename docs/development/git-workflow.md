# Git工作流程和分支策略

## 分支策略

本项目采用 **Git Flow** 分支策略，确保代码质量和发布流程的规范性。

### 主要分支

#### 1. main 分支
- **用途**: 生产环境代码
- **特点**: 始终保持稳定，可直接部署到生产环境
- **保护**: 受保护分支，只能通过PR合并
- **标签**: 每次发布都会打上版本标签

#### 2. develop 分支
- **用途**: 开发环境代码集成
- **特点**: 包含最新的开发功能
- **来源**: 从main分支创建
- **合并**: 接收feature分支的合并

#### 3. feature/* 分支
- **用途**: 功能开发
- **命名**: `feature/功能名称` 或 `feature/任务编号-功能名称`
- **来源**: 从develop分支创建
- **合并**: 完成后合并回develop分支
- **示例**: 
  - `feature/user-authentication`
  - `feature/cattle-management`
  - `feature/health-records`

#### 4. release/* 分支
- **用途**: 发布准备
- **命名**: `release/版本号`
- **来源**: 从develop分支创建
- **合并**: 同时合并到main和develop分支
- **示例**: `release/v1.0.0`

#### 5. hotfix/* 分支
- **用途**: 紧急修复生产问题
- **命名**: `hotfix/问题描述`
- **来源**: 从main分支创建
- **合并**: 同时合并到main和develop分支
- **示例**: `hotfix/login-security-fix`

## 工作流程

### 功能开发流程

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/new-feature
   ```

2. **开发和提交**
   ```bash
   # 进行开发工作
   git add .
   git commit -m "feat: 添加新功能"
   ```

3. **推送分支**
   ```bash
   git push origin feature/new-feature
   ```

4. **创建Pull Request**
   - 目标分支: develop
   - 填写详细的PR描述
   - 请求代码审查

5. **代码审查和合并**
   - 至少需要1个审查者批准
   - 通过所有CI检查
   - 合并到develop分支

### 发布流程

1. **创建发布分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v1.0.0
   ```

2. **发布准备**
   - 更新版本号
   - 更新CHANGELOG
   - 进行最终测试

3. **合并到main**
   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   ```

4. **合并回develop**
   ```bash
   git checkout develop
   git merge release/v1.0.0
   git push origin develop
   ```

### 热修复流程

1. **创建热修复分支**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug-fix
   ```

2. **修复问题**
   ```bash
   # 修复代码
   git add .
   git commit -m "fix: 修复关键安全问题"
   ```

3. **合并到main和develop**
   ```bash
   # 合并到main
   git checkout main
   git merge hotfix/critical-bug-fix
   git tag v1.0.1
   git push origin main --tags
   
   # 合并到develop
   git checkout develop
   git merge hotfix/critical-bug-fix
   git push origin develop
   ```

## 提交规范

### 提交消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 提交类型

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码格式调整（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动

### 示例

```bash
feat(auth): 添加JWT认证功能

实现了基于JWT的用户认证系统，包括：
- 用户登录接口
- Token验证中间件
- 权限控制机制

Closes #123
```

## 代码审查规范

### 审查要点

1. **功能正确性**
   - 代码是否实现了预期功能
   - 是否有潜在的bug

2. **代码质量**
   - 代码是否清晰易读
   - 是否遵循项目编码规范
   - 是否有适当的注释

3. **性能考虑**
   - 是否有性能问题
   - 数据库查询是否优化

4. **安全性**
   - 是否有安全漏洞
   - 输入验证是否充分

5. **测试覆盖**
   - 是否有相应的测试
   - 测试是否充分

### 审查流程

1. **自动检查**
   - CI/CD流水线自动运行
   - 代码质量检查
   - 自动化测试

2. **人工审查**
   - 至少1个团队成员审查
   - 核心功能需要2个审查者

3. **反馈处理**
   - 及时回应审查意见
   - 修改后重新请求审查

## 分支保护规则

### main分支保护
- 禁止直接推送
- 需要PR审查
- 需要通过状态检查
- 需要分支是最新的

### develop分支保护
- 禁止直接推送
- 需要PR审查
- 需要通过状态检查

## 版本管理

### 版本号规范

采用 [Semantic Versioning](https://semver.org/) 规范：

- **MAJOR**: 不兼容的API修改
- **MINOR**: 向后兼容的功能性新增
- **PATCH**: 向后兼容的问题修正

### 发布标签

- 格式: `v{MAJOR}.{MINOR}.{PATCH}`
- 示例: `v1.0.0`, `v1.1.0`, `v1.1.1`

### 变更日志

每次发布都需要更新 `CHANGELOG.md` 文件，记录：
- 新增功能
- 修复的问题
- 重大变更
- 已知问题

## 最佳实践

1. **频繁提交**: 保持小而频繁的提交
2. **清晰消息**: 写清楚的提交消息
3. **及时同步**: 定期从上游分支拉取更新
4. **测试先行**: 提交前确保测试通过
5. **代码审查**: 认真对待代码审查过程
6. **文档更新**: 及时更新相关文档