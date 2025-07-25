import { api } from '@/utils/apiClient'

export const baseApi = {
  // 获取基地列表
  async getBases(params = {}) {
    try {
      const response = await api.get('/bases', params)
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    }
  },

  // 获取基地详情
  async getBaseDetail(baseId) {
    try {
      const response = await api.get(`/bases/${baseId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取基地详情失败:', error)
      throw error
    }
  },

  // 创建基地
  async createBase(data) {
    try {
      const response = await api.post('/bases', data)
      if (response.success) {
        uni.showToast({
          title: '基地创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建基地失败')
      }
    } catch (error) {
      console.error('创建基地失败:', error)
      throw error
    }
  },

  // 更新基地
  async updateBase(baseId, data) {
    try {
      const response = await api.put(`/bases/${baseId}`, data)
      if (response.success) {
        uni.showToast({
          title: '基地更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新基地失败')
      }
    } catch (error) {
      console.error('更新基地失败:', error)
      throw error
    }
  },

  // 删除基地
  async deleteBase(baseId) {
    try {
      const response = await api.delete(`/bases/${baseId}`)
      if (response.success) {
        uni.showToast({
          title: '基地删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除基地失败')
      }
    } catch (error) {
      console.error('删除基地失败:', error)
      throw error
    }
  }
}