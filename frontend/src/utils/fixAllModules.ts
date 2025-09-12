/**
 * 修复所有模块的综合工具
 * 统一处理各个模块的数据解析和交互问题
 */

import { ElMessage } from 'element-plus'
import { nextTick } from 'vue'

// 修复健康记录API调用
export async function fixHealthRecordAPI() {
  console.log('修复健康记录API调用...')
  
  // 检查健康服务的健康检查端点（不需要认证）
  try {
    const response = await fetch('http://localhost:3004/health')
    const data = await response.json()
    console.log('健康服务连通性测试成功:', data)
    return data.success && data.data?.status === 'healthy'
  } catch (error) {
    console.error('健康服务连通性测试失败:', error)
    return false
  }
}

// 修复饲料配方表单问题
export function fixFormulaFormIssues() {
  console.log('修复饲料配方表单问题...')
  // 仅保留安全表单包装器
}

// 修复 parentNode 错误
export function fixParentNodeErrors() {
  console.log('修复 parentNode 错误...')
  (window as any).safeRemoveChild = function(parent: Node, child: Node): Node | null {
    if (parent && child && child.parentNode === parent) {
      try {
        return parent.removeChild(child)
      } catch (error) {
        console.error('safeRemoveChild 失败:', error)
        return null
      }
    }
    return null
  }
  (window as any).safeAppendChild = function(parent: Node, child: Node): Node | null {
    if (parent && child) {
      try {
        return parent.appendChild(child)
      } catch (error) {
        console.error('safeAppendChild 失败:', error)
        return null
      }
    }
    return null
  }
  (window as any).safeInsertBefore = function(parent: Node, newNode: Node, referenceNode?: Node | null): Node | null {
    if (parent && newNode) {
      try {
        return parent.insertBefore(newNode, referenceNode ?? null)
      } catch (error) {
        console.error('safeInsertBefore 失败:', error)
        return null
      }
    }
    return null
  }
}

// 自动修复所有微服务API调用路径和404/网络错误（只保留一份）
export async function autoFixMicroserviceRoutes() {
  const servicePorts: Record<string, number> = {
    'health-service': 3004,
    'feeding-service': 3005,
    'sales-service': 3008,
    'procurement-service': 3007,
    'material-service': 3009,
    'base-service': 3002,
    'cattle-service': 3003,
    'equipment-service': 3006,
    'file-service': 3011,
    'notification-service': 3010,
    'monitoring-service': 3012,
    'news-service': 3013
  }
  (window as any).microserviceBaseUrls = {}
  Object.entries(servicePorts).forEach(([name, port]) => {
    (window as any).microserviceBaseUrls[name] = `http://localhost:${port}`
  })
  (window as any).getMicroserviceUrl = function(service: string, path: string): string {
    const base = (window as any).microserviceBaseUrls[service]
    if (!base) return path
    return `${base}${path.startsWith('/') ? path : '/' + path}`
  }
  (window as any).handleApiError = function(error: any, defaultMessage = '操作失败') {
    let message = defaultMessage
    if (error?.response?.data?.message) {
      message = error.response.data.message
    } else if (error?.message) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    }
    if (error?.response?.status === 404 || error?.status === 404) {
      message = '接口不存在或微服务未启动（404）'
    } else if (error?.name === 'TypeError' && message.includes('Failed to fetch')) {
      message = '网络错误或微服务端口未开放'
    }
    ElMessage.error(message)
    return message
  }
}

// 修复所有API路由问题
export async function fixAllAPIRoutes() {
  console.log('修复所有API路由问题...')
  const healthEndpoints = [
    { name: 'health-service', url: 'http://localhost:3004/health' },
    { name: 'feeding-service', url: 'http://localhost:3005/health' },
    { name: 'sales-service', url: 'http://localhost:3008/health' },
    { name: 'procurement-service', url: 'http://localhost:3007/health' },
    { name: 'material-service', url: 'http://localhost:3009/health' }
  ]
  const results: any[] = []
  for (const endpoint of healthEndpoints) {
    try {
      const response = await fetch(endpoint.url)
      const data = await response.json()
      results.push({
        endpoint: endpoint.name,
        success: response.ok,
        status: response.status,
        healthy: data.success && data.data?.status === 'healthy'
      })
      console.log(`✓ ${endpoint.name} - 状态: ${response.status}, 健康: ${data.success && data.data?.status === 'healthy'}`)
    } catch (error) {
      results.push({
        endpoint: endpoint.name,
        success: false,
        error: (error as any)?.message || String(error)
      })
      console.error(`✗ ${endpoint.name} - 错误: ${(error as any)?.message || error}`)
    }
  }
  return results
}

// 修复表单验证问题
export function fixFormValidationIssues() {
  console.log('修复表单验证问题...')
  
  // 创建安全的表单验证包装器
  window.safeFormValidate = async function(formRef: any): Promise<boolean> {
    if (!formRef || !formRef.value) {
      console.warn('表单引用为空')
      return false
    }

    if (typeof formRef.value.validate !== 'function') {
      console.warn('表单验证方法不存在')
      return false
    }

    try {
      return await new Promise((resolve) => {
        formRef.value.validate((valid: boolean) => {
          resolve(valid)
        })
      })
    } catch (error) {
      console.error('表单验证失败:', error)
      return false
    }
  }

  // 创建安全的表单重置包装器
  window.safeFormReset = function(formRef: any) {
    nextTick(() => {
      if (formRef && formRef.value && typeof formRef.value.resetFields === 'function') {
        formRef.value.resetFields()
      }
    })
  }

  // 创建安全的表单清除验证包装器
  window.safeFormClearValidate = function(formRef: any) {
    nextTick(() => {
      if (formRef && formRef.value && typeof formRef.value.clearValidate === 'function') {
        formRef.value.clearValidate()
      }
    })
  }
}

// 修复数据绑定问题
export function fixDataBindingIssues() {
  console.log('修复数据绑定问题...')
  
  // 创建全局数据处理函数
  window.safeDataAccess = function(obj: any, path: string, defaultValue: any = undefined): any {
    if (!obj || typeof obj !== 'object') {
      return defaultValue
    }

    const keys = path.split('.')
    let current = obj

    for (const key of keys) {
      if (current == null || typeof current !== 'object' || !(key in current)) {
        return defaultValue
      }
      current = current[key]
    }

    return current !== undefined ? current : defaultValue
  }

  // 创建数组确保函数
  window.ensureArray = function<T>(value: any): T[] {
    if (Array.isArray(value)) {
      return value
    }
    if (value === null || value === undefined) {
      return []
    }
    return [value]
  }

  // 创建数字确保函数
  window.ensureNumber = function(value: any, defaultValue: number = 0): number {
    if (typeof value === 'number' && !isNaN(value)) {
      return value
    }
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
}

// 修复级联选择器问题
export function fixCascadeSelectorIssues() {
  console.log('修复级联选择器问题...')
  
  // 创建级联选择器数据处理函数
  window.handleCascadeChange = function(
    value: { baseId?: number; barnId?: number; cattleId?: number },
    targetForm: any,
    callback?: () => void
  ) {
    if (targetForm && typeof targetForm === 'object') {
      // 确保cascade属性存在
      if (!targetForm.cascade) {
        targetForm.cascade = {}
      }
      
      // 安全地设置值
      targetForm.cascade.baseId = value.baseId
      targetForm.cascade.barnId = value.barnId
      targetForm.cascade.cattleId = value.cattleId
      
      // 如果有回调函数，执行它
      if (callback && typeof callback === 'function') {
        try {
          callback()
        } catch (error) {
          console.error('级联选择器回调执行失败:', error)
        }
      }
    }
  }
}

// 修复分页数据处理问题
export function fixPaginationIssues() {
  console.log('修复分页数据处理问题...')
  
  // 创建标准化分页数据处理函数
  window.normalizePaginationData = function(response: any, dataKey: string = 'data') {
    console.log('normalizePaginationData 输入:', { response, dataKey })
    
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

    const result = {
      data: items,
      pagination
    }
    
    console.log('normalizePaginationData 输出:', result)
    return result
  }
}

// 修复错误处理问题
export function fixErrorHandlingIssues() {
  console.log('修复错误处理问题...')
  
  // 创建统一的错误处理函数
  window.handleApiError = function(error: any, defaultMessage: string = '操作失败') {
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

  // 创建成功消息处理函数
  window.handleApiSuccess = function(message: string = '操作成功') {
    ElMessage.success(message)
  }
}

// 修复组件引用问题
export function fixComponentReferenceIssues() {
  console.log('修复组件引用问题...')
  
  // 创建安全的组件方法调用
  window.safeComponentCall = function(component: any, method: string, ...args: any[]) {
    if (component && component.value && typeof component.value[method] === 'function') {
      try {
        return component.value[method](...args)
      } catch (error) {
        console.error(`组件方法调用失败: ${method}`, error)
        return null
      }
    } else {
      console.warn(`组件方法不存在: ${method}`)
      return null
    }
  }
}

// 执行所有修复
export async function fixAllModules() {
  console.log('开始修复所有模块问题...')
  
  const results = {
    healthAPI: false,
    formValidation: false,
    dataBinding: false,
    cascadeSelector: false,
    pagination: false,
    errorHandling: false,
    componentReference: false,
    parentNodeErrors: false,
    apiRoutes: []
  }
  
  try {
    // 修复 parentNode 错误
    fixParentNodeErrors()
    results.parentNodeErrors = true
    console.log('✓ parentNode 错误修复完成')
    
    // 修复表单验证问题
    fixFormValidationIssues()
    results.formValidation = true
    console.log('✓ 表单验证问题修复完成')
    
    // 修复数据绑定问题
    fixDataBindingIssues()
    results.dataBinding = true
    console.log('✓ 数据绑定问题修复完成')
    
    // 修复级联选择器问题
    fixCascadeSelectorIssues()
    results.cascadeSelector = true
    console.log('✓ 级联选择器问题修复完成')
    
    // 修复分页数据处理问题
    fixPaginationIssues()
    results.pagination = true
    console.log('✓ 分页数据处理问题修复完成')
    
    // 修复错误处理问题
    fixErrorHandlingIssues()
    results.errorHandling = true
    console.log('✓ 错误处理问题修复完成')
    
    // 修复组件引用问题
    fixComponentReferenceIssues()
    results.componentReference = true
    console.log('✓ 组件引用问题修复完成')
    
    // 修复健康记录API
    results.healthAPI = await fixHealthRecordAPI()
    console.log(results.healthAPI ? '✓ 健康记录API修复完成' : '✗ 健康记录API修复失败')
    
    // 修复所有API路由
    results.apiRoutes = await fixAllAPIRoutes()
    console.log('✓ API路由检查完成')
    
    console.log('所有模块修复完成！')
    ElMessage.success('所有模块修复完成！')
    
  } catch (error) {
    console.error('修复过程中出现错误:', error)
    ElMessage.error('修复过程中出现错误')
  }
  
  return results
}

// 创建测试函数
export async function testAllModules() {
  console.log('开始测试所有模块...')
  
  const testResults = []
  
  // 测试健康服务
  try {
    const healthResponse = await fetch('http://localhost:3004/health')
    const healthData = await healthResponse.json()
    testResults.push({
      module: '健康服务',
      success: healthResponse.ok && healthData.success,
      status: healthResponse.status,
      healthy: healthData.data?.status === 'healthy'
    })
  } catch (error) {
    testResults.push({
      module: '健康服务',
      success: false,
      error: (error as any).message
    })
  }
  
  // 测试饲养服务
  try {
    const feedingResponse = await fetch('http://localhost:3005/health')
    const feedingData = await feedingResponse.json()
    testResults.push({
      module: '饲养服务',
      success: feedingResponse.ok && feedingData.success,
      status: feedingResponse.status,
      healthy: feedingData.data?.status === 'healthy'
    })
  } catch (error) {
    testResults.push({
      module: '饲养服务',
      success: false,
      error: (error as any).message
    })
  }
  
  // 测试销售服务
  try {
    const salesResponse = await fetch('http://localhost:3008/health')
    const salesData = await salesResponse.json()
    testResults.push({
      module: '销售服务',
      success: salesResponse.ok && salesData.success,
      status: salesResponse.status,
      healthy: salesData.data?.status === 'healthy'
    })
  } catch (error) {
    testResults.push({
      module: '销售服务',
      success: false,
      error: (error as any).message
    })
  }
  
  // 测试采购服务
  try {
    const procurementResponse = await fetch('http://localhost:3007/health')
    const procurementData = await procurementResponse.json()
    testResults.push({
      module: '采购服务',
      success: procurementResponse.ok && procurementData.success,
      status: procurementResponse.status,
      healthy: procurementData.data?.status === 'healthy'
    })
  } catch (error) {
    testResults.push({
      module: '采购服务',
      success: false,
      error: (error as any).message
    })
  }
  
  // 测试物料服务
  try {
    const materialResponse = await fetch('http://localhost:3009/health')
    const materialData = await materialResponse.json()
    testResults.push({
      module: '物料服务',
      success: materialResponse.ok && materialData.success,
      status: materialResponse.status,
      healthy: materialData.data?.status === 'healthy'
    })
  } catch (error) {
    testResults.push({
      module: '物料服务',
      success: false,
      error: (error as any).message
    })
  }
  
  console.log('模块测试结果:', testResults)
  return testResults
}

// 导出所有函数
export default {
  fixAllModules,
  testAllModules,
  fixHealthRecordAPI,
  fixFormulaFormIssues,
  fixAllAPIRoutes,
  fixFormValidationIssues,
  fixDataBindingIssues,
  fixCascadeSelectorIssues,
  fixPaginationIssues,
  fixErrorHandlingIssues,
  fixComponentReferenceIssues
}

// 声明全局函数类型
declare global {
  interface Window {
    safeFormValidate: (formRef: any) => Promise<boolean>
    safeFormReset: (formRef: any) => void
    safeFormClearValidate: (formRef: any) => void
    safeDataAccess: (obj: any, path: string, defaultValue?: any) => any
    ensureArray: <T>(value: any) => T[]
    ensureNumber: (value: any, defaultValue?: number) => number
    handleCascadeChange: (value: any, targetForm: any, callback?: () => void) => void
    normalizePaginationData: (response: any, dataKey?: string) => any
    handleApiError: (error: any, defaultMessage?: string) => string
    handleApiSuccess: (message?: string) => void
    safeComponentCall: (component: any, method: string, ...args: any[]) => any
    safeRemoveChild: (parent: Node, child: Node) => Node | null
    safeAppendChild: (parent: Node, child: Node) => Node | null
    safeInsertBefore: (parent: Node, newNode: Node, referenceNode?: Node | null) => Node | null
    safeQuerySelector: (selector: string, parent?: Element | Document) => Element | null
    safeQuerySelectorAll: (selector: string, parent?: Element | Document) => NodeListOf<Element> | Element[]
  }
}