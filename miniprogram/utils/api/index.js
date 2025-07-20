// API工具集合
import { apiService } from '../request'
import { healthApi } from './health'
import { cattleApi } from './cattle'
import { userApi } from './user'
import { authApi } from './auth'
import { salesApi } from './sales'
import { equipmentApi } from './equipment'
import { materialsApi } from './materials'

// 导出所有API
export {
  apiService,
  healthApi,
  cattleApi,
  userApi,
  authApi,
  salesApi,
  equipmentApi,
  materialsApi
}

// 默认导出
export default {
  apiService,
  healthApi,
  cattleApi,
  userApi,
  authApi,
  salesApi,
  equipmentApi,
  materialsApi
}