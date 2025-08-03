import { baseServiceApi } from './microservices'

export const baseApi = {
  // 获取基地列表
  async getBases(params = {}) {
    try {
      const response = await baseServiceApi.getBases(params)
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取基地列表失败:', error)
      throw error
    }
  },

  // 获取基地详情
  async getBaseDetail(baseId) {
    try {
      const response = await baseServiceApi.getBase(baseId)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取基地详情失败:', error)
      throw error
    }
  },

  // 创建基地
  async createBase(data) {
    try {
      const response = await baseServiceApi.createBase(data)
      if (response.success) {
        uni.showToast({
          title: '基地创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建基地失败')
      }
    } catch (error) {
      console.error('创建基地失败:', error)
      throw error
    }
  },

  // 更新基地
  async updateBase(baseId, data) {
    try {
      const response = await baseServiceApi.updateBase(baseId, data)
      if (response.success) {
        uni.showToast({
          title: '基地更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新基地失败')
      }
    } catch (error) {
      console.error('更新基地失败:', error)
      throw error
    }
  },

  // 删除基地
  async deleteBase(baseId) {
    try {
      const response = await baseServiceApi.deleteBase(baseId)
      if (response.success) {
        uni.showToast({
          title: '基地删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除基地失败')
      }
    } catch (error) {
      console.error('删除基地失败:', error)
      throw error
    }
  },

  // 获取牛舍列表
  async getBarns(baseId, params = {}) {
    try {
      const response = await baseServiceApi.getBarns(baseId, params)
      return response.success ? response.data : []
    } catch (error) {
      console.error('获取牛舍列表失败:', error)
      throw error
    }
  },

  // 获取牛舍详情
  async getBarnDetail(barnId) {
    try {
      const response = await baseServiceApi.getBarn(barnId)
      return response.success ? response.data : null
    } catch (error) {
      console.error('获取牛舍详情失败:', error)
      throw error
    }
  },

  // 创建牛舍
  async createBarn(data) {
    try {
      const response = await baseServiceApi.createBarn(data)
      if (response.success) {
        uni.showToast({
          title: '牛舍创建成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '创建牛舍失败')
      }
    } catch (error) {
      console.error('创建牛舍失败:', error)
      throw error
    }
  },

  // 更新牛舍
  async updateBarn(barnId, data) {
    try {
      const response = await baseServiceApi.updateBarn(barnId, data)
      if (response.success) {
        uni.showToast({
          title: '牛舍更新成功',
          icon: 'success'
        })
        return response.data
      } else {
        throw new Error(response.message || '更新牛舍失败')
      }
    } catch (error) {
      console.error('更新牛舍失败:', error)
      throw error
    }
  },

  // 删除牛舍
  async deleteBarn(barnId) {
    try {
      const response = await baseServiceApi.deleteBarn(barnId)
      if (response.success) {
        uni.showToast({
          title: '牛舍删除成功',
          icon: 'success'
        })
        return true
      } else {
        throw new Error(response.message || '删除牛舍失败')
      }
    } catch (error) {
      console.error('删除牛舍失败:', error)
      throw error
    }
  }
}