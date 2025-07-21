<template>
  <div class="inquiries-management">
    <div class="inquiries-header">
      <h2>询价管理</h2>
      <p>管理产品询价和报价</p>
    </div>

    <!-- 筛选和搜索 -->
    <div class="filters-section">
      <div class="filters-row">
        <div class="filter-group">
          <label>状态筛选</label>
          <select v-model="filters.status" @change="fetchInquiries">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="quoted">已报价</option>
            <option value="closed">已关闭</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>时间范围</label>
          <select v-model="filters.dateRange" @change="fetchInquiries">
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
            placeholder="搜索公司名称或联系人"
            @input="debounceSearch"
          />
        </div>
        
        <div class="filter-actions">
          <button class="btn btn-primary" @click="fetchInquiries">
            <i class="icon">🔍</i>
            搜索
          </button>
          <button class="btn btn-outline" @click="resetFilters">
            <i class="icon">🔄</i>
            重置
          </button>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-row">
      <div class="stat-item">
        <div class="stat-number">{{ stats.total }}</div>
        <div class="stat-label">总询价数</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.pending }}</div>
        <div class="stat-label">待处理</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.quoted }}</div>
        <div class="stat-label">已报价</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ stats.todayNew }}</div>
        <div class="stat-label">今日新增</div>
      </div>
    </div>

    <!-- 询价列表 -->
    <div class="inquiries-list">
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
            :disabled="selectedInquiries.length === 0"
            @click="bulkUpdateStatus('processing')"
          >
            批量标记处理中
          </button>
          <button 
            class="btn btn-sm btn-outline"
            :disabled="selectedInquiries.length === 0"
            @click="bulkUpdateStatus('closed')"
          >
            批量关闭
          </button>
        </div>
        
        <div class="list-info">
          共 {{ pagination.total }} 条询价
        </div>
      </div>

      <div class="inquiries-table">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner">⏳</div>
          <p>加载中...</p>
        </div>
        
        <div v-else-if="inquiries.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <p>暂无询价数据</p>
        </div>
        
        <div v-else class="table-content">
          <div 
            v-for="inquiry in inquiries" 
            :key="inquiry.id"
            class="inquiry-row"
            :class="{ 
              unread: inquiry.status === 'pending',
              selected: selectedInquiries.includes(inquiry.id)
            }"
          >
            <div class="inquiry-select">
              <input 
                type="checkbox" 
                :value="inquiry.id"
                v-model="selectedInquiries"
              />
            </div>
            
            <div class="inquiry-info">
              <div class="inquiry-header">
                <div class="company-info">
                  <span class="company-name">{{ inquiry.company }}</span>
                  <span class="contact-name">{{ inquiry.name }}</span>
                </div>
                <div class="inquiry-meta">
                  <span class="inquiry-time">{{ formatDate(inquiry.createdAt) }}</span>
                  <span class="inquiry-status" :class="inquiry.status">
                    {{ getStatusLabel(inquiry.status) }}
                  </span>
                </div>
              </div>
              
              <div class="inquiry-details">
                <div class="detail-row">
                  <span class="detail-label">联系电话:</span>
                  <span class="detail-value">{{ inquiry.phone }}</span>
                </div>
                <div class="detail-row" v-if="inquiry.baseCount">
                  <span class="detail-label">基地数量:</span>
                  <span class="detail-value">{{ inquiry.baseCount }}</span>
                </div>
                <div class="detail-row" v-if="inquiry.userCount">
                  <span class="detail-label">用户数量:</span>
                  <span class="detail-value">{{ inquiry.userCount }}</span>
                </div>
              </div>
              
              <div class="inquiry-modules">
                <span class="modules-label">需求模块:</span>
                <div class="modules-list">
                  <span 
                    v-for="module in inquiry.modules" 
                    :key="module"
                    class="module-tag"
                  >
                    {{ getModuleLabel(module) }}
                  </span>
                </div>
              </div>
              
              <div v-if="inquiry.requirements" class="inquiry-requirements">
                <span class="requirements-label">特殊需求:</span>
                <div class="requirements-content">{{ inquiry.requirements }}</div>
              </div>
              
              <div v-if="inquiry.quote" class="inquiry-quote">
                <div class="quote-header">
                  <span class="quote-label">报价信息</span>
                  <span class="quote-time">{{ formatDate(inquiry.quotedAt) }}</span>
                </div>
                <div class="quote-content">
                  <div class="quote-price">
                    总价: ¥{{ inquiry.quote.totalPrice?.toLocaleString() }}
                  </div>
                  <div class="quote-note">{{ inquiry.quote.note }}</div>
                </div>
              </div>
            </div>
            
            <div class="inquiry-actions">
              <button 
                v-if="inquiry.status === 'pending' || inquiry.status === 'processing'"
                class="action-btn primary"
                @click="provideQuote(inquiry)"
              >
                {{ inquiry.status === 'pending' ? '报价' : '修改报价' }}
              </button>
              <button 
                class="action-btn"
                @click="viewInquiry(inquiry)"
              >
                详情
              </button>
              <div class="action-dropdown">
                <button class="action-btn dropdown-toggle" @click="toggleDropdown(inquiry.id)">
                  ⋮
                </button>
                <div v-if="activeDropdown === inquiry.id" class="dropdown-menu">
                  <button @click="updateInquiryStatus(inquiry.id, 'processing')">
                    标记处理中
                  </button>
                  <button @click="updateInquiryStatus(inquiry.id, 'quoted')">
                    标记已报价
                  </button>
                  <button @click="updateInquiryStatus(inquiry.id, 'closed')">
                    关闭询价
                  </button>
                  <button @click="deleteInquiry(inquiry.id)" class="danger">
                    删除询价
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

    <!-- 报价弹窗 -->
    <div v-if="showQuoteModal" class="modal-overlay" @click="closeQuoteModal">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>提供报价</h3>
          <button class="close-btn" @click="closeQuoteModal">×</button>
        </div>
        
        <div class="modal-body">
          <div class="inquiry-summary">
            <h4>询价信息</h4>
            <div class="summary-content">
              <div class="summary-row">
                <span class="summary-label">公司名称:</span>
                <span class="summary-value">{{ quotingInquiry?.company }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">联系人:</span>
                <span class="summary-value">{{ quotingInquiry?.name }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">联系电话:</span>
                <span class="summary-value">{{ quotingInquiry?.phone }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">需求模块:</span>
                <div class="summary-modules">
                  <span 
                    v-for="module in quotingInquiry?.modules" 
                    :key="module"
                    class="module-tag"
                  >
                    {{ getModuleLabel(module) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="submitQuote">
            <div class="quote-form">
              <h4>报价详情</h4>
              
              <div class="form-group">
                <label>基础费用 *</label>
                <input 
                  type="number" 
                  v-model="quoteForm.basePrice"
                  placeholder="请输入基础费用"
                  required
                />
              </div>
              
              <div class="form-group">
                <label>模块费用</label>
                <div class="module-pricing">
                  <div 
                    v-for="module in quotingInquiry?.modules" 
                    :key="module"
                    class="module-price-item"
                  >
                    <span class="module-name">{{ getModuleLabel(module) }}</span>
                    <input 
                      type="number" 
                      v-model="quoteForm.modulePrices[module]"
                      placeholder="模块价格"
                    />
                  </div>
                </div>
              </div>
              
              <div class="form-group">
                <label>实施费用</label>
                <input 
                  type="number" 
                  v-model="quoteForm.implementationPrice"
                  placeholder="请输入实施费用"
                />
              </div>
              
              <div class="form-group">
                <label>年度维护费</label>
                <input 
                  type="number" 
                  v-model="quoteForm.maintenancePrice"
                  placeholder="请输入年度维护费"
                />
              </div>
              
              <div class="form-group">
                <label>总价</label>
                <div class="total-price">
                  ¥{{ calculateTotalPrice().toLocaleString() }}
                </div>
              </div>
              
              <div class="form-group">
                <label>报价说明</label>
                <textarea 
                  v-model="quoteForm.note"
                  rows="4"
                  placeholder="请输入报价说明和备注"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label>有效期</label>
                <input 
                  type="date" 
                  v-model="quoteForm.validUntil"
                />
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? '提交中...' : '提交报价' }}
              </button>
              <button type="button" class="btn btn-outline" @click="closeQuoteModal">
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
const inquiries = ref<any[]>([])
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
  quoted: 0,
  todayNew: 0
})

// 选择状态
const selectAll = ref(false)
const selectedInquiries = ref<number[]>([])
const activeDropdown = ref<number | null>(null)

// 报价相关
const showQuoteModal = ref(false)
const quotingInquiry = ref<any>(null)
const submitting = ref(false)
const quoteForm = reactive({
  basePrice: 0,
  modulePrices: {} as Record<string, number>,
  implementationPrice: 0,
  maintenancePrice: 0,
  note: '',
  validUntil: ''
})

// 模块标签映射
const moduleLabels = {
  cattle: '牛只档案管理',
  health: '健康管理',
  feeding: '精准饲喂',
  materials: '物资管理',
  equipment: '设备管理',
  purchase: '采购管理',
  sales: '销售管理',
  dashboard: '数据分析'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待处理',
    processing: '处理中',
    quoted: '已报价',
    closed: '已关闭'
  }
  return labels[status as keyof typeof labels] || status
}

// 获取模块标签
const getModuleLabel = (module: string) => {
  return moduleLabels[module as keyof typeof moduleLabels] || module
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

// 计算总价
const calculateTotalPrice = () => {
  let total = quoteForm.basePrice || 0
  
  Object.values(quoteForm.modulePrices).forEach(price => {
    total += price || 0
  })
  
  total += quoteForm.implementationPrice || 0
  total += quoteForm.maintenancePrice || 0
  
  return total
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

// 获取询价列表
const fetchInquiries = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined
    }
    
    const response = await portalApi.getInquiries(params)
    inquiries.value = response.data.data
    Object.assign(pagination, response.data.pagination)
    
    updateStats()
  } catch (error) {
    console.error('获取询价失败:', error)
    // 使用模拟数据
    inquiries.value = [
      {
        id: 1,
        name: '张经理',
        company: '北京牧场集团',
        phone: '13800138001',
        modules: ['cattle', 'health', 'feeding', 'dashboard'],
        baseCount: '2-5',
        userCount: '11-50',
        requirements: '需要支持多基地管理，要求系统稳定可靠，支持移动端操作。',
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: '李总',
        company: '现代养殖合作社',
        phone: '13900139002',
        modules: ['cattle', 'health', 'materials'],
        baseCount: '1',
        userCount: '1-10',
        requirements: '主要用于牛只健康管理和物资管理。',
        status: 'quoted',
        quote: {
          totalPrice: 58000,
          note: '包含基础功能和一年维护服务',
          validUntil: '2024-02-15'
        },
        quotedAt: '2024-01-14T16:20:00Z',
        createdAt: '2024-01-13T09:15:00Z'
      }
    ]
    
    pagination.total = inquiries.value.length
    pagination.totalPages = Math.ceil(pagination.total / pagination.limit)
    
    updateStats()
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStats = () => {
  stats.total = inquiries.value.length
  stats.pending = inquiries.value.filter(i => i.status === 'pending').length
  stats.quoted = inquiries.value.filter(i => i.status === 'quoted').length
  stats.todayNew = inquiries.value.filter(i => {
    const today = new Date().toDateString()
    return new Date(i.createdAt).toDateString() === today
  }).length
}

// 切换全选
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedInquiries.value = inquiries.value.map(i => i.id)
  } else {
    selectedInquiries.value = []
  }
}

// 切换下拉菜单
const toggleDropdown = (inquiryId: number) => {
  activeDropdown.value = activeDropdown.value === inquiryId ? null : inquiryId
}

// 更新询价状态
const updateInquiryStatus = async (inquiryId: number, status: string) => {
  try {
    await portalApi.updateInquiryStatus(inquiryId, status)
    
    // 更新本地数据
    const inquiry = inquiries.value.find(i => i.id === inquiryId)
    if (inquiry) {
      inquiry.status = status
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
  if (selectedInquiries.value.length === 0) return
  
  try {
    for (const inquiryId of selectedInquiries.value) {
      await updateInquiryStatus(inquiryId, status)
    }
    
    selectedInquiries.value = []
    selectAll.value = false
    alert('批量操作成功')
  } catch (error) {
    console.error('批量操作失败:', error)
    alert('批量操作失败，请重试')
  }
}

// 提供报价
const provideQuote = (inquiry: any) => {
  quotingInquiry.value = inquiry
  
  // 重置表单
  Object.assign(quoteForm, {
    basePrice: 0,
    modulePrices: {},
    implementationPrice: 0,
    maintenancePrice: 0,
    note: '',
    validUntil: ''
  })
  
  // 初始化模块价格
  inquiry.modules.forEach((module: string) => {
    quoteForm.modulePrices[module] = 0
  })
  
  // 如果已有报价，填充表单
  if (inquiry.quote) {
    Object.assign(quoteForm, inquiry.quote)
  }
  
  showQuoteModal.value = true
}

// 查看询价详情
const viewInquiry = (inquiry: any) => {
  alert(`查看询价详情: ${inquiry.company}`)
}

// 删除询价
const deleteInquiry = async (inquiryId: number) => {
  if (!confirm('确定要删除这条询价吗？')) return
  
  try {
    await portalApi.deleteInquiry(inquiryId)
    
    // 从本地数据中移除
    const index = inquiries.value.findIndex(i => i.id === inquiryId)
    if (index !== -1) {
      inquiries.value.splice(index, 1)
    }
    
    updateStats()
    activeDropdown.value = null
    alert('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    alert('删除失败，请重试')
  }
}

// 关闭报价弹窗
const closeQuoteModal = () => {
  showQuoteModal.value = false
  quotingInquiry.value = null
}

// 提交报价
const submitQuote = async () => {
  if (!quotingInquiry.value) return
  
  submitting.value = true
  try {
    const quoteData = {
      basePrice: quoteForm.basePrice,
      modulePrices: quoteForm.modulePrices,
      implementationPrice: quoteForm.implementationPrice,
      maintenancePrice: quoteForm.maintenancePrice,
      totalPrice: calculateTotalPrice(),
      note: quoteForm.note,
      validUntil: quoteForm.validUntil
    }
    
    await portalApi.provideQuote(quotingInquiry.value.id, quoteData)
    
    // 更新本地数据
    quotingInquiry.value.status = 'quoted'
    quotingInquiry.value.quote = quoteData
    quotingInquiry.value.quotedAt = new Date().toISOString()
    
    updateStats()
    closeQuoteModal()
    alert('报价提交成功')
  } catch (error) {
    console.error('提交报价失败:', error)
    alert('提交报价失败，请重试')
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
  fetchInquiries()
}

// 防抖搜索
let searchTimeout: NodeJS.Timeout
const debounceSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    fetchInquiries()
  }, 500)
}

// 切换页面
const changePage = (page: string | number) => {
  const pageNum = typeof page === 'string' ? parseInt(page) : page
  if (pageNum < 1 || pageNum > pagination.totalPages) return
  pagination.page = pageNum
  fetchInquiries()
}

onMounted(() => {
  fetchInquiries()
})
</script>

<style scoped>
/* 基础样式与Messages.vue类似，这里只列出主要差异 */
.inquiries-management {
  max-width: 100%;
}

.inquiries-header {
  margin-bottom: 30px;
}

.inquiries-header h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.inquiries-header p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 询价特有样式 */
.inquiry-details {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.detail-label {
  color: #6c757d;
}

.detail-value {
  color: #495057;
  font-weight: 500;
}

.inquiry-modules {
  margin-bottom: 12px;
}

.modules-label {
  font-size: 12px;
  color: #6c757d;
  margin-right: 8px;
}

.modules-list {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.module-tag {
  font-size: 11px;
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.inquiry-requirements {
  margin-bottom: 12px;
}

.requirements-label {
  font-size: 12px;
  color: #6c757d;
  display: block;
  margin-bottom: 4px;
}

.requirements-content {
  font-size: 13px;
  color: #495057;
  line-height: 1.4;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border-left: 3px solid #667eea;
}

.inquiry-quote {
  background: #e8f5e8;
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid #28a745;
}

.quote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quote-label {
  font-size: 12px;
  font-weight: 600;
  color: #155724;
}

.quote-time {
  font-size: 11px;
  color: #6c757d;
}

.quote-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.quote-price {
  font-size: 14px;
  font-weight: 600;
  color: #155724;
}

.quote-note {
  font-size: 12px;
  color: #495057;
}

/* 报价弹窗样式 */
.modal-content.large {
  max-width: 800px;
}

.inquiry-summary {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.inquiry-summary h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.summary-label {
  color: #6c757d;
  min-width: 80px;
}

.summary-value {
  color: #495057;
  font-weight: 500;
}

.summary-modules {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.quote-form h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.module-pricing {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.module-price-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.module-name {
  min-width: 120px;
  font-size: 14px;
  color: #495057;
}

.module-price-item input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  font-size: 14px;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: #28a745;
  padding: 12px;
  background: #e8f5e8;
  border-radius: 6px;
  text-align: center;
}

/* 复用Messages.vue的其他样式 */
.filters-section,
.stats-row,
.inquiries-list,
.list-header,
.bulk-actions,
.list-info,
.inquiries-table,
.loading-state,
.empty-state,
.table-content,
.inquiry-row,
.inquiry-select,
.inquiry-info,
.inquiry-header,
.company-info,
.inquiry-meta,
.inquiry-actions,
.action-btn,
.action-dropdown,
.dropdown-menu,
.pagination,
.page-btn,
.page-numbers,
.modal-overlay,
.modal-content,
.modal-header,
.modal-body,
.close-btn,
.form-group,
.form-actions,
.btn {
  /* 继承Messages.vue的样式 */
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

/* 响应式设计 */
@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .inquiry-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .modules-list {
    margin-top: 4px;
  }
  
  .modal-content.large {
    width: 95%;
    margin: 20px;
  }
  
  .module-price-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  
  .module-name {
    min-width: auto;
  }
}
</style>