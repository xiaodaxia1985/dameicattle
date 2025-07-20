import request from './request'
import type { ApiResponse } from './request'

// 门户网站配置接口
export interface PortalConfig {
  id: number
  key: string
  value: any
  description?: string
  type: 'text' | 'image' | 'json' | 'html'
  category: string
  createdAt: string
  updatedAt: string
}

// 轮播图接口
export interface CarouselItem {
  id: number
  title: string
  subtitle?: string
  image: string
  link?: string
  linkType: 'internal' | 'external'
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 广告位接口
export interface Advertisement {
  id: number
  name: string
  position: string
  type: 'image' | 'html' | 'video'
  content: string
  link?: string
  linkType: 'internal' | 'external'
  startTime?: string
  endTime?: string
  isActive: boolean
  clickCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
}

// 页面内容接口
export interface PageContent {
  id: number
  page: string
  section: string
  key: string
  title?: string
  content: any
  type: 'text' | 'html' | 'json' | 'image'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 访客统计接口
export interface VisitorStats {
  id: number
  date: string
  totalVisits: number
  uniqueVisitors: number
  pageViews: number
  bounceRate: number
  avgSessionDuration: number
  topPages: Array<{
    page: string
    views: number
  }>
  topSources: Array<{
    source: string
    visits: number
  }>
}

// 在线留言接口
export interface ContactMessage {
  id: number
  name: string
  company?: string
  phone: string
  email?: string
  subject: string
  cattleCount?: string
  message: string
  preferredContact?: string
  status: 'pending' | 'processing' | 'replied' | 'closed'
  reply?: string
  repliedBy?: number
  repliedAt?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

// 产品询价接口
export interface ProductInquiry {
  id: number
  name: string
  phone: string
  company: string
  modules: string[]
  baseCount?: string
  userCount?: string
  requirements?: string
  status: 'pending' | 'processing' | 'quoted' | 'closed'
  quote?: any
  quotedBy?: number
  quotedAt?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

export const portalApi = {
  // ========== 门户网站配置管理 ==========
  
  // 获取门户配置列表
  getConfigs(params?: {
    category?: string
    key?: string
  }): Promise<ApiResponse<PortalConfig[]>> {
    return request.get('/portal/configs', { params })
  },

  // 获取单个配置
  getConfig(key: string): Promise<ApiResponse<PortalConfig>> {
    return request.get(`/portal/configs/${key}`)
  },

  // 更新配置
  updateConfig(key: string, data: {
    value: any
    description?: string
  }): Promise<ApiResponse<PortalConfig>> {
    return request.put(`/portal/configs/${key}`, data)
  },

  // 批量更新配置
  updateConfigs(configs: Array<{
    key: string
    value: any
  }>): Promise<ApiResponse<PortalConfig[]>> {
    return request.put('/portal/configs/batch', { configs })
  },

  // ========== 轮播图管理 ==========
  
  // 获取轮播图列表
  getCarousels(params?: {
    isActive?: boolean
  }): Promise<ApiResponse<CarouselItem[]>> {
    return request.get('/portal/carousels', { params })
  },

  // 创建轮播图
  createCarousel(data: Partial<CarouselItem>): Promise<ApiResponse<CarouselItem>> {
    return request.post('/portal/carousels', data)
  },

  // 更新轮播图
  updateCarousel(id: number, data: Partial<CarouselItem>): Promise<ApiResponse<CarouselItem>> {
    return request.put(`/portal/carousels/${id}`, data)
  },

  // 删除轮播图
  deleteCarousel(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/portal/carousels/${id}`)
  },

  // 更新轮播图排序
  updateCarouselOrder(items: Array<{
    id: number
    sortOrder: number
  }>): Promise<ApiResponse<void>> {
    return request.put('/portal/carousels/order', { items })
  },

  // ========== 广告管理 ==========
  
  // 获取广告列表
  getAdvertisements(params?: {
    position?: string
    isActive?: boolean
  }): Promise<ApiResponse<Advertisement[]>> {
    return request.get('/portal/advertisements', { params })
  },

  // 创建广告
  createAdvertisement(data: Partial<Advertisement>): Promise<ApiResponse<Advertisement>> {
    return request.post('/portal/advertisements', data)
  },

  // 更新广告
  updateAdvertisement(id: number, data: Partial<Advertisement>): Promise<ApiResponse<Advertisement>> {
    return request.put(`/portal/advertisements/${id}`, data)
  },

  // 删除广告
  deleteAdvertisement(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/portal/advertisements/${id}`)
  },

  // 获取公开广告（前端展示用）
  getPublicAdvertisements(position: string): Promise<ApiResponse<Advertisement[]>> {
    return request.get(`/public/advertisements/${position}`)
  },

  // ========== 页面内容管理 ==========
  
  // 获取页面内容列表
  getPageContents(params?: {
    page?: string
    section?: string
    isActive?: boolean
  }): Promise<ApiResponse<PageContent[]>> {
    return request.get('/portal/page-contents', { params })
  },

  // 获取单个页面内容
  getPageContent(page: string, section: string, key: string): Promise<ApiResponse<PageContent>> {
    return request.get(`/portal/page-contents/${page}/${section}/${key}`)
  },

  // 更新页面内容
  updatePageContent(id: number, data: Partial<PageContent>): Promise<ApiResponse<PageContent>> {
    return request.put(`/portal/page-contents/${id}`, data)
  },

  // 批量更新页面内容
  updatePageContents(contents: Array<{
    id: number
    content: any
  }>): Promise<ApiResponse<PageContent[]>> {
    return request.put('/portal/page-contents/batch', { contents })
  },

  // 获取公开页面内容（前端展示用）
  getPublicPageContent(page: string, section?: string): Promise<ApiResponse<PageContent[]>> {
    const params = section ? { section } : {}
    return request.get(`/public/page-contents/${page}`, { params })
  },

  // ========== 访客统计 ==========
  
  // 获取访客统计
  getVisitorStats(params?: {
    startDate?: string
    endDate?: string
    page?: string
  }): Promise<ApiResponse<VisitorStats[]>> {
    return request.get('/portal/visitor-stats', { params })
  },

  // 获取实时统计
  getRealTimeStats(): Promise<ApiResponse<{
    onlineUsers: number
    todayVisits: number
    todayPageViews: number
    totalVisits: number
  }>> {
    return request.get('/portal/visitor-stats/realtime')
  },

  // 记录访客行为
  recordVisitorAction(data: {
    action: string
    page?: string
    data?: any
    userAgent?: string
    ipAddress?: string
  }): Promise<ApiResponse<void>> {
    return request.post('/public/visitor-actions', data)
  },

  // ========== 留言管理 ==========
  
  // 获取留言列表
  getContactMessages(params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<{
    data: ContactMessage[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }>> {
    return request.get('/portal/contact-messages', { params })
  },

  // 获取留言详情
  getContactMessage(id: number): Promise<ApiResponse<ContactMessage>> {
    return request.get(`/portal/contact-messages/${id}`)
  },

  // 更新留言状态
  updateContactMessageStatus(id: number, status: string): Promise<ApiResponse<ContactMessage>> {
    return request.put(`/portal/contact-messages/${id}/status`, { status })
  },

  // 回复留言
  replyContactMessage(id: number, reply: string): Promise<ApiResponse<ContactMessage>> {
    return request.post(`/portal/contact-messages/${id}/reply`, { reply })
  },

  // 删除留言
  deleteContactMessage(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/portal/contact-messages/${id}`)
  },

  // 提交留言（公开接口）
  submitContactMessage(data: {
    name: string
    company?: string
    phone: string
    email?: string
    subject: string
    cattleCount?: string
    message: string
    preferredContact?: string
  }): Promise<ApiResponse<ContactMessage>> {
    return request.post('/public/contact-messages', data)
  },

  // ========== 询价管理 ==========
  
  // 获取询价列表
  getInquiries(params?: {
    page?: number
    limit?: number
    status?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<{
    data: ProductInquiry[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }>> {
    return request.get('/portal/inquiries', { params })
  },

  // 获取询价详情
  getInquiry(id: number): Promise<ApiResponse<ProductInquiry>> {
    return request.get(`/portal/inquiries/${id}`)
  },

  // 更新询价状态
  updateInquiryStatus(id: number, status: string): Promise<ApiResponse<ProductInquiry>> {
    return request.put(`/portal/inquiries/${id}/status`, { status })
  },

  // 提供报价
  provideQuote(id: number, quote: any): Promise<ApiResponse<ProductInquiry>> {
    return request.post(`/portal/inquiries/${id}/quote`, { quote })
  },

  // 删除询价
  deleteInquiry(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/portal/inquiries/${id}`)
  },

  // 提交询价（公开接口）
  submitInquiry(data: {
    name: string
    phone: string
    company: string
    modules: string[]
    baseCount?: string
    userCount?: string
    requirements?: string
  }): Promise<ApiResponse<ProductInquiry>> {
    return request.post('/public/inquiries', data)
  },

  // ========== 文件上传 ==========
  
  // 上传门户网站文件
  uploadFile(file: File, type: 'carousel' | 'advertisement' | 'content'): Promise<ApiResponse<{
    url: string
    filename: string
    size: number
  }>> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    
    return request.post('/portal/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}