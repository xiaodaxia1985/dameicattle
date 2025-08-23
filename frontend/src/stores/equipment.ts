import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { equipmentApi } from '@/api/equipment'
import { safeApiCall } from '@/utils/errorHandler'
import { ensureArray, ensureNumber, safeGet } from '@/utils/safeAccess'

interface Equipment {
  id: number
  name: string
  code: string
  category_id: number
  base_id: number
  status: string
  purchase_date?: string
  warranty_expires?: string
  purchase_price?: number
  supplier?: string
  model?: string
  serial_number?: string
}

interface EquipmentCategory {
  id: number
  name: string
  description?: string
}

interface MaintenanceRecord {
  id: number
  equipment_id: number
  maintenance_date: string
  maintenance_type: string
  description: string
  cost?: number
  technician?: string
  next_maintenance?: string
}

interface MaintenancePlan {
  id: number
  equipment_id: number
  plan_name: string
  frequency: string
  description?: string
  next_date: string
  is_active: boolean
}

interface EquipmentFailure {
  id: number
  equipment_id: number
  reported_date: string
  description: string
  status: string
  severity: string
  reporter?: string
  assigned_to?: string
  resolved_date?: string
}

interface EquipmentStatistics {
  total_equipment: number
  active_equipment: number
  maintenance_equipment: number
  failed_equipment: number
  maintenance_due_count: number
}

export const useEquipmentStore = defineStore('equipment', () => {
  // State
  const equipment = ref<Equipment[]>([])
  const categories = ref<EquipmentCategory[]>([])
  const maintenanceRecords = ref<MaintenanceRecord[]>([])
  const maintenancePlans = ref<MaintenancePlan[]>([])
  const failures = ref<EquipmentFailure[]>([])
  const statistics = ref<EquipmentStatistics | null>(null)
  
  const loading = ref(false)
  const total = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Computed
  const activeEquipmentCount = computed(() => 
    equipment.value.filter(item => item.status === 'active').length
  )

  const maintenanceEquipmentCount = computed(() =>
    equipment.value.filter(item => item.status === 'maintenance').length
  )

  const failedEquipmentCount = computed(() =>
    equipment.value.filter(item => item.status === 'failed').length
  )

  const pendingFailuresCount = computed(() =>
    failures.value.filter(failure => failure.status === 'pending').length
  )

  // Actions
  const fetchCategories = async () => {
    const result = await safeApiCall(
      () => equipmentApi.getCategories(),
      {
        showMessage: false,
        fallbackValue: { data: [] }
      }
    )
    
    categories.value = ensureArray(safeGet(result, 'data', []))
  }

  const fetchEquipment = async (params: any = {}) => {
    loading.value = true
    try {
      // 权限控制：根据用户角色获取设备数据
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      const user = authStore.user
      
      console.log('🔄 equipmentStore.fetchEquipment: 开始获取设备列表...')
      console.log('👤 当前用户信息:', {
        username: user?.username,
        role: user?.role,
        base_id: user?.base_id,
        isAdminUser: user?.role === 'admin' || user?.role === 'super_admin'
      })
      
      let finalParams = { ...params }
      
      // 如果不是管理员，只能看到自己基地的设备
      if (user && user.role !== 'admin' && user.role !== 'super_admin') {
        if (user.base_id) {
          finalParams.base_id = user.base_id
          console.log('🔒 非管理员用户，限制查看基地:', user.base_id)
        } else {
          console.warn('⚠️ 用户没有关联基地，将返回空结果')
          equipment.value = []
          total.value = 0
          return
        }
      }
      
      console.log('📤 最终请求参数:', finalParams)
      
      const result = await safeApiCall(
        () => equipmentApi.getEquipment(finalParams),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      // 处理不同的响应数据格式
      const responseData = safeGet(result, 'data', {})
      
      let equipmentData = []
      let totalCount = 0
      
      if (Array.isArray(responseData)) {
        equipmentData = responseData
        totalCount = equipmentData.length
      } else if (responseData.data && Array.isArray(responseData.data)) {
        equipmentData = responseData.data
        totalCount = responseData.total || responseData.pagination?.total || equipmentData.length
      } else if (responseData.equipment && Array.isArray(responseData.equipment)) {
        equipmentData = responseData.equipment
        totalCount = responseData.total || responseData.pagination?.total || equipmentData.length
      } else if (responseData.items && Array.isArray(responseData.items)) {
        equipmentData = responseData.items
        totalCount = responseData.total || responseData.pagination?.total || equipmentData.length
      }
      
      equipment.value = ensureArray(equipmentData)
      total.value = ensureNumber(totalCount)
      
      console.log('✅ 设备列表获取成功:', {
        equipmentCount: equipment.value.length,
        total: total.value,
        sampleEquipment: equipment.value[0] || null
      })
    } finally {
      loading.value = false
    }
  }

  const fetchMaintenanceRecords = async (params: any = {}) => {
    loading.value = true
    try {
      // 权限控制：根据用户角色获取维护记录
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      const user = authStore.user
      
      console.log('🔄 equipmentStore.fetchMaintenanceRecords: 开始获取维护记录...')
      
      let finalParams = { ...params }
      
      // 如果不是管理员，只能看到自己基地的维护记录
      if (user && user.role !== 'admin' && user.role !== 'super_admin') {
        if (user.base_id) {
          finalParams.base_id = user.base_id
          console.log('🔒 非管理员用户，限制查看基地:', user.base_id)
        } else {
          console.warn('⚠️ 用户没有关联基地，将返回空结果')
          maintenanceRecords.value = []
          total.value = 0
          return
        }
      }
      
      const result = await safeApiCall(
        () => equipmentApi.getMaintenanceRecords(finalParams),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      const responseData = safeGet(result, 'data', {})
      let recordsData = []
      let totalCount = 0
      
      if (Array.isArray(responseData)) {
        recordsData = responseData
        totalCount = recordsData.length
      } else if (responseData.data && Array.isArray(responseData.data)) {
        recordsData = responseData.data
        totalCount = responseData.total || responseData.pagination?.total || recordsData.length
      } else if (responseData.records && Array.isArray(responseData.records)) {
        recordsData = responseData.records
        totalCount = responseData.total || responseData.pagination?.total || recordsData.length
      }
      
      maintenanceRecords.value = ensureArray(recordsData)
      total.value = ensureNumber(totalCount)
      
      console.log('✅ 维护记录获取成功:', {
        recordsCount: maintenanceRecords.value.length,
        total: total.value
      })
    } finally {
      loading.value = false
    }
  }

  const fetchMaintenancePlans = async (params: any = {}) => {
    loading.value = true
    try {
      // 权限控制：根据用户角色获取维护计划
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      const user = authStore.user
      
      console.log('🔄 equipmentStore.fetchMaintenancePlans: 开始获取维护计划...')
      
      let finalParams = { ...params }
      
      // 如果不是管理员，只能看到自己基地的维护计划
      if (user && user.role !== 'admin' && user.role !== 'super_admin') {
        if (user.base_id) {
          finalParams.base_id = user.base_id
          console.log('🔒 非管理员用户，限制查看基地:', user.base_id)
        } else {
          console.warn('⚠️ 用户没有关联基地，将返回空结果')
          maintenancePlans.value = []
          total.value = 0
          return
        }
      }
      
      const result = await safeApiCall(
        () => equipmentApi.getMaintenancePlans(finalParams),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      const responseData = safeGet(result, 'data', {})
      let plansData = []
      let totalCount = 0
      
      if (Array.isArray(responseData)) {
        plansData = responseData
        totalCount = plansData.length
      } else if (responseData.data && Array.isArray(responseData.data)) {
        plansData = responseData.data
        totalCount = responseData.total || responseData.pagination?.total || plansData.length
      } else if (responseData.plans && Array.isArray(responseData.plans)) {
        plansData = responseData.plans
        totalCount = responseData.total || responseData.pagination?.total || plansData.length
      }
      
      maintenancePlans.value = ensureArray(plansData)
      total.value = ensureNumber(totalCount)
      
      console.log('✅ 维护计划获取成功:', {
        plansCount: maintenancePlans.value.length,
        total: total.value
      })
    } finally {
      loading.value = false
    }
  }

  const fetchFailures = async (params: any = {}) => {
    loading.value = true
    try {
      // 权限控制：根据用户角色获取故障记录
      const { useAuthStore } = await import('@/stores/auth')
      const authStore = useAuthStore()
      const user = authStore.user
      
      console.log('🔄 equipmentStore.fetchFailures: 开始获取故障记录...')
      
      let finalParams = { ...params }
      
      // 如果不是管理员，只能看到自己基地的故障记录
      if (user && user.role !== 'admin' && user.role !== 'super_admin') {
        if (user.base_id) {
          finalParams.base_id = user.base_id
          console.log('🔒 非管理员用户，限制查看基地:', user.base_id)
        } else {
          console.warn('⚠️ 用户没有关联基地，将返回空结果')
          failures.value = []
          total.value = 0
          return
        }
      }
      
      const result = await safeApiCall(
        () => equipmentApi.getFailures(finalParams),
        {
          showMessage: false,
          fallbackValue: { data: [], pagination: { total: 0 } }
        }
      )
      
      const responseData = safeGet(result, 'data', {})
      let failuresData = []
      let totalCount = 0
      
      if (Array.isArray(responseData)) {
        failuresData = responseData
        totalCount = failuresData.length
      } else if (responseData.data && Array.isArray(responseData.data)) {
        failuresData = responseData.data
        totalCount = responseData.total || responseData.pagination?.total || failuresData.length
      } else if (responseData.failures && Array.isArray(responseData.failures)) {
        failuresData = responseData.failures
        totalCount = responseData.total || responseData.pagination?.total || failuresData.length
      }
      
      failures.value = ensureArray(failuresData)
      total.value = ensureNumber(totalCount)
      
      console.log('✅ 故障记录获取成功:', {
        failuresCount: failures.value.length,
        total: total.value
      })
    } finally {
      loading.value = false
    }
  }

  const fetchStatistics = async (baseId?: number) => {
    // 权限控制：根据用户角色获取统计数据
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    const user = authStore.user
    
    console.log('🔄 equipmentStore.fetchStatistics: 开始获取统计数据...')
    
    let finalBaseId = baseId
    
    // 如果不是管理员，只能看到自己基地的统计数据
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      if (user.base_id) {
        finalBaseId = user.base_id
        console.log('🔒 非管理员用户，限制查看基地:', user.base_id)
      } else {
        console.warn('⚠️ 用户没有关联基地，将返回空统计')
        statistics.value = null
        return
      }
    }
    
    const result = await safeApiCall(
      () => equipmentApi.getEquipmentStatistics({ baseId: finalBaseId }),
      {
        showMessage: false,
        fallbackValue: { data: null }
      }
    )
    
    statistics.value = safeGet(result, 'data', null)
    
    console.log('✅ 统计数据获取成功:', statistics.value)
  }

  // Equipment CRUD operations
  const createEquipment = async (data: any) => {
    const result = await safeApiCall(
      () => equipmentApi.createEquipment(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      equipment.value.push(result.data)
      return result.data
    }
    throw new Error('创建设备失败')
  }

  const updateEquipment = async (id: number, data: any) => {
    const result = await safeApiCall(
      () => equipmentApi.updateEquipment(ensureNumber(id, 0), data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      const index = equipment.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        equipment.value[index] = result.data
      }
      return result.data
    }
    throw new Error('更新设备失败')
  }

  const deleteEquipment = async (id: number) => {
    const result = await safeApiCall(
      () => equipmentApi.deleteEquipment(ensureNumber(id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      equipment.value = equipment.value.filter(item => ensureNumber(item.id, -1) !== ensureNumber(id, 0))
    } else {
      throw new Error('删除设备失败')
    }
  }

  const updateEquipmentStatus = async (id: number, status: string) => {
    const result = await safeApiCall(
      () => equipmentApi.updateEquipmentStatus(ensureNumber(id, 0), status),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      const index = equipment.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        equipment.value[index].status = status
      }
      return result.data
    }
    throw new Error('更新设备状态失败')
  }

  // Maintenance operations
  const createMaintenanceRecord = async (data: any) => {
    const result = await safeApiCall(
      () => equipmentApi.createMaintenanceRecord(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      maintenanceRecords.value.unshift(result.data)
      return result.data
    }
    throw new Error('创建维护记录失败')
  }

  const createMaintenancePlan = async (data: any) => {
    const result = await safeApiCall(
      () => equipmentApi.createMaintenancePlan(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      maintenancePlans.value.push(result.data)
      return result.data
    }
    throw new Error('创建维护计划失败')
  }

  // Failure reporting
  const reportFailure = async (data: any) => {
    const result = await safeApiCall(
      () => equipmentApi.reportFailure(data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      failures.value.unshift(result.data)
      return result.data
    }
    throw new Error('报告故障失败')
  }

  const updateFailureStatus = async (id: number, data: any) => {
    const result = await safeApiCall(
      () => equipmentApi.updateFailureStatus(ensureNumber(id, 0), data),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result && result.data) {
      const index = failures.value.findIndex(item => ensureNumber(item.id, -1) === ensureNumber(id, 0))
      if (index !== -1) {
        failures.value[index] = { ...failures.value[index], ...result.data }
      }
      return result.data
    }
    throw new Error('更新故障状态失败')
  }

  const resetState = () => {
    equipment.value = []
    categories.value = []
    maintenanceRecords.value = []
    maintenancePlans.value = []
    failures.value = []
    statistics.value = null
    total.value = 0
    currentPage.value = 1
  }

  return {
    // State
    equipment,
    categories,
    maintenanceRecords,
    maintenancePlans,
    failures,
    statistics,
    loading,
    total,
    currentPage,
    pageSize,

    // Computed
    activeEquipmentCount,
    maintenanceEquipmentCount,
    failedEquipmentCount,
    pendingFailuresCount,

    // Actions
    fetchCategories,
    fetchEquipment,
    fetchMaintenanceRecords,
    fetchMaintenancePlans,
    fetchFailures,
    fetchStatistics,
    createEquipment,
    updateEquipment,
    deleteEquipment,
    updateEquipmentStatus,
    createMaintenanceRecord,
    createMaintenancePlan,
    reportFailure,
    updateFailureStatus,
    resetState
  }
})