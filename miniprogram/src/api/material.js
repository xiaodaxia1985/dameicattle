import request from '@/utils/request'

export const materialApi = {
  // 获取统计数据
  getStatistics() {
    return request({
      url: '/api/materials/statistics',
      method: 'GET'
    })
  },

  // 获取物资列表
  getMaterials(params = {}) {
    return request({
      url: '/api/materials',
      method: 'GET',
      data: params
    })
  },

  // 获取库存信息
  getInventory(params = {}) {
    return request({
      url: '/api/materials/inventory',
      method: 'GET',
      data: params
    })
  },

  // 获取交易记录
  getTransactions(params = {}) {
    return request({
      url: '/api/materials/transactions',
      method: 'GET',
      data: params
    })
  },

  // 创建交易记录
  createTransaction(data) {
    return request({
      url: '/api/materials/transactions',
      method: 'POST',
      data
    })
  },

  // 获取预警信息
  getAlerts(params = {}) {
    return request({
      url: '/api/materials/alerts',
      method: 'GET',
      data: params
    })
  },

  // 解决预警
  resolveAlert(alertId) {
    return request({
      url: `/api/materials/alerts/${alertId}/resolve`,
      method: 'POST'
    })
  },

  // 同步离线数据
  syncOfflineData() {
    return request({
      url: '/api/materials/sync',
      method: 'POST'
    })
  }
}