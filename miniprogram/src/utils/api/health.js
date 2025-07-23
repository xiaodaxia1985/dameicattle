// 健康管理API
import { apiService } from '../request'

export const healthApi = {
  // 获取健康统计
  getHealthStatistics: () => apiService.get('/health/statistics'),
  
  // 健康记录
  getHealthRecords: (params) => apiService.get('/health/records', params),
  getHealthRecordById: (id) => apiService.get(`/health/records/${id}`),
  createHealthRecord: (data) => apiService.post('/health/records', data),
  updateHealthRecord: (id, data) => apiService.put(`/health/records/${id}`, data),
  deleteHealthRecord: (id) => apiService.delete(`/health/records/${id}`),
  
  // 疫苗接种记录
  getVaccinationRecords: (params) => apiService.get('/health/vaccinations', params),
  getVaccinationRecordById: (id) => apiService.get(`/health/vaccinations/${id}`),
  createVaccinationRecord: (data) => apiService.post('/health/vaccinations', data),
  updateVaccinationRecord: (id, data) => apiService.put(`/health/vaccinations/${id}`, data),
  deleteVaccinationRecord: (id) => apiService.delete(`/health/vaccinations/${id}`),
  
  // 健康预警
  getHealthAlerts: (params) => apiService.get('/health/alerts', params),
  getHealthAlertById: (id) => apiService.get(`/health/alerts/${id}`),
  markAlertAsRead: (id) => apiService.put(`/health/alerts/${id}/read`),
  
  // 牛只健康档案
  getCattleHealthProfile: (cattleId) => apiService.get(`/health/cattle/${cattleId}/profile`),
  getCattleHealthHistory: (cattleId, params) => apiService.get(`/health/cattle/${cattleId}/history`, params)
}

export default healthApi