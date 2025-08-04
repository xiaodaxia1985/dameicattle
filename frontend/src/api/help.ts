import { notificationServiceApi, newsServiceApi } from './microservices'
import type { ApiResponse } from './request'

export interface ChatSession {
  sessionId: string
  subject: string
  status: 'active' | 'ended'
  createdAt: string
}

export interface ChatMessage {
  id: string
  sessionId: string
  message: string
  type: 'text' | 'image' | 'file'
  isStaff: boolean
  user?: {
    id: number
    realName: string
    avatar?: string
  }
  createdAt: string
}

export interface HelpArticle {
  id: number
  title: string
  summary: string
  content: string
  category: string
  viewCount: number
  featured: boolean
  updatedAt: string
}

export interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

export interface Tutorial {
  id: number
  title: string
  description: string
  thumbnailUrl: string
  videoUrl?: string
  duration: number
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  viewCount: number
  userProgress?: {
    progress: number
    completed: boolean
  }
}

export const helpApi = {
  // Chat related APIs - 使用通知服务处理聊天功能
  initChatSession: async (data: { subject: string; initialMessage?: string }): Promise<ApiResponse<ChatSession>> => {
    const response = await notificationServiceApi.post('/chat/init', data)
    return response
  },

  getChatMessages: async (sessionId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> => {
    const response = await notificationServiceApi.get(`/chat/${sessionId}/messages`)
    return response
  },

  sendChatMessage: async (sessionId: string, data: { message: string; type: string }): Promise<ApiResponse<ChatMessage>> => {
    const response = await notificationServiceApi.post(`/chat/${sessionId}/messages`, data)
    return response
  },

  // Search API - 使用新闻服务的搜索功能
  searchHelp: async (query: string): Promise<ApiResponse<{
    articles: HelpArticle[]
    faqs: FAQ[]
    tutorials: Tutorial[]
  }>> => {
    const response = await newsServiceApi.get('/help/search', { q: query })
    return response
  },

  // FAQ APIs - 使用新闻服务处理FAQ
  getFAQ: async (category?: string): Promise<ApiResponse<{ [key: string]: FAQ[] }>> => {
    const response = await newsServiceApi.get('/help/faq', { category })
    return response
  },

  // Tutorial APIs - 使用新闻服务处理教程
  getTutorials: async (params?: { category?: string; level?: string }): Promise<ApiResponse<Tutorial[]>> => {
    const response = await newsServiceApi.get('/help/tutorials', params)
    return response
  },

  // Article APIs - 使用新闻服务处理帮助文章
  getHelpArticles: async (params?: { featured?: boolean; limit?: number }): Promise<ApiResponse<{ items: HelpArticle[] }>> => {
    const response = await newsServiceApi.get('/help/articles', params)
    return response
  },

  getArticle: async (id: number): Promise<ApiResponse<HelpArticle>> => {
    const response = await newsServiceApi.get(`/help/articles/${id}`)
    return response
  },

  // Manual APIs - 使用新闻服务处理手册
  getManualSection: async (section: string): Promise<ApiResponse<{ content: string }>> => {
    const response = await newsServiceApi.get(`/help/manual/${section}`)
    return response
  }
}