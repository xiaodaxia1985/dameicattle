import { defineStore } from 'pinia'
import { ref } from 'vue'
import { healthApi } from '@/api/health'
import type { HealthRecord, VaccinationRecord, HealthStatistics } from '@/api/health'

export const useHealthStore = defineStore('health', () => {
  const healthRecords = ref<HealthRecord[]>([])
  const vaccinationRecords = ref<VaccinationRecord[]>([])
  const healthStats = ref<HealthStatistics | null>(null)
  const loading = ref(false)

  // 获取健康记录列表
  const fetchHealthRecords = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await healthApi.getHealthRecords(params)
      healthRecords.value = response.data.data
      return response.data
    } catch (error) {
      console.error('获取健康记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取疫苗接种记录
  const fetchVaccinationRecords = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await healthApi.getVaccinationRecords(params)
      vaccinationRecords.value = response.data.data
      return response.data
    } catch (error) {
      console.error('获取疫苗记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取健康统计
  const fetchHealthStatistics = async (params: any = {}) => {
    loading.value = true
    try {
      const response = await healthApi.getHealthStatistics(params)
      healthStats.value = response.data
      return response.data
    } catch (error) {
      console.error('获取健康统计失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建健康记录
  const createHealthRecord = async (data: any) => {
    loading.value = true
    try {
      const response = await healthApi.createHealthRecord(data)
      healthRecords.value.unshift(response.data)
      return response.data
    } catch (error) {
      console.error('创建健康记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    healthRecords,
    vaccinationRecords,
    healthStats,
    loading,
    fetchHealthRecords,
    fetchVaccinationRecords,
    fetchHealthStatistics,
    createHealthRecord
  }
})