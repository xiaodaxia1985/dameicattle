<template>
  <div class="system-test">
    <div class="page-header">
      <h1 class="page-title">系统完整性测试</h1>
      <p class="page-description">测试所有微服务的连接性和数据处理完整性</p>
    </div>

    <el-card class="test-controls">
      <div class="controls">
        <el-button type="primary" @click="runHealthCheck" :loading="healthCheckLoading">
          <el-icon><Refresh /></el-icon>
          健康检查
        </el-button>
        <el-button type="success" @click="runDataIntegrityTest" :loading="dataTestLoading">
          <el-icon><DataAnalysis /></el-icon>
          数据完整性测试
        </el-button>
        <el-button type="warning" @click="fixDataIssues" :loading="fixingIssues">
          <el-icon><Tools /></el-icon>
          修复数据问题
        </el-button>
        <el-button @click="clearResults">
          <el-icon><Delete /></el-icon>
          清空结果
        </el-button>
      </div>
    </el-card>

    <!-- 健康检查结果 -->
    <el-card v-if="healthReport" class="health-report">
      <template #header>
        <div class="card-header">
          <span>系统健康状态</span>
          <el-tag 
            :type="healthReport.overall === 'healthy' ? 'success' : 
                   healthReport.overall === 'degraded' ? 'warning' : 'danger'"
            size="large"
          >
            {{ healthReport.overall === 'healthy' ? '健康' : 
               healthReport.overall === 'degraded' ? '降级' : '不健康' }}
          </el-tag>
        </div>
      </template>

      <div class="health-summary">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ healthReport.summary.total }}</div>
              <div class="stat-label">总服务数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item success">
              <div class="stat-number">{{ healthReport.summary.healthy }}</div>
              <div class="stat-label">健康服务</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item danger">
              <div class="stat-number">{{ healthReport.summary.unhealthy }}</div>
              <div class="stat-label">异常服务</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item info">
              <div class="stat-number">{{ healthReport.summary.unknown }}</div>
              <div class="stat-label">未知状态</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <el-table :data="healthReport.services" style="width: 100%">
        <el-table-column prop="name" label="服务名称" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'healthy' ? 'success' : 
                     row.status === 'unhealthy' ? 'danger' : 'info'"
              size="small"
            >
              {{ row.status === 'healthy' ? '健康' : 
                 row.status === 'unhealthy' ? '异常' : '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="responseTime" label="响应时间(ms)" width="120" />
        <el-table-column prop="error" label="错误信息" />
        <el-table-column prop="lastCheck" label="检查时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.lastCheck) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 数据完整性测试结果 -->
    <el-card v-if="dataTestResults" class="data-test-results">
      <template #header>
        <div class="card-header">
          <span>数据完整性测试</span>
          <el-tag 
            :type="dataTestResults.success ? 'success' : 'danger'"
            size="large"
          >
            {{ dataTestResults.success ? '通过' : '失败' }}
          </el-tag>
        </div>
      </template>

      <el-table :data="dataTestResults.results" style="width: 100%">
        <el-table-column prop="api" label="API服务" width="120" />
        <el-table-column prop="endpoint" label="端点" width="150" />
        <el-table-column prop="success" label="连接状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dataValid" label="数据有效性" width="120">
          <template #default="{ row }">
            <el-tag 
              v-if="row.success"
              :type="row.dataValid ? 'success' : 'warning'" 
              size="small"
            >
              {{ row.dataValid ? '有效' : '无效' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="error" label="错误信息" />
      </el-table>
    </el-card>

    <!-- 修复结果 -->
    <el-card v-if="fixResults" class="fix-results">
      <template #header>
        <div class="card-header">
          <span>数据修复结果</span>
          <el-tag type="info" size="large">
            修复了 {{ fixResults.fixed }} 个问题
          </el-tag>
        </div>
      </template>

      <el-timeline>
        <el-timeline-item
          v-for="(issue, index) in fixResults.issues"
          :key="index"
          :timestamp="new Date().toLocaleTimeString()"
        >
          {{ issue }}
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 实时日志 -->
    <el-card class="logs">
      <template #header>
        <div class="card-header">
          <span>实时日志</span>
          <el-button size="small" @click="clearLogs">清空日志</el-button>
        </div>
      </template>

      <div class="log-container">
        <div 
          v-for="(log, index) in logs" 
          :key="index"
          :class="['log-item', `log-${log.level}`]"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, DataAnalysis, Tools, Delete } from '@element-plus/icons-vue'
import { 
  checkAllServicesHealth, 
  testDataApiIntegrity, 
  fixCommonDataIssues,
  startAutoHealthCheck,
  type SystemHealthReport
} from '@/utils/systemHealthCheck'
import dayjs from 'dayjs'

// 响应式数据
const healthCheckLoading = ref(false)
const dataTestLoading = ref(false)
const fixingIssues = ref(false)

const healthReport = ref<SystemHealthReport | null>(null)
const dataTestResults = ref<any>(null)
const fixResults = ref<any>(null)

const logs = ref<Array<{
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
}>>([])

let autoHealthCheckStop: (() => void) | null = null

// 添加日志
const addLog = (level: 'info' | 'warn' | 'error' | 'success', message: string) => {
  logs.value.unshift({
    timestamp: new Date(),
    level,
    message
  })
  
  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

// 运行健康检查
const runHealthCheck = async () => {
  healthCheckLoading.value = true
  addLog('info', '开始系统健康检查...')
  
  try {
    const report = await checkAllServicesHealth()
    healthReport.value = report
    
    if (report.overall === 'healthy') {
      addLog('success', `健康检查完成：所有 ${report.summary.total} 个服务运行正常`)
      ElMessage.success('所有服务运行正常')
    } else {
      addLog('warn', `健康检查完成：${report.summary.unhealthy} 个服务异常`)
      ElMessage.warning(`发现 ${report.summary.unhealthy} 个服务异常`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '健康检查失败'
    addLog('error', `健康检查失败: ${errorMessage}`)
    ElMessage.error(errorMessage)
  } finally {
    healthCheckLoading.value = false
  }
}

// 运行数据完整性测试
const runDataIntegrityTest = async () => {
  dataTestLoading.value = true
  addLog('info', '开始数据完整性测试...')
  
  try {
    const results = await testDataApiIntegrity()
    dataTestResults.value = results
    
    const successCount = results.results.filter(r => r.success).length
    const totalCount = results.results.length
    
    if (results.success) {
      addLog('success', `数据完整性测试通过：${successCount}/${totalCount} 个API正常`)
      ElMessage.success('数据完整性测试通过')
    } else {
      addLog('warn', `数据完整性测试部分失败：${successCount}/${totalCount} 个API正常`)
      ElMessage.warning('部分API存在问题')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '数据完整性测试失败'
    addLog('error', `数据完整性测试失败: ${errorMessage}`)
    ElMessage.error(errorMessage)
  } finally {
    dataTestLoading.value = false
  }
}

// 修复数据问题
const fixDataIssues = async () => {
  fixingIssues.value = true
  addLog('info', '开始修复数据问题...')
  
  try {
    const results = await fixCommonDataIssues()
    fixResults.value = results
    
    if (results.fixed > 0) {
      addLog('success', `修复完成：修复了 ${results.fixed} 个问题`)
      ElMessage.success(`修复了 ${results.fixed} 个问题`)
    } else {
      addLog('info', '未发现需要修复的问题')
      ElMessage.info('未发现需要修复的问题')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '修复过程失败'
    addLog('error', `修复失败: ${errorMessage}`)
    ElMessage.error(errorMessage)
  } finally {
    fixingIssues.value = false
  }
}

// 清空结果
const clearResults = () => {
  healthReport.value = null
  dataTestResults.value = null
  fixResults.value = null
  addLog('info', '清空了所有测试结果')
}

// 清空日志
const clearLogs = () => {
  logs.value = []
}

// 格式化时间
const formatTime = (time: Date | string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  addLog('info', '系统测试页面已加载')
  
  // 启动自动健康检查（每5分钟）
  autoHealthCheckStop = startAutoHealthCheck(5)
  addLog('info', '已启动自动健康检查（每5分钟）')
})

onUnmounted(() => {
  if (autoHealthCheckStop) {
    autoHealthCheckStop()
    addLog('info', '已停止自动健康检查')
  }
})
</script>

<style lang="scss" scoped>
.system-test {
  .page-header {
    margin-bottom: 20px;
    
    .page-title {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
      margin: 0 0 8px 0;
    }
    
    .page-description {
      color: #909399;
      margin: 0;
    }
  }
  
  .test-controls {
    margin-bottom: 20px;
    
    .controls {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
  
  .health-report,
  .data-test-results,
  .fix-results,
  .logs {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
  
  .health-summary {
    margin-bottom: 20px;
    
    .stat-item {
      text-align: center;
      padding: 16px;
      border-radius: 8px;
      background: #f5f7fa;
      
      .stat-number {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
      
      &.success {
        background: #f0f9ff;
        .stat-number { color: #67c23a; }
      }
      
      &.danger {
        background: #fef0f0;
        .stat-number { color: #f56c6c; }
      }
      
      &.info {
        background: #f4f4f5;
        .stat-number { color: #909399; }
      }
    }
  }
  
  .log-container {
    max-height: 400px;
    overflow-y: auto;
    background: #1e1e1e;
    border-radius: 4px;
    padding: 12px;
    
    .log-item {
      display: flex;
      gap: 12px;
      margin-bottom: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      
      .log-time {
        color: #888;
        min-width: 80px;
      }
      
      .log-level {
        min-width: 60px;
        font-weight: bold;
      }
      
      .log-message {
        flex: 1;
      }
      
      &.log-info {
        .log-level { color: #409eff; }
        .log-message { color: #e6e6e6; }
      }
      
      &.log-success {
        .log-level { color: #67c23a; }
        .log-message { color: #e6e6e6; }
      }
      
      &.log-warn {
        .log-level { color: #e6a23c; }
        .log-message { color: #e6e6e6; }
      }
      
      &.log-error {
        .log-level { color: #f56c6c; }
        .log-message { color: #e6e6e6; }
      }
    }
  }
}
</style>