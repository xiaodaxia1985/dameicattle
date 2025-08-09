/**
 * 开发环境调试工具
 */

interface DebugInfo {
  printDebugInfo: () => Promise<void>
  printStoreState: () => Promise<void>
  printRouterInfo: () => Promise<void>
  printEnvInfo: () => void
}

export const debugInfo: DebugInfo = {
  /**
   * 打印完整的调试信息
   */
  async printDebugInfo() {
    console.group('🔍 调试信息')
    this.printEnvInfo()
    await this.printRouterInfo()
    await this.printStoreState()
    console.groupEnd()
  },

  /**
   * 打印 Store 状态
   */
  async printStoreState() {
    try {
      const stores = await import('../stores')
      const authStore = stores.useAuthStore()
      const appStore = stores.useAppStore()

      console.group('📦 Store 状态')
      console.log('Auth Store:', {
        isAuthenticated: authStore.isAuthenticated,
        user: authStore.user,
        token: authStore.token ? '***已设置***' : '未设置'
      })
      console.log('App Store:', {
        theme: appStore.theme,
        sidebarCollapsed: appStore.sidebarCollapsed,
        loading: appStore.loading
      })
      console.groupEnd()
    } catch (error) {
      console.warn('无法获取 Store 状态:', error)
    }
  },

  /**
   * 打印路由信息
   */
  async printRouterInfo() {
    try {
      const routerModule = await import('../router')
      const router = routerModule.default
      console.group('🛣️ 路由信息')
      console.log('当前路由:', router.currentRoute.value)
      console.log('所有路由:', router.getRoutes().map((route: any) => ({
        name: route.name,
        path: route.path,
        component: route.component?.name || 'Anonymous'
      })))
      console.groupEnd()
    } catch (error) {
      console.warn('无法获取路由信息:', error)
    }
  },

  /**
   * 打印环境信息
   */
  printEnvInfo() {
    console.group('🌍 环境信息')
    console.log('模式:', import.meta.env.MODE)
    console.log('开发环境:', import.meta.env.DEV)
    console.log('生产环境:', import.meta.env.PROD)
    console.log('API 基础 URL:', import.meta.env.VITE_API_BASE_URL || '未设置')
    console.log('浏览器:', navigator.userAgent)
    console.groupEnd()
  }
}

// 在开发环境下将 debugInfo 挂载到 window 对象上，方便在控制台调用
if (import.meta.env.DEV) {
  ;(window as any).debugInfo = debugInfo
}

export default debugInfo