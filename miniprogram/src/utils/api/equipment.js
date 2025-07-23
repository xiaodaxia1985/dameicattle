// 设备管理API
import { apiService } from '../request'

export const equipmentApi = {
  getEquipment: (params) => apiService.get('/equipment', params),
  getEquipmentById: (id) => apiService.get(`/equipment/${id}`),
  createEquipment: (data) => apiService.post('/equipment', data),
  updateEquipment: (id, data) => apiService.put(`/equipment/${id}`, data),
  deleteEquipment: (id) => apiService.delete(`/equipment/${id}`),
  
  // 设备维护
  getMaintenancePlans: (equipmentId) => apiService.get(`/equipment/${equipmentId}/maintenance-plans`),
  createMaintenancePlan: (equipmentId, data) => apiService.post(`/equipment/${equipmentId}/maintenance-plans`, data),
  getMaintenanceRecords: (equipmentId, params) => apiService.get(`/equipment/${equipmentId}/maintenance-records`, params),
  createMaintenanceRecord: (equipmentId, data) => apiService.post(`/equipment/${equipmentId}/maintenance-records`, data),
  
  // 设备故障
  getFailures: (equipmentId, params) => apiService.get(`/equipment/${equipmentId}/failures`, params),
  reportFailure: (equipmentId, data) => apiService.post(`/equipment/${equipmentId}/failures`, data),
  updateFailure: (id, data) => apiService.put(`/equipment/failures/${id}`, data)
}

export default equipmentApi