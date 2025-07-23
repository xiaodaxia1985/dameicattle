// 牛只管理API
import { apiService } from '../request'

export const cattleApi = {
  getCattleList: (params) => apiService.get('/cattle', params),
  getCattleById: (id) => apiService.get(`/cattle/${id}`),
  getCattleByEarTag: (earTag) => apiService.get(`/cattle/ear-tag/${earTag}`),
  createCattle: (data) => apiService.post('/cattle', data),
  updateCattle: (id, data) => apiService.put(`/cattle/${id}`, data),
  deleteCattle: (id) => apiService.delete(`/cattle/${id}`)
}

export default cattleApi