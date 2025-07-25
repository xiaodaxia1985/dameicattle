// 物资管理API
import { api } from '../apiClient'

export const materialsApi = {
  // 获取物资列表
  async getMaterials(params = {}) {
    try {
      const response = await api.get('/materials', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取物资列表失败:', error)
      throw error
    }
  },

  // 获取物资详情
  async getMaterialById(id) {
    try {
      const response = await api.get(`/materials/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取物资详情失败:', error)
      throw error
    }
  },

  // 创建物资记录
  async createMaterial(data) {
    try {
      const response = await api.post('/materials', data)
      if (response.success) {
        uni.showToast({
          title: '物资记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建物资记录失败')
      }
    } catch (error) {
      console.error('创建物资记录失败:', error)
      throw error
    }
  },

  // 更新物资记录
  async updateMaterial(id, data) {
    try {
      const response = await api.put(`/materials/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '物资记录更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新物资记录失败')
      }
    } catch (error) {
      console.error('更新物资记录失败:', error)
      throw error
    }
  },

  // 删除物资记录
  async deleteMaterial(id) {
    try {
      const response = await api.delete(`/materials/${id}`)
      if (response.success) {
        uni.showToast({
          title: '物资记录删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除物资记录失败')
      }
    } catch (error) {
      console.error('删除物资记录失败:', error)
      throw error
    }
  },

  // 库存管理
  async getInventory(params = {}) {
    try {
      const response = await api.get('/inventory', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取库存信息失败:', error)
      throw error
    }
  },

  async getInventoryByMaterial(materialId, baseId) {
    try {
      const response = await api.get(`/inventory/material/${materialId}`, { baseId })
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取物资库存失败:', error)
      throw error
    }
  },

  async createInbound(data) {
    try {
      const response = await api.post('/inventory/inbound', data)
      if (response.success) {
        uni.showToast({
          title: '入库记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建入库记录失败')
      }
    } catch (error) {
      console.error('创建入库记录失败:', error)
      throw error
    }
  },

  async createOutbound(data) {
    try {
      const response = await api.post('/inventory/outbound', data)
      if (response.success) {
        uni.showToast({
          title: '出库记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建出库记录失败')
      }
    } catch (error) {
      console.error('创建出库记录失败:', error)
      throw error
    }
  },

  // 库存预警
  async getInventoryAlerts(params = {}) {
    try {
      const response = await api.get('/inventory/alerts', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取库存预警失败:', error)
      throw error
    }
  },

  // 库存盘点
  async createStocktaking(data) {
    try {
      const response = await api.post('/inventory/stocktaking', data)
      if (response.success) {
        uni.showToast({
          title: '库存盘点创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建库存盘点失败')
      }
    } catch (error) {
      console.error('创建库存盘点失败:', error)
      throw error
    }
  },

  async getStocktakingRecords(params = {}) {
    try {
      const response = await api.get('/inventory/stocktaking', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取盘点记录失败:', error)
      throw error
    }
  }
}

export default materialsApi