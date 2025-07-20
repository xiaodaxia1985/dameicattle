import request from './request'
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
  // ========== 新闻分类管理 ==========
  
  // 获取新闻分类列表
  getCategories(params?: { isActive?: boolean }): Promise<ApiResponse<NewsCategory[]>> {
    return request.get('/news/categories', { params })
  },

  // 创建新闻分类
  createCategory(data: Partial<NewsCategory>): Promise<ApiResponse<NewsCategory>> {
    return request.post('/news/categories', data)
  },

  // 更新新闻分类
  updateCategory(id: number, data: Partial<NewsCategory>): Promise<ApiResponse<NewsCategory>> {
    return request.put(`/news/categories/${id}`, data)
  },

  // 删除新闻分类
  deleteCategory(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/news/categories/${id}`)
  },

  // ========== 新闻文章管理 ==========
  
  // 获取新闻文章列表
  getArticles(params?: {
    page?: number
    limit?: number
    categoryId?: number
    status?: string
    isFeatured?: boolean
    isTop?: boolean
    keyword?: string
  }): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    return request.get('/news/articles', { params })
  },

  // 获取新闻文章详情
  getArticleById(id: number): Promise<ApiResponse<NewsArticle>> {
    return request.get(`/news/articles/${id}`)
  },

  // 创建新闻文章
  createArticle(data: Partial<NewsArticle>): Promise<ApiResponse<NewsArticle>> {
    return request.post('/news/articles', data)
  },

  // 更新新闻文章
  updateArticle(id: number, data: Partial<NewsArticle>): Promise<ApiResponse<NewsArticle>> {
    return request.put(`/news/articles/${id}`, data)
  },

  // 删除新闻文章
  deleteArticle(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/news/articles/${id}`)
  },

  // 发布新闻文章
  publishArticle(id: number, publishTime?: string): Promise<ApiResponse<NewsArticle>> {
    return request.post(`/news/articles/${id}/publish`, { publishTime })
  },

  // 点赞新闻文章
  likeArticle(id: number): Promise<ApiResponse<void>> {
    return request.post(`/news/articles/${id}/like`)
  },

  // 搜索新闻文章
  searchArticles(params: {
    keyword: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<PaginatedResponse<NewsArticle>>> {
    return request.get('/news/articles/search', { params })
  },

  // ========== 新闻评论管理 ==========
  
  // 获取文章评论列表
  getComments(articleId: number, params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<ApiResponse<PaginatedResponse<NewsComment>>> {
    return request.get(`/news/articles/${articleId}/comments`, { params })
  },

  // 创建评论
  createComment(articleId: number, data: {
    userName: string
    userEmail?: string
    userPhone?: string
    content: string
    parentId?: number
  }): Promise<ApiResponse<NewsComment>> {
    return request.post(`/news/articles/${articleId}/comments`, data)
  },

  // 更新评论状态
  updateCommentStatus(id: number, status: string): Promise<ApiResponse<NewsComment>> {
    return request.put(`/news/comments/${id}/status`, { status })
  },

  // 删除评论
  deleteComment(id: number): Promise<ApiResponse<void>> {
    return request.delete(`/news/comments/${id}`)
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