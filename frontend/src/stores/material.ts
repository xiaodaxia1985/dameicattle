import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { materialApi } from '@/api/material'
import { safeApiCall } from '@/utils/errorHandler'
import { ensureArray, ensureNumber, safeGet } from '@/utils/safeAccess'
import { validateDataArray } from '@/utils/dataValidation'
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
    const result = await safeApiCall(
      () => materialApi.getCategories(),
      {
        showMessage: false,
        fallbackValue: { data: [] }
      }
    )
    
    categories.value = ensureArray(safeGet(result, 'data', []))
  }

  const fetchSuppliers = async (params?: MaterialListParams) => {
    loading.value = true
    try {
      const result = await safeApiCall(
        () => materialApi.getSuppliers(params),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      suppliers.value = ensureArray(safeGet(result, 'data', []))
      total.value = ensureNumber(safeGet(result, 'pagination.total', 0))
    } finally {
      loading.value = false
    }
  }

  const fetchMaterials = async (params?: MaterialListParams) => {
    loading.value = true
    try {
      const result = await safeApiCall(
        () => materialApi.getProductionMaterials(params),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      materials.value = ensureArray(safeGet(result, 'data', []))
      total.value = ensureNumber(safeGet(result, 'pagination.total', 0))
    } finally {
      loading.value = false
    }
  }

  const fetchInventory = async (params?: InventoryListParams) => {
    loading.value = true
    try {
      const result = await safeApiCall(
        () => materialApi.getInventory(params),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      inventory.value = ensureArray(safeGet(result, 'data', []))
      total.value = ensureNumber(safeGet(result, 'pagination.total', 0))
    } finally {
      loading.value = false
    }
  }

  const fetchTransactions = async (params?: TransactionListParams) => {
    loading.value = true
    try {
      const result = await safeApiCall(
        () => materialApi.getInventoryTransactions(params),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      transactions.value = ensureArray(safeGet(result, 'data', []))
      total.value = ensureNumber(safeGet(result, 'pagination.total', 0))
    } finally {
      loading.value = false
    }
  }

  const fetchAlerts = async (params?: { base_id?: number }) => {
    loading.value = true
    try {
      const result = await safeApiCall(
        () => materialApi.getInventoryAlerts(params),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      alerts.value = ensureArray(safeGet(result, 'data', []))
      total.value = ensureNumber(safeGet(result, 'pagination.total', 0))
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async () => {
    const result = await safeApiCall(
      () => materialApi.getInventoryStatistics(),
      {
        showMessage: false,
        fallbackValue: { data: null }
      }
    )
    
    statistics.value = safeGet(result, 'data', null)
  }

  const createCategory = async (data: any) => {
    const result = await safeApiCall(
      () => materialApi.createCategory(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      categories.value.push(result.data)
      return result.data
    }
    throw new Error('创建物资分类失败')
  }

  const updateCategory = async (id: number, data: any) => {
    const result = await safeApiCall(
      () => materialApi.updateCategory(ensureNumber(id, 0), data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      const index = categories.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        categories.value[index] = result.data
      }
      return result.data
    }
    throw new Error('更新物资分类失败')
  }

  const deleteCategory = async (id: number) => {
    const result = await safeApiCall(
      () => materialApi.deleteCategory(ensureNumber(id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      categories.value = categories.value.filter(item => ensureNumber(item.id, -1) !== ensureNumber(id, 0))
    } else {
      throw new Error('删除物资分类失败')
    }
  }

  const createSupplier = async (data: any) => {
    const result = await safeApiCall(
      () => materialApi.createSupplier(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      suppliers.value.push(result.data)
      return result.data
    }
    throw new Error('创建供应商失败')
  }

  const updateSupplier = async (id: number, data: any) => {
    const result = await safeApiCall(
      () => materialApi.updateSupplier(ensureNumber(id, 0), data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      const index = suppliers.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        suppliers.value[index] = result.data
      }
      return result.data
    }
    throw new Error('更新供应商失败')
  }

  const deleteSupplier = async (id: number) => {
    const result = await safeApiCall(
      () => materialApi.deleteSupplier(ensureNumber(id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      suppliers.value = suppliers.value.filter(item => ensureNumber(item.id, -1) !== ensureNumber(id, 0))
    } else {
      throw new Error('删除供应商失败')
    }
  }

  const createMaterial = async (data: any) => {
    const result = await safeApiCall(
      () => materialApi.createProductionMaterial(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      materials.value.push(result.data)
      return result.data
    }
    throw new Error('创建物资失败')
  }

  const updateMaterial = async (id: number, data: any) => {
    const result = await safeApiCall(
      () => materialApi.updateProductionMaterial(ensureNumber(id, 0), data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      const index = materials.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        materials.value[index] = result.data
      }
      return result.data
    }
    throw new Error('更新物资失败')
  }

  const deleteMaterial = async (id: number) => {
    const result = await safeApiCall(
      () => materialApi.deleteProductionMaterial(ensureNumber(id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      materials.value = materials.value.filter(item => ensureNumber(item.id, -1) !== ensureNumber(id, 0))
    } else {
      throw new Error('删除物资失败')
    }
  }

  const createTransaction = async (data: any) => {
    const result = await safeApiCall(
      () => materialApi.createInventoryTransaction(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      transactions.value.unshift(result.data)
      // 刷新库存数据
      await fetchInventory()
      return result.data
    }
    throw new Error('创建库存交易失败')
  }

  const resolveAlert = async (id: number) => {
    const result = await safeApiCall(
      () => materialApi.resolveInventoryAlert(ensureNumber(id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      const index = alerts.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        alerts.value[index].is_resolved = true
        alerts.value[index].resolved_at = new Date().toISOString()
      }
    } else {
      throw new Error('解决预警失败')
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