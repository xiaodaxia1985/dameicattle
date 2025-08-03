import { authServiceApi } from './microservices'
import type { ApiResponse } from './request'
import type { LoginRequest, LoginResponse, User } from '@/types/auth'

export const authApi = {
  // User login
  async login(data: LoginRequest): Promise<{ data: LoginResponse }> {
    const response = await authServiceApi.login(data)
    return { data: response.data }
  },

  // User logout
  async logout(): Promise<void> {
    await authServiceApi.logout()
  },

  // Refresh token
  async refreshToken(): Promise<{ data: { token: string } }> {
    const response = await authServiceApi.refreshToken()
    return { data: response.data }
  },

  // Get user profile
  async getProfile(): Promise<{ data: { user: User; permissions: string[] } }> {
    const response = await authServiceApi.getProfile()
    return { data: response.data }
  },

  // Update user profile
  async updateProfile(data: Partial<User>): Promise<{ data: { user: User } }> {
    const response = await authServiceApi.updateProfile(data)
    return { data: response.data }
  }
}