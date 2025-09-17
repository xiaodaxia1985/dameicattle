import type { RouteRecordRaw } from 'vue-router'

const adminRoutes: RouteRecordRaw[] = [
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
            path: 'patrol-dashboard',
            name: 'PatrolDashboard',
            component: () => import('@/views/feeding/patrol/Dashboard.vue'),
            meta: { title: '巡圈总览' }
          },
          {
            path: 'patrol-tasks',
            name: 'PatrolTasks',
            component: () => import('@/views/feeding/patrol/Tasks.vue'),
            meta: { title: '巡圈任务' }
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
          },
          {
            path: 'formula-management',
            name: 'FormulaManagement',
            component: () => import('@/views/feeding/FormulaManagement.vue'),
            meta: { title: '配方管理' }
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
        path: 'equipment',
        name: 'Equipment',
        redirect: '/admin/equipment/dashboard',
        meta: { title: '设备管理', icon: 'Monitor' },
        children: [
          {
            path: 'dashboard',
            name: 'EquipmentDashboard',
            component: () => import('@/views/equipment/EquipmentDashboard.vue'),
            meta: { title: '设备总览' }
          },
          {
            path: 'list',
            name: 'EquipmentList',
            component: () => import('@/views/equipment/EquipmentList.vue'),
            meta: { title: '设备列表' }
          }
        ]
      },
      {
        path: 'purchase',
        name: 'Purchase',
        redirect: '/admin/purchase/statistics',
        meta: { title: '采购管理', icon: 'ShoppingCart' },
        children: [
          {
            path: 'statistics',
            name: 'PurchaseStatistics',
            component: () => import('@/views/purchase/Statistics.vue'),
            meta: { title: '采购统计分析' }
          },
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
            path: 'statistics',
            name: 'SalesStatistics',
            component: () => import('@/views/sales/Statistics.vue'),
            meta: { title: '销售统计' }
          },
          {
            path: 'orders',
            name: 'SalesOrders',
            component: () => import('@/views/sales/Orders.vue'),
            meta: { title: '销售订单' }
          },
          {
            path: 'orders/new',
            name: 'OrderCreate',
            component: () => import('@/views/sales/OrderForm.vue'),
            meta: { title: '新建订单', hidden: true }
          },
          {
            path: 'orders/:id/edit',
            name: 'OrderEdit',
            component: () => import('@/views/sales/OrderForm.vue'),
            meta: { title: '编辑订单', hidden: true }
          },
          {
            path: 'orders/:id',
            name: 'OrderDetail',
            component: () => import('@/views/sales/OrderDetail.vue'),
            meta: { title: '订单详情', hidden: true }
          },
          {
            path: 'customers',
            name: 'Customers',
            component: () => import('@/views/sales/Customers.vue'),
            meta: { title: '客户管理' }
          },
          {
            path: 'customers/new',
            name: 'CustomerCreate',
            component: () => import('@/views/sales/CustomerForm.vue'),
            meta: { title: '新增客户', hidden: true }
          },
          {
            path: 'customers/:id/edit',
            name: 'CustomerEdit',
            component: () => import('@/views/sales/CustomerForm.vue'),
            meta: { title: '编辑客户', hidden: true }
          },
          {
            path: 'customers/:id',
            name: 'CustomerDetail',
            component: () => import('@/views/sales/CustomerDetail.vue'),
            meta: { title: '客户详情', hidden: true }
          },
          {
            path: 'customers/:customerId/visit/new',
            name: 'CustomerVisitCreate',
            component: () => import('@/views/sales/CustomerVisitForm.vue'),
            meta: { title: '添加回访记录', hidden: true }
          },
          {
            path: 'customers/:customerId/visit/:visitId/edit',
            name: 'CustomerVisitEdit',
            component: () => import('@/views/sales/CustomerVisitForm.vue'),
            meta: { title: '编辑回访记录', hidden: true }
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
            path: 'barns',
            name: 'Barns',
            component: () => import('@/views/system/Barns.vue'),
            meta: { title: '牛棚管理' }
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
  }
]

export default adminRoutes


