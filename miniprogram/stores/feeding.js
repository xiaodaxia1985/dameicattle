import { defineStore } from 'pinia'
import { request } from '@/utils/request'

export const useFeedingStore = defineStore('feeding', {
  state: () => ({
    formulas: [],
    feedingRecords: [],
    loading: false,
    error: null
  }),

  getters: {
    // 获取活跃配方（最近使用的配方）
    activeFormulas: (state) => {
      return state.formulas.filter(formula => formula.isActive)
    },

    // 获取今日饲喂记录
    todayRecords: (state) => {
      const today = new Date().toISOString().split('T')[0]
      return state.feedingRecords.filter(record => 
        record.feedingDate === today
      )
    }
  },

  actions: {
    // 获取饲料配方列表
    async fetchFormulas(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/formulas',
          method: 'GET',
          data: params
        })
        
        if (response.success) {
          this.formulas = response.data.formulas || response.data || []
          return {
            success: true,
            data: this.formulas,
            total: response.data.total || this.formulas.length
          }
        } else {
          throw new Error(response.message || '获取配方列表失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('获取配方列表失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取配方详情
    async fetchFormulaById(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: `/feeding/formulas/${id}`,
          method: 'GET'
        })
        
        if (response.success) {
          return {
            success: true,
            data: response.data.formula || response.data
          }
        } else {
          throw new Error(response.message || '获取配方详情失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('获取配方详情失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取饲喂记录列表
    async fetchFeedingRecords(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/records',
          method: 'GET',
          data: params
        })
        
        if (response.success) {
          const records = response.data.records || response.data || []
          
          // 如果是第一页，替换数据；否则追加数据
          if (params.page === 1 || !params.page) {
            this.feedingRecords = records
          } else {
            this.feedingRecords = [...this.feedingRecords, ...records]
          }
          
          return {
            success: true,
            data: records,
            total: response.data.total || records.length
          }
        } else {
          throw new Error(response.message || '获取饲喂记录失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('获取饲喂记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取今日饲喂记录
    async fetchTodayRecords(params = {}) {
      const today = new Date().toISOString().split('T')[0]
      return this.fetchFeedingRecords({
        ...params,
        startDate: today,
        endDate: today,
        limit: 50
      })
    },

    // 创建饲喂记录
    async createFeedingRecord(data) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/records',
          method: 'POST',
          data
        })
        
        if (response.success) {
          // 将新记录添加到列表开头
          const newRecord = response.data
          this.feedingRecords.unshift(newRecord)
          
          return {
            success: true,
            data: newRecord
          }
        } else {
          throw new Error(response.message || '创建饲喂记录失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('创建饲喂记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 更新饲喂记录
    async updateFeedingRecord(id, data) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: `/feeding/records/${id}`,
          method: 'PUT',
          data
        })
        
        if (response.success) {
          // 更新本地记录
          const index = this.feedingRecords.findIndex(record => record.id === id)
          if (index !== -1) {
            this.feedingRecords[index] = response.data
          }
          
          return {
            success: true,
            data: response.data
          }
        } else {
          throw new Error(response.message || '更新饲喂记录失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('更新饲喂记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 删除饲喂记录
    async deleteFeedingRecord(id) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: `/feeding/records/${id}`,
          method: 'DELETE'
        })
        
        if (response.success) {
          // 从本地列表中移除
          this.feedingRecords = this.feedingRecords.filter(record => record.id !== id)
          
          return {
            success: true
          }
        } else {
          throw new Error(response.message || '删除饲喂记录失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('删除饲喂记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取饲喂统计数据
    async fetchFeedingStatistics(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/statistics',
          method: 'GET',
          data: params
        })
        
        if (response.success) {
          return {
            success: true,
            data: response.data
          }
        } else {
          throw new Error(response.message || '获取统计数据失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('获取统计数据失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 获取饲喂推荐
    async fetchRecommendations(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/recommendations',
          method: 'GET',
          data: params
        })
        
        if (response.success) {
          return {
            success: true,
            data: response.data.recommendations || []
          }
        } else {
          throw new Error(response.message || '获取推荐失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('获取推荐失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 生成饲喂计划
    async generateFeedingPlan(params = {}) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/plans/generate',
          method: 'POST',
          data: params
        })
        
        if (response.success) {
          return {
            success: true,
            data: response.data
          }
        } else {
          throw new Error(response.message || '生成饲喂计划失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('生成饲喂计划失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 批量创建饲喂记录
    async batchCreateFeedingRecords(records) {
      this.loading = true
      this.error = null
      
      try {
        const response = await request({
          url: '/feeding/records/batch',
          method: 'POST',
          data: { records }
        })
        
        if (response.success) {
          // 将新记录添加到列表
          const newRecords = response.data.records || []
          this.feedingRecords = [...newRecords, ...this.feedingRecords]
          
          return {
            success: true,
            data: response.data
          }
        } else {
          throw new Error(response.message || '批量创建记录失败')
        }
      } catch (error) {
        this.error = error.message
        console.error('批量创建记录失败:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // 清除错误状态
    clearError() {
      this.error = null
    },

    // 重置状态
    reset() {
      this.formulas = []
      this.feedingRecords = []
      this.loading = false
      this.error = null
    }
  }
})