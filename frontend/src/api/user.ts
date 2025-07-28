import request from './request'
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
  getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    return request.get<ApiResponse<any>>('/users', { params })
      .then(response => {
        const responseData = response.data.data;
        return {
          data: responseData.users || [],
          total: responseData.pagination?.total || 0,
          page: responseData.pagination?.page || 1,
          limit: responseData.pagination?.limit || 20
        };
      })
  },

  // 获取用户详情
  getUser(id: number): Promise<User> {
    return request.get<ApiResponse<User>>(`/users/${id}`)
      .then(response => response.data.data)
  },

  // 创建用户
  createUser(data: CreateUserRequest): Promise<User> {
    return request.post<ApiResponse<User>>('/users', data)
      .then(response => response.data.data)
  },

  // 更新用户
  updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    return request.put<ApiResponse<User>>(`/users/${id}`, data)
      .then(response => response.data.data)
  },

  // 删除用户
  deleteUser(id: number): Promise<void> {
    return request.delete(`/users/${id}`)
  },

  // 批量删除用户
  batchDeleteUsers(ids: number[]): Promise<void> {
    return request.delete('/users/batch', { data: { ids } })
  },

  // 重置用户密码
  resetPassword(id: number, password: string): Promise<void> {
    return request.put(`/users/${id}/reset-password`, { password })
  },

  // 修改密码
  changePassword(data: ChangePasswordRequest): Promise<void> {
    return request.put('/users/change-password', data)
  },

  // 锁定/解锁用户
  toggleUserStatus(id: number, status: 'active' | 'inactive' | 'locked'): Promise<void> {
    return request.put(`/users/${id}/status`, { status })
  },

  // 获取角色列表（用于下拉选择器）
  getRoles(): Promise<Role[]> {
    return request.get<ApiResponse<any>>('/roles')
      .then(response => {
        const responseData = response.data.data;
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
      })
  },

  // 获取角色列表（用于角色管理页面，支持分页）
  getRolesList(params: { page?: number; limit?: number; keyword?: string } = {}): Promise<{ data: Role[]; total: number; page: number; limit: number }> {
    return request.get<ApiResponse<any>>('/roles', { params })
      .then(response => {
        const responseData = response.data.data;
        return {
          data: responseData.roles || [],
          total: responseData.pagination?.total || 0,
          page: responseData.pagination?.page || 1,
          limit: responseData.pagination?.limit || 20
        };
      })
  },

  // 创建角色
  createRole(data: { name: string; description?: string; permissions: string[] }): Promise<Role> {
    return request.post<ApiResponse<Role>>('/roles', data)
      .then(response => response.data.data)
  },

  // 更新角色
  updateRole(id: number, data: { name?: string; description?: string; permissions?: string[] }): Promise<Role> {
    return request.put<ApiResponse<Role>>(`/roles/${id}`, data)
      .then(response => response.data.data)
  },

  // 删除角色
  deleteRole(id: number): Promise<void> {
    return request.delete(`/roles/${id}`)
  },

  // 获取权限列表
  getPermissions(): Promise<{ [key: string]: string[] }> {
    return request.get<ApiResponse<{ [key: string]: string[] }>>('/permissions')
      .then(response => response.data.data)
  },

  // 获取操作日志
  getOperationLogs(params: OperationLogParams = {}): Promise<{ data: OperationLog[]; total: number; page: number; limit: number }> {
    return request.get<ApiResponse<any>>('/operation-logs', { params })
      .then(response => {
        const responseData = response.data.data;
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
      })
  }
}