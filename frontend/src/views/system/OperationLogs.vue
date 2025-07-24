<template>
  <div class="operation-logs-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>操作日志</h2>
      <p>查看系统用户的操作记录和审计信息</p>
    </div>

    <!-- 搜索工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleExport" v-if="hasPermission('operation-log:export')">
          <el-icon><Download /></el-icon>
          导出日志
        </el-button>
        <el-button @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名或操作内容"
          style="width: 200px; margin-right: 10px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.user_id"
          placeholder="选择用户"
          style="width: 150px; margin-right: 10px"
          clearable
          filterable
          @change="handleSearch"
        >
          <el-option
            v-for="user in users"
            :key="user.id"
            :label="user.real_name"
            :value="user.id"
          />
        </el-select>
        <el-select
          v-model="searchForm.action"
          placeholder="操作类型"
          style="width: 120px; margin-right: 10px"
          clearable
          @change="handleSearch"
        >
          <el-option label="登录" value="login" />
          <el-option label="登出" value="logout" />
          <el-option label="创建" value="create" />
          <el-option label="更新" value="update" />
          <el-option label="删除" value="delete" />
          <el-option label="导入" value="import" />
          <el-option label="导出" value="export" />
        </el-select>
        <el-select
          v-model="searchForm.resource"
          placeholder="资源类型"
          style="width: 120px; margin-right: 10px"
          clearable
          @change="handleSearch"
        >
          <el-option label="用户" value="user" />
          <el-option label="角色" value="role" />
          <el-option label="基地" value="base" />
          <el-option label="牛只" value="cattle" />
          <el-option label="健康记录" value="health" />
          <el-option label="饲喂记录" value="feeding" />
          <el-option label="采购订单" value="purchase" />
          <el-option label="销售订单" value="sales" />
          <el-option label="物资" value="material" />
          <el-option label="设备" value="equipment" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-right: 10px"
          @change="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-icon login">
            <el-icon><User /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ statistics.todayLogins }}</div>
            <div class="stats-label">今日登录</div>
          </div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-icon operation">
            <el-icon><Operation /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ statistics.todayOperations }}</div>
            <div class="stats-label">今日操作</div>
          </div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-icon active">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ statistics.activeUsers }}</div>
            <div class="stats-label">活跃用户</div>
          </div>
        </div>
      </el-card>
      <el-card class="stats-card">
        <div class="stats-content">
          <div class="stats-icon total">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stats-info">
            <div class="stats-number">{{ statistics.totalLogs }}</div>
            <div class="stats-label">总日志数</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 操作日志列表 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="operationLogs"
        stripe
        border
        :default-sort="{ prop: 'created_at', order: 'descending' }"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div class="user-info">
              <div class="user-name">{{ row.user_name }}</div>
              <div class="user-id">ID: {{ row.user_id }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="资源" width="120">
          <template #default="{ row }">
            <div class="resource-info">
              <div class="resource-type">{{ getResourceText(row.resource) }}</div>
              <div class="resource-id" v-if="row.resource_id">ID: {{ row.resource_id }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column label="设备信息" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="device-info">
              {{ getDeviceInfo(row.user_agent) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="操作时间" width="160" sortable>
          <template #default="{ row }">
            <div class="time-info">
              <div class="date">{{ formatDate(row.created_at) }}</div>
              <div class="time">{{ formatTime(row.created_at) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="200">
          <template #default="{ row }">
            <div class="details-cell">
              <el-button
                type="text"
                size="small"
                @click="handleViewDetails(row)"
                v-if="row.details"
              >
                查看详情
              </el-button>
              <span v-else class="no-details">无详情</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailsVisible"
      title="操作详情"
      width="800px"
    >
      <div class="details-content" v-if="currentLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentLog.user_name }} (ID: {{ currentLog.user_id }})</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getActionTagType(currentLog.action)">
              {{ getActionText(currentLog.action) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="资源类型">{{ getResourceText(currentLog.resource) }}</el-descriptions-item>
          <el-descriptions-item label="资源ID" v-if="currentLog.resource_id">{{ currentLog.resource_id }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip_address }}</el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ formatDateTime(currentLog.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="用户代理" :span="2">
            <div class="user-agent">{{ currentLog.user_agent }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div class="details-json" v-if="currentLog.details">
          <h4>详细信息</h4>
          <el-input
            type="textarea"
            :rows="10"
            :value="JSON.stringify(currentLog.details, null, 2)"
            readonly
            class="json-textarea"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh, Search, User, Operation, UserFilled, Document } from '@element-plus/icons-vue'
import { userApi, type OperationLogParams, type OperationLog } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import type { User as UserType } from '@/types/auth'

const authStore = useAuthStore()

// 权限检查
const hasPermission = (permission: string) => {
  return authStore.hasPermission(permission)
}

// 响应式数据
const loading = ref(false)
const operationLogs = ref<OperationLog[]>([])
const users = ref<UserType[]>([])
const dateRange = ref<any>(null)
const detailsVisible = ref(false)
const currentLog = ref<OperationLog | null>(null)

// 搜索表单
const searchForm = reactive<OperationLogParams & { keyword: string }>({
  keyword: '',
  user_id: undefined,
  action: '',
  resource: '',
  start_date: '',
  end_date: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 统计数据
const statistics = reactive({
  todayLogins: 0,
  todayOperations: 0,
  activeUsers: 0,
  totalLogs: 0
})

// 方法
const loadOperationLogs = async () => {
  try {
    loading.value = true
    const params: OperationLogParams = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    if (dateRange.value) {
      params.start_date = dateRange.value[0].toISOString().split('T')[0]
      params.end_date = dateRange.value[1].toISOString().split('T')[0]
    }
    
    const response = await userApi.getOperationLogs(params)
    // 根据API实现，response 应该是 { data: [...], total: number, page: number, limit: number }
    operationLogs.value = response.data || []
    pagination.total = response.total || 0
  } catch (error) {
    console.error('Load operation logs error:', error)
    ElMessage.error('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const response = await userApi.getUsers({ limit: 1000 })
    // 根据API实现，response 应该是 { data: [...], total: number, page: number, limit: number }
    users.value = response.data || []
  } catch (error) {
    console.error('Load users error:', error)
  }
}

const loadStatistics = async () => {
  try {
    // 这里应该调用统计API，暂时使用模拟数据
    statistics.todayLogins = Math.floor(Math.random() * 50) + 10
    statistics.todayOperations = Math.floor(Math.random() * 200) + 50
    statistics.activeUsers = Math.floor(Math.random() * 20) + 5
    statistics.totalLogs = pagination.total
  } catch (error) {
    console.error('Load statistics error:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadOperationLogs()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    user_id: undefined,
    action: '',
    resource: '',
    start_date: '',
    end_date: ''
  })
  dateRange.value = null
  handleSearch()
}

const handleRefresh = () => {
  loadOperationLogs()
  loadStatistics()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadOperationLogs()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOperationLogs()
}

const handleViewDetails = (log: OperationLog) => {
  currentLog.value = log
  detailsVisible.value = true
}

const handleExport = async () => {
  try {
    ElMessage.info('导出功能开发中...')
    // TODO: 实现导出功能
  } catch (error) {
    console.error('Export error:', error)
    ElMessage.error('导出失败')
  }
}

// 工具方法
const getActionTagType = (action: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const typeMap: { [key: string]: 'success' | 'primary' | 'warning' | 'info' | 'danger' } = {
    'login': 'success',
    'logout': 'info',
    'create': 'primary',
    'update': 'warning',
    'delete': 'danger',
    'import': 'success',
    'export': 'info'
  }
  return typeMap[action] || 'info'
}

const getActionText = (action: string) => {
  const textMap: { [key: string]: string } = {
    'login': '登录',
    'logout': '登出',
    'create': '创建',
    'update': '更新',
    'delete': '删除',
    'import': '导入',
    'export': '导出'
  }
  return textMap[action] || action
}

const getResourceText = (resource: string) => {
  const textMap: { [key: string]: string } = {
    'user': '用户',
    'role': '角色',
    'base': '基地',
    'cattle': '牛只',
    'health': '健康记录',
    'feeding': '饲喂记录',
    'purchase': '采购订单',
    'sales': '销售订单',
    'material': '物资',
    'equipment': '设备',
    'news': '新闻',
    'system': '系统'
  }
  return textMap[resource] || resource
}

const getDeviceInfo = (userAgent: string) => {
  if (!userAgent) return '未知设备'
  
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return '移动设备'
  } else if (userAgent.includes('Chrome')) {
    return 'Chrome浏览器'
  } else if (userAgent.includes('Firefox')) {
    return 'Firefox浏览器'
  } else if (userAgent.includes('Safari')) {
    return 'Safari浏览器'
  } else if (userAgent.includes('Edge')) {
    return 'Edge浏览器'
  } else {
    return '桌面设备'
  }
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

const formatDate = (dateTime: string) => {
  return new Date(dateTime).toLocaleDateString('zh-CN')
}

const formatTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleTimeString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadOperationLogs()
  loadUsers()
  loadStatistics()
})
</script>

<style scoped>
.operation-logs-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stats-icon.login {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.operation {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.active {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon.total {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stats-label {
  font-size: 14px;
  color: #606266;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.user-id {
  font-size: 12px;
  color: #909399;
}

.resource-info {
  display: flex;
  flex-direction: column;
}

.resource-type {
  font-weight: 500;
  color: #303133;
}

.resource-id {
  font-size: 12px;
  color: #909399;
}

.device-info {
  font-size: 13px;
  color: #606266;
}

.time-info {
  display: flex;
  flex-direction: column;
}

.date {
  font-weight: 500;
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
}

.details-cell {
  display: flex;
  align-items: center;
}

.no-details {
  color: #c0c4cc;
  font-size: 12px;
}

.details-content {
  max-height: 600px;
  overflow-y: auto;
}

.user-agent {
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}

.details-json {
  margin-top: 20px;
}

.details-json h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.json-textarea {
  font-family: 'Courier New', monospace;
}

:deep(.json-textarea .el-textarea__inner) {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background: #f5f5f5;
}
</style>