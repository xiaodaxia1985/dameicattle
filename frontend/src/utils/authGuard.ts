/**
 * 认证守卫工具
 * 确保用户已登录，如果未登录则自动登录或跳转到登录页
 */

import { tokenStorage, userStorage } from './authUtils'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'
import { ElMessage } from 'element-plus'

/**
 * 检查用户是否已登录
 */
export function isUserLoggedIn(): boolean {
  const token = tokenStorage.getToken()
  const user = userStorage.getUser()
  return !!(token && user)
}

/**
 * 确保用户已登录，如果未登录则尝试自动登录
 */
export async function ensureUserLoggedIn(): Promise<boolean> {
  // 如果已经登录，直接返回true
  if (isUserLoggedIn()) {
    return true
  }

  // 尝试使用默认测试账户自动登录
  try {
    const authStore = useAuthStore()
    
    console.log('🔐 用户未登录，尝试自动登录...')
    
    await authStore.login({
      username: 'test',
      password: '123456'
    })
    
    console.log('✅ 自动登录成功')
    ElMessage.success('自动登录成功')
    return true
    
  } catch (error) {
    console.error('❌ 自动登录失败:', error)
    
    // 自动登录失败，跳转到登录页
    const currentPath = router.currentRoute.value.fullPath
    router.push({
      path: '/login',
      query: { redirect: currentPath }
    })
    
    ElMessage.error('请先登录')
    return false
  }
}

/**
 * 为页面组件添加认证检查的混入
 */
export function withAuthGuard(setupFn: () => any) {
  return async () => {
    // 确保用户已登录
    const isLoggedIn = await ensureUserLoggedIn()
    
    if (!isLoggedIn) {
      // 如果登录失败，返回空的setup
      return {}
    }
    
    // 如果登录成功，执行原始的setup函数
    return setupFn()
  }
}

/**
 * 为API调用添加认证检查
 */
export async function withAuth<T>(apiCall: () => Promise<T>): Promise<T> {
  // 确保用户已登录
  const isLoggedIn = await ensureUserLoggedIn()
  
  if (!isLoggedIn) {
    throw new Error('用户未登录')
  }
  
  // 执行API调用
  return apiCall()
}