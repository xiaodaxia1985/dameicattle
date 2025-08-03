/**
 * 小程序微服务API适配层
 * 统一管理所有微服务的API调用
 */

import { api } from '@/utils/apiClient'

// 微服务路由映射
export const MICROSERVICE_ROUTES = {
  // 认证服务
  AUTH: '/auth',
  // 基地服务  
  BASE: '/base',
  // 牛只服务
  CATTLE: '/cattle', 
  // 健康服务
  HEALTH: '/health',
  // 饲养服务
  FEEDING: '/feeding',
  // 设备服务
  EQUIPMENT: '/equipment',
  // 采购服务
  PROCUREMENT: '/procurement',
  // 销售服务
  SALES: '/sales',
  // 物料服务
  MATERIAL: '/material',
  // 通知服务
  NOTIFICATION: '/notification',
  // 文件服务
  FILE: '/file',
  // 监控服务
  MONITORING: '/monitoring'
}

// 微服务API基类
class MicroserviceApi {
  constructor(servicePath) {
    this.servicePath = servicePath
  }

  buildUrl(path) {
    return `${this.servicePath}${path.startsWith('/') ? path : `/${path}`}`
  }

  // 通用CRUD操作
  async get(path, params) {
    return api.get(this.buildUrl(path), params)
  }

  async post(path, data) {
    return api.post(this.buildUrl(path), data)
  }

  async put(path, data) {
    return api.put(this.buildUrl(path), data)
  }

  async delete(path, data) {
    return api.delete(this.buildUrl(path), data)
  }

  async patch(path, data) {
    return api.patch(this.buildUrl(path), data)
  }

  // 分页查询
  async getList(path, params = {}) {
    return this.get(path, params)
  }

  // 获取详情
  async getById(path, id) {
    return this.get(`${path}/${id}`)
  }

  // 创建资源
  async create(path, data) {
    return this.post(path, data)
  }

  // 更新资源
  async update(path, id, data) {
    return this.put(`${path}/${id}`, data)
  }

  // 删除资源
  async remove(path, id) {
    return this.delete(`${path}/${id}`)
  }

  // 批量操作
  async batchCreate(path, data) {
    return this.post(`${path}/batch`, data)
  }

  async batchUpdate(path, data) {
    return this.put(`${path}/batch`, data)
  }

  async batchDelete(path, ids) {
    return this.delete(`${path}/batch?ids=${ids.join(',')}`)
  }

  // 文件上传
  async upload(path, filePath, formData, onProgress) {
    return api.upload(this.buildUrl(path), filePath, formData, onProgress)
  }

  // 健康检查
  async healthCheck() {
    return this.get('/health')
  }
}

// 认证服务API
export class AuthServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.AUTH)
  }

  // 用户登录
  async login(credentials) {
    return this.post('/login', credentials)
  }

  // 用户登出
  async logout() {
    return this.post('/logout')
  }

  // 刷新token
  async refreshToken() {
    return this.post('/refresh')
  }

  // 获取用户信息
  async getProfile() {
    return this.get('/profile')
  }

  // 更新用户信息
  async updateProfile(data) {
    return this.put('/profile', data)
  }

  // 微信小程序登录
  async wxLogin(code) {
    return this.post('/wx/login', { code })
  }

  // 绑定手机号
  async bindPhone(data) {
    return this.post('/wx/bind-phone', data)
  }
}

// 基地服务API
export class BaseServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.BASE)
  }

  // 获取基地列表
  async getBases(params) {
    return this.getList('/bases', params)
  }

  // 获取基地详情
  async getBase(id) {
    return this.getById('/bases', id)
  }

  // 创建基地
  async createBase(data) {
    return this.create('/bases', data)
  }

  // 更新基地
  async updateBase(id, data) {
    return this.update('/bases', id, data)
  }

  // 删除基地
  async deleteBase(id) {
    return this.remove('/bases', id)
  }

  // 获取牛舍列表
  async getBarns(baseId, params) {
    const queryParams = baseId ? { baseId, ...params } : params
    return this.getList('/barns', queryParams)
  }

  // 获取牛舍详情
  async getBarn(id) {
    return this.getById('/barns', id)
  }

  // 创建牛舍
  async createBarn(data) {
    return this.create('/barns', data)
  }

  // 更新牛舍
  async updateBarn(id, data) {
    return this.update('/barns', id, data)
  }

  // 删除牛舍
  async deleteBarn(id) {
    return this.remove('/barns', id)
  }
}

// 牛只服务API
export class CattleServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.CATTLE)
  }

  // 获取牛只列表
  async getCattleList(params) {
    return this.getList('/cattle', params)
  }

  // 获取牛只详情
  async getCattle(id) {
    return this.getById('/cattle', id)
  }

  // 通过耳标获取牛只
  async getCattleByEarTag(earTag) {
    return this.get(`/cattle/scan/${earTag}`)
  }

  // 创建牛只
  async createCattle(data) {
    return this.create('/cattle', data)
  }

  // 更新牛只
  async updateCattle(id, data) {
    return this.update('/cattle', id, data)
  }

  // 删除牛只
  async deleteCattle(id) {
    return this.remove('/cattle', id)
  }

  // 获取牛只统计
  async getCattleStatistics(baseId) {
    const params = baseId ? { baseId } : undefined
    return this.get('/cattle/statistics', params)
  }

  // 获取牛只事件
  async getCattleEvents(cattleId, params) {
    return this.getList(`/cattle/${cattleId}/events`, params)
  }

  // 添加牛只事件
  async addCattleEvent(cattleId, event) {
    return this.post(`/cattle/${cattleId}/events`, event)
  }

  // 扫码获取牛只信息
  async scanCattle(earTag) {
    return this.getCattleByEarTag(earTag)
  }
}

// 健康服务API
export class HealthServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.HEALTH)
  }

  // 获取健康记录
  async getHealthRecords(params) {
    return this.getList('/records', params)
  }

  // 创建健康记录
  async createHealthRecord(data) {
    return this.create('/records', data)
  }

  // 获取疫苗记录
  async getVaccineRecords(params) {
    return this.getList('/vaccines', params)
  }

  // 创建疫苗记录
  async createVaccineRecord(data) {
    return this.create('/vaccines', data)
  }

  // 获取疾病记录
  async getDiseaseRecords(params) {
    return this.getList('/diseases', params)
  }

  // 创建疾病记录
  async createDiseaseRecord(data) {
    return this.create('/diseases', data)
  }

  // 获取健康统计
  async getHealthStatistics(baseId) {
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
  async getFeedingPlans(params) {
    return this.getList('/plans', params)
  }

  // 创建饲养计划
  async createFeedingPlan(data) {
    return this.create('/plans', data)
  }

  // 获取饲料配方
  async getFeedFormulas(params) {
    return this.getList('/formulas', params)
  }

  // 创建饲料配方
  async createFeedFormula(data) {
    return this.create('/formulas', data)
  }

  // 获取喂养记录
  async getFeedingRecords(params) {
    return this.getList('/records', params)
  }

  // 创建喂养记录
  async createFeedingRecord(data) {
    return this.create('/records', data)
  }

  // 获取饲养统计
  async getFeedingStatistics(baseId) {
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
  async getEquipment(params) {
    return this.getList('/equipment', params)
  }

  // 创建设备
  async createEquipment(data) {
    return this.create('/equipment', data)
  }

  // 获取维护记录
  async getMaintenanceRecords(params) {
    return this.getList('/maintenance', params)
  }

  // 创建维护记录
  async createMaintenanceRecord(data) {
    return this.create('/maintenance', data)
  }

  // 获取设备统计
  async getEquipmentStatistics(baseId) {
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
  async getMaterials(params) {
    return this.getList('/materials', params)
  }

  // 创建物料
  async createMaterial(data) {
    return this.create('/materials', data)
  }

  // 获取库存信息
  async getInventory(params) {
    return this.getList('/inventory', params)
  }

  // 获取交易记录
  async getTransactions(params) {
    return this.getList('/transactions', params)
  }

  // 创建交易记录
  async createTransaction(data) {
    return this.create('/transactions', data)
  }

  // 获取预警信息
  async getAlerts(params) {
    return this.getList('/alerts', params)
  }

  // 解决预警
  async resolveAlert(alertId) {
    return this.post(`/alerts/${alertId}/resolve`)
  }

  // 获取物料统计
  async getMaterialStatistics(baseId) {
    const params = baseId ? { baseId } : undefined
    return this.get('/statistics', params)
  }

  // 同步离线数据
  async syncOfflineData() {
    return this.post('/sync')
  }
}

// 采购服务API
export class ProcurementServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.PROCUREMENT)
  }

  // 获取采购订单
  async getPurchaseOrders(params) {
    return this.getList('/orders', params)
  }

  // 创建采购订单
  async createPurchaseOrder(data) {
    return this.create('/orders', data)
  }

  // 获取供应商列表
  async getSuppliers(params) {
    return this.getList('/suppliers', params)
  }

  // 创建供应商
  async createSupplier(data) {
    return this.create('/suppliers', data)
  }

  // 获取采购统计
  async getProcurementStatistics(baseId) {
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
  async getSalesOrders(params) {
    return this.getList('/orders', params)
  }

  // 创建销售订单
  async createSalesOrder(data) {
    return this.create('/orders', data)
  }

  // 获取客户列表
  async getCustomers(params) {
    return this.getList('/customers', params)
  }

  // 创建客户
  async createCustomer(data) {
    return this.create('/customers', data)
  }

  // 获取销售统计
  async getSalesStatistics(baseId) {
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
  async getNotifications(params) {
    return this.getList('/notifications', params)
  }

  // 标记通知为已读
  async markAsRead(id) {
    return this.put(`/notifications/${id}/read`)
  }

  // 批量标记为已读
  async markAllAsRead() {
    return this.put('/notifications/read-all')
  }

  // 发送通知
  async sendNotification(data) {
    return this.create('/notifications', data)
  }
}

// 文件服务API
export class FileServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.FILE)
  }

  // 上传文件
  async uploadFile(filePath, category, onProgress) {
    const formData = {}
    if (category) {
      formData.category = category
    }
    return this.upload('/upload', filePath, formData, onProgress)
  }

  // 获取文件列表
  async getFiles(params) {
    return this.getList('/files', params)
  }

  // 删除文件
  async deleteFile(id) {
    return this.remove('/files', id)
  }
}

// 监控服务API
export class MonitoringServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.MONITORING)
  }

  // 获取系统指标
  async getSystemMetrics() {
    return this.get('/metrics/system')
  }

  // 获取业务指标
  async getBusinessMetrics(baseId) {
    const params = baseId ? { baseId } : undefined
    return this.get('/metrics/business', params)
  }

  // 获取服务健康状态
  async getServiceHealth() {
    return this.get('/health/services')
  }

  // 获取日志
  async getLogs(params) {
    return this.getList('/logs', params)
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
  monitoring: monitoringServiceApi
}

export default microserviceApis