// 用户管理API
import { apiService } from '../request'

export const userApi = {
  getUserList: (params) => apiService.get('/users', params),
  getUserById: (id) => apiService.get(`/users/${id}`),
  getUserProfile: () => apiService.get('/users/profile'),
  updateUserProfile: (data) => apiService.put('/users/profile', data)
}

export default userApi