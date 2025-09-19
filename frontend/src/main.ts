// 核心依赖导入
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 应用组件和路由
import App from './App.vue'
import router from './router'

// 样式文件
import './styles/index.scss'
import './styles/modern-icons.scss'

// 工具函数和服务
import { useAuthStore, useAppStore } from './stores'
import { registerCustomTheme } from './utils/chartTheme'
import { checkBackendConnection } from './utils/healthCheck'
import { isUserLoggedIn } from './utils/authGuard'

// 创建应用实例
const app = createApp(App)
const pinia = createPinia()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册插件
app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 注册图表主题
registerCustomTheme()

// 初始化 stores
const authStore = useAuthStore()
const appStore = useAppStore()

// 初始化认证状态 (异步)
authStore.initializeAuth().then(() => {
  console.log('认证状态初始化完成')
}).catch((error) => {
  console.error('认证状态初始化失败:', error)
})

// 监听认证状态失效事件
if (typeof window !== 'undefined') {
  window.addEventListener('auth:token-invalid', () => {
    console.log('收到token失效事件，跳转到登录页面')
    // 延迟一下再跳转，避免与当前操作冲突
    setTimeout(() => {
      if (router.currentRoute.value.path !== '/login') {
        router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
      }
    }, 100)
  })
}

// 初始化应用状态
appStore.initializeApp()

// 只在未登录状态下检查后端连接

// 只有在未登录或在登录页面时才执行健康检查
if (!isUserLoggedIn() || router.currentRoute.value.path === '/login') {
  checkBackendConnection()
}

// Development mode logging
if (import.meta.env.MODE === 'development') {
  console.log('🚀 前端应用已启动')
}

app.mount('#app')