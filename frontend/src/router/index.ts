import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

// Configure NProgress
NProgress.configure({ showSpinner: false })

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false, title: '登录' }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据总览', icon: 'DataAnalysis' }
      },
      {
        path: 'cattle',
        name: 'Cattle',
        component: () => import('@/views/cattle/index.vue'),
        meta: { title: '牛只管理', icon: 'Grid' },
        children: [
          {
            path: '',
            name: 'CattleList',
            component: () => import('@/views/cattle/List.vue'),
            meta: { title: '牛只列表' }
          },
          {
            path: 'detail/:id',
            name: 'CattleDetail',
            component: () => import('@/views/cattle/Detail.vue'),
            meta: { title: '牛只详情', hidden: true }
          }
        ]
      },
      {
        path: 'health',
        name: 'Health',
        component: () => import('@/views/health/index.vue'),
        meta: { title: '健康管理', icon: 'FirstAidKit' },
        children: [
          {
            path: '',
            name: 'HealthDashboard',
            component: () => import('@/views/health/Dashboard.vue'),
            meta: { title: '健康总览' }
          },
          {
            path: 'records',
            name: 'HealthRecords',
            component: () => import('@/views/health/Records.vue'),
            meta: { title: '健康记录' }
          },
          {
            path: 'vaccination',
            name: 'Vaccination',
            component: () => import('@/views/health/Vaccination.vue'),
            meta: { title: '疫苗管理' }
          },
          {
            path: 'alerts',
            name: 'HealthAlerts',
            component: () => import('@/views/health/Alerts.vue'),
            meta: { title: '健康预警' }
          },
          {
            path: 'statistics',
            name: 'HealthStatistics',
            component: () => import('@/views/health/Statistics.vue'),
            meta: { title: '健康统计' }
          }
        ]
      },
      {
        path: 'feeding',
        name: 'Feeding',
        component: () => import('@/views/feeding/index.vue'),
        meta: { title: '饲喂管理', icon: 'Bowl' },
        children: [
          {
            path: '',
            name: 'FeedingDashboard',
            component: () => import('@/views/feeding/Dashboard.vue'),
            meta: { title: '饲喂总览' }
          },
          {
            path: 'records',
            name: 'FeedingRecords',
            component: () => import('@/views/feeding/Records.vue'),
            meta: { title: '饲喂记录' }
          },
          {
            path: 'formulas',
            name: 'FeedFormulas',
            component: () => import('@/views/feeding/Formulas.vue'),
            meta: { title: '饲料配方' }
          },
          {
            path: 'analysis',
            name: 'FeedingAnalysis',
            component: () => import('@/views/feeding/Analysis.vue'),
            meta: { title: '效率分析' }
          }
        ]
      },
      {
        path: 'purchase',
        name: 'Purchase',
        component: () => import('@/views/purchase/index.vue'),
        meta: { title: '采购管理', icon: 'ShoppingCart' },
        children: [
          {
            path: '',
            name: 'PurchaseOrders',
            component: () => import('@/views/purchase/Orders.vue'),
            meta: { title: '采购订单' }
          },
          {
            path: 'suppliers',
            name: 'Suppliers',
            component: () => import('@/views/purchase/Suppliers.vue'),
            meta: { title: '供应商管理' }
          },
          {
            path: 'statistics',
            name: 'PurchaseStatistics',
            component: () => import('@/views/purchase/Statistics.vue'),
            meta: { title: '采购统计' }
          }
        ]
      },
      {
        path: 'sales',
        name: 'Sales',
        component: () => import('@/views/sales/index.vue'),
        meta: { title: '销售管理', icon: 'Sell' },
        children: [
          {
            path: '',
            name: 'SalesOrders',
            component: () => import('@/views/sales/Orders.vue'),
            meta: { title: '销售订单' }
          },
          {
            path: 'customers',
            name: 'Customers',
            component: () => import('@/views/sales/Customers.vue'),
            meta: { title: '客户管理' }
          }
        ]
      },
      {
        path: 'materials',
        name: 'Materials',
        component: () => import('@/views/materials/index.vue'),
        meta: { title: '物资管理', icon: 'Box' },
        children: [
          {
            path: '',
            name: 'MaterialsDashboard',
            component: () => import('@/views/materials/Dashboard.vue'),
            meta: { title: '物资总览' }
          },
          {
            path: 'list',
            name: 'MaterialsList',
            component: () => import('@/views/materials/List.vue'),
            meta: { title: '物资档案' }
          },
          {
            path: 'inventory',
            name: 'Inventory',
            component: () => import('@/views/materials/Inventory.vue'),
            meta: { title: '库存管理' }
          }
        ]
      },
      {
        path: 'news',
        name: 'News',
        component: () => import('@/views/news/index.vue'),
        meta: { title: '新闻管理', icon: 'Document' },
        children: [
          {
            path: '',
            name: 'NewsList',
            component: () => import('@/views/news/NewsList.vue'),
            meta: { title: '新闻列表' }
          },
          {
            path: 'create',
            name: 'NewsCreate',
            component: () => import('@/views/news/NewsEditor.vue'),
            meta: { title: '新建文章', hidden: true }
          },
          {
            path: 'edit/:id',
            name: 'NewsEdit',
            component: () => import('@/views/news/NewsEditor.vue'),
            meta: { title: '编辑文章', hidden: true }
          },
          {
            path: 'view/:id',
            name: 'NewsView',
            component: () => import('@/views/news/NewsView.vue'),
            meta: { title: '查看文章', hidden: true }
          },
          {
            path: 'categories',
            name: 'NewsCategories',
            component: () => import('@/views/news/CategoryManager.vue'),
            meta: { title: '分类管理' }
          }
        ]
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/system/index.vue'),
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: 'users',
            name: 'Users',
            component: () => import('@/views/system/Users.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'roles',
            name: 'Roles',
            component: () => import('@/views/system/Roles.vue'),
            meta: { title: '角色管理' }
          },
          {
            path: 'bases',
            name: 'Bases',
            component: () => import('@/views/system/Bases.vue'),
            meta: { title: '基地管理' }
          },
          {
            path: 'operation-logs',
            name: 'OperationLogs',
            component: () => import('@/views/system/OperationLogs.vue'),
            meta: { title: '操作日志' }
          }
        ]
      }
    ]
  },
  {
    path: '/portal',
    name: 'Portal',
    component: () => import('@/views/portal/index.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: 'news',
        name: 'PortalNews',
        component: () => import('@/views/portal/NewsPortal.vue'),
        meta: { title: '新闻中心' }
      },
      {
        path: 'news/:id',
        name: 'PortalNewsDetail',
        component: () => import('@/views/portal/NewsDetail.vue'),
        meta: { title: '新闻详情' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

router.afterEach((to) => {
  NProgress.done()
  
  // Set page title
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} - 肉牛全生命周期管理系统`
  }
})

export default router