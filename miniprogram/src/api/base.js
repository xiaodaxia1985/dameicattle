import request from '@/utils/request'

export const baseApi = {
  // 获取基地列表
  getBases(params = {}) {
    return request({
      url: '/api/bases',
      method: 'GET',
      data: params
    })
  },

  // 获取基地详情
  getBaseDetail(baseId) {
    return request({
      url: `/api/bases/${baseId}`,
      method: 'GET'
    })
  },

  // 创建基地
  createBase(data) {
    return request({
      url: '/api/bases',
      method: 'POST',
      data
    })
  },

  // 更新基地
  updateBase(baseId, data) {
    return request({
      url: `/api/bases/${baseId}`,
      method: 'PUT',
      data
    })
  },

  // 删除基地
  deleteBase(baseId) {
    return request({
      url: `/api/bases/${baseId}`,
      method: 'DELETE'
    })
  }
}