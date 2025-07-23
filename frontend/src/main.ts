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

// Initialize auth state
authStore.initializeAuth()

// Initialize app state
appStore.initializeApp()

// Check backend connection
import { checkBackendConnection } from './utils/healthCheck'
checkBackendConnection()

// Initialize debug tools in development
if (import.meta.env.MODE === 'development') {
  import('./utils/debug').then(({ debugInfo }) => {
    console.log('🚀 前端应用已启动')
    console.log('💡 在控制台输入 debugInfo.printDebugInfo() 查看调试信息')
    
    // Auto-run debug info after a short delay
    setTimeout(() => {
      debugInfo.printDebugInfo()
    }, 2000)
  })
}

app.mount('#app')