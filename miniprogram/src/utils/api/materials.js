// 物资管理API
import { apiService } from '../request'

export const materialsApi = {
  getMaterials: (params) => apiService.get('/materials', params),
  getMaterialById: (id) => apiService.get(`/materials/${id}`),
  createMaterial: (data) => apiService.post('/materials', data),
  updateMaterial: (id, data) => apiService.put(`/materials/${id}`, data),
  deleteMaterial: (id) => apiService.delete(`/materials/${id}`),
  
  // 库存管理
  getInventory: (params) => apiService.get('/inventory', params),
  getInventoryByMaterial: (materialId, baseId) => apiService.get(`/inventory/material/${materialId}`, { baseId }),
  createInbound: (data) => apiService.post('/inventory/inbound', data),
  createOutbound: (data) => apiService.post('/inventory/outbound', data),
  
  // 库存预警
  getInventoryAlerts: (params) => apiService.get('/inventory/alerts', params),
  
  // 库存盘点
  createStocktaking: (data) => apiService.post('/inventory/stocktaking', data),
  getStocktakingRecords: (params) => apiService.get('/inventory/stocktaking', params)
}

export default materialsApi