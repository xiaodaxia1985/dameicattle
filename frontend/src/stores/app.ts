import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 侧边栏折叠状态
  const sidebarCollapsed = ref(false)
  
  // 主题模式
  const isDark = ref(false)
  
  // 当前选中的基地
  const currentBaseId = ref<number | null>(null)
  
  // 页面加载状态
  const loading = ref(false)
  
  // 设备类型
  const deviceType = ref<'desktop' | 'mobile'>('desktop')

  // 切换侧边栏
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  }

  // 设置当前基地
  const setCurrentBase = (baseId: number | null) => {
    currentBaseId.value = baseId
    if (baseId) {
      localStorage.setItem('currentBaseId', baseId.toString())
    } else {
      localStorage.removeItem('currentBaseId')
    }
  }

  // 设置加载状态
  const setLoading = (state: boolean) => {
    loading.value = state
  }

  // 设置设备类型
  const setDeviceType = (type: 'desktop' | 'mobile') => {
    deviceType.value = type
  }

  // 初始化应用状态
  const initializeApp = () => {
    // 恢复主题设置
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      isDark.value = true
      document.documentElement.classList.add('dark')
    }

    // 恢复基地选择
    const savedBaseId = localStorage.getItem('currentBaseId')
    if (savedBaseId) {
      currentBaseId.value = parseInt(savedBaseId)
    }

    // 检测设备类型
    const checkDeviceType = () => {
      setDeviceType(window.innerWidth <= 768 ? 'mobile' : 'desktop')
    }
    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)
  }

  return {
    sidebarCollapsed,
    isDark,
    currentBaseId,
    loading,
    deviceType,
    toggleSidebar,
    toggleTheme,
    setCurrentBase,
    setLoading,
    setDeviceType,
    initializeApp
  }
})