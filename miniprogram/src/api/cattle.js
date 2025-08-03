import { cattleServiceApi } from './microservices'

export const cattleApi = {
  // 获取牛只列表
  async getCattleList(params = {}) {
    try {
      const response = await cattleServiceApi.getCattleList(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取牛只列表失败:', error)
      throw error
    }
  },

  // 获取牛只详情
  async getCattleDetail(cattleId) {
    try {
      const response = await cattleServiceApi.getCattle(cattleId)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取牛只详情失败:', error)
      throw error
    }
  },

  // 通过耳标扫码获取牛只信息
  async scanCattle(earTag) {
    try {
      const response = await cattleServiceApi.scanCattle(earTag)
      return response.success ? response.data : null
    } catch (error) {
      console.error('扫码获取牛只信息失败:', error)
      throw error
    }
  },

  // 创建牛只记录
  async createCattle(data) {
    try {
      const response = await cattleServiceApi.createCattle(data)
      if (response.success) {
        uni.showToast({
          title: '牛只创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建牛只失败')
      }
    } catch (error) {
      console.error('创建牛只失败:', error)
      throw error
    }
  },

  // 更新牛只信息
  async updateCattle(cattleId, data) {
    try {
      const response = await cattleServiceApi.updateCattle(cattleId, data)
      if (response.success) {
        uni.showToast({
          title: '牛只更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新牛只失败')
      }
    } catch (error) {
      console.error('更新牛只失败:', error)
      throw error
    }
  },

  // 删除牛只记录
  async deleteCattle(cattleId) {
    try {
      const response = await cattleServiceApi.deleteCattle(cattleId)
      if (response.success) {
        uni.showToast({
          title: '牛只删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除牛只失败')
      }
    } catch (error) {
      console.error('删除牛只失败:', error)
      throw error
    }
  },

  // 获取牛只统计数据
  async getCattleStatistics(baseId) {
    try {
      const response = await cattleServiceApi.getCattleStatistics(baseId)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取牛只统计失败:', error)
      throw error
    }
  },

  // 获取牛只生命周期事件
  async getCattleEvents(cattleId, params = {}) {
    try {
      const response = await cattleServiceApi.getCattleEvents(cattleId, params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取牛只事件失败:', error)
      throw error
    }
  },

  // 添加牛只事件
  async addCattleEvent(cattleId, event) {
    try {
      const response = await cattleServiceApi.addCattleEvent(cattleId, event)
      if (response.success) {
        uni.showToast({
          title: '事件添加成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '添加事件失败')
      }
    } catch (error) {
      console.error('添加牛只事件失败:', error)
      throw error
    }
  }
}