/**
 * 模块修复工具
 * 用于修复各个功能模块的数据处理问题
 */

import { ElMessage } from 'element-plus'

// 安全的表单引用处理
export function safeFormValidate(formRef: any): Promise<boolean> {
  return new Promise((resolve) => {
    if (!formRef || !formRef.value) {
      console.warn('表单引用为空')
      resolve(false)
      return
    }

    if (typeof formRef.value.validate !== 'function') {
      console.warn('表单验证方法不存在')
      resolve(false)
      return
    }

    formRef.value.validate((valid: boolean) => {
      resolve(valid)
    }).catch(() => {
      resolve(false)
    })
  })
}

// 安全的表单重置
export function safeFormReset(formRef: any) {
  if (formRef && formRef.value && typeof formRef.value.resetFields === 'function') {
    formRef.value.resetFields()
  }
}

// 安全的表单清除验证
export function safeFormClearValidate(formRef: any) {
  if (formRef && formRef.value && typeof formRef.value.clearValidate === 'function') {
    formRef.value.clearValidate()
  }
}

// 修复健康记录数据
export function fixHealthRecordData(record: any) {
  if (!record || typeof record !== 'object') {
    return null
  }

  return {
    id: record.id || '',
    cattleId: record.cattle_id || record.cattleId || '',
    cattleEarTag: record.cattle_ear_tag || record.cattleEarTag || record.cattle?.ear_tag || '',
    symptoms: record.symptoms || '',
    diagnosis: record.diagnosis || '',
    treatment: record.treatment || '',
    veterinarianId: record.veterinarian_id || record.veterinarianId || '',
    veterinarianName: record.veterinarian_name || record.veterinarianName || record.veterinarian?.name || '',
    diagnosisDate: record.diagnosis_date || record.diagnosisDate || '',
    status: record.status || 'ongoing',
    createdAt: record.created_at || record.createdAt || '',
    updatedAt: record.updated_at || record.updatedAt || ''
  }
}

// 修复饲料配方数据
export function fixFormulaData(formula: any) {
  if (!formula || typeof formula !== 'object') {
    return null
  }

  return {
    id: formula.id || '',
    name: formula.name || '',
    description: formula.description || '',
    ingredients: Array.isArray(formula.ingredients) ? formula.ingredients : [],
    costPerKg: typeof formula.cost_per_kg === 'number' ? formula.cost_per_kg : 
               typeof formula.costPerKg === 'number' ? formula.costPerKg : 0,
    createdBy: formula.created_by || formula.createdBy || '',
    createdByName: formula.created_by_name || formula.createdByName || '',
    createdAt: formula.created_at || formula.createdAt || '',
    updatedAt: formula.updated_at || formula.updatedAt || ''
  }
}

// 修复饲喂记录数据
export function fixFeedingRecordData(record: any) {
  if (!record || typeof record !== 'object') {
    return null
  }

  return {
    id: record.id || '',
    formulaId: record.formula_id || record.formulaId || '',
    formulaName: record.formula_name || record.formulaName || record.formula?.name || '',
    baseId: record.base_id || record.baseId || 0,
    baseName: record.base_name || record.baseName || record.base?.name || '',
    barnId: record.barn_id || record.barnId || 0,
    barnName: record.barn_name || record.barnName || record.barn?.name || '',
    amount: typeof record.amount === 'number' ? record.amount : parseFloat(record.amount) || 0,
    feedingDate: record.feeding_date || record.feedingDate || '',
    operatorId: record.operator_id || record.operatorId || '',
    operatorName: record.operator_name || record.operatorName || record.operator?.name || '',
    cost: typeof record.cost === 'number' ? record.cost : parseFloat(record.cost) || 0,
    remark: record.remark || '',
    createdAt: record.created_at || record.createdAt || ''
  }
}

// 修复销售订单数据
export function fixSalesOrderData(order: any) {
  if (!order || typeof order !== 'object') {
    return null
  }

  return {
    id: order.id || 0,
    order_number: order.order_number || order.orderNumber || '',
    customer_id: order.customer_id || order.customerId || 0,
    base_id: order.base_id || order.baseId || 0,
    total_amount: typeof order.total_amount === 'number' ? order.total_amount : 
                  typeof order.totalAmount === 'number' ? order.totalAmount : 0,
    status: order.status || 'pending',
    payment_status: order.payment_status || order.paymentStatus || 'unpaid',
    order_date: order.order_date || order.orderDate || '',
    delivery_date: order.delivery_date || order.deliveryDate || null,
    customer: order.customer || null,
    creator: order.creator || null,
    created_at: order.created_at || order.createdAt || '',
    updated_at: order.updated_at || order.updatedAt || ''
  }
}

// 修复采购订单数据
export function fixProcurementOrderData(order: any) {
  if (!order || typeof order !== 'object') {
    return null
  }

  return {
    id: order.id || 0,
    orderNumber: order.order_number || order.orderNumber || '',
    supplierId: order.supplier_id || order.supplierId || 0,
    supplierName: order.supplier_name || order.supplierName || order.supplier?.name || '',
    baseId: order.base_id || order.baseId || 0,
    baseName: order.base_name || order.baseName || order.base?.name || '',
    orderType: order.order_type || order.orderType || 'material',
    totalAmount: typeof order.total_amount === 'number' ? order.total_amount : 
                 typeof order.totalAmount === 'number' ? order.totalAmount : 0,
    taxAmount: typeof order.tax_amount === 'number' ? order.tax_amount : 
               typeof order.taxAmount === 'number' ? order.taxAmount : 0,
    discountAmount: typeof order.discount_amount === 'number' ? order.discount_amount : 
                    typeof order.discountAmount === 'number' ? order.discountAmount : 0,
    status: order.status || 'pending',
    paymentStatus: order.payment_status || order.paymentStatus || 'unpaid',
    paymentMethod: order.payment_method || order.paymentMethod || '',
    orderDate: order.order_date || order.orderDate || '',
    expectedDeliveryDate: order.expected_delivery_date || order.expectedDeliveryDate || null,
    actualDeliveryDate: order.actual_delivery_date || order.actualDeliveryDate || null,
    contractNumber: order.contract_number || order.contractNumber || '',
    remark: order.remark || '',
    createdBy: order.created_by || order.createdBy || '',
    createdByName: order.created_by_name || order.createdByName || order.creator?.name || '',
    approvedBy: order.approved_by || order.approvedBy || '',
    approvedByName: order.approved_by_name || order.approvedByName || order.approver?.name || '',
    approvedAt: order.approved_at || order.approvedAt || null,
    supplier: order.supplier || null,
    base: order.base || null,
    creator: order.creator || null,
    approver: order.approver || null,
    items: Array.isArray(order.items) ? order.items : [],
    createdAt: order.created_at || order.createdAt || '',
    updatedAt: order.updated_at || order.updatedAt || ''
  }
}

// 修复物料数据
export function fixMaterialData(material: any) {
  if (!material || typeof material !== 'object') {
    return null
  }

  return {
    id: material.id || 0,
    name: material.name || '',
    code: material.code || '',
    category_id: material.category_id || material.categoryId || 0,
    supplier_id: material.supplier_id || material.supplierId || null,
    unit: material.unit || '',
    price: typeof material.price === 'number' ? material.price : parseFloat(material.price) || 0,
    description: material.description || '',
    category: material.category || null,
    supplier: material.supplier || null,
    created_at: material.created_at || material.createdAt || '',
    updated_at: material.updated_at || material.updatedAt || ''
  }
}

// 修复库存数据
export function fixInventoryData(inventory: any) {
  if (!inventory || typeof inventory !== 'object') {
    return null
  }

  return {
    id: inventory.id || 0,
    material_id: inventory.material_id || inventory.materialId || 0,
    base_id: inventory.base_id || inventory.baseId || 0,
    current_stock: typeof inventory.current_stock === 'number' ? inventory.current_stock : 
                   typeof inventory.currentStock === 'number' ? inventory.currentStock : 0,
    reserved_stock: typeof inventory.reserved_stock === 'number' ? inventory.reserved_stock : 
                    typeof inventory.reservedStock === 'number' ? inventory.reservedStock : 0,
    min_stock: typeof inventory.min_stock === 'number' ? inventory.min_stock : 
               typeof inventory.minStock === 'number' ? inventory.minStock : null,
    max_stock: typeof inventory.max_stock === 'number' ? inventory.max_stock : 
               typeof inventory.maxStock === 'number' ? inventory.maxStock : null,
    material: inventory.material || null,
    base: inventory.base || null,
    last_updated: inventory.last_updated || inventory.lastUpdated || ''
  }
}

// 统一的API错误处理
export function handleApiError(error: any, defaultMessage: string = '操作失败') {
  console.error('API错误:', error)
  
  let message = defaultMessage
  
  if (error?.response?.data?.message) {
    message = error.response.data.message
  } else if (error?.message) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  }
  
  ElMessage.error(message)
  return message
}

// 统一的成功消息处理
export function handleApiSuccess(message: string = '操作成功') {
  ElMessage.success(message)
}

// 数据列表标准化处理
export function normalizeDataList<T>(
  response: any, 
  dataKey: string = 'data',
  fixFunction?: (item: any) => T | null
): {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
} {
  console.log(`normalizeDataList 处理 ${dataKey}:`, response)
  
  let items: any[] = []
  let pagination = {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  }

  // 处理响应数据
  const responseData = response?.data || response || {}
  
  // 尝试多种数据结构
  if (Array.isArray(responseData)) {
    items = responseData
  } else if (responseData[dataKey] && Array.isArray(responseData[dataKey])) {
    items = responseData[dataKey]
  } else if (responseData.data && Array.isArray(responseData.data)) {
    items = responseData.data
  } else if (responseData.items && Array.isArray(responseData.items)) {
    items = responseData.items
  } else if (responseData.records && Array.isArray(responseData.records)) {
    items = responseData.records
  }

  // 获取分页信息
  if (responseData.pagination) {
    pagination = {
      total: responseData.pagination.total || items.length,
      page: responseData.pagination.page || 1,
      limit: responseData.pagination.limit || 20,
      totalPages: responseData.pagination.totalPages || responseData.pagination.pages || Math.ceil((responseData.pagination.total || items.length) / (responseData.pagination.limit || 20))
    }
  } else {
    pagination.total = responseData.total || items.length
    pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
  }

  // 应用修复函数
  let processedItems: T[] = []
  if (fixFunction) {
    processedItems = items.map(fixFunction).filter((item): item is T => item !== null)
  } else {
    processedItems = items.filter(item => item && typeof item === 'object')
  }

  console.log(`normalizeDataList 结果:`, { data: processedItems, pagination })
  
  return {
    data: processedItems,
    pagination
  }
}

// 级联选择器数据处理
export function handleCascadeChange(
  value: { baseId?: number; barnId?: number; cattleId?: number },
  targetForm: any,
  callback?: () => void
) {
  if (targetForm && typeof targetForm === 'object') {
    targetForm.cascade = value
    
    // 如果有回调函数，执行它
    if (callback && typeof callback === 'function') {
      callback()
    }
  }
}

// 表单数据清理
export function cleanFormData(formData: any): any {
  if (!formData || typeof formData !== 'object') {
    return {}
  }

  const cleaned: any = {}
  
  for (const [key, value] of Object.entries(formData)) {
    if (value !== null && value !== undefined && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedValue = cleanFormData(value)
        if (Object.keys(cleanedValue).length > 0) {
          cleaned[key] = cleanedValue
        }
      } else {
        cleaned[key] = value
      }
    }
  }

  return cleaned
}

export default {
  safeFormValidate,
  safeFormReset,
  safeFormClearValidate,
  fixHealthRecordData,
  fixFormulaData,
  fixFeedingRecordData,
  fixSalesOrderData,
  fixProcurementOrderData,
  fixMaterialData,
  fixInventoryData,
  handleApiError,
  handleApiSuccess,
  normalizeDataList,
  handleCascadeChange,
  cleanFormData
}