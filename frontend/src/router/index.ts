import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import adminRoutes from './routes/admin.ts'
import portalRoutes from './routes/portal.ts'
import publicRoutes from './routes/public.ts'
import notFoundRoute from './routes/notfound.ts'

NProgress.configure({ showSpinner: false })

// 正确使用导入的路由模块构建routes数组
const routes: RouteRecordRaw[] = [
  // 导入公共路由（登录页面等）
  ...publicRoutes,
  
  // 导入管理员路由
  ...adminRoutes,
  
  // 导入门户路由
  ...portalRoutes,
  
  // 404路由必须放在最后
  notFoundRoute
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

let authInitialized = false

router.beforeEach(async (to, from, next) => {
  NProgress.start()

  const authStore = useAuthStore()

  if (!authInitialized) {
    authInitialized = true
    try {
      await authStore.initializeAuth()
    } catch (error) {
      console.error('初始化认证失败:', error)
      // 继续处理，让路由正常工作
    }
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)

  if (requiresAuth && !authStore.isAuthenticated) {
    if (to.path !== '/login') {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin/dashboard')
  } else {
    next()
  }
})

router.afterEach((to) => {
  NProgress.done()
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - 肉牛全生命周期管理系统`
  }
})

export default router