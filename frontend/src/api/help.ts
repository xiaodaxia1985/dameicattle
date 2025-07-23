import request from './request'
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
  // Chat related APIs
  initChatSession: (data: { subject: string; initialMessage?: string }): Promise<ApiResponse<ChatSession>> => {
    return request.post('/help/chat/init', data)
  },

  getChatMessages: (sessionId: string): Promise<ApiResponse<{ messages: ChatMessage[] }>> => {
    return request.get(`/help/chat/${sessionId}/messages`)
  },

  sendChatMessage: (sessionId: string, data: { message: string; type: string }): Promise<ApiResponse<ChatMessage>> => {
    return request.post(`/help/chat/${sessionId}/messages`, data)
  },

  // Search API
  searchHelp: (query: string): Promise<ApiResponse<{
    articles: HelpArticle[]
    faqs: FAQ[]
    tutorials: Tutorial[]
  }>> => {
    return request.get('/help/search', { params: { q: query } })
  },

  // FAQ APIs
  getFAQ: (category?: string): Promise<ApiResponse<{ [key: string]: FAQ[] }>> => {
    return request.get('/help/faq', { params: { category } })
  },

  // Tutorial APIs
  getTutorials: (params?: { category?: string; level?: string }): Promise<ApiResponse<Tutorial[]>> => {
    return request.get('/help/tutorials', { params })
  },

  // Article APIs
  getHelpArticles: (params?: { featured?: boolean; limit?: number }): Promise<ApiResponse<{ items: HelpArticle[] }>> => {
    return request.get('/help/articles', { params })
  },

  getArticle: (id: number): Promise<ApiResponse<HelpArticle>> => {
    return request.get(`/help/articles/${id}`)
  },

  // Manual APIs
  getManualSection: (section: string): Promise<ApiResponse<{ content: string }>> => {
    return request.get(`/help/manual/${section}`)
  }
}