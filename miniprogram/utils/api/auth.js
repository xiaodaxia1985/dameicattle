// 认证API
import { apiService } from '../request'

export const authApi = {
  login: (data) => apiService.post('/auth/login', data),
  logout: () => apiService.post('/auth/logout'),
  refreshToken: () => apiService.post('/auth/refresh'),
  wxLogin: (data) => apiService.post('/auth/wx-login', data)
}

export default authApi