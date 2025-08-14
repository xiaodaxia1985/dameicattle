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
    redirect: '/portal'
  },
  {
    path: '/admin',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/admin/dashboard',
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
        redirect: '/admin/cattle/bases',
        meta: { title: '牛场管理', icon: 'Grid' },
        children: [
          {
            path: 'bases',
            name: 'Bases',
            component: () => import('@/views/system/Bases.vue'),
            meta: { title: '基地管理' }
          },

          {
            path: 'list',
            name: 'CattleList',
            component: () => import('@/views/cattle/List.vue'),
            meta: { title: '牛只管理' }
          },
          {
            path: 'detail/:id',
            name: 'CattleDetail',
            component: () => import('@/views/cattle/Detail.vue'),
            meta: { title: '牛只详情', hidden: true, hideInMenu: true }
          }
        ]
      },
      {
        path: 'health',
        name: 'Health',
        redirect: '/admin/health/dashboard',
        meta: { title: '健康管理', icon: 'FirstAidKit' },
        children: [
          {
            path: 'dashboard',
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
        redirect: '/admin/feeding/dashboard',
        meta: { title: '饲喂管理', icon: 'Bowl' },
        children: [
          {
            path: 'dashboard',
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
            path: 'patrol-records',
            name: 'PatrolRecords',
            component: () => import('@/views/feeding/patrol/Records.vue'),
            meta: { title: '巡圈记录' }
          },
          {
            path: 'formulas',
            name: 'FeedFormulas',
            component: () => import('@/views/feeding/Formulas.vue'),
            meta: { title: '饲料配方' }
          }
        ]
      },
      {
        path: 'purchase',
        name: 'Purchase',
        redirect: '/admin/purchase/orders',
        meta: { title: '采购管理', icon: 'ShoppingCart' },
        children: [
          {
            path: 'orders',
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
        redirect: '/admin/sales/orders',
        meta: { title: '销售管理', icon: 'Sell' },
        children: [
          {
            path: 'orders',
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
        redirect: '/admin/materials/dashboard',
        meta: { title: '物资管理', icon: 'Box' },
        children: [
          {
            path: 'dashboard',
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
        redirect: '/admin/news/list',
        meta: { title: '新闻管理', icon: 'Document' },
        children: [
          {
            path: 'list',
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
        redirect: '/admin/system/users',
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
            path: 'operation-logs',
            name: 'OperationLogs',
            component: () => import('@/views/system/OperationLogs.vue'),
            meta: { title: '操作日志' }
          },
          {
            path: 'test',
            name: 'Test',
            redirect: '/admin/system/test/map',
            meta: { title: '功能测试' },
            children: [
              {
                path: 'map',
                name: 'MapTest',
                component: () => import('@/views/test/MapTest.vue'),
                meta: { title: '地图测试' }
              },
              {
                path: 'geocode',
                name: 'GeocodeTest',
                component: () => import('@/views/test/GeocodeTest.vue'),
                meta: { title: '地理编码测试' }
              }
            ]
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
        path: '',
        name: 'PortalHome',
        component: () => import('@/views/portal/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'about',
        name: 'PortalAbout',
        component: () => import('@/views/portal/About.vue'),
        meta: { title: '关于我们' }
      },
      {
        path: 'products',
        name: 'PortalProducts',
        component: () => import('@/views/portal/Products.vue'),
        meta: { title: '产品服务' }
      },
      {
        path: 'culture',
        name: 'PortalCulture',
        component: () => import('@/views/portal/Culture.vue'),
        meta: { title: '企业文化' }
      },
      {
        path: 'history',
        name: 'PortalHistory',
        component: () => import('@/views/portal/History.vue'),
        meta: { title: '发展历程' }
      },
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
      },
      {
        path: 'contact',
        name: 'PortalContact',
        component: () => import('@/views/portal/Contact.vue'),
        meta: { title: '联系我们' }
      },
      {
        path: 'admin',
        name: 'PortalAdmin',
        component: () => import('@/views/portal/admin/index.vue'),
        meta: { requiresAuth: true, title: '门户管理' },
        children: [
          {
            path: '',
            redirect: 'dashboard'
          },
          {
            path: 'dashboard',
            name: 'PortalAdminDashboard',
            component: () => import('@/views/portal/admin/Dashboard.vue'),
            meta: { title: '数据概览' }
          },
          {
            path: 'content',
            name: 'PortalAdminContent',
            component: () => import('@/views/portal/admin/Content.vue'),
            meta: { title: '内容管理' }
          },
          {
            path: 'messages',
            name: 'PortalAdminMessages',
            component: () => import('@/views/portal/admin/Messages.vue'),
            meta: { title: '留言管理' }
          },
          {
            path: 'inquiries',
            name: 'PortalAdminInquiries',
            component: () => import('@/views/portal/admin/Inquiries.vue'),
            meta: { title: '询价管理' }
          }
        ]
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

// 添加一个标志来跟踪认证状态是否已经初始化
let authInitialized = false

// Navigation guards
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  const authStore = useAuthStore()
  
  // 只在第一次访问时初始化认证状态
  if (!authInitialized) {
    console.log('首次访问，初始化认证状态...')
    authInitialized = true
    try {
      await authStore.initializeAuth()
    } catch (error) {
      console.error('认证状态初始化失败:', error)
    }
  }
  
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth === true)
  
  console.log('路由守卫:', {
    to: to.path,
    from: from.path,
    requiresAuth,
    isAuthenticated: authStore.isAuthenticated,
    hasToken: !!authStore.token,
    hasUser: !!authStore.user
  })
  
  if (requiresAuth && !authStore.isAuthenticated) {
    console.log('需要认证但未登录，跳转到登录页面')
    if (to.path !== '/login') {
      next({ path: '/login', query: { redirect: to.fullPath } })
    } else {
      next()
    }
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    console.log('已登录用户访问登录页面，跳转到仪表盘')
    next('/admin/dashboard')
  } else {
    console.log('正常访问')
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