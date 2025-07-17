import request from './request'
import type { ApiResponse } from './request'

export const newsApi = {
  // 获取新闻列表
  getNews(params: any = {}): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>('/news', { params })
      .then(response => ({ data: response.data.data }))
  },

  // 获取新闻详情
  getNewsById(id: string): Promise<{ data: any }> {
    return request.get<ApiResponse<any>>(`/news/${id}`)
      .then(response => ({ data: response.data.data }))
  }
}