// 用户管理API
import { api } from '../apiClient'

export const userApi = {
  // 获取用户列表
  async getUserList(params = {}) {
    try {
      const response = await api.get('/users', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      throw error
    }
  },

  // 获取用户详情
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取用户详情失败:', error)
      throw error
    }
  },

  // 获取用户资料
  async getUserProfile() {
    try {
      const response = await api.get('/users/profile')
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取用户资料失败:', error)
      throw error
    }
  },

  // 更新用户资料
  async updateUserProfile(data) {
    try {
      const response = await api.put('/users/profile', data)
      if (response.success) {
        uni.showToast({
          title: '用户资料更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新用户资料失败')
      }
    } catch (error) {
      console.error('更新用户资料失败:', error)
      throw error
    }
  },

  // 创建用户
  async createUser(data) {
    try {
      const response = await api.post('/users', data)
      if (response.success) {
        uni.showToast({
          title: '用户创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建用户失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      throw error
    }
  },

  // 更新用户信息
  async updateUser(id, data) {
    try {
      const response = await api.put(`/users/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '用户信息更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新用户信息失败')
      }
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    }
  },

  // 删除用户
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`)
      if (response.success) {
        uni.showToast({
          title: '用户删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      throw error
    }
  },

  // 修改密码
  async changePassword(data) {
    try {
      const response = await api.post('/users/change-password', data)
      if (response.success) {
        uni.showToast({
          title: '密码修改成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '密码修改失败')
      }
    } catch (error) {
      console.error('密码修改失败:', error)
      throw error
    }
  },

  // 获取用户权限
  async getUserPermissions(id) {
    try {
      const response = await api.get(`/users/${id}/permissions`)
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取用户权限失败:', error)
      throw error
    }
  },

  // 更新用户权限
  async updateUserPermissions(id, permissions) {
    try {
      const response = await api.put(`/users/${id}/permissions`, { permissions })
      if (response.success) {
        uni.showToast({
          title: '用户权限更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新用户权限失败')
      }
    } catch (error) {
      console.error('更新用户权限失败:', error)
      throw error
    }
  }
}

export default userApi