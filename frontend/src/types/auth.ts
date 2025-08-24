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
  base?: Base
  last_login_at?: string
  login_count?: number
}

export interface Role {
  id: number
  name: string
  description?: string
  permissions: string[]
  created_at: string
  updated_at: string
  user_count?: number
}

export interface Base {
  id: number
  name: string
  code: string
  address?: string
  manager_id?: number
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
  permissions: string[]
  expiresIn?: number
}

export interface RegisterRequest {
  username: string
  password: string
  real_name: string
  email?: string
  phone?: string
}

export interface Permission {
  key: string
  name: string
  description?: string
}

export interface PermissionGroup {
  name: string
  permissions: Permission[]
}