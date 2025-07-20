<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h2>数据概览</h2>
      <p>门户网站运营数据统计</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalVisitors.toLocaleString() }}</div>
          <div class="stat-label">总访问量</div>
          <div class="stat-change positive">
            <i class="change-icon">↗</i>
            <span>+{{ stats.visitorGrowth }}%</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">📄</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.pageViews.toLocaleString() }}</div>
          <div class="stat-label">页面浏览量</div>
          <div class="stat-change positive">
            <i class="change-icon">↗</i>
            <span>+{{ stats.pageViewGrowth }}%</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💬</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.messages }}</div>
          <div class="stat-label">留言数量</div>
          <div class="stat-change positive">
            <i class="change-icon">↗</i>
            <span>+{{ stats.messageGrowth }}%</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.inquiries }}</div>
          <div class="stat-label">询价数量</div>
          <div class="stat-change positive">
            <i class="change-icon">↗</i>
            <span>+{{ stats.inquiryGrowth }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最新活动 -->
    <div class="activity-section">
      <div class="activity-container">
        <div class="activity-header">
          <h3>最新活动</h3>
          <router-link to="/portal/admin/messages" class="view-all-link">查看全部</router-link>
        </div>
        <div class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="activity-content">
              <div class="activity-text">{{ activity.text }}</div>
              <div class="activity-time">{{ formatTime(activity.time) }}</div>
            </div>
            <div class="activity-action" v-if="activity.actionable">
              <button class="action-btn" @click="handleActivity(activity)">
                处理
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <div class="actions-header">
          <h3>快捷操作</h3>
        </div>
        <div class="actions-grid">
          <router-link to="/portal/admin/content" class="action-card">
            <div class="action-icon">📝</div>
            <div class="action-title">内容管理</div>
            <div class="action-desc">编辑网站内容</div>
          </router-link>
          <router-link to="/portal/admin/messages" class="action-card">
            <div class="action-icon">💬</div>
            <div class="action-title">留言管理</div>
            <div class="action-desc">处理客户留言</div>
          </router-link>
          <router-link to="/portal/admin/inquiries" class="action-card">
            <div class="action-icon">💰</div>
            <div class="action-title">询价管理</div>
            <div class="action-desc">处理询价请求</div>
          </router-link>
          <router-link to="/portal" class="action-card" target="_blank">
            <div class="action-icon">🌐</div>
            <div class="action-title">预览网站</div>
            <div class="action-desc">查看网站效果</div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 统计数据
const stats = reactive({
  totalVisitors: 12580,
  visitorGrowth: 15.2,
  pageViews: 45230,
  pageViewGrowth: 8.7,
  messages: 156,
  messageGrowth: 12.3,
  inquiries: 89,
  inquiryGrowth: 25.6
})

// 最新活动数据
const recentActivities = ref([
  {
    id: 1,
    type: 'message',
    text: '收到来自"北京牧场集团"的新留言',
    time: new Date(Date.now() - 5 * 60 * 1000),
    actionable: true
  },
  {
    id: 2,
    type: 'inquiry',
    text: '收到新的产品询价请求',
    time: new Date(Date.now() - 15 * 60 * 1000),
    actionable: true
  },
  {
    id: 3,
    type: 'visit',
    text: '网站访问量突破10000次',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actionable: false
  }
])

// 获取活动图标
const getActivityIcon = (type: string) => {
  const icons = {
    message: '💬',
    inquiry: '💰',
    visit: '👥',
    content: '📝'
  }
  return icons[type as keyof typeof icons] || '📋'
}

// 格式化时间
const formatTime = (time: Date) => {
  const now = new Date()
  const diff = now.getTime() - time.getTime()
  
  if (diff < 60 * 1000) {
    return '刚刚'
  } else if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}分钟前`
  } else if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
  } else {
    return time.toLocaleDateString()
  }
}

// 处理活动
const handleActivity = (activity: any) => {
  if (activity.type === 'message') {
    router.push('/portal/admin/messages')
  } else if (activity.type === 'inquiry') {
    router.push('/portal/admin/inquiries')
  }
}

onMounted(() => {
  console.log('Dashboard mounted')
})
</script>

<style scoped>
.admin-dashboard {
  max-width: 100%;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.dashboard-header p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
}

.stat-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: #28a745;
}

.change-icon {
  font-size: 14px;
}

/* 活动区域 */
.activity-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.activity-container,
.quick-actions {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.activity-header,
.actions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.activity-header h3,
.actions-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.view-all-link {
  font-size: 14px;
  color: #667eea;
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.activity-icon.message {
  background: rgba(102, 126, 234, 0.1);
}

.activity-icon.inquiry {
  background: rgba(40, 167, 69, 0.1);
}

.activity-icon.visit {
  background: rgba(255, 193, 7, 0.1);
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: #2c3e50;
  margin-bottom: 2px;
}

.activity-time {
  font-size: 12px;
  color: #6c757d;
}

.activity-action {
  flex-shrink: 0;
}

.action-btn {
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-btn:hover {
  background: #5a6fd8;
}

/* 快捷操作 */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s;
}

.action-card:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  color: inherit;
}

.action-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.action-title {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .activity-section {
    grid-template-columns: 1fr;
  }
  
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>