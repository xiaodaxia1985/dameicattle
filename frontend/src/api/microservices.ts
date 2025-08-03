/**
 * 微服务API适配层
 * 统一管理所有微服务的API调用
 */

import apiClient from './request'
import type { ApiResponse } from './request'
import { UnifiedApiClient } from '@/utils/apiClient'

// 创建一个专用的认证API客户端，不使用baseURL前缀
const authApiClient = new UnifiedApiClient({
  baseURL: '', // 空的baseURL，避免路径重复
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true
})

// 微服务路由映射 - 直接通过API网关访问
export const MICROSERVICE_ROUTES = {
  // 认证服务
  AUTH: '/api/v1/auth',
  // 基地服务  
  BASE: '/api/v1/base',
  // 牛只服务
  CATTLE: '/api/v1/cattle',
  // 健康服务
  HEALTH: '/api/v1/health',
  // 饲养服务
  FEEDING: '/api/v1/feeding',
  // 设备服务
  EQUIPMENT: '/api/v1/equipment',
  // 采购服务
  PROCUREMENT: '/api/v1/procurement',
  // 销售服务
  SALES: '/api/v1/sales',
  // 物料服务
  MATERIAL: '/api/v1/material',
  // 通知服务
  NOTIFICATION: '/api/v1/notification',
  // 文件服务
  FILE: '/api/v1/file',
  // 监控服务
  MONITORING: '/api/v1/monitoring',
  // 新闻服务
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
    return apiClient.get<T>(this.buildUrl(path), params)
  }

  async post<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return apiClient.post<T>(this.buildUrl(path), data)
  }

  async put<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return apiClient.put<T>(this.buildUrl(path), data)
  }

  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    return apiClient.delete<T>(this.buildUrl(path))
  }

  async patch<T = any>(path: string, data?: any): Promise<ApiResponse<T>> {
    return apiClient.patch<T>(this.buildUrl(path), data)
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
    return apiClient.upload<T>(this.buildUrl(path), formData, onProgress)
  }

  // 文件下载
  async download(path: string, filename?: string): Promise<void> {
    return apiClient.download(this.buildUrl(path), filename)
  }

  // 健康检查
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health')
  }
}

// 认证服务API
export class AuthServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.AUTH)
  }

  // 用户登录
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    // 使用专用的认证API客户端，避免baseURL重复
    return authApiClient.post<{ token: string; user: any }>('/api/v1/auth/login', credentials)
  }

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    return authApiClient.post<void>('/api/v1/auth/logout')
  }

  // 刷新token
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return authApiClient.post<{ token: string }>('/api/v1/auth/refresh')
  }

  // 获取用户信息
  async getProfile(): Promise<ApiResponse<{ user: any; permissions: string[] }>> {
    return authApiClient.get<{ user: any; permissions: string[] }>('/api/v1/auth/verify')
  }

  // 更新用户信息
  async updateProfile(data: any): Promise<ApiResponse<any>> {
    return authApiClient.put<any>('/api/v1/auth/profile', data)
  }
}

// 基地服务API
export class BaseServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.BASE)
  }

  // 获取基地列表
  async getBases(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/bases', params)
  }

  // 获取基地详情
  async getBase(id: number): Promise<ApiResponse<any>> {
    return this.getById('/bases', id)
  }

  // 创建基地
  async createBase(data: any): Promise<ApiResponse<any>> {
    return this.create('/bases', data)
  }

  // 更新基地
  async updateBase(id: number, data: any): Promise<ApiResponse<any>> {
    return this.update('/bases', id, data)
  }

  // 删除基地
  async deleteBase(id: number): Promise<ApiResponse<any>> {
    return this.remove('/bases', id)
  }

  // 获取牛舍列表
  async getBarns(baseId?: number, params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = baseId ? { baseId, ...params } : params
    return this.getList('/barns', queryParams)
  }

  // 获取牛舍详情
  async getBarn(id: number): Promise<ApiResponse<any>> {
    return this.getById('/barns', id)
  }

  // 创建牛舍
  async createBarn(data: any): Promise<ApiResponse<any>> {
    return this.create('/barns', data)
  }

  // 更新牛舍
  async updateBarn(id: number, data: any): Promise<ApiResponse<any>> {
    return this.update('/barns', id, data)
  }

  // 删除牛舍
  async deleteBarn(id: number): Promise<ApiResponse<any>> {
    return this.remove('/barns', id)
  }
}

// 牛只服务API
export class CattleServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.CATTLE)
  }

  // 获取牛只列表
  async getCattleList(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/cattle', params)
  }

  // 获取牛只详情
  async getCattle(id: number): Promise<ApiResponse<any>> {
    return this.getById('/cattle', id)
  }

  // 通过耳标获取牛只
  async getCattleByEarTag(earTag: string): Promise<ApiResponse<any>> {
    return this.get(`/cattle/scan/${earTag}`)
  }

  // 创建牛只
  async createCattle(data: any): Promise<ApiResponse<any>> {
    return this.create('/cattle', data)
  }

  // 更新牛只
  async updateCattle(id: number, data: any): Promise<ApiResponse<any>> {
    return this.update('/cattle', id, data)
  }

  // 删除牛只
  async deleteCattle(id: number): Promise<ApiResponse<any>> {
    return this.remove('/cattle', id)
  }

  // 获取牛只统计
  async getCattleStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/cattle/statistics', params)
  }

  // 获取牛只事件
  async getCattleEvents(cattleId: number, params?: any): Promise<ApiResponse<any[]>> {
    return this.getList(`/cattle/${cattleId}/events`, params)
  }

  // 添加牛只事件
  async addCattleEvent(cattleId: number, event: any): Promise<ApiResponse<any>> {
    return this.post(`/cattle/${cattleId}/events`, event)
  }

  // 批量导入牛只
  async batchImportCattle(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData()
    formData.append('file', file)
    return this.upload('/cattle/batch/import', formData)
  }

  // 导出牛只数据
  async exportCattle(params?: any): Promise<void> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : ''
    return this.download(`/cattle/batch/export${queryString}`, 'cattle_export.xlsx')
  }

  // 生成耳标
  async generateEarTags(data: { prefix: string; count: number; startNumber?: number }): Promise<ApiResponse<any>> {
    return this.post('/cattle/batch/generate-tags', data)
  }

  // 批量转移牛只
  async batchTransferCattle(data: { cattle_ids: number[]; from_barn_id?: number; to_barn_id?: number; reason?: string }): Promise<ApiResponse<any>> {
    return this.post('/cattle/batch/transfer', data)
  }
}

// 健康服务API
export class HealthServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.HEALTH)
  }

  // 获取健康记录
  async getHealthRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/records', params)
  }

  // 创建健康记录
  async createHealthRecord(data: any): Promise<ApiResponse<any>> {
    return this.create('/records', data)
  }

  // 获取疫苗记录
  async getVaccineRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/vaccines', params)
  }

  // 创建疫苗记录
  async createVaccineRecord(data: any): Promise<ApiResponse<any>> {
    return this.create('/vaccines', data)
  }

  // 获取疾病记录
  async getDiseaseRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/diseases', params)
  }

  // 创建疾病记录
  async createDiseaseRecord(data: any): Promise<ApiResponse<any>> {
    return this.create('/diseases', data)
  }

  // 获取健康统计
  async getHealthStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }
}

// 饲养服务API
export class FeedingServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.FEEDING)
  }

  // 获取饲养计划
  async getFeedingPlans(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/plans', params)
  }

  // 创建饲养计划
  async createFeedingPlan(data: any): Promise<ApiResponse<any>> {
    return this.create('/plans', data)
  }

  // 获取饲料配方
  async getFeedFormulas(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/formulas', params)
  }

  // 创建饲料配方
  async createFeedFormula(data: any): Promise<ApiResponse<any>> {
    return this.create('/formulas', data)
  }

  // 获取喂养记录
  async getFeedingRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/records', params)
  }

  // 创建喂养记录
  async createFeedingRecord(data: any): Promise<ApiResponse<any>> {
    return this.create('/records', data)
  }

  // 获取饲养统计
  async getFeedingStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }
}

// 设备服务API
export class EquipmentServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.EQUIPMENT)
  }

  // 获取设备列表
  async getEquipment(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/equipment', params)
  }

  // 创建设备
  async createEquipment(data: any): Promise<ApiResponse<any>> {
    return this.create('/equipment', data)
  }

  // 获取维护记录
  async getMaintenanceRecords(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/maintenance', params)
  }

  // 创建维护记录
  async createMaintenanceRecord(data: any): Promise<ApiResponse<any>> {
    return this.create('/maintenance', data)
  }

  // 获取设备统计
  async getEquipmentStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }
}

// 物料服务API
export class MaterialServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.MATERIAL)
  }

  // 获取物料列表
  async getMaterials(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/materials', params)
  }

  // 创建物料
  async createMaterial(data: any): Promise<ApiResponse<any>> {
    return this.create('/materials', data)
  }

  // 获取库存信息
  async getInventory(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/inventory', params)
  }

  // 获取交易记录
  async getTransactions(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/transactions', params)
  }

  // 创建交易记录
  async createTransaction(data: any): Promise<ApiResponse<any>> {
    return this.create('/transactions', data)
  }

  // 获取预警信息
  async getAlerts(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/alerts', params)
  }

  // 解决预警
  async resolveAlert(alertId: number): Promise<ApiResponse<any>> {
    return this.post(`/alerts/${alertId}/resolve`)
  }

  // 获取物料统计
  async getMaterialStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }
}

// 采购服务API
export class ProcurementServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.PROCUREMENT)
  }

  // 获取采购订单
  async getPurchaseOrders(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/orders', params)
  }

  // 创建采购订单
  async createPurchaseOrder(data: any): Promise<ApiResponse<any>> {
    return this.create('/orders', data)
  }

  // 获取供应商列表
  async getSuppliers(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/suppliers', params)
  }

  // 创建供应商
  async createSupplier(data: any): Promise<ApiResponse<any>> {
    return this.create('/suppliers', data)
  }

  // 获取采购统计
  async getProcurementStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }
}

// 销售服务API
export class SalesServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.SALES)
  }

  // 获取销售订单
  async getSalesOrders(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/orders', params)
  }

  // 创建销售订单
  async createSalesOrder(data: any): Promise<ApiResponse<any>> {
    return this.create('/orders', data)
  }

  // 获取客户列表
  async getCustomers(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/customers', params)
  }

  // 创建客户
  async createCustomer(data: any): Promise<ApiResponse<any>> {
    return this.create('/customers', data)
  }

  // 获取销售统计
  async getSalesStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }
}

// 通知服务API
export class NotificationServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.NOTIFICATION)
  }

  // 获取通知列表
  async getNotifications(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/notifications', params)
  }

  // 标记通知为已读
  async markAsRead(id: number): Promise<ApiResponse<any>> {
    return this.put(`/notifications/${id}/read`)
  }

  // 批量标记为已读
  async markAllAsRead(): Promise<ApiResponse<any>> {
    return this.put('/notifications/read-all')
  }

  // 发送通知
  async sendNotification(data: any): Promise<ApiResponse<any>> {
    return this.create('/notifications', data)
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
    return this.upload('/upload', formData, onProgress)
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
    return this.upload('/upload/batch', formData, onProgress)
  }

  // 获取文件列表
  async getFiles(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/files', params)
  }

  // 删除文件
  async deleteFile(id: number): Promise<ApiResponse<any>> {
    return this.remove('/files', id)
  }

  // 下载文件
  async downloadFile(id: number, filename?: string): Promise<void> {
    return this.download(`/files/${id}/download`, filename)
  }
}

// 监控服务API
export class MonitoringServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.MONITORING)
  }

  // 获取系统指标
  async getSystemMetrics(): Promise<ApiResponse<any>> {
    return this.get('/metrics/system')
  }

  // 获取业务指标
  async getBusinessMetrics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { baseId } : undefined
    return this.get('/metrics/business', params)
  }

  // 获取服务健康状态
  async getServiceHealth(): Promise<ApiResponse<any>> {
    return this.get('/health/services')
  }

  // 获取日志
  async getLogs(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/logs', params)
  }
}

// 新闻服务API
export class NewsServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.NEWS)
  }

  // 获取新闻分类列表
  async getNewsCategories(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/categories', params)
  }

  // 创建新闻分类
  async createNewsCategory(data: any): Promise<ApiResponse<any>> {
    return this.create('/categories', data)
  }

  // 更新新闻分类
  async updateNewsCategory(id: number, data: any): Promise<ApiResponse<any>> {
    return this.update('/categories', id, data)
  }

  // 删除新闻分类
  async deleteNewsCategory(id: number): Promise<ApiResponse<any>> {
    return this.remove('/categories', id)
  }

  // 获取新闻文章列表
  async getNewsArticles(params?: any): Promise<ApiResponse<any[]>> {
    return this.getList('/articles', params)
  }

  // 获取新闻文章详情
  async getNewsArticleById(id: number): Promise<ApiResponse<any>> {
    return this.getById('/articles', id)
  }

  // 创建新闻文章
  async createNewsArticle(data: any): Promise<ApiResponse<any>> {
    return this.create('/articles', data)
  }

  // 更新新闻文章
  async updateNewsArticle(id: number, data: any): Promise<ApiResponse<any>> {
    return this.update('/articles', id, data)
  }

  // 删除新闻文章
  async deleteNewsArticle(id: number): Promise<ApiResponse<any>> {
    return this.remove('/articles', id)
  }

  // 发布新闻文章
  async publishNewsArticle(id: number, publishTime?: string): Promise<ApiResponse<any>> {
    return this.post(`/articles/${id}/publish`, { publishTime })
  }

  // 搜索新闻文章
  async searchNewsArticles(params: { keyword: string; page?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    return this.get('/articles/search', params)
  }

  // 增加新闻浏览量
  async incrementViewCount(id: number): Promise<ApiResponse<any>> {
    return this.post(`/articles/${id}/view`)
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