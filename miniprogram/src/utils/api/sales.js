// 销售管理API
import { api } from '../apiClient'

export const salesApi = {
  // 销售订单
  async getOrders(params = {}) {
    try {
      const response = await api.get('/sales-orders', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取销售订单失败:', error)
      throw error
    }
  },

  async getOrder(id) {
    try {
      const response = await api.get(`/sales-orders/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取销售订单详情失败:', error)
      throw error
    }
  },

  async createOrder(data) {
    try {
      const response = await api.post('/sales-orders', data)
      if (response.success) {
        uni.showToast({
          title: '销售订单创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建销售订单失败')
      }
    } catch (error) {
      console.error('创建销售订单失败:', error)
      throw error
    }
  },

  async updateOrder(id, data) {
    try {
      const response = await api.put(`/sales-orders/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '销售订单更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新销售订单失败')
      }
    } catch (error) {
      console.error('更新销售订单失败:', error)
      throw error
    }
  },

  async approveOrder(id) {
    try {
      const response = await api.post(`/sales-orders/${id}/approve`)
      if (response.success) {
        uni.showToast({
          title: '订单审批成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '订单审批失败')
      }
    } catch (error) {
      console.error('订单审批失败:', error)
      throw error
    }
  },

  async cancelOrder(id, reason) {
    try {
      const response = await api.post(`/sales-orders/${id}/cancel`, { reason })
      if (response.success) {
        uni.showToast({
          title: '订单取消成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '订单取消失败')
      }
    } catch (error) {
      console.error('订单取消失败:', error)
      throw error
    }
  },

  async updateDeliveryStatus(id, data) {
    try {
      const response = await api.post(`/sales-orders/${id}/delivery`, data)
      if (response.success) {
        uni.showToast({
          title: '配送状态更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '配送状态更新失败')
      }
    } catch (error) {
      console.error('配送状态更新失败:', error)
      throw error
    }
  },

  async updatePaymentStatus(id, data) {
    try {
      const response = await api.post(`/sales-orders/${id}/payment`, data)
      if (response.success) {
        uni.showToast({
          title: '支付状态更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '支付状态更新失败')
      }
    } catch (error) {
      console.error('支付状态更新失败:', error)
      throw error
    }
  },

  // 销售统计
  async getStatistics(params = {}) {
    try {
      const response = await api.get('/sales-orders/statistics', params)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取销售统计失败:', error)
      throw error
    }
  },

  // 客户管理
  async getCustomers(params = {}) {
    try {
      const response = await api.get('/customers', params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取客户列表失败:', error)
      throw error
    }
  },

  async getCustomer(id) {
    try {
      const response = await api.get(`/customers/${id}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取客户详情失败:', error)
      throw error
    }
  },

  async createCustomer(data) {
    try {
      const response = await api.post('/customers', data)
      if (response.success) {
        uni.showToast({
          title: '客户创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建客户失败')
      }
    } catch (error) {
      console.error('创建客户失败:', error)
      throw error
    }
  },

  async updateCustomer(id, data) {
    try {
      const response = await api.put(`/customers/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '客户信息更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新客户信息失败')
      }
    } catch (error) {
      console.error('更新客户信息失败:', error)
      throw error
    }
  },

  async deleteCustomer(id) {
    try {
      const response = await api.delete(`/customers/${id}`)
      if (response.success) {
        uni.showToast({
          title: '客户删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除客户失败')
      }
    } catch (error) {
      console.error('删除客户失败:', error)
      throw error
    }
  },

  // 客户评级
  async updateCustomerRating(id, data) {
    try {
      const response = await api.put(`/customers/${id}/rating`, data)
      if (response.success) {
        uni.showToast({
          title: '客户评级更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '客户评级更新失败')
      }
    } catch (error) {
      console.error('客户评级更新失败:', error)
      throw error
    }
  },

  // 客户统计
  async getCustomerStatistics(id, params = {}) {
    try {
      const response = await api.get(`/customers/${id}/statistics`, params)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取客户统计失败:', error)
      throw error
    }
  },

  // 客户回访记录
  async getCustomerVisits(customerId, params = {}) {
    try {
      const response = await api.get(`/customers/${customerId}/visits`, params)
      return response.success ? {
        data: response.data || [],
        pagination: response.pagination
      } : { data: [], pagination: null }
    } catch (error) {
      console.error('获取客户回访记录失败:', error)
      throw error
    }
  },

  async createCustomerVisit(customerId, data) {
    try {
      const response = await api.post(`/customers/${customerId}/visits`, data)
      if (response.success) {
        uni.showToast({
          title: '回访记录创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建回访记录失败')
      }
    } catch (error) {
      console.error('创建回访记录失败:', error)
      throw error
    }
  },

  async updateCustomerVisit(id, data) {
    try {
      const response = await api.put(`/customers/visits/${id}`, data)
      if (response.success) {
        uni.showToast({
          title: '回访记录更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新回访记录失败')
      }
    } catch (error) {
      console.error('更新回访记录失败:', error)
      throw error
    }
  },

  // 客户类型
  async getCustomerTypes() {
    try {
      const response = await api.get('/customers/types')
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取客户类型失败:', error)
      throw error
    }
  },

  // 客户价值分析
  async getCustomerValueAnalysis(params = {}) {
    try {
      const response = await api.get('/customers/value-analysis', params)
      return response.success ? response.data : {}
    } catch (error) {
      console.error('获取客户价值分析失败:', error)
      throw error
    }
  }
}

export default salesApi