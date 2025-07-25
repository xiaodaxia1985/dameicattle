// 设备管理API
import { api } from '../apiClient'

export const equipmentApi = {
  // 获取设备列表
  async getEquipmentList(params = {}) {
    try {
      const response = await api.get('/equipment', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取设备列表失败:', error)
      throw error
    }
  },

  // 获取设备详情
  async getEquipmentById(id) {
    try {
      const response = await api.get(`/equipment/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取设备详情失败:', error)
      throw error
    }
  },

  // 创建设备记录
  async createEquipment(data) {
    try {
      const response = await api.post('/equipment', data)
      if (response.success) {
        uni.showToast({
          title: '设备记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建设备记录失败')
      }
    } catch (error) {
      console.error('创建设备记录失败:', error)
      throw error
    }
  },

  // 更新设备记录
  async updateEquipment(id, data) {
    try {
      const response = await api.put(`/equipment/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '设备记录更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新设备记录失败')
      }
    } catch (error) {
      console.error('更新设备记录失败:', error)
      throw error
    }
  },

  // 删除设备记录
  async deleteEquipment(id) {
    try {
      const response = await api.delete(`/equipment/${id}`)
      if (response.success) {
        uni.showToast({
          title: '设备记录删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除设备记录失败')
      }
    } catch (error) {
      console.error('删除设备记录失败:', error)
      throw error
    }
  },

  // 获取维护记录
  async getMaintenanceRecords(equipmentId, params = {}) {
    try {
      const response = await api.get(`/equipment/${equipmentId}/maintenance`, params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取维护记录失败:', error)
      throw error
    }
  },

  // 创建维护记录
  async createMaintenanceRecord(equipmentId, data) {
    try {
      const response = await api.post(`/equipment/${equipmentId}/maintenance`, data)
      if (response.success) {
        uni.showToast({
          title: '维护记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建维护记录失败')
      }
    } catch (error) {
      console.error('创建维护记录失败:', error)
      throw error
    }
  },

  // 报告故障
  async reportFailure(equipmentId, data) {
    try {
      const response = await api.post(`/equipment/${equipmentId}/failure`, data)
      if (response.success) {
        uni.showToast({
          title: '故障报告提交成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '故障报告提交失败')
      }
    } catch (error) {
      console.error('故障报告提交失败:', error)
      throw error
    }
  },

  // 获取故障记录
  async getFailureRecords(equipmentId, params = {}) {
    try {
      const response = await api.get(`/equipment/${equipmentId}/failures`, params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取故障记录失败:', error)
      throw error
    }
  }
}

export default equipmentApi