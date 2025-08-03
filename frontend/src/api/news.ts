import { request } from 'http'
import { request } from 'http'
import { request } from 'http'
import { request } from 'http'
import { request } from 'http'
import { request } from 'http'
import { request } from 'http'
import { newsServiceApi } from './microservices'
import type { ApiResponse } from './request'

// 新闻分类接口
export interface NewsCategory {
  id: number
  name: string
  code: string
  description?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// 新闻文章接口
export interface NewsArticle {
  id: number
  title: string
  subtitle?: string
  categoryId: number
  content: string
  summary?: string
  coverImage?: string
  images?: object
  tags?: string
  authorId?: number
  authorName?: string
  status: 'draft' | 'published' | 'archived'
  isFeatured: boolean
  isTop: boolean
  viewCount: number
  likeCount: number
  commentCount: number
  publishTime?: string
  seoTitle?: string
  seoKeywords?: string
  seoDescription?: string
  createdAt: string
  updatedAt: string
  category?: NewsCategory
  author?: any
}

// 新闻评论接口
export interface NewsComment {
  id: number
  articleId: number
  parentId?: number
  userName: string
  userEmail?: string
  userPhone?: string
  content: string
  ipAddress?: string
  userAgent?: string
  status: 'pending' | 'approved' | 'rejected' | 'deleted'
  isAdminReply: boolean
  createdAt: string
  updatedAt: string
  replies?: NewsComment[]
}

// 分页响应接口
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const newsApi = {
  // ========== 健康检查和调试 ==========

  // 检查新闻服务健康状态
  async checkNewsServiceHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await newsServiceApi.healthCheck()
      return response.data || { status: 'unknown', timestamp: new Date().toISOString() }
    } catch (error) {
      console.error('新闻服务健康检查失败:', error)
      return { status: 'error', timestamp: new Date().toISOString() }
    }
  },

  // 测试新闻分类端点连通性
  async testCategoriesEndpoint(): Promise<boolean> {
    try {
      console.log('测试新闻分类端点连通性...')
      const response = await request.get('/news/categories', {
        params: { limit: 1 },
        timeout: 10000
      })
      console.log('端点连通性测试成功:', response)
      return true
    } catch (error) {
      console.error('端点连通性测试失败:', error)
      return false
    }
  },

  // 测试新闻文章端点连通性
  async testArticlesEndpoint(): Promise<{ exists: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now()
    try {
      console.log('测试新闻文章端点连通性...')
      console.log('请求URL: /news/articles')
      console.log('请求参数: { limit: 1 }')

      const response = await request.get('/news/articles', {
        params: { limit: 1 },
        timeout: 5000 // 短超时用于快速测试
      })

      const responseTime = Date.now() - startTime
      console.log(`端点连通性测试成功，响应时间: ${responseTime}ms`)
      console.log('响应数据结构:', {
        hasData: !!response.data,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
      })

      return { exists: true, responseTime }
    } catch (error: any) {
      const responseTime = Date.now() - startTime
      console.error(`端点连通性测试失败，耗时: ${responseTime}ms`)
      console.error('错误详情:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.response?.config?.url
      })

      return {
        exists: false,
        responseTime,
        error: `${error.code || error.response?.status || 'UNKNOWN'}: ${error.message}`
      }
    }
  },

  // 诊断新闻文章接口问题
  async diagnoseArticlesEndpoint(): Promise<{
    endpoint: string
    status: 'success' | 'timeout' | 'not_found' | 'server_error' | 'network_error'
    responseTime: number
    details: string
  }[]> {
    const endpoints = ['/news/articles'] // 只测试主要端点，baseURL已经包含/api/v1
    const results = []

    for (const endpoint of endpoints) {
      const startTime = Date.now()
      try {
        console.log(`诊断端点: ${endpoint}`)

        const response = await request.get(endpoint, {
          params: { limit: 1 },
          timeout: 8000
        })

        const responseTime = Date.now() - startTime
        results.push({
          endpoint,
          status: 'success' as const,
          responseTime,
          details: `成功响应，数据类型: ${typeof response.data}, 是否为数组: ${Array.isArray(response.data)}`
        })

      } catch (error: any) {
        const responseTime = Date.now() - startTime
        let status: 'timeout' | 'not_found' | 'server_error' | 'network_error' = 'network_error'
        let details = error.message

        if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
          status = 'timeout'
          details = `请求超时 (${responseTime}ms)`
        } else if (error.response?.status === 404) {
          status = 'not_found'
          details = '接口不存在 (404)'
        } else if (error.response?.status >= 500) {
          status = 'server_error'
          details = `服务器错误 (${error.response.status})`
        }

        results.push({
          endpoint,
          status,
          responseTime,
          details
        })
      }
    }

    return results
  },

  // ========== 新闻分类管理 ==========

  // 获取新闻分类列表
  async getCategories(params?: { isActive?: boolean }): Promise<ApiResponse<NewsCategory[]>> {
    return await newsServiceApi.getNewsCategories(params)
  },

  // 创建新闻分类
  async createCategory(data: Partial<NewsCategory>): Promise<ApiResponse<NewsCategory>> {
    console.log('正在发送创建分类请求:', { url: '/news/categories', data })
    return await newsServiceApi.createNewsCategory(data)
  },

  // 创建新闻分类（使用备用端点）
  async createCategoryFallback(data: Partial<NewsCategory>): Promise<ApiResponse<NewsCategory>> {
    const fallbackEndpoints = [
      '/news/categories',
      '/api/news/categories',
      '/v1/news/categories',
      '/admin/news/categories'
    ]

    let lastError: any

    for (const endpoint of fallbackEndpoints) {
      try {
        console.log(`尝试端点: ${endpoint}`)
        const result = await request.post(endpoint, data, { timeout: 15000 })
        console.log(`端点 ${endpoint} 成功`)
        return result
      } catch (error: any) {
        console.error(`端点 ${endpoint} 失败:`, error)
        lastError = error

        // 如果是404，尝试下一个端点
        if (error.response?.status === 404) {
          continue
        }

        // 如果是其他错误（如超时），也尝试下一个端点
        if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
          continue
        }

        // 如果是认证或权限错误，不再尝试其他端点
        if (error.response?.status === 401 || error.response?.status === 403) {
          break
        }
      }
    }

    throw lastError
  },

  // 创建新闻分类（带重试机制）
  async createCategoryWithRetry(data: Partial<NewsCategory>, maxRetries: number = 3): Promise<ApiResponse<NewsCategory>> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试创建分类 (第 ${attempt} 次)...`)
        const result = await this.createCategory(data)
        console.log('分类创建成功')
        return result
      } catch (error: any) {
        lastError = error
        console.error(`第 ${attempt} 次尝试失败:`, error)

        // 如果是最后一次尝试，或者是不应该重试的错误，直接抛出
        if (attempt === maxRetries ||
          (error.response?.status && error.response.status < 500 && error.response.status !== 408)) {
          break
        }

        // 等待一段时间后重试
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000) // 指数退避，最大5秒
        console.log(`等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  },

  // 更新新闻分类
  async updateCategory(id: number, data: Partial<NewsCategory>): Promise<ApiResponse<NewsCategory>> {
    return await newsServiceApi.updateNewsCategory(id, data)
  },

  // 删除新闻分类
  async deleteCategory(id: number): Promise<ApiResponse<void>> {
    return await newsServiceApi.deleteNewsCategory(id)
  },

  // ========== 新闻文章管理 ==========

  // 获取新闻文章列表
  async getArticles(params?: {
    page?: number
    limit?: number
    categoryId?: number
    status?: string
    isFeatured?: boolean
    isTop?: boolean
    keyword?: string
  }): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    console.log('正在获取文章列表:', { url: '/news/articles', params })
    return await newsServiceApi.getNewsArticles(params)
  },

  // 获取新闻文章列表（使用备用端点）
  async getArticlesFallback(params?: {
    page?: number
    limit?: number
    categoryId?: number
    status?: string
    isFeatured?: boolean
    isTop?: boolean
    keyword?: string
  }): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    // 更现实的备用端点列表，优先使用最可能存在的端点
    const fallbackEndpoints = [
      '/news/articles' // 只使用主要端点，baseURL已经包含/api/v1
    ]

    let lastError: any

    for (const endpoint of fallbackEndpoints) {
      try {
        console.log(`尝试文章列表端点: ${endpoint}`)
        const result = await request.get(endpoint, {
          params,
          timeout: 20000 // 稍微减少单个端点的超时时间
        })
        console.log(`端点 ${endpoint} 成功`)
        return result.data
      } catch (error: any) {
        console.error(`端点 ${endpoint} 失败:`, error)
        lastError = error

        // 如果是404，尝试下一个端点
        if (error.response?.status === 404) {
          console.log(`端点 ${endpoint} 不存在，尝试下一个...`)
          continue
        }

        // 如果是超时，也尝试下一个端点，但记录详细信息
        if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
          console.log(`端点 ${endpoint} 超时，尝试下一个...`)
          continue
        }

        // 如果是认证或权限错误，不再尝试其他端点
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(`认证错误，停止尝试其他端点`)
          break
        }

        // 如果是服务器错误，也尝试下一个端点
        if (error.response?.status >= 500) {
          console.log(`服务器错误，尝试下一个端点...`)
          continue
        }
      }
    }

    throw lastError
  },

  // 获取新闻文章列表（带重试机制）
  async getArticlesWithRetry(params?: {
    page?: number
    limit?: number
    categoryId?: number
    status?: string
    isFeatured?: boolean
    isTop?: boolean
    keyword?: string
  }, maxRetries: number = 2): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`尝试获取文章列表 (第 ${attempt} 次)...`)
        const result = await this.getArticles(params)
        console.log('文章列表获取成功')
        return result
      } catch (error: any) {
        lastError = error
        console.error(`第 ${attempt} 次尝试失败:`, error)

        // 如果是最后一次尝试，或者是不应该重试的错误，直接抛出
        if (attempt === maxRetries ||
          (error.response?.status && error.response.status < 500 && error.response.status !== 408)) {
          console.log(`停止重试: ${attempt === maxRetries ? '达到最大重试次数' : '不可重试的错误'}`)
          break
        }

        // 更快的重试策略：1s, 2s
        const delay = Math.min(1000 * attempt, 3000) // 线性增长，最大3秒
        console.log(`等待 ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  },

  // 获取新闻文章详情
  async getArticleById(id: number): Promise<ApiResponse<NewsArticle>> {
    return await newsServiceApi.getNewsArticleById(id)
  },

  // 创建新闻文章
  async createArticle(data: Partial<NewsArticle>): Promise<ApiResponse<NewsArticle>> {
    return await newsServiceApi.createNewsArticle(data)
  },

  // 更新新闻文章
  async updateArticle(id: number, data: Partial<NewsArticle>): Promise<ApiResponse<NewsArticle>> {
    return await newsServiceApi.updateNewsArticle(id, data)
  },

  // 删除新闻文章
  async deleteArticle(id: number): Promise<ApiResponse<void>> {
    return await newsServiceApi.deleteNewsArticle(id)
  },

  // 发布新闻文章
  async publishArticle(id: number, publishTime?: string): Promise<ApiResponse<NewsArticle>> {
    return await newsServiceApi.publishNewsArticle(id, publishTime)
  },



  // 搜索新闻文章
  async searchArticles(params: {
    keyword: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    return await newsServiceApi.searchNewsArticles(params)
  },



  // ========== 门户网站公开接口 ==========

  // 获取公开新闻列表（门户网站使用）
  getPublicNews(params?: {
    page?: number
    limit?: number
    categoryId?: number
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    return request.get('/public/news', { params })
  },

  // 获取公开新闻详情（门户网站使用）
  getPublicNewsById(id: number): Promise<ApiResponse<NewsArticle>> {
    return request.get(`/public/news/${id}`)
  },

  // 增加新闻浏览量
  async incrementViewCount(id: number): Promise<ApiResponse<void>> {
    return await newsServiceApi.incrementViewCount(id)
  },

  // ========== 兼容旧接口 ==========

  // 获取新闻列表 (兼容旧版本)
  getNews(params: any = {}): Promise<{ data: any }> {
    return this.getArticles(params)
      .then(response => ({ data: response.data }))
  },

  // 获取新闻详情 (兼容旧版本)
  getNewsById(id: string): Promise<{ data: any }> {
    return this.getArticleById(Number(id))
      .then(response => ({ data: response.data }))
  }
}