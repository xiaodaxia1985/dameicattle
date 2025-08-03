import { materialServiceApi } from './microservices'

export const materialApi = {
  // 获取统计数据
  async getStatistics() {
    try {
      const response = await materialServiceApi.getMaterialStatistics()
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw error
    }
  },

  // 获取物资列表
  async getMaterials(params = {}) {
    try {
      const response = await materialServiceApi.getMaterials(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取物资列表失败:', error)
      throw error
    }
  },

  // 获取库存信息
  async getInventory(params = {}) {
    try {
      const response = await materialServiceApi.getInventory(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取库存信息失败:', error)
      throw error
    }
  },

  // 获取交易记录
  async getTransactions(params = {}) {
    try {
      const response = await materialServiceApi.getTransactions(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取交易记录失败:', error)
      throw error
    }
  },

  // 创建交易记录
  async createTransaction(data) {
    try {
      const response = await materialServiceApi.createTransaction(data)
      if (response.success) {
        uni.showToast({
          title: '交易记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建交易记录失败')
      }
    } catch (error) {
      console.error('创建交易记录失败:', error)
      throw error
    }
  },

  // 获取预警信息
  async getAlerts(params = {}) {
    try {
      const response = await materialServiceApi.getAlerts(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取预警信息失败:', error)
      throw error
    }
  },

  // 解决预警
  async resolveAlert(alertId) {
    try {
      const response = await materialServiceApi.resolveAlert(alertId)
      if (response.success) {
        uni.showToast({
          title: '预警已解决',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '解决预警失败')
      }
    } catch (error) {
      console.error('解决预警失败:', error)
      throw error
    }
  },

  // 同步离线数据
  async syncOfflineData() {
    try {
      uni.showLoading({
        title: '同步中...'
      })
      
      const response = await materialServiceApi.syncOfflineData()
      
      uni.hideLoading()
      
      if (response.success) {
        uni.showToast({
          title: '数据同步成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '数据同步失败')
      }
    } catch (error) {
      uni.hideLoading()
      console.error('同步离线数据失败:', error)
      throw error
    }
  }
}