import request from './request'
import type { ApiResponse } from './request'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

export const authApi = {
  // User login
  login(data: LoginRequest): Promise<{ data: LoginResponse }> {
    return request.post<ApiResponse<LoginResponse>>('/auth/login', data)
      .then(response => ({ data: response.data.data }))
  },

  // User logout
  logout(): Promise<void> {
    return request.post('/auth/logout')
  },

  // Refresh token
  refreshToken(): Promise<{ data: { token: string } }> {
    return request.post<ApiResponse<{ token: string }>>('/auth/refresh')
      .then(response => ({ data: response.data.data }))
  },

  // Get user profile
  getProfile(): Promise<{ data: { user: User; permissions: string[] } }> {
    return request.get<ApiResponse<{ user: User; permissions: string[] }>>('/users/profile/me')
      .then(response => ({ data: response.data.data }))
  },

  // Update user profile
  updateProfile(data: Partial<User>): Promise<{ data: { user: User } }> {
    return request.put<ApiResponse<{ user: User }>>('/users/profile/me', data)
      .then(response => ({ data: response.data.data }))
  }
}