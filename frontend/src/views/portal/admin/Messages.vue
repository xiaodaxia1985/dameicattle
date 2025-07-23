<template>
  <div class="messages-management">
    <div class="messages-header">
      <h2>留言管理</h2>
      <p>管理客户留言和反馈</p>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label>状态筛选</label>
          <select v-model="filters.status" @change="fetchMessages">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="replied">已回复</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>时间范围</label>
          <select v-model="filters.dateRange" @change="fetchMessages">
            <option value="">全部时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>搜索</label>
          <input 
            type="text" 
            v-model="filters.keyword" 
            placeholder="搜索姓名、公司或内容"
            @input="debounceSearch"
          />
        </div>
        
        <div class="filter-actions">
          <button class="btn btn-primary" @click="fetchMessages">
            <i class="modern-icon icon-search"></i>
            搜索
          </button>
          <button class="btn btn-outline" @click="resetFilters">
            <i class="modern-icon icon-refresh"></i>
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">总留言数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.pending }}</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.replied }}</div>
        <div class="stat-label">已回复</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.todayNew }}</div>
        <div class="stat-label">今日新增</div>
      </div>
    </div>

    <!-- 留言列表 -->
    <div class="messages-list">
      <div class="list-header">
        <div class="bulk-actions">
          <input 
            type="checkbox" 
            v-model="selectAll" 
            @change="toggleSelectAll"
          />
          <span>全选</span>
          <button 
            class="btn btn-sm btn-outline"
            :disabled="selectedMessages.length === 0"
            @click="bulkUpdateStatus('replied')"
          >
            批量标记已回复
          </button>
          <button 
            class="btn btn-sm btn-outline"
            :disabled="selectedMessages.length === 0"
            @click="bulkUpdateStatus('closed')"
          >
            批量关闭
          </button>
        </div>
        
        <div class="list-info">
          共 {{ pagination.total }} 条留言
        </div>
      </div>

      <div class="messages-table">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">⏳</div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="messages.length === 0" class="empty-state">
          <div class="empty-icon">
            <i class="modern-icon icon-chat modern-icon-xl"></i>
          </div>
          <p>暂无留言数据</p>
        </div>
        
        <div v-else class="table-content">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="message-row"
            :class="{ 
              unread: message.status === 'pending',
              selected: selectedMessages.includes(message.id)
            }"
          >
            <div class="message-select">
              <input 
                type="checkbox" 
                :value="message.id"
                v-model="selectedMessages"
              />
            </div>
            
            <div class="message-info">
              <div class="message-header">
                <div class="sender-info">
                  <span class="sender-name">{{ message.name }}</span>
                  <span v-if="message.company" class="sender-company">{{ message.company }}</span>
                </div>
                <div class="message-meta">
                  <span class="message-time">{{ formatDate(message.createdAt) }}</span>
                  <span class="message-status" :class="message.status">
                    {{ getStatusLabel(message.status) }}
                  </span>
                </div>
              </div>
              
              <div class="message-subject">
                <span class="subject-label">{{ getSubjectLabel(message.subject) }}</span>
                <span v-if="message.cattleCount" class="cattle-count">
                  预计管理: {{ message.cattleCount }}
                </span>
              </div>
              
              <div class="message-content">
                {{ message.message }}
              </div>
              
              <div class="message-contact">
                <span class="contact-item">
                  <i class="modern-icon icon-phone"></i>
                  {{ message.phone }}
                </span>
                <span v-if="message.email" class="contact-item">
                  <i class="modern-icon icon-email"></i>
                  {{ message.email }}
                </span>
                <span v-if="message.preferredContact" class="contact-item">
                  <i class="modern-icon icon-chat"></i>
                  首选: {{ getContactLabel(message.preferredContact) }}
                </span>
              </div>
            </div>
            
            <div class="message-actions">
              <button 
                class="action-btn primary"
                @click="replyMessage(message)"
              >
                回复
              </button>
              <button 
                class="action-btn"
                @click="viewMessage(message)"
              >
                详情
              </button>
              <div class="action-dropdown">
                <button class="action-btn dropdown-toggle" @click="toggleDropdown(message.id)">
                  ⋮
                </button>
                <div v-if="activeDropdown === message.id" class="dropdown-menu">
                  <button @click="updateMessageStatus(message.id, 'processing')">
                    标记处理中
                  </button>
                  <button @click="updateMessageStatus(message.id, 'replied')">
                    标记已回复
                  </button>
                  <button @click="updateMessageStatus(message.id, 'closed')">
                    关闭留言
                  </button>
                  <button @click="deleteMessage(message.id)" class="danger">
                    删除留言
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button 
          class="page-btn"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </button>
        
        <div class="page-numbers">
          <button 
            v-for="page in getPageNumbers()" 
            :key="page"
            class="page-btn"
            :class="{ active: page === pagination.page }"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          class="page-btn"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 回复弹窗 -->
    <div v-if="showReplyModal" class="modal-overlay" @click="closeReplyModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>回复留言</h3>
          <button class="close-btn" @click="closeReplyModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="original-message">
            <h4>原留言内容</h4>
            <div class="original-content">
              <p><strong>姓名:</strong> {{ replyingMessage?.name }}</p>
              <p v-if="replyingMessage?.company"><strong>公司:</strong> {{ replyingMessage.company }}</p>
              <p><strong>联系电话:</strong> {{ replyingMessage?.phone }}</p>
              <p><strong>咨询主题:</strong> {{ getSubjectLabel(replyingMessage?.subject) }}</p>
              <p><strong>留言内容:</strong></p>
              <div class="message-text">{{ replyingMessage?.message }}</div>
            </div>
          </div>
          
          <form @submit.prevent="submitReply">
            <div class="form-group">
              <label>回复内容 *</label>
              <textarea 
                v-model="replyForm.content"
                rows="8"
                placeholder="请输入回复内容"
                required
              ></textarea>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? '发送中...' : '发送回复' }}
              </button>
              <button type="button" class="btn btn-outline" @click="closeReplyModal">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { portalApi } from '@/api/portal'

// 筛选条件
const filters = reactive({
  status: '',
  dateRange: '',
  keyword: ''
})

// 数据状态
const loading = ref(false)
const messages = ref<any[]>([])
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// 统计数据
const stats = reactive({
  total: 0,
  pending: 0,
  replied: 0,
  todayNew: 0
})

// 选择状态
const selectAll = ref(false)
const selectedMessages = ref<number[]>([])
const activeDropdown = ref<number | null>(null)

// 回复相关
const showReplyModal = ref(false)
const replyingMessage = ref<any>(null)
const submitting = ref(false)
const replyForm = reactive({
  content: ''
})

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待处理',
    processing: '处理中',
    replied: '已回复',
    closed: '已关闭'
  }
  return labels[status as keyof typeof labels] || status
}

// 获取主题标签
const getSubjectLabel = (subject: string) => {
  const labels = {
    product: '产品咨询',
    price: '价格咨询',
    demo: '产品演示',
    support: '技术支持',
    cooperation: '合作洽谈',
    other: '其他'
  }
  return labels[subject as keyof typeof labels] || subject
}

// 获取联系方式标签
const getContactLabel = (contact: string) => {
  const labels = {
    phone: '电话联系',
    email: '邮件联系',
    wechat: '微信联系'
  }
  return labels[contact as keyof typeof labels] || contact
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 获取分页数字
const getPageNumbers = () => {
  const pages = []
  const total = pagination.totalPages
  const current = pagination.page
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    } else if (current >= total - 3) {
      pages.push(1, '...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1, '...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...', total)
    }
  }
  
  return pages
}

// 获取留言列表
const fetchMessages = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined
    }
    
    const response = await portalApi.getContactMessages(params)
    messages.value = response.data.data
    Object.assign(pagination, response.data.pagination)
    
    // 更新统计数据
    updateStats()
  } catch (error) {
    console.error('获取留言失败:', error)
    // 使用模拟数据
    messages.value = [
      {
        id: 1,
        name: '张经理',
        company: '北京牧场集团',
        phone: '13800138001',
        email: 'zhang@example.com',
        subject: 'product',
        cattleCount: '1001-5000',
        message: '我们是一家大型牧场，希望了解贵公司的肉牛管理系统，请提供详细的产品介绍和报价。',
        preferredContact: 'phone',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: '李总',
        company: '现代养殖合作社',
        phone: '13900139002',
        email: 'li@example.com',
        subject: 'demo',
        cattleCount: '501-1000',
        message: '希望能够预约产品演示，了解系统的具体功能和操作流程。',
        preferredContact: 'wechat',
        status: 'processing',
        createdAt: '2024-01-14T15:20:00Z'
      }
    ]
    
    pagination.total = messages.value.length
    pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
    
    updateStats()
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStats = () => {
  stats.total = messages.value.length
  stats.pending = messages.value.filter(m => m.status === 'pending').length
  stats.replied = messages.value.filter(m => m.status === 'replied').length
  stats.todayNew = messages.value.filter(m => {
    const today = new Date().toDateString()
    return new Date(m.createdAt).toDateString() === today
  }).length
}

// 切换全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedMessages.value = messages.value.map(m => m.id)
  } else {
    selectedMessages.value = []
  }
}

// 切换下拉菜单
const toggleDropdown = (messageId: number) => {
  activeDropdown.value = activeDropdown.value === messageId ? null : messageId
}

// 更新留言状态
const updateMessageStatus = async (messageId: number, status: string) => {
  try {
    await portalApi.updateContactMessageStatus(messageId, status)
    
    // 更新本地数据
    const message = messages.value.find(m => m.id === messageId)
    if (message) {
      message.status = status
    }
    
    updateStats()
    activeDropdown.value = null
  } catch (error) {
    console.error('更新状态失败:', error)
    alert('更新状态失败，请重试')
  }
}

// 批量更新状态
const bulkUpdateStatus = async (status: string) => {
  if (selectedMessages.value.length === 0) return
  
  try {
    for (const messageId of selectedMessages.value) {
      await updateMessageStatus(messageId, status)
    }
    
    selectedMessages.value = []
    selectAll.value = false
    alert('批量操作成功')
  } catch (error) {
    console.error('批量操作失败:', error)
    alert('批量操作失败，请重试')
  }
}

// 回复留言
const replyMessage = (message: any) => {
  replyingMessage.value = message
  replyForm.content = ''
  showReplyModal.value = true
}

// 查看留言详情
const viewMessage = (message: any) => {
  // 这里可以实现查看详情功能
  alert(`查看留言详情: ${message.name}`)
}

// 删除留言
const deleteMessage = async (messageId: number) => {
  if (!confirm('确定要删除这条留言吗？')) return
  
  try {
    await portalApi.deleteContactMessage(messageId)
    
    // 从本地数据中移除
    const index = messages.value.findIndex(m => m.id === messageId)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
    
    updateStats()
    activeDropdown.value = null
    alert('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

// 关闭回复弹窗
const closeReplyModal = () => {
  showReplyModal.value = false
  replyingMessage.value = null
  replyForm.content = ''
}

// 提交回复
const submitReply = async () => {
  if (!replyingMessage.value || !replyForm.content.trim()) return
  
  submitting.value = true
  try {
    await portalApi.replyContactMessage(replyingMessage.value.id, replyForm.content)
    
    // 更新留言状态
    replyingMessage.value.status = 'replied'
    replyingMessage.value.reply = replyForm.content
    
    updateStats()
    closeReplyModal()
    alert('回复发送成功')
  } catch (error) {
    console.error('发送回复失败:', error)
    alert('发送回复失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  Object.assign(filters, {
    status: '',
    dateRange: '',
    keyword: ''
  })
  pagination.page = 1
  fetchMessages()
}

// 防抖搜索
let searchTimeout: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    fetchMessages()
  }, 500)
}

// 切换页面
const changePage = (page: string | number) => {
  const pageNum = typeof page === 'string' ? parseInt(page) : page
  if (pageNum < 1 || pageNum > pagination.totalPages) return
  pagination.page = pageNum
  fetchMessages()
}

onMounted(() => {
  fetchMessages()
})
</script>

<style scoped>
.messages-management {
  max-width: 100%;
}

.messages-header {
  margin-bottom: 30px;
}

.messages-header h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.messages-header p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 筛选区域 */
.filters-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.filter-group input,
.filter-group select {
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.icon {
  font-size: 14px;
}

/* 统计信息 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
}

/* 留言列表 */
.messages-list {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f8f9fa;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-info {
  font-size: 14px;
  color: #6c757d;
}

.loading-state,
.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #6c757d;
}

.loading-spinner,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.table-content {
  max-height: 600px;
  overflow-y: auto;
}

.message-row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f8f9fa;
  transition: background-color 0.3s;
}

.message-row:hover {
  background-color: #f8f9fa;
}

.message-row.unread {
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
}

.message-row.selected {
  background-color: #e3f2fd;
}

.message-select {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.message-info {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-name {
  font-weight: 600;
  color: #2c3e50;
}

.sender-company {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-time {
  font-size: 12px;
  color: #6c757d;
}

.message-status {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.message-status.pending {
  background: #fff3cd;
  color: #856404;
}

.message-status.processing {
  background: #cce5ff;
  color: #004085;
}

.message-status.replied {
  background: #d4edda;
  color: #155724;
}

.message-status.closed {
  background: #f8d7da;
  color: #721c24;
}

.message-subject {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.subject-label {
  font-size: 14px;
  font-weight: 500;
  color: #495057;
}

.cattle-count {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 4px;
}

.message-content {
  font-size: 14px;
  color: #495057;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-contact {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.contact-item {
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  position: relative;
}

.action-btn {
  padding: 4px 8px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn:hover {
  border-color: #667eea;
}

.action-btn.primary {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.action-dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 120px;
}

.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  text-align: left;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.dropdown-menu button:hover {
  background-color: #f8f9fa;
}

.dropdown-menu button.danger {
  color: #dc3545;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-top: 1px solid #f8f9fa;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: #667eea;
}

.page-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

/* 回复弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.original-message {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.original-message h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.original-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #495057;
}

.message-text {
  background: white;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #667eea;
  font-size: 14px;
  line-height: 1.5;
  color: #2c3e50;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .message-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .message-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .message-actions {
    justify-content: flex-end;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>