# 测试指南

## 测试策略

本项目采用多层次的测试策略，确保代码质量和系统稳定性：

### 测试金字塔

```
    /\
   /  \     E2E Tests (端到端测试)
  /____\    Integration Tests (集成测试)
 /______\   Unit Tests (单元测试)
```

1. **单元测试 (70%)**：测试单个函数、组件或模块
2. **集成测试 (20%)**：测试模块间的交互
3. **端到端测试 (10%)**：测试完整的用户流程

## 测试工具

### 后端测试
- **Jest**: 测试框架
- **Supertest**: HTTP接口测试
- **ts-jest**: TypeScript支持

### 前端测试
- **Vitest**: 测试框架（Vite原生支持）
- **Vue Test Utils**: Vue组件测试
- **jsdom**: DOM环境模拟

### E2E测试
- **Playwright**: 端到端测试（推荐）
- **Cypress**: 备选方案

## 测试环境设置

### 初始化测试环境

```bash
# 设置测试环境
npm run setup

# 设置测试数据库
bash scripts/test-setup.sh
```

### 环境变量

测试环境使用独立的配置文件：
- 后端：`backend/.env.test`
- 前端：测试时自动使用测试配置

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm run test:all

# 运行后端测试
npm run test:backend

# 运行前端测试
npm run test:frontend

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 单独运行特定测试

```bash
# 后端单元测试
cd backend && npm test -- --testPathPattern=unit

# 后端集成测试
cd backend && npm test -- --testPathPattern=integration

# 前端组件测试
cd frontend && npm test -- components

# 前端store测试
cd frontend && npm test -- stores
```

## 编写测试

### 后端测试

#### 单元测试示例

```typescript
// src/tests/unit/services/cattleService.test.ts
import { CattleService } from '@/services/cattleService';
import { createTestData } from '../../helpers/database';

describe('CattleService', () => {
  let cattleService: CattleService;

  beforeEach(() => {
    cattleService = new CattleService();
  });

  describe('createCattle', () => {
    it('should create cattle with valid data', async () => {
      const cattleData = {
        earTag: 'TEST001',
        breed: '西门塔尔',
        gender: 'male',
        birthDate: '2023-01-01',
        weight: 500.00
      };

      const result = await cattleService.create(cattleData);

      expect(result).toHaveProperty('id');
      expect(result.earTag).toBe('TEST001');
      expect(result.breed).toBe('西门塔尔');
    });

    it('should throw error with invalid data', async () => {
      const invalidData = {
        earTag: '', // 空耳标
        breed: '西门塔尔'
      };

      await expect(cattleService.create(invalidData))
        .rejects.toThrow('耳标不能为空');
    });
  });
});
```

#### 集成测试示例

```typescript
// src/tests/integration/cattle.test.ts
import request from 'supertest';
import app from '@/app';
import { createTestToken } from '../helpers/auth';

describe('Cattle API', () => {
  let authToken: string;

  beforeAll(() => {
    authToken = createTestToken();
  });

  describe('POST /api/v1/cattle', () => {
    it('should create new cattle', async () => {
      const cattleData = {
        earTag: 'INT001',
        breed: '安格斯',
        gender: 'female',
        weight: 450.00
      };

      const response = await request(app)
        .post('/api/v1/cattle')
        .set('Authorization', `Bearer ${authToken}`)
        .send(cattleData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.earTag).toBe('INT001');
    });
  });
});
```

### 前端测试

#### 组件测试示例

```typescript
// src/tests/unit/components/CattleCard.test.ts
import { mount } from '@vue/test-utils';
import CattleCard from '@/components/CattleCard.vue';

describe('CattleCard', () => {
  const mockCattle = {
    id: 1,
    earTag: 'TEST001',
    breed: '西门塔尔',
    gender: 'male',
    healthStatus: 'healthy'
  };

  it('renders cattle information', () => {
    const wrapper = mount(CattleCard, {
      props: { cattle: mockCattle }
    });

    expect(wrapper.text()).toContain('TEST001');
    expect(wrapper.text()).toContain('西门塔尔');
  });

  it('emits select event when clicked', async () => {
    const wrapper = mount(CattleCard, {
      props: { 
        cattle: mockCattle,
        selectable: true 
      }
    });

    await wrapper.find('.cattle-card').trigger('click');

    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual([mockCattle]);
  });
});
```

#### Store测试示例

```typescript
// src/tests/unit/stores/cattle.test.ts
import { setActivePinia, createPinia } from 'pinia';
import { useCattleStore } from '@/stores/cattle';

describe('Cattle Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('fetches cattle list', async () => {
    const store = useCattleStore();
    
    // 模拟API响应
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [mockCattle],
        total: 1
      })
    });

    await store.fetchCattleList();

    expect(store.cattleList).toHaveLength(1);
    expect(store.cattleList[0].earTag).toBe('TEST001');
  });
});
```

### E2E测试

#### Playwright示例

```typescript
// tests/e2e/cattle-management.spec.ts
import { test, expect } from '@playwright/test';

test('cattle management flow', async ({ page }) => {
  // 登录
  await page.goto('/login');
  await page.fill('[data-testid="username"]', 'testuser');
  await page.fill('[data-testid="password"]', 'testpassword');
  await page.click('[data-testid="login-button"]');

  // 导航到牛只管理
  await page.click('[data-testid="cattle-menu"]');
  await expect(page).toHaveURL('/cattle');

  // 添加新牛只
  await page.click('[data-testid="add-cattle"]');
  await page.fill('[data-testid="ear-tag"]', 'E2E001');
  await page.selectOption('[data-testid="breed"]', '西门塔尔');
  await page.click('[data-testid="save"]');

  // 验证添加成功
  await expect(page.locator('[data-testid="cattle-list"]'))
    .toContainText('E2E001');
});
```

## 测试数据管理

### 测试数据库

- 使用独立的测试数据库：`cattle_management_test`
- 每个测试前清理数据，确保测试独立性
- 使用工厂函数创建测试数据

### 测试数据工厂

```typescript
// src/tests/factories/cattleFactory.ts
export const createCattleData = (overrides = {}) => ({
  earTag: `TEST${Date.now()}`,
  breed: '西门塔尔',
  gender: 'male',
  birthDate: '2023-01-01',
  weight: 500.00,
  healthStatus: 'healthy',
  ...overrides
});
```

## 模拟和存根

### API模拟

```typescript
// 模拟fetch请求
vi.mocked(fetch).mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ data: mockData })
});
```

### 外部服务模拟

```typescript
// 模拟文件上传服务
vi.mock('@/services/uploadService', () => ({
  uploadFile: vi.fn().mockResolvedValue({
    url: 'http://example.com/file.jpg',
    filename: 'test.jpg'
  })
}));
```

## 测试覆盖率

### 覆盖率目标

- **语句覆盖率**: ≥ 70%
- **分支覆盖率**: ≥ 70%
- **函数覆盖率**: ≥ 70%
- **行覆盖率**: ≥ 70%

### 查看覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看HTML报告
open backend/coverage/index.html
open frontend/coverage/index.html
```

## 持续集成

### GitHub Actions

测试在以下情况下自动运行：
- 推送到 `main` 或 `develop` 分支
- 创建 Pull Request
- 每日定时运行

### 测试流水线

1. **代码检查**: ESLint, Prettier
2. **单元测试**: Jest, Vitest
3. **集成测试**: API测试
4. **构建测试**: 验证构建成功
5. **E2E测试**: 关键用户流程

## 最佳实践

### 测试命名

```typescript
describe('CattleService', () => {
  describe('createCattle', () => {
    it('should create cattle with valid data', () => {
      // 测试实现
    });

    it('should throw error when ear tag is empty', () => {
      // 测试实现
    });
  });
});
```

### 测试结构

使用 **AAA** 模式：
- **Arrange**: 准备测试数据
- **Act**: 执行被测试的操作
- **Assert**: 验证结果

```typescript
it('should calculate total weight', () => {
  // Arrange
  const cattle = [
    { weight: 500 },
    { weight: 600 },
    { weight: 550 }
  ];

  // Act
  const total = calculateTotalWeight(cattle);

  // Assert
  expect(total).toBe(1650);
});
```

### 测试隔离

- 每个测试应该独立运行
- 使用 `beforeEach` 和 `afterEach` 清理状态
- 避免测试间的依赖关系

### 异步测试

```typescript
it('should fetch cattle data', async () => {
  const promise = cattleService.fetchAll();
  
  await expect(promise).resolves.toHaveLength(3);
});
```

## 调试测试

### 调试单个测试

```bash
# 运行单个测试文件
npm test -- cattle.test.ts

# 运行特定测试用例
npm test -- --testNamePattern="should create cattle"

# 调试模式
npm test -- --inspect-brk cattle.test.ts
```

### 测试日志

```typescript
it('should process data', () => {
  console.log('Debug info:', data);
  expect(processData(data)).toBe(expected);
});
```

## 性能测试

### 基准测试

```typescript
it('should process large dataset efficiently', () => {
  const largeDataset = generateLargeDataset(10000);
  
  const startTime = Date.now();
  const result = processDataset(largeDataset);
  const endTime = Date.now();
  
  expect(endTime - startTime).toBeLessThan(1000); // 1秒内完成
  expect(result).toHaveLength(10000);
});
```

## 故障排除

### 常见问题

1. **测试超时**: 增加 `testTimeout` 配置
2. **数据库连接**: 检查测试数据库配置
3. **异步问题**: 确保正确使用 `async/await`
4. **模拟问题**: 检查模拟函数的设置

### 调试技巧

- 使用 `console.log` 输出调试信息
- 使用 `debugger` 断点调试
- 检查测试数据库状态
- 验证模拟函数调用