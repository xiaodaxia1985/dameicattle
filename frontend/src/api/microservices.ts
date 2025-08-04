/**
 * 微服务API适配层
 * 统一管理所有微服务的API调用
 * 每个微服务独立运行，保持服务隔离
 */

import type { ApiResponse } from './request'
import { UnifiedApiClient } from '@/utils/apiClient'

// 创建专用的微服务API客户端，使用空的baseURL让每个服务使用完整路径
const microserviceApiClient = new UnifiedApiClient({
  baseURL: '', // 空的baseURL，让每个微服务使用完整的/api/v1/xxx路径
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true
})

// 微服务路由映射 - 直接访问各个微服务
export const MICROSERVICE_ROUTES = {
  // 认证服务 - 端口3001
  AUTH: '/api/v1/auth',
  // 基地服务 - 端口3002
  BASE: '/api/v1/base',
  // 牛只服务 - 端口3003
  CATTLE: '/api/v1/cattle',
  // 健康服务 - 端口3004
  HEALTH: '/api/v1/health',
  // 饲养服务 - 端口3005
  FEEDING: '/api/v1/feeding',
  // 设备服务 - 端口3006
  EQUIPMENT: '/api/v1/equipment',
  // 采购服务 - 端口3007
  PROCUREMENT: '/api/v1/procurement',
  // 销售服务 - 端口3008
  SALES: '/api/v1/sales',
  // 物料服务 - 端口3009
  MATERIAL: '/api/v1/material',
  // 通知服务 - 端口3010
  NOTIFICATION: '/api/v1/notification',
  // 文件服务 - 端口3011
  FILE: '/api/v1/file',
  // 监控服务 - 端口3012
  MONITORING: '/api/v1/monitoring',
  // 新闻服务 - 端口3013
  NEWS: '/api/v1/news'
} as const

// 微服务API基类
class MicroserviceApi {
  protected servicePath: string

  constructor(servicePath: string) {
    this.servicePath = servicePath
  }

  protected buildUrl(path: string): string {
    return `${this.servicePath}${path.startsWith('/') ? path : `/${path}`}`
  }

  // 通用CRUD操作
  async get<T = any>(path: string, params?: any): Promise<ApiResponse<T>> {
    return microserviceApiClient.get<T>(this.buildUrl(path), params)
  }

  async post<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return microserviceApiClient.post<T>(this.buildUrl(path), data)
  }

  async put<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return microserviceApiClient.put<T>(this.buildUrl(path), data)
  }

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    return microserviceApiClient.delete<T>(this.buildUrl(path))
  }

  async patch<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return microserviceApiClient.patch<T>(this.buildUrl(path), data)
  }

  // 分页查询
  async getList<T = any>(path: string, params?: {
    page?: number
    limit?: number
    [key: string]: any
  }): Promise<ApiResponse<T[]>> {
    return this.get<T[]>(path, params)
  }

  // 获取详情
  async getById<T = any>(path: string, id: number | string): Promise<ApiResponse<T>> {
    return this.get<T>(`${path}/${id}`)
  }

  // 创建资源
  async create<T = any>(path: string, data: any): Promise<ApiResponse<T>> {
    return this.post<T>(path, data)
  }

  // 更新资源
  async update<T = any>(path: string, id: number | string, data: any): Promise<ApiResponse<T>> {
    return this.put<T>(`${path}/${id}`, data)
  }

  // 删除资源
  async remove<T = any>(path: string, id: number | string): Promise<ApiResponse<T>> {
    return this.delete<T>(`${path}/${id}`)
  }

  // 批量操作
  async batchCreate<T = any>(path: string, data: any[]): Promise<ApiResponse<T[]>> {
    return this.post<T[]>(`${path}/batch`, data)
  }

  async batchUpdate<T = any>(path: string, data: any[]): Promise<ApiResponse<T[]>> {
    return this.put<T[]>(`${path}/batch`, data)
  }

  async batchDelete<T = any>(path: string, ids: (number | string)[]): Promise<ApiResponse<T>> {
    return this.delete<T>(`${path}/batch?ids=${ids.join(',')}`)
  }

  // 文件上传
  async upload<T = any>(path: string, formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    return microserviceApiClient.post<T>(this.buildUrl(path), formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }

  // 文件下载
  async download(path: string, filename?: string): Promise<void> {
    const url = this.buildUrl(path)
    window.open(url)
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return microserviceApiClient.get<{ status: string; timestamp: string }>('/health')
  }
}

// 认证服务API
export class AuthServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.AUTH)
  }

  // 用户登录
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.post<{ token: string; user: any }>('/login', credentials)
  }

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    return this.post<void>('/logout')
  }

  // 刷新token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return this.post<{ token: string }>('/refresh')
  }

  // 获取用户信息
  async getProfile(): Promise<ApiResponse<{ user: any; permissions: string[] }>> {
    return this.get<{ user: any; permissions: string[] }>('/profile')
  }

  // 更新用户信息
  async updateProfile(data: any): Promise<ApiResponse<any>> {
    return this.put<any>('/profile', data)
  }
}

// 基地服务API
export class BaseServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.BASE)
  }

  // 获取基地列表
  async getBases(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/bases', params)
  }

  // 获取基地详情
  async getBase(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/bases/${id}`)
  }

  // 创建基地
  async createBase(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/bases', data)
  }

  // 更新基地
  async updateBase(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/bases/${id}`, data)
  }

  // 删除基地
  async deleteBase(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/bases/${id}`)
  }

  // 获取牛舍列表
  async getBarns(baseId?: number, params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = baseId ? { baseId, ...params } : params
    return this.get<any[]>('/barns', queryParams)
  }

  // 获取牛舍详情
  async getBarn(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/barns/${id}`)
  }

  // 创建牛舍
  async createBarn(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/barns', data)
  }

  // 更新牛舍
  async updateBarn(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/barns/${id}`, data)
  }

  // 删除牛舍
  async deleteBarn(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/barns/${id}`)
  }
}

// 牛只服务API
export class CattleServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.CATTLE)
  }

  // 获取牛只列表
  async getCattleList(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/cattle', params)
  }

  // 获取牛只详情
  async getCattle(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/cattle/${id}`)
  }

  // 通过耳标获取牛只
  async getCattleByEarTag(earTag: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/cattle/scan/${earTag}`)
  }

  // 创建牛只
  async createCattle(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/cattle', data)
  }

  // 更新牛只
  async updateCattle(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/cattle/${id}`, data)
  }

  // 删除牛只
  async deleteCattle(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/cattle/${id}`)
  }

  // 获取牛只统计
  async getCattleStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/cattle/statistics', params)
  }

  // 获取牛只事件
  async getCattleEvents(cattleId: number, params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`/cattle/${cattleId}/events`, params)
  }

  // 添加牛只事件
  async addCattleEvent(cattleId: number, event: any): Promise<ApiResponse<any>> {
    return this.post<any>(`/cattle/${cattleId}/events`, event)
  }

  // 批量导入牛只
  async batchImportCattle(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    return this.post<any>('/cattle/batch/import', formData)
  }

  // 导出牛只数据
  async exportCattle(params?: any): Promise<void> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    window.open(`/api/v1/cattle/cattle/batch/export${queryString}`)
  }

  // 生成耳标
  async generateEarTags(data: { prefix: string; count: number; startNumber?: number }): Promise<ApiResponse<any>> {
    return this.post<any>('/cattle/batch/generate-tags', data)
  }

  // 批量转移牛只
  async batchTransferCattle(data: { cattle_ids: number[]; from_barn_id?: number; to_barn_id?: number; reason?: string }): Promise<ApiResponse<any>> {
    return this.post<any>('/cattle/batch/transfer', data)
  }
}

// 健康服务API
export class HealthServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.HEALTH)
  }

  // 获取健康记录
  async getHealthRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/records', params)
  }

  // 创建健康记录
  async createHealthRecord(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/records', data)
  }

  // 获取疫苗记录
  async getVaccineRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/vaccines', params)
  }

  // 创建疫苗记录
  async createVaccineRecord(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/vaccines', data)
  }

  // 获取疾病记录
  async getDiseaseRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/diseases', params)
  }

  // 创建疾病记录
  async createDiseaseRecord(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/diseases', data)
  }

  // 获取健康统计
  async getHealthStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}

// 饲养服务API
export class FeedingServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.FEEDING)
  }

  // 获取饲养计划
  async getFeedingPlans(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/plans', params)
  }

  // 创建饲养计划
  async createFeedingPlan(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/plans', data)
  }

  // 获取饲料配方
  async getFeedFormulas(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/formulas', params)
  }

  // 创建饲料配方
  async createFeedFormula(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/formulas', data)
  }

  // 获取喂养记录
  async getFeedingRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/records', params)
  }

  // 创建喂养记录
  async createFeedingRecord(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/records', data)
  }

  // 获取饲养统计
  async getFeedingStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}

// 设备服务API
export class EquipmentServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.EQUIPMENT)
  }

  // 获取设备列表
  async getEquipment(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/equipment', params)
  }

  // 创建设备
  async createEquipment(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/equipment', data)
  }

  // 获取维护记录
  async getMaintenanceRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/maintenance', params)
  }

  // 创建维护记录
  async createMaintenanceRecord(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/maintenance', data)
  }

  // 获取设备统计
  async getEquipmentStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}

// 物料服务API
export class MaterialServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.MATERIAL)
  }

  // 获取物料列表
  async getMaterials(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/materials', params)
  }

  // 创建物料
  async createMaterial(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/materials', data)
  }

  // 获取库存信息
  async getInventory(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/inventory', params)
  }

  // 获取交易记录
  async getTransactions(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/transactions', params)
  }

  // 创建交易记录
  async createTransaction(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/transactions', data)
  }

  // 获取预警信息
  async getAlerts(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/alerts', params)
  }

  // 解决预警
  async resolveAlert(alertId: number): Promise<ApiResponse<any>> {
    return this.post<any>(`/alerts/${alertId}/resolve`)
  }

  // 获取物料统计
  async getMaterialStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}

// 采购服务API
export class ProcurementServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.PROCUREMENT)
  }

  // 获取采购订单
  async getPurchaseOrders(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/orders', params)
  }

  // 创建采购订单
  async createPurchaseOrder(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/orders', data)
  }

  // 获取供应商列表
  async getSuppliers(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/suppliers', params)
  }

  // 创建供应商
  async createSupplier(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/suppliers', data)
  }

  // 获取采购统计
  async getProcurementStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}

// 销售服务API
export class SalesServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.SALES)
  }

  // 获取销售订单
  async getSalesOrders(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/orders', params)
  }

  // 创建销售订单
  async createSalesOrder(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/orders', data)
  }

  // 获取客户列表
  async getCustomers(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/customers', params)
  }

  // 创建客户
  async createCustomer(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/customers', data)
  }

  // 获取销售统计
  async getSalesStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}

// 通知服务API
export class NotificationServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.NOTIFICATION)
  }

  // 获取通知列表
  async getNotifications(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/notifications', params)
  }

  // 标记通知为已读
  async markAsRead(id: number): Promise<ApiResponse<any>> {
    return this.put<any>(`/notifications/${id}/read`)
  }

  // 批量标记为已读
  async markAllAsRead(): Promise<ApiResponse<any>> {
    return this.put<any>('/notifications/read-all')
  }

  // 发送通知
  async sendNotification(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/notifications', data)
  }
}

// 文件服务API
export class FileServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.FILE)
  }

  // 上传文件
  async uploadFile(file: File, category?: string, onProgress?: (progress: number) => void): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    if (category) {
      formData.append('category', category)
    }
    return this.post<any>('/upload', formData)
  }

  // 批量上传文件
  async uploadFiles(files: File[], category?: string, onProgress?: (progress: number) => void): Promise<ApiResponse<any[]>> {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    if (category) {
      formData.append('category', category)
    }
    return this.post<any[]>('/upload/batch', formData)
  }

  // 获取文件列表
  async getFiles(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/files', params)
  }

  // 删除文件
  async deleteFile(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/files/${id}`)
  }

  // 下载文件
  async downloadFile(id: number, filename?: string): Promise<void> {
    window.open(`/api/v1/file/files/${id}/download`)
  }
}

// 监控服务API
export class MonitoringServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.MONITORING)
  }

  // 获取系统指标
  async getSystemMetrics(): Promise<ApiResponse<any>> {
    return this.get<any>('/metrics/system')
  }

  // 获取业务指标
  async getBusinessMetrics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get<any>('/metrics/business', params)
  }

  // 获取服务健康状态
  async getServiceHealth(): Promise<ApiResponse<any>> {
    return this.get<any>('/health/services')
  }

  // 获取日志
  async getLogs(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/logs', params)
  }
}

// 新闻服务API
export class NewsServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.NEWS)
  }

  // 获取新闻分类列表
  async getNewsCategories(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/categories', params)
  }

  // 创建新闻分类
  async createNewsCategory(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/categories', data)
  }

  // 更新新闻分类
  async updateNewsCategory(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/categories/${id}`, data)
  }

  // 删除新闻分类
  async deleteNewsCategory(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/categories/${id}`)
  }

  // 获取新闻文章列表
  async getNewsArticles(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/articles', params)
  }

  // 获取新闻文章详情
  async getNewsArticleById(id: number): Promise<ApiResponse<any>> {
    return this.get<any>(`/articles/${id}`)
  }

  // 创建新闻文章
  async createNewsArticle(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/articles', data)
  }

  // 更新新闻文章
  async updateNewsArticle(id: number, data: any): Promise<ApiResponse<any>> {
    return this.put<any>(`/articles/${id}`, data)
  }

  // 删除新闻文章
  async deleteNewsArticle(id: number): Promise<ApiResponse<any>> {
    return this.delete<any>(`/articles/${id}`)
  }

  // 发布新闻文章
  async publishNewsArticle(id: number, publishTime?: string): Promise<ApiResponse<any>> {
    return this.post<any>(`/articles/${id}/publish`, { publishTime })
  }

  // 搜索新闻文章
  async searchNewsArticles(params: { keyword: string; page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/articles/search', params)
  }

  // 增加新闻浏览量
  async incrementViewCount(id: number): Promise<ApiResponse<any>> {
    return this.post<any>(`/articles/${id}/view`)
  }
}

// 创建微服务API实例
export const authServiceApi = new AuthServiceApi()
export const baseServiceApi = new BaseServiceApi()
export const cattleServiceApi = new CattleServiceApi()
export const healthServiceApi = new HealthServiceApi()
export const feedingServiceApi = new FeedingServiceApi()
export const equipmentServiceApi = new EquipmentServiceApi()
export const materialServiceApi = new MaterialServiceApi()
export const procurementServiceApi = new ProcurementServiceApi()
export const salesServiceApi = new SalesServiceApi()
export const notificationServiceApi = new NotificationServiceApi()
export const fileServiceApi = new FileServiceApi()
export const monitoringServiceApi = new MonitoringServiceApi()
export const newsServiceApi = new NewsServiceApi()

// 导出所有微服务API
export const microserviceApis = {
  auth: authServiceApi,
  base: baseServiceApi,
  cattle: cattleServiceApi,
  health: healthServiceApi,
  feeding: feedingServiceApi,
  equipment: equipmentServiceApi,
  material: materialServiceApi,
  procurement: procurementServiceApi,
  sales: salesServiceApi,
  notification: notificationServiceApi,
  file: fileServiceApi,
  monitoring: monitoringServiceApi,
  news: newsServiceApi
}

export default microserviceApis