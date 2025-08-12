/**
 * 系统健康检查工具
 * 用于验证所有微服务的连接性和数据完整性
 */

import { microserviceApis } from '@/api/microservices'
import { ElMessage, ElNotification } from 'element-plus'

export interface ServiceHealthStatus {
  name: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  responseTime: number
  error?: string
  lastCheck: Date
}

export interface SystemHealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  services: ServiceHealthStatus[]
  summary: {
    total: number
    healthy: number
    unhealthy: number
    unknown: number
  }
  timestamp: Date
}

/**
 * 检查单个微服务的健康状态
 */
async function checkServiceHealth(
  serviceName: string, 
  api: any
): Promise<ServiceHealthStatus> {
  const startTime = Date.now()
  
  try {
    // 尝试调用健康检查端点
    await api.healthCheck()
    
    const responseTime = Date.now() - startTime
    
    return {
      name: serviceName,
      status: 'healthy',
      responseTime,
      lastCheck: new Date()
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    
    return {
      name: serviceName,
      status: 'unhealthy',
      responseTime,
      error: errorMessage,
      lastCheck: new Date()
    }
  }
}

/**
 * 检查所有微服务的健康状态
 */
export async function checkAllServicesHealth(): Promise<SystemHealthReport> {
  console.log('开始系统健康检查...')
  
  const serviceChecks = Object.entries(microserviceApis).map(([name, api]) =>
    checkServiceHealth(name, api)
  )
  
  const services = await Promise.all(serviceChecks)
  
  const summary = {
    total: services.length,
    healthy: services.filter(s => s.status === 'healthy').length,
    unhealthy: services.filter(s => s.status === 'unhealthy').length,
    unknown: services.filter(s => s.status === 'unknown').length
  }
  
  let overall: 'healthy' | 'degraded' | 'unhealthy'
  if (summary.healthy === summary.total) {
    overall = 'healthy'
  } else if (summary.healthy > summary.total / 2) {
    overall = 'degraded'
  } else {
    overall = 'unhealthy'
  }
  
  const report: SystemHealthReport = {
    overall,
    services,
    summary,
    timestamp: new Date()
  }
  
  console.log('系统健康检查完成:', report)
  return report
}

/**
 * 测试数据API的完整性
 */
export async function testDataApiIntegrity(): Promise<{
  success: boolean
  results: Array<{
    api: string
    endpoint: string
    success: boolean
    error?: string
    dataValid?: boolean
  }>
}> {
  const testResults: Array<{
    api: string
    endpoint: string
    success: boolean
    error?: string
    dataValid?: boolean
  }> = []

  // 测试牛只API
  try {
    const cattleResponse = await microserviceApis.cattle.getCattleList({ page: 1, limit: 5 })
    const dataValid = Array.isArray(cattleResponse.data) || 
                     (cattleResponse.data && Array.isArray(cattleResponse.data.cattle))
    
    testResults.push({
      api: 'cattle',
      endpoint: '/cattle',
      success: true,
      dataValid
    })
  } catch (error) {
    testResults.push({
      api: 'cattle',
      endpoint: '/cattle',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }

  // 测试基地API
  try {
    const baseResponse = await microserviceApis.base.getBases({ page: 1, limit: 5 })
    const dataValid = Array.isArray(baseResponse.data) || 
                     (baseResponse.data && Array.isArray(baseResponse.data.bases))
    
    testResults.push({
      api: 'base',
      endpoint: '/bases',
      success: true,
      dataValid
    })
  } catch (error) {
    testResults.push({
      api: 'base',
      endpoint: '/bases',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }

  // 测试销售API
  try {
    const salesResponse = await microserviceApis.sales.getSalesOrders({ page: 1, limit: 5 })
    const dataValid = Array.isArray(salesResponse.data) || 
                     (salesResponse.data && Array.isArray(salesResponse.data.orders))
    
    testResults.push({
      api: 'sales',
      endpoint: '/orders',
      success: true,
      dataValid
    })
  } catch (error) {
    testResults.push({
      api: 'sales',
      endpoint: '/orders',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }

  // 测试采购API
  try {
    const procurementResponse = await microserviceApis.procurement.getProcurementOrders({ page: 1, limit: 5 })
    const dataValid = Array.isArray(procurementResponse.data) || 
                     (procurementResponse.data && Array.isArray(procurementResponse.data.orders))
    
    testResults.push({
      api: 'procurement',
      endpoint: '/orders',
      success: true,
      dataValid
    })
  } catch (error) {
    testResults.push({
      api: 'procurement',
      endpoint: '/orders',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }

  // 测试物料API
  try {
    const materialResponse = await microserviceApis.material.getMaterials({ page: 1, limit: 5 })
    const dataValid = Array.isArray(materialResponse.data) || 
                     (materialResponse.data && Array.isArray(materialResponse.data.materials))
    
    testResults.push({
      api: 'material',
      endpoint: '/materials',
      success: true,
      dataValid
    })
  } catch (error) {
    testResults.push({
      api: 'material',
      endpoint: '/materials',
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    })
  }

  const successCount = testResults.filter(r => r.success).length
  const success = successCount === testResults.length

  return {
    success,
    results: testResults
  }
}

/**
 * 显示健康检查报告
 */
export function displayHealthReport(report: SystemHealthReport) {
  const { overall, summary } = report
  
  let message = `系统状态: ${overall === 'healthy' ? '健康' : overall === 'degraded' ? '降级' : '不健康'}\n`
  message += `服务总数: ${summary.total}\n`
  message += `健康服务: ${summary.healthy}\n`
  message += `异常服务: ${summary.unhealthy}\n`
  
  if (summary.unhealthy > 0) {
    const unhealthyServices = report.services
      .filter(s => s.status === 'unhealthy')
      .map(s => `${s.name}: ${s.error}`)
      .join('\n')
    message += `\n异常详情:\n${unhealthyServices}`
  }

  if (overall === 'healthy') {
    ElNotification.success({
      title: '系统健康检查',
      message,
      duration: 5000
    })
  } else {
    ElNotification.warning({
      title: '系统健康检查',
      message,
      duration: 0 // 不自动关闭
    })
  }
}

/**
 * 自动健康检查
 */
export function startAutoHealthCheck(intervalMinutes: number = 5) {
  const interval = intervalMinutes * 60 * 1000
  
  const check = async () => {
    try {
      const report = await checkAllServicesHealth()
      
      // 只在状态变化或有问题时显示通知
      if (report.overall !== 'healthy') {
        displayHealthReport(report)
      }
    } catch (error) {
      console.error('自动健康检查失败:', error)
    }
  }

  // 立即执行一次
  check()
  
  // 设置定时检查
  const intervalId = setInterval(check, interval)
  
  return () => clearInterval(intervalId)
}

/**
 * 修复常见的数据问题
 */
export async function fixCommonDataIssues(): Promise<{
  fixed: number
  issues: string[]
}> {
  const issues: string[] = []
  let fixed = 0

  try {
    // 检查并修复localStorage中的损坏数据
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          JSON.parse(value) // 尝试解析
        }
      } catch (error) {
        localStorage.removeItem(key)
        issues.push(`修复了损坏的localStorage项: ${key}`)
        fixed++
      }
    }

    // 检查并修复sessionStorage中的损坏数据
    const sessionKeys = Object.keys(sessionStorage)
    for (const key of sessionKeys) {
      try {
        const value = sessionStorage.getItem(key)
        if (value) {
          JSON.parse(value) // 尝试解析
        }
      } catch (error) {
        sessionStorage.removeItem(key)
        issues.push(`修复了损坏的sessionStorage项: ${key}`)
        fixed++
      }
    }

    // 清理过期的缓存数据
    const cacheKeys = keys.filter(key => key.startsWith('cache_'))
    for (const key of cacheKeys) {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          const parsed = JSON.parse(value)
          if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key)
            issues.push(`清理了过期的缓存: ${key}`)
            fixed++
          }
        }
      } catch (error) {
        localStorage.removeItem(key)
        issues.push(`清理了损坏的缓存: ${key}`)
        fixed++
      }
    }

  } catch (error) {
    issues.push(`修复过程中出现错误: ${error instanceof Error ? error.message : '未知错误'}`)
  }

  return { fixed, issues }
}

export default {
  checkAllServicesHealth,
  testDataApiIntegrity,
  displayHealthReport,
  startAutoHealthCheck,
  fixCommonDataIssues
}