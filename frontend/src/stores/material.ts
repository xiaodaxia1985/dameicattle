import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { materialApi } from '@/api/material'
import type {
  MaterialCategory,
  Supplier,
  ProductionMaterial,
  Inventory,
  InventoryTransaction,
  InventoryAlert,
  MaterialListParams,
  InventoryListParams,
  TransactionListParams,
  InventoryStatistics
} from '@/types/material'

export const useMaterialStore = defineStore('material', () => {
  // State
  const categories = ref<MaterialCategory[]>([])
  const suppliers = ref<Supplier[]>([])
  const materials = ref<ProductionMaterial[]>([])
  const inventory = ref<Inventory[]>([])
  const transactions = ref<InventoryTransaction[]>([])
  const alerts = ref<InventoryAlert[]>([])
  const statistics = ref<InventoryStatistics | null>(null)
  
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Computed
  const lowStockCount = computed(() => 
    inventory.value.filter(item => 
      item.current_stock <= (item.material?.safety_stock || 0)
    ).length
  )

  const totalInventoryValue = computed(() =>
    inventory.value.reduce((sum, item) => 
      sum + (item.current_stock * (item.material?.purchase_price || 0)), 0
    )
  )

  const activeAlertsCount = computed(() =>
    alerts.value.filter(alert => !alert.is_resolved).length
  )

  // Actions
  const fetchCategories = async () => {
    try {
      const response = await materialApi.getCategories()
      categories.value = response.data
    } catch (error) {
      console.error('获取物资分类失败:', error)
      throw error
    }
  }

  const fetchSuppliers = async (params?: MaterialListParams) => {
    loading.value = true
    try {
      const response = await materialApi.getSuppliers(params)
      suppliers.value = response.data
      total.value = response.pagination.total
    } catch (error) {
      console.error('获取供应商列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchMaterials = async (params?: MaterialListParams) => {
    loading.value = true
    try {
      const response = await materialApi.getProductionMaterials(params)
      materials.value = response.data
      total.value = response.pagination.total
    } catch (error) {
      console.error('获取物资列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchInventory = async (params?: InventoryListParams) => {
    loading.value = true
    try {
      const response = await materialApi.getInventory(params)
      inventory.value = response.data
      total.value = response.pagination.total
    } catch (error) {
      console.error('获取库存列表失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchTransactions = async (params?: TransactionListParams) => {
    loading.value = true
    try {
      const response = await materialApi.getInventoryTransactions(params)
      transactions.value = response.data
      total.value = response.pagination.total
    } catch (error) {
      console.error('获取交易记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchAlerts = async (params?: { base_id?: number }) => {
    loading.value = true
    try {
      const response = await materialApi.getInventoryAlerts(params)
      alerts.value = response.data
      total.value = response.pagination.total
    } catch (error) {
      console.error('获取库存预警失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await materialApi.getInventoryStatistics()
      statistics.value = response.data
    } catch (error) {
      console.error('获取库存统计失败:', error)
      throw error
    }
  }

  const createCategory = async (data: any) => {
    try {
      const response = await materialApi.createCategory(data)
      categories.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('创建物资分类失败:', error)
      throw error
    }
  }

  const updateCategory = async (id: number, data: any) => {
    try {
      const response = await materialApi.updateCategory(id, data)
      const index = categories.value.findIndex(item => item.id === id)
      if (index !== -1) {
        categories.value[index] = response.data
      }
      return response.data
    } catch (error) {
      console.error('更新物资分类失败:', error)
      throw error
    }
  }

  const deleteCategory = async (id: number) => {
    try {
      await materialApi.deleteCategory(id)
      categories.value = categories.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('删除物资分类失败:', error)
      throw error
    }
  }

  const createSupplier = async (data: any) => {
    try {
      const response = await materialApi.createSupplier(data)
      suppliers.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('创建供应商失败:', error)
      throw error
    }
  }

  const updateSupplier = async (id: number, data: any) => {
    try {
      const response = await materialApi.updateSupplier(id, data)
      const index = suppliers.value.findIndex(item => item.id === id)
      if (index !== -1) {
        suppliers.value[index] = response.data
      }
      return response.data
    } catch (error) {
      console.error('更新供应商失败:', error)
      throw error
    }
  }

  const deleteSupplier = async (id: number) => {
    try {
      await materialApi.deleteSupplier(id)
      suppliers.value = suppliers.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('删除供应商失败:', error)
      throw error
    }
  }

  const createMaterial = async (data: any) => {
    try {
      const response = await materialApi.createProductionMaterial(data)
      materials.value.push(response.data)
      return response.data
    } catch (error) {
      console.error('创建物资失败:', error)
      throw error
    }
  }

  const updateMaterial = async (id: number, data: any) => {
    try {
      const response = await materialApi.updateProductionMaterial(id, data)
      const index = materials.value.findIndex(item => item.id === id)
      if (index !== -1) {
        materials.value[index] = response.data
      }
      return response.data
    } catch (error) {
      console.error('更新物资失败:', error)
      throw error
    }
  }

  const deleteMaterial = async (id: number) => {
    try {
      await materialApi.deleteProductionMaterial(id)
      materials.value = materials.value.filter(item => item.id !== id)
    } catch (error) {
      console.error('删除物资失败:', error)
      throw error
    }
  }

  const createTransaction = async (data: any) => {
    try {
      const response = await materialApi.createInventoryTransaction(data)
      transactions.value.unshift(response.data)
      // 刷新库存数据
      await fetchInventory()
      return response.data
    } catch (error) {
      console.error('创建库存交易失败:', error)
      throw error
    }
  }

  const resolveAlert = async (id: number) => {
    try {
      await materialApi.resolveInventoryAlert(id)
      const index = alerts.value.findIndex(item => item.id === id)
      if (index !== -1) {
        alerts.value[index].is_resolved = true
        alerts.value[index].resolved_at = new Date().toISOString()
      }
    } catch (error) {
      console.error('解决预警失败:', error)
      throw error
    }
  }

  const resetState = () => {
    categories.value = []
    suppliers.value = []
    materials.value = []
    inventory.value = []
    transactions.value = []
    alerts.value = []
    statistics.value = null
    total.value = 0
    currentPage.value = 1
  }

  return {
    // State
    categories,
    suppliers,
    materials,
    inventory,
    transactions,
    alerts,
    statistics,
    loading,
    total,
    currentPage,
    pageSize,

    // Computed
    lowStockCount,
    totalInventoryValue,
    activeAlertsCount,

    // Actions
    fetchCategories,
    fetchSuppliers,
    fetchMaterials,
    fetchInventory,
    fetchTransactions,
    fetchAlerts,
    fetchStatistics,
    createCategory,
    updateCategory,
    deleteCategory,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    createTransaction,
    resolveAlert,
    resetState
  }
})