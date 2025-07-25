// 牛只管理API
import { api } from '../apiClient'

export const cattleApi = {
  // 获取牛只列表
  async getCattleList(params = {}) {
    try {
      const response = await api.get('/cattle', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取牛只列表失败:', error)
      throw error
    }
  },

  // 根据ID获取牛只详情
  async getCattleById(id) {
    try {
      const response = await api.get(`/cattle/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      throw error
    }
  },

  // 根据耳标获取牛只信息
  async getCattleByEarTag(earTag) {
    try {
      const response = await api.get(`/cattle/ear-tag/${earTag}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('根据耳标获取牛只信息失败:', error)
      throw error
    }
  },

  // 创建牛只记录
  async createCattle(data) {
    try {
      const response = await api.post('/cattle', data)
      if (response.success) {
        uni.showToast({
          title: '牛只记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建牛只记录失败')
      }
    } catch (error) {
      console.error('创建牛只记录失败:', error)
      throw error
    }
  },

  // 更新牛只记录
  async updateCattle(id, data) {
    try {
      const response = await api.put(`/cattle/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '牛只记录更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新牛只记录失败')
      }
    } catch (error) {
      console.error('更新牛只记录失败:', error)
      throw error
    }
  },

  // 删除牛只记录
  async deleteCattle(id) {
    try {
      const response = await api.delete(`/cattle/${id}`)
      if (response.success) {
        uni.showToast({
          title: '牛只记录删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除牛只记录失败')
      }
    } catch (error) {
      console.error('删除牛只记录失败:', error)
      throw error
    }
  },

  // 批量操作牛只
  async batchOperation(operation, cattleIds, data = {}) {
    try {
      const response = await api.post('/cattle/batch', {
        operation,
        cattleIds,
        ...data
      })
      if (response.success) {
        uni.showToast({
          title: `批量${operation}成功`,
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || `批量${operation}失败`)
      }
    } catch (error) {
      console.error(`批量${operation}失败:`, error)
      throw error
    }
  },

  // 扫码查询牛只
  async scanCattle(qrCode) {
    try {
      const response = await api.get(`/cattle/scan/${qrCode}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('扫码查询牛只失败:', error)
      throw error
    }
  }
}

export default cattleApi