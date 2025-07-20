import request from './request'
import type { ApiResponse } from './request'

export const equipmentApi = {
  // 设备分类
  getCategories(): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment/categories')
      .then(response => ({ data: response.data.data }))
  },

  createCategory(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/equipment/categories', data)
      .then(response => ({ data: response.data.data }))
  },

  updateCategory(id: number, data: any): Promise<{ data: any }> {
    return request.put<ApiResponse<any>>(`/equipment/categories/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  deleteCategory(id: number): Promise<{ data: any }> {
    return request.delete<ApiResponse<any>>(`/equipment/categories/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 生产设备
  getEquipment(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment', { params })
      .then(response => ({ data: response.data }))
  },

  getEquipmentById(id: number): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/equipment/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  createEquipment(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/equipment', data)
      .then(response => ({ data: response.data.data }))
  },

  updateEquipment(id: number, data: any): Promise<{ data: any }> {
    return request.put<ApiResponse<any>>(`/equipment/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  deleteEquipment(id: number): Promise<{ data: any }> {
    return request.delete<ApiResponse<any>>(`/equipment/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  updateEquipmentStatus(id: number, status: string): Promise<{ data: any }> {
    return request.patch<ApiResponse<any>>(`/equipment/${id}/status`, { status })
      .then(response => ({ data: response.data.data }))
  },

  getEquipmentStatistics(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment/statistics', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 维护计划
  getMaintenancePlans(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment/maintenance-plans', { params })
      .then(response => ({ data: response.data.data }))
  },

  createMaintenancePlan(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/equipment/maintenance-plans', data)
      .then(response => ({ data: response.data.data }))
  },

  updateMaintenancePlan(id: number, data: any): Promise<{ data: any }> {
    return request.put<ApiResponse<any>>(`/equipment/maintenance-plans/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  deleteMaintenancePlan(id: number): Promise<{ data: any }> {
    return request.delete<ApiResponse<any>>(`/equipment/maintenance-plans/${id}`)
      .then(response => ({ data: response.data.data }))
  },

  // 维护记录
  getMaintenanceRecords(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment/maintenance-records', { params })
      .then(response => ({ data: response.data.data }))
  },

  createMaintenanceRecord(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/equipment/maintenance-records', data)
      .then(response => ({ data: response.data.data }))
  },

  updateMaintenanceRecord(id: number, data: any): Promise<{ data: any }> {
    return request.put<ApiResponse<any>>(`/equipment/maintenance-records/${id}`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 设备故障
  getFailures(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment/failures', { params })
      .then(response => ({ data: response.data.data }))
  },

  reportFailure(data: any): Promise<{ data: any }> {
    return request.post<ApiResponse<any>>('/equipment/failures', data)
      .then(response => ({ data: response.data.data }))
  },

  updateFailureStatus(id: number, data: any): Promise<{ data: any }> {
    return request.patch<ApiResponse<any>>(`/equipment/failures/${id}/status`, data)
      .then(response => ({ data: response.data.data }))
  },

  // 设备效率分析
  getEquipmentEfficiency(id: number, params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/equipment/${id}/efficiency`, { params })
      .then(response => ({ data: response.data.data }))
  },
}