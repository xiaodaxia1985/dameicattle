import type { RouteRecordRaw } from 'vue-router'

const portalRoutes: RouteRecordRaw[] = [
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
          { path: '', redirect: 'dashboard' },
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
  }
]

export default portalRoutes


