import { healthServiceApi } from './microservices'

export const healthApi = {
  // 获取健康记录列表
  async getHealthRecords(params = {}) {
    try {
      const response = await healthServiceApi.getHealthRecords(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取健康记录失败:', error)
      throw error
    }
  },

  // 创建健康记录
  async createHealthRecord(data) {
    try {
      const response = await healthServiceApi.createHealthRecord(data)
      if (response.success) {
        uni.showToast({
          title: '健康记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建健康记录失败')
      }
    } catch (error) {
      console.error('创建健康记录失败:', error)
      throw error
    }
  },

  // 获取疫苗记录列表
  async getVaccineRecords(params = {}) {
    try {
      const response = await healthServiceApi.getVaccineRecords(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取疫苗记录失败:', error)
      throw error
    }
  },

  // 创建疫苗记录
  async createVaccineRecord(data) {
    try {
      const response = await healthServiceApi.createVaccineRecord(data)
      if (response.success) {
        uni.showToast({
          title: '疫苗记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建疫苗记录失败')
      }
    } catch (error) {
      console.error('创建疫苗记录失败:', error)
      throw error
    }
  },

  // 获取疾病记录列表
  async getDiseaseRecords(params = {}) {
    try {
      const response = await healthServiceApi.getDiseaseRecords(params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取疾病记录失败:', error)
      throw error
    }
  },

  // 创建疾病记录
  async createDiseaseRecord(data) {
    try {
      const response = await healthServiceApi.createDiseaseRecord(data)
      if (response.success) {
        uni.showToast({
          title: '疾病记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建疾病记录失败')
      }
    } catch (error) {
      console.error('创建疾病记录失败:', error)
      throw error
    }
  },

  // 获取健康统计数据
  async getHealthStatistics(baseId) {
    try {
      const response = await healthServiceApi.getHealthStatistics(baseId)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取健康统计失败:', error)
      throw error
    }
  }
}