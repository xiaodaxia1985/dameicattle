import { feedingServiceApi } from './microservices'

export const feedingApi = {
  // 获取饲养计划列表
  async getFeedingPlans(params = {}) {
    try {
      const response = await feedingServiceApi.getFeedingPlans(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取饲养计划失败:', error)
      throw error
    }
  },

  // 创建饲养计划
  async createFeedingPlan(data) {
    try {
      const response = await feedingServiceApi.createFeedingPlan(data)
      if (response.success) {
        uni.showToast({
          title: '饲养计划创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建饲养计划失败')
      }
    } catch (error) {
      console.error('创建饲养计划失败:', error)
      throw error
    }
  },

  // 获取饲料配方列表
  async getFeedFormulas(params = {}) {
    try {
      const response = await feedingServiceApi.getFeedFormulas(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取饲料配方失败:', error)
      throw error
    }
  },

  // 创建饲料配方
  async createFeedFormula(data) {
    try {
      const response = await feedingServiceApi.createFeedFormula(data)
      if (response.success) {
        uni.showToast({
          title: '饲料配方创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建饲料配方失败')
      }
    } catch (error) {
      console.error('创建饲料配方失败:', error)
      throw error
    }
  },

  // 获取喂养记录列表
  async getFeedingRecords(params = {}) {
    try {
      const response = await feedingServiceApi.getFeedingRecords(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取喂养记录失败:', error)
      throw error
    }
  },

  // 创建喂养记录
  async createFeedingRecord(data) {
    try {
      const response = await feedingServiceApi.createFeedingRecord(data)
      if (response.success) {
        uni.showToast({
          title: '喂养记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建喂养记录失败')
      }
    } catch (error) {
      console.error('创建喂养记录失败:', error)
      throw error
    }
  },

  // 获取饲养统计数据
  async getFeedingStatistics(baseId) {
    try {
      const response = await feedingServiceApi.getFeedingStatistics(baseId)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取饲养统计失败:', error)
      throw error
    }
  }
}