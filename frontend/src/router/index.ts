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

const routes: RouteRecordRaw[] = [
  ...publicRoutes,
  ...adminRoutes,
  ...portalRoutes,
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
      // noop
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