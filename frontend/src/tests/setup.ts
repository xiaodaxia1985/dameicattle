import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Mock CSS imports
vi.mock('element-plus/dist/index.css', () => ({}));
vi.mock('element-plus/theme-chalk/dark/css-vars.css', () => ({}));

// 模拟浏览器API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('localStorage', localStorageMock);

// 模拟sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal('sessionStorage', sessionStorageMock);

// 模拟Element Plus组件
vi.mock('element-plus', () => ({
  default: {}, // Provide default export
  ElMessage: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
  ElMessageBox: {
    alert: vi.fn().mockResolvedValue(undefined),
    confirm: vi.fn().mockResolvedValue(undefined),
    prompt: vi.fn().mockResolvedValue({ value: 'test' }),
  },
  ElNotification: vi.fn(),
  ElLoading: {
    service: vi.fn().mockReturnValue({
      close: vi.fn(),
    }),
  },
}));

// 模拟IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// 模拟fetch
global.fetch = vi.fn();

// 全局测试工具
export const testUtils = {
  // 创建模拟的路由器
  createMockRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    currentRoute: {
      value: {
        path: '/',
        name: 'home',
        params: {},
        query: {},
        meta: {},
      },
    },
  }),

  // 创建模拟的store
  createMockStore: () => ({
    state: {},
    getters: {},
    commit: vi.fn(),
    dispatch: vi.fn(),
  }),

  // 模拟API响应
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),

  // 模拟用户数据
  mockUser: {
    id: 1,
    username: 'testuser',
    realName: '测试用户',
    email: 'test@example.com',
    role: 'user',
    baseId: 1,
  },

  // 模拟牛只数据
  mockCattle: {
    id: 1,
    earTag: 'TEST001',
    breed: '西门塔尔',
    gender: 'male',
    birthDate: '2023-01-01',
    weight: 500.00,
    healthStatus: 'healthy',
    baseId: 1,
    barnId: 1,
  },

  // 等待DOM更新
  waitForUpdate: () => new Promise(resolve => setTimeout(resolve, 0)),
};