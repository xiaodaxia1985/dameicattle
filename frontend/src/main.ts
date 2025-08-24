import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import './styles/index.scss'
import './styles/modern-icons.scss'
import { useAuthStore, useAppStore } from './stores'
import { registerCustomTheme } from './utils/chartTheme'

const app = createApp(App)
const pinia = createPinia()

// Register Element Plus icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// Register chart theme
registerCustomTheme()

// Initialize stores
const authStore = useAuthStore()
const appStore = useAppStore()

// Initialize auth state (async)
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

// Initialize app state
appStore.initializeApp()

// Check backend connection
import { checkBackendConnection } from './utils/healthCheck'
checkBackendConnection()

// Initialize Vue component fixes
import { fixAllVueErrors } from './utils/vueComponentFix'
fixAllVueErrors()

// Initialize all module fixes
import { fixAllModules } from './utils/fixAllModules'
fixAllModules().then((results) => {
  console.log('🔧 模块修复完成:', results)
}).catch((error) => {
  console.error('❌ 模块修复失败:', error)
})

// Development mode logging
if (import.meta.env.MODE === 'development') {
  console.log('🚀 前端应用已启动')
}

app.mount('#app')