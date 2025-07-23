import { defineStore } from 'pinia'
import { equipmentApi } from '@/utils/api'

export const useEquipmentStore = defineStore('equipment', {
  state: () => ({
    // 设备列表
    equipmentList: [],
    equipmentTotal: 0,
    
    // 设备分类
    categories: [],
    
    // 当前选中的设备
    currentEquipment: null,
    
    // 维护记录
    maintenanceRecords: [],
    maintenanceTotal: 0,
    
    // 故障记录
    failureRecords: [],
    failureTotal: 0,
    
    // 统计数据
    statistics: {
      total: 0,
      statusDistribution: {},
      categoryDistribution: [],
    },
    
    // 加载状态
    loading: {
      equipment: false,
      maintenance: false,
      failure: false,
      statistics: false,
    },
  }),

  getters: {
    // 正常设备数量
    normalEquipmentCount: (state) => {
      return state.statistics.statusDistribution?.normal || 0
    },
    
    // 故障设备数量
    brokenEquipmentCount: (state) => {
      return state.statistics.statusDistribution?.broken || 0
    },
    
    // 维护中设备数量
    maintenanceEquipmentCount: (state) => {
      return state.statistics.statusDistribution?.maintenance || 0
    },
    
    // 设备状态分布
    statusDistribution: (state) => {
      const distribution = state.statistics.statusDistribution || {}
      return [
        { name: '正常', value: distribution.normal || 0, color: '#52c41a' },
        { name: '维护中', value: distribution.maintenance || 0, color: '#faad14' },
        { name: '故障', value: distribution.broken || 0, color: '#ff4d4f' },
        { name: '已退役', value: distribution.retired || 0, color: '#8c8c8c' },
      ]
    },
  },

  actions: {
    // 获取设备列表
    async fetchEquipmentList(params = {}) {
      this.loading.equipment = true
      try {
        const response = await equipmentApi.getEquipment(params)
        const { data, pagination } = response.data
        
        if (params.page === 1 || !params.page) {
          this.equipmentList = data
        } else {
          this.equipmentList.push(...data)
        }
        
        this.equipmentTotal = pagination?.total || 0
        return response
      } catch (error) {
        console.error('获取设备列表失败:', error)
        throw error
      } finally {
        this.loading.equipment = false
      }
    },

    // 获取设备详情
    async fetchEquipmentDetail(id) {
      try {
        const response = await equipmentApi.getEquipmentById(id)
        this.currentEquipment = response.data
        return response
      } catch (error) {
        console.error('获取设备详情失败:', error)
        throw error
      }
    },

    // 获取设备分类
    async fetchCategories() {
      try {
        const response = await equipmentApi.getCategories()
        this.categories = response.data || []
        return response
      } catch (error) {
        console.error('获取设备分类失败:', error)
        throw error
      }
    },

    // 获取维护记录
    async fetchMaintenanceRecords(params = {}) {
      this.loading.maintenance = true
      try {
        const response = await equipmentApi.getMaintenanceRecords(params)
        const { data, pagination } = response.data
        
        if (params.page === 1 || !params.page) {
          this.maintenanceRecords = data
        } else {
          this.maintenanceRecords.push(...data)
        }
        
        this.maintenanceTotal = pagination?.total || 0
        return response
      } catch (error) {
        console.error('获取维护记录失败:', error)
        throw error
      } finally {
        this.loading.maintenance = false
      }
    },

    // 获取故障记录
    async fetchFailureRecords(params = {}) {
      this.loading.failure = true
      try {
        const response = await equipmentApi.getFailures(params)
        const { data, pagination } = response.data
        
        if (params.page === 1 || !params.page) {
          this.failureRecords = data
        } else {
          this.failureRecords.push(...data)
        }
        
        this.failureTotal = pagination?.total || 0
        return response
      } catch (error) {
        console.error('获取故障记录失败:', error)
        throw error
      } finally {
        this.loading.failure = false
      }
    },

    // 获取统计数据
    async fetchStatistics(params = {}) {
      this.loading.statistics = true
      try {
        const response = await equipmentApi.getEquipmentStatistics(params)
        this.statistics = response.data
        return response
      } catch (error) {
        console.error('获取统计数据失败:', error)
        throw error
      } finally {
        this.loading.statistics = false
      }
    },

    // 报告故障
    async reportFailure(data) {
      try {
        const response = await equipmentApi.reportFailure(data)
        
        // 更新设备状态
        if (this.currentEquipment && this.currentEquipment.id === data.equipment_id) {
          if (data.severity === 'high' || data.severity === 'critical') {
            this.currentEquipment.status = 'broken'
          }
        }
        
        // 刷新故障记录
        await this.fetchFailureRecords({ equipmentId: data.equipment_id, limit: 10 })
        
        return response
      } catch (error) {
        console.error('报告故障失败:', error)
        throw error
      }
    },

    // 创建维护记录
    async createMaintenanceRecord(data) {
      try {
        const response = await equipmentApi.createMaintenanceRecord(data)
        
        // 刷新维护记录
        await this.fetchMaintenanceRecords({ equipmentId: data.equipment_id, limit: 10 })
        
        return response
      } catch (error) {
        console.error('创建维护记录失败:', error)
        throw error
      }
    },

    // 更新设备状态
    async updateEquipmentStatus(id, status) {
      try {
        const response = await equipmentApi.updateEquipmentStatus(id, status)
        
        // 更新本地数据
        if (this.currentEquipment && this.currentEquipment.id === id) {
          this.currentEquipment.status = status
        }
        
        const equipmentIndex = this.equipmentList.findIndex(item => item.id === id)
        if (equipmentIndex !== -1) {
          this.equipmentList[equipmentIndex].status = status
        }
        
        return response
      } catch (error) {
        console.error('更新设备状态失败:', error)
        throw error
      }
    },

    // 搜索设备
    async searchEquipment(keyword) {
      try {
        const response = await this.fetchEquipmentList({
          search: keyword,
          limit: 50,
        })
        return response
      } catch (error) {
        console.error('搜索设备失败:', error)
        throw error
      }
    },

    // 根据编码查找设备
    async findEquipmentByCode(code) {
      try {
        const response = await this.fetchEquipmentList({
          search: code,
          limit: 1,
        })
        
        if (response.data.data && response.data.data.length > 0) {
          return response.data.data[0]
        }
        
        return null
      } catch (error) {
        console.error('根据编码查找设备失败:', error)
        throw error
      }
    },

    // 清空数据
    clearData() {
      this.equipmentList = []
      this.equipmentTotal = 0
      this.currentEquipment = null
      this.maintenanceRecords = []
      this.maintenanceTotal = 0
      this.failureRecords = []
      this.failureTotal = 0
      this.statistics = {
        total: 0,
        statusDistribution: {},
        categoryDistribution: [],
      }
    },

    // 重置加载状态
    resetLoading() {
      this.loading = {
        equipment: false,
        maintenance: false,
        failure: false,
        statistics: false,
      }
    },
  },
})