// 完整的前端修复方案
// 这个文件包含了所有需要修复的代码片段

// 1. 修复微服务API客户端配置
const microserviceApiClientFix = `
// 在 frontend/src/api/microservices.ts 中修复
const microserviceApiClient = new UnifiedApiClient({
  baseURL: '/api/v1', // 使用前端代理的baseURL
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableLogging: true
})
`;

// 2. 修复采购服务API路径
const procurementServiceApiFix = `
// 在 frontend/src/api/microservices.ts 中修复
export class ProcurementServiceApi extends MicroserviceApi {
  constructor() {
    super(MICROSERVICE_ROUTES.PROCUREMENT) // 使用 '/procurement'
  }

  // 获取采购订单
  async getProcurementOrders(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/orders', params)
  }

  // 创建采购订单
  async createProcurementOrder(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/orders', data)
  }

  // 获取供应商列表
  async getSuppliers(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/suppliers', params)
  }

  // 创建供应商
  async createSupplier(data: any): Promise<ApiResponse<any>> {
    return this.post<any>('/suppliers', data)
  }

  // 获取基地列表
  async getBases(params?: any): Promise<ApiResponse<any[]>> {
    return this.get<any[]>('/bases', params)
  }

  // 获取采购统计
  async getProcurementStatistics(baseId?: number): Promise<ApiResponse<any>> {
    const params = baseId ? { base_id: baseId } : undefined
    return this.get<any>('/statistics', params)
  }
}
`;

// 3. 修复数据获取逻辑
const dataFetchingFix = `
// 在 frontend/src/views/purchase/Orders.vue 中修复
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    }
    const { dateRange, ...finalParams } = params
    
    const response = await purchaseApi.getOrders(finalParams)
    console.log('采购订单API响应:', response)
    
    // 简化数据处理逻辑
    if (response && response.data && response.data.success) {
      const orderData = response.data.data || {}
      orders.value = Array.isArray(orderData.orders) ? orderData.orders : []
      pagination.total = orderData.pagination?.total || 0
    } else {
      orders.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
    orders.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const fetchSuppliers = async () => {
  try {
    const response = await purchaseApi.getSuppliers()
    console.log('供应商API响应:', response)
    
    if (response && response.data && response.data.success) {
      const supplierData = response.data.data || {}
      supplierOptions.value = Array.isArray(supplierData.suppliers) ? supplierData.suppliers : []
    } else {
      supplierOptions.value = []
    }
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    supplierOptions.value = []
  }
}

const fetchBases = async () => {
  try {
    const response = await purchaseApi.getBases()
    console.log('基地API响应:', response)
    
    if (response && response.data && response.data.success) {
      const baseData = response.data.data || {}
      baseOptions.value = Array.isArray(baseData.bases) ? baseData.bases : []
    } else {
      baseOptions.value = []
    }
  } catch (error) {
    console.error('获取基地列表失败:', error)
    baseOptions.value = []
  }
}
`;

// 4. 修复供应商创建逻辑
const supplierCreationFix = `
// 确保供应商表单数据完整
const validateSupplierData = (data) => {
  const requiredFields = ['name', 'contactPerson', 'phone', 'address'];
  const missingFields = requiredFields.filter(field => !data[field] || data[field].trim() === '');
  
  if (missingFields.length > 0) {
    throw new Error(\`缺少必填字段: \${missingFields.join(', ')}\`);
  }
  
  return {
    name: data.name.trim(),
    contactPerson: data.contactPerson.trim(),
    phone: data.phone.trim(),
    email: data.email ? data.email.trim() : '',
    address: data.address.trim(),
    supplierType: data.supplierType || 'material',
    businessLicense: data.businessLicense || '',
    taxNumber: data.taxNumber || '',
    bankAccount: data.bankAccount || '',
    creditLimit: Number(data.creditLimit) || 0,
    paymentTerms: data.paymentTerms || '',
    rating: Number(data.rating) || 5,
    remark: data.remark || ''
  };
};
`;

// 5. 修复订单创建逻辑
const orderCreationFix = `
// 确保订单数据完整
const validateOrderData = (data) => {
  const requiredFields = ['supplierId', 'supplierName', 'baseId', 'baseName', 'orderType', 'orderDate'];
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new Error(\`缺少必填字段: \${missingFields.join(', ')}\`);
  }
  
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error('订单必须包含至少一个商品');
  }
  
  return {
    supplierId: Number(data.supplierId),
    supplierName: data.supplierName,
    baseId: Number(data.baseId),
    baseName: data.baseName,
    orderType: data.orderType,
    orderDate: data.orderDate,
    expectedDeliveryDate: data.expectedDeliveryDate || null,
    paymentMethod: data.paymentMethod || '',
    contractNumber: data.contractNumber || '',
    remark: data.remark || '',
    taxAmount: Number(data.taxAmount) || 0,
    discountAmount: Number(data.discountAmount) || 0,
    items: data.items.map(item => ({
      itemName: item.itemName,
      specification: item.specification || '',
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      remark: item.remark || ''
    }))
  };
};
`;

console.log('前端修复方案已生成');
console.log('请按照以下步骤进行修复：');
console.log('1. 修复微服务API客户端配置');
console.log('2. 修复采购服务API路径');
console.log('3. 修复数据获取逻辑');
console.log('4. 添加数据验证逻辑');
console.log('5. 测试所有功能');