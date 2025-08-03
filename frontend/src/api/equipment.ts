import { equipmentServiceApi } from './microservices'
import type { ApiResponse } from './request'

export const equipmentApi = {
  // 设备分类
  async getCategories(): Promise<{ data: any }> {
    const response = await equipmentServiceApi.get('/categories')
    return { data: response.data }
  },

  async createCategory(data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.post('/categories', data)
    return { data: response.data }
  },

  async updateCategory(id: number, data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.update('/categories', id, data)
    return { data: response.data }
  },

  async deleteCategory(id: number): Promise<{ data: any }> {
    const response = await equipmentServiceApi.remove('/categories', id)
    return { data: response.data }
  },

  // 生产设备
  async getEquipment(params: any = {}): Promise<{ data: any }> {
    const response = await equipmentServiceApi.getEquipment(params)
    return { data: response.data }
  },

  async getEquipmentById(id: number): Promise<{ data: any }> {
    const response = await equipmentServiceApi.getById('/equipment', id)
    return { data: response.data }
  },

  async createEquipment(data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.createEquipment(data)
    return { data: response.data }
  },

  async updateEquipment(id: number, data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.update('/equipment', id, data)
    return { data: response.data }
  },

  async deleteEquipment(id: number): Promise<{ data: any }> {
    const response = await equipmentServiceApi.remove('/equipment', id)
    return { data: response.data }
  },

  async updateEquipmentStatus(id: number, status: string): Promise<{ data: any }> {
    const response = await equipmentServiceApi.patch(`/equipment/${id}/status`, { status })
    return { data: response.data }
  },

  async getEquipmentStatistics(params: any = {}): Promise<{ data: any }> {
    const response = await equipmentServiceApi.getEquipmentStatistics(params.baseId)
    return { data: response.data }
  },

  // 维护计划
  async getMaintenancePlans(params: any = {}): Promise<{ data: any }> {
    const response = await equipmentServiceApi.get('/maintenance-plans', params)
    return { data: response.data }
  },

  async createMaintenancePlan(data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.post('/maintenance-plans', data)
    return { data: response.data }
  },

  async updateMaintenancePlan(id: number, data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.update('/maintenance-plans', id, data)
    return { data: response.data }
  },

  async deleteMaintenancePlan(id: number): Promise<{ data: any }> {
    const response = await equipmentServiceApi.remove('/maintenance-plans', id)
    return { data: response.data }
  },

  // 维护记录
  async getMaintenanceRecords(params: any = {}): Promise<{ data: any }> {
    const response = await equipmentServiceApi.getMaintenanceRecords(params)
    return { data: response.data }
  },

  async createMaintenanceRecord(data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.createMaintenanceRecord(data)
    return { data: response.data }
  },

  async updateMaintenanceRecord(id: number, data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.update('/maintenance', id, data)
    return { data: response.data }
  },

  // 设备故障
  async getFailures(params: any = {}): Promise<{ data: any }> {
    const response = await equipmentServiceApi.get('/failures', params)
    return { data: response.data }
  },

  async reportFailure(data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.post('/failures', data)
    return { data: response.data }
  },

  async updateFailureStatus(id: number, data: any): Promise<{ data: any }> {
    const response = await equipmentServiceApi.patch(`/failures/${id}/status`, data)
    return { data: response.data }
  },

  // 设备效率分析
  async getEquipmentEfficiency(id: number, params: any = {}): Promise<{ data: any }> {
    const response = await equipmentServiceApi.get(`/equipment/${id}/efficiency`, params)
    return { data: response.data }
  },
}