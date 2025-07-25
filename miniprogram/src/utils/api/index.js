// API工具集合 - 使用标准化API客户端
import { api } from '../apiClient'
import { healthApi } from './health'
import { cattleApi } from './cattle'
import { userApi } from './user'
import { authApi } from './auth'
import { salesApi } from './sales'
import { equipmentApi } from './equipment'
import { materialsApi } from './materials'
import { dashboardApi } from './dashboard'

// 导出所有API
export {
  api,
  healthApi,
  cattleApi,
  userApi,
  authApi,
  salesApi,
  equipmentApi,
  materialsApi,
  dashboardApi
}

// 统一API对象
export const apis = {
  auth: authApi,
  cattle: cattleApi,
  dashboard: dashboardApi,
  equipment: equipmentApi,
  health: healthApi,
  materials: materialsApi,
  sales: salesApi,
  user: userApi
}

// 默认导出
export default {
  api,
  healthApi,
  cattleApi,
  userApi,
  authApi,
  salesApi,
  equipmentApi,
  materialsApi,
  dashboardApi,
  apis
}