import { ElMessage } from 'element-plus'

/**
 * 验证路由ID参数
 */
export const validateRouteId = (id: string | string[]): number => {
  const numId = Number(Array.isArray(id) ? id[0] : id)
  if (isNaN(numId) || numId <= 0) {
    throw new Error('无效的ID参数')
  }
  return numId
}

/**
 * 安全获取路由参数
 */
export const safeGetRouteParam = (param: string | string[], defaultValue?: any) => {
  const value = Array.isArray(param) ? param[0] : param
  return value || defaultValue
}

/**
 * 处理路由参数错误
 */
export const handleRouteParamError = (error: any, router: any, fallbackRoute: string) => {
  console.error('路由参数错误:', error)
  ElMessage.error(error.message || '参数错误')
  router.push(fallbackRoute)
}