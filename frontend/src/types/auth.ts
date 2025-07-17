export interface User {
  id: number
  username: string
  real_name: string
  email?: string
  phone?: string
  role_id?: number
  base_id?: number
  status: 'active' | 'inactive' | 'locked'
  created_at: string
  updated_at: string
  role?: Role
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions: string[]
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  permissions: string[]
}

export interface RegisterRequest {
  username: string
  password: string
  real_name: string
  email?: string
  phone?: string
}