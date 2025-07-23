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

app.mount('#app')