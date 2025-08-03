import { authServiceApi } from './microservices'
import type { ApiResponse } from './request'
import type { User, Role } from '@/types/auth'

export interface UserListParams {
  page?: number
  limit?: number
  keyword?: string
  status?: string
  role_id?: number
  base_id?: number
}

export interface UserListResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

export interface CreateUserRequest {
  username: string
  password: string
  real_name: string
  email?: string
  phone?: string
  role_id: number
  base_id?: number
  status?: 'active' | 'inactive'
}

export interface UpdateUserRequest {
  real_name?: string
  email?: string
  phone?: string
  role_id?: number
  base_id?: number
  status?: 'active' | 'inactive'
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface OperationLog {
  id: number
  user_id: number
  user_name: string
  action: string
  resource: string
  resource_id?: string
  ip_address: string
  user_agent: string
  created_at: string
  details?: any
}

export interface OperationLogParams {
  page?: number
  limit?: number
  user_id?: number
  action?: string
  resource?: string
  start_date?: string
  end_date?: string
}

export const userApi = {
  // 获取用户列表
  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    const response = await authServiceApi.get('/users', params)
    const responseData = response.data;
    return {
      data: responseData.users || [],
      total: responseData.pagination?.total || 0,
      page: responseData.pagination?.page || 1,
      limit: responseData.pagination?.limit || 20
    };
  },

  // 获取用户详情
  async getUser(id: number): Promise<User> {
    const response = await authServiceApi.getById('/users', id)
    return response.data
  },

  // 创建用户
  async createUser(data: CreateUserRequest): Promise<User> {
    const response = await authServiceApi.post('/users', data)
    return response.data
  },

  // 更新用户
  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    const response = await authServiceApi.update('/users', id, data)
    return response.data
  },

  // 删除用户
  async deleteUser(id: number): Promise<void> {
    await authServiceApi.remove('/users', id)
  },

  // 批量删除用户
  async batchDeleteUsers(ids: number[]): Promise<void> {
    await authServiceApi.delete('/users/batch', { ids })
  },

  // 重置用户密码
  async resetPassword(id: number, password: string): Promise<void> {
    await authServiceApi.put(`/users/${id}/reset-password`, { password })
  },

  // 修改密码
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await authServiceApi.put('/users/change-password', data)
  },

  // 锁定/解锁用户
  async toggleUserStatus(id: number, status: 'active' | 'inactive' | 'locked'): Promise<void> {
    await authServiceApi.put(`/users/${id}/status`, { status })
  },

  // 获取角色列表（用于下拉选择器）
  async getRoles(): Promise<Role[]> {
    const response = await authServiceApi.get('/roles')
    const responseData = response.data;
    // 如果后端返回的是 { roles: [...] } 格式
    if (responseData.roles) {
      return responseData.roles;
    }
    // 如果后端返回的是直接的数组格式
    if (Array.isArray(responseData)) {
      return responseData;
    }
    // 默认返回空数组
    return [];
  },

  // 获取角色列表（用于角色管理页面，支持分页）
  async getRolesList(params: { page?: number; limit?: number; keyword?: string } = {}): Promise<{ data: Role[]; total: number; page: number; limit: number }> {
    const response = await authServiceApi.get('/roles', params)
    const responseData = response.data;
    return {
      data: responseData.roles || [],
      total: responseData.pagination?.total || 0,
      page: responseData.pagination?.page || 1,
      limit: responseData.pagination?.limit || 20
    };
  },

  // 创建角色
  async createRole(data: { name: string; description?: string; permissions: string[] }): Promise<Role> {
    const response = await authServiceApi.post('/roles', data)
    return response.data
  },

  // 更新角色
  async updateRole(id: number, data: { name?: string; description?: string; permissions?: string[] }): Promise<Role> {
    const response = await authServiceApi.update('/roles', id, data)
    return response.data
  },

  // 删除角色
  async deleteRole(id: number): Promise<void> {
    await authServiceApi.remove('/roles', id)
  },

  // 获取权限列表
  async getPermissions(): Promise<{ [key: string]: string[] }> {
    const response = await authServiceApi.get('/permissions')
    return response.data
  },

  // 获取操作日志
  async getOperationLogs(params: OperationLogParams = {}): Promise<{ data: OperationLog[]; total: number; page: number; limit: number }> {
    const response = await authServiceApi.get('/operation-logs', params)
    const responseData = response.data;
    // 转换后端数据结构到前端期望的格式
    const logs = (responseData.logs || []).map((log: any) => ({
      id: log.id || Math.random(), // 如果没有id，生成一个临时id
      user_id: log.user_id,
      user_name: log.username || '未知用户',
      action: log.operation || log.action, // 兼容两种字段名
      resource: log.resource,
      resource_id: log.resource_id,
      ip_address: log.ip_address,
      user_agent: log.user_agent || '',
      created_at: log.timestamp || log.created_at,
      details: log.request_body || log.details
    }));
    
    return {
      data: logs,
      total: responseData.pagination?.total || responseData.total || 0,
      page: responseData.pagination?.page || responseData.page || 1,
      limit: responseData.pagination?.limit || responseData.limit || 20
    };
  }
}