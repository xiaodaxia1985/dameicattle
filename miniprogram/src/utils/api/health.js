// 健康管理API
import { api } from '../apiClient'

export const healthApi = {
  // 获取健康记录列表
  async getHealthRecords(params = {}) {
    try {
      const response = await api.get('/health', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取健康记录失败:', error)
      throw error
    }
  },

  // 获取健康记录详情
  async getHealthRecordById(id) {
    try {
      const response = await api.get(`/health/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取健康记录详情失败:', error)
      throw error
    }
  },

  // 创建健康记录
  async createHealthRecord(data) {
    try {
      const response = await api.post('/health', data)
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

  // 更新健康记录
  async updateHealthRecord(id, data) {
    try {
      const response = await api.put(`/health/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '健康记录更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新健康记录失败')
      }
    } catch (error) {
      console.error('更新健康记录失败:', error)
      throw error
    }
  },

  // 删除健康记录
  async deleteHealthRecord(id) {
    try {
      const response = await api.delete(`/health/${id}`)
      if (response.success) {
        uni.showToast({
          title: '健康记录删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除健康记录失败')
      }
    } catch (error) {
      console.error('删除健康记录失败:', error)
      throw error
    }
  },

  // 获取疫苗记录
  async getVaccineRecords(cattleId, params = {}) {
    try {
      const response = await api.get(`/health/vaccines/${cattleId}`, params)
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
      const response = await api.post('/health/vaccines', data)
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

  // 获取治疗记录
  async getTreatmentRecords(cattleId, params = {}) {
    try {
      const response = await api.get(`/health/treatments/${cattleId}`, params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取治疗记录失败:', error)
      throw error
    }
  },

  // 创建治疗记录
  async createTreatmentRecord(data) {
    try {
      const response = await api.post('/health/treatments', data)
      if (response.success) {
        uni.showToast({
          title: '治疗记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建治疗记录失败')
      }
    } catch (error) {
      console.error('创建治疗记录失败:', error)
      throw error
    }
  },

  // 获取健康统计
  async getHealthStatistics(params = {}) {
    try {
      const response = await api.get('/health/statistics', params)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取健康统计失败:', error)
      throw error
    }
  }
}

export default healthApi