import type { RouteRecordRaw } from 'vue-router'

const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('@/views/404.vue'),
  meta: { title: '页面不存在' }
}

export default notFoundRoute


