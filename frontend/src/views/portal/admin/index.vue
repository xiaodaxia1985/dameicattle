<template>
  <div class="portal-admin">
    <div class="admin-header">
      <div class="container">
        <div class="header-content">
          <h1>门户网站管理</h1>
          <div class="header-actions">
            <router-link to="/portal" class="btn btn-outline" target="_blank">
              <i class="icon">🌐</i>
              预览网站
            </router-link>
            <router-link to="/" class="btn btn-primary">
              <i class="icon">🏠</i>
              返回后台
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div class="admin-content">
      <div class="container">
        <div class="admin-layout">
          <!-- 侧边导航 -->
          <aside class="admin-sidebar">
            <nav class="sidebar-nav">
              <router-link 
                to="/portal/admin/dashboard" 
                class="nav-item"
                :class="{ active: $route.path.includes('dashboard') }"
              >
                <i class="nav-icon">📊</i>
                <span>数据概览</span>
              </router-link>
              <router-link 
                to="/portal/admin/content" 
                class="nav-item"
                :class="{ active: $route.path.includes('content') }"
              >
                <i class="nav-icon">📝</i>
                <span>内容管理</span>
              </router-link>
              <router-link 
                to="/portal/admin/messages" 
                class="nav-item"
                :class="{ active: $route.path.includes('messages') }"
              >
                <i class="nav-icon">💬</i>
                <span>留言管理</span>
                <span class="badge" v-if="unreadMessages > 0">{{ unreadMessages }}</span>
              </router-link>
              <router-link 
                to="/portal/admin/inquiries" 
                class="nav-item"
                :class="{ active: $route.path.includes('inquiries') }"
              >
                <i class="nav-icon">💰</i>
                <span>询价管理</span>
                <span class="badge" v-if="pendingInquiries > 0">{{ pendingInquiries }}</span>
              </router-link>
            </nav>
          </aside>

          <!-- 主要内容区域 -->
          <main class="admin-main">
            <router-view />
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { portalApi } from '@/api/portal'

const unreadMessages = ref(0)
const pendingInquiries = ref(0)

// 获取未读消息数量
const fetchUnreadCounts = async () => {
  try {
    // 获取未读留言数量
    const messagesResponse = await portalApi.getContactMessages({
      status: 'pending',
      limit: 1
    })
    unreadMessages.value = messagesResponse.data.pagination.total

    // 获取待处理询价数量
    const inquiriesResponse = await portalApi.getInquiries({
      status: 'pending',
      limit: 1
    })
    pendingInquiries.value = inquiriesResponse.data.pagination.total
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

onMounted(() => {
  fetchUnreadCounts()
  
  // 每30秒刷新一次未读数量
  setInterval(fetchUnreadCounts, 30000)
})
</script>

<style scoped>
.portal-admin {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 头部 */
.admin-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background-color: white;
  color: #667eea;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
}

.btn-outline {
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.btn-outline:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.icon {
  font-size: 16px;
}

/* 内容区域 */
.admin-content {
  padding: 30px 0;
}

.admin-layout {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 30px;
  min-height: calc(100vh - 140px);
}

/* 侧边栏 */
.admin-sidebar {
  background: white;
  border-radius: 12px;
  padding: 20px 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: fit-content;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #6c757d;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  position: relative;
}

.nav-item:hover {
  background-color: #f8f9fa;
  color: #2c3e50;
}

.nav-item.active {
  background-color: #667eea;
  color: white;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background-color: #764ba2;
}

.nav-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

.badge {
  background-color: #dc3545;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: auto;
  min-width: 16px;
  text-align: center;
}

.nav-item.active .badge {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 主要内容 */
.admin-main {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  min-height: 600px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .admin-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .admin-sidebar {
    order: 2;
  }
  
  .admin-main {
    order: 1;
    padding: 20px;
  }
  
  .sidebar-nav {
    flex-direction: row;
    overflow-x: auto;
    padding: 0 10px;
  }
  
  .nav-item {
    flex-shrink: 0;
    padding: 8px 16px;
    border-radius: 6px;
    margin: 0 4px;
  }
  
  .nav-item.active::before {
    display: none;
  }
}

@media (max-width: 480px) {
  .admin-content {
    padding: 20px 0;
  }
  
  .header-content h1 {
    font-size: 20px;
  }
  
  .btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>