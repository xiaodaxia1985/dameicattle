/**
 * 统一API入口
 * 所有微服务调用都应通过此模块
 */
import { api } from './client'
import { AuthServiceApi, BaseServiceApi, /* 其他服务API */ } from './microservices'

// 创建API实例
export const authApi = new AuthServiceApi()
export const baseApi = new BaseServiceApi()
// 导出其他微服务API实例

// 导出统一的API客户端
export default api

// 导出工具函数
export * from './client'
export * from './microservices'