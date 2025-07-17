import request from './request'
import type { ApiResponse } from './request'

export const equipmentApi = {
  // 获取设备列表
  getEquipment(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取维护记录
  getMaintenanceRecords(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/equipment/maintenance-records', { params })
      .then(response => ({ data: response.data.data }))
  }
}