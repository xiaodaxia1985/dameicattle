<template>
  <div class="equipment-detail" v-if="equipment">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 基本信息 -->
      <el-tab-pane label="基本信息" name="basic">
        <div class="detail-section">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>设备名称：</label>
                <span>{{ equipment.name }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>设备编码：</label>
                <span>{{ equipment.code }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>设备分类：</label>
                <span>{{ equipment.category?.name || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>设备状态：</label>
                <el-tag :type="getStatusType(equipment.status)">
                  {{ getStatusText(equipment.status) }}
                </el-tag>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>所属基地：</label>
                <span>{{ equipment.base?.name || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>所属牛棚：</label>
                <span>{{ equipment.barn?.name || '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>品牌：</label>
                <span>{{ equipment.brand || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>型号：</label>
                <span>{{ equipment.model || '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>序列号：</label>
                <span>{{ equipment.serial_number || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>安装位置：</label>
                <span>{{ equipment.location || '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>采购日期：</label>
                <span>{{ equipment.purchase_date ? formatDate(equipment.purchase_date) : '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>采购价格：</label>
                <span>{{ equipment.purchase_price ? `¥${equipment.purchase_price}` : '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>保修期：</label>
                <span>{{ equipment.warranty_period ? `${equipment.warranty_period}个月` : '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>安装日期：</label>
                <span>{{ equipment.installation_date ? formatDate(equipment.installation_date) : '-' }}</span>
              </div>
            </el-col>
          </el-row>

          <div class="detail-item full-width">
            <label>技术规格：</label>
            <div class="specifications">
              <el-tag
                v-for="(value, key) in equipment.specifications"
                :key="key"
                class="spec-tag"
              >
                {{ key }}: {{ value }}
              </el-tag>
              <span v-if="!equipment.specifications || Object.keys(equipment.specifications).length === 0">-</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 维护计划 -->
      <el-tab-pane label="维护计划" name="maintenance-plans">
        <div class="maintenance-plans">
          <div class="section-header">
            <h4>维护计划</h4>
            <el-button size="small" type="primary" @click="showAddPlanDialog = true">
              添加计划
            </el-button>
          </div>
          
          <el-table :data="maintenancePlans" stripe>
            <el-table-column prop="maintenance_type" label="维护类型" />
            <el-table-column prop="frequency_days" label="频率(天)" width="100" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="is_active" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'">
                  {{ row.is_active ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="editPlan(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePlan(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 维护记录 -->
      <el-tab-pane label="维护记录" name="maintenance-records">
        <div class="maintenance-records">
          <div class="section-header">
            <h4>维护记录</h4>
            <el-button size="small" type="primary" @click="showAddRecordDialog = true">
              添加记录
            </el-button>
          </div>
          
          <el-table :data="maintenanceRecords" stripe>
            <el-table-column prop="maintenance_date" label="维护日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.maintenance_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="maintenance_type" label="维护类型" />
            <el-table-column prop="operator.real_name" label="操作员" width="100" />
            <el-table-column prop="duration_hours" label="时长(小时)" width="100" />
            <el-table-column prop="cost" label="成本" width="100">
              <template #default="{ row }">
                {{ row.cost ? `¥${row.cost}` : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getMaintenanceStatusType(row.status)">
                  {{ getMaintenanceStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" @click="viewRecord(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 故障记录 -->
      <el-tab-pane label="故障记录" name="failures">
        <div class="failure-records">
          <div class="section-header">
            <h4>故障记录</h4>
            <el-button size="small" type="danger" @click="showReportFailureDialog = true">
              报告故障
            </el-button>
          </div>
          
          <el-table :data="failureRecords" stripe>
            <el-table-column prop="failure_date" label="故障日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.failure_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="failure_type" label="故障类型" />
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="{ row }">
                <el-tag :type="getSeverityType(row.severity)">
                  {{ getSeverityText(row.severity) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reporter.real_name" label="报告人" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getFailureStatusType(row.status)">
                  {{ getFailureStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" @click="viewFailure(row)">详情</el-button>
                <el-button size="small" type="primary" @click="updateFailureStatus(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { equipmentApi } from '@/api/equipment'

interface Props {
  equipment: any
}

const props = defineProps<Props>()

const activeTab = ref('basic')
const maintenancePlans = ref([])
const maintenanceRecords = ref([])
const failureRecords = ref([])
const showAddPlanDialog = ref(false)
const showAddRecordDialog = ref(false)
const showReportFailureDialog = ref(false)

// 加载维护计划
const loadMaintenancePlans = async () => {
  try {
    const response = await equipmentApi.getMaintenancePlans({ equipmentId: props.equipment.id })
    maintenancePlans.value = response.data || []
  } catch (error) {
    console.error('加载维护计划失败:', error)
  }
}

// 加载维护记录
const loadMaintenanceRecords = async () => {
  try {
    const response = await equipmentApi.getMaintenanceRecords({ equipmentId: props.equipment.id })
    maintenanceRecords.value = response.data || []
  } catch (error) {
    console.error('加载维护记录失败:', error)
  }
}

// 加载故障记录
const loadFailureRecords = async () => {
  try {
    const response = await equipmentApi.getFailures({ equipmentId: props.equipment.id })
    failureRecords.value = response.data || []
  } catch (error) {
    console.error('加载故障记录失败:', error)
  }
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap = {
    normal: 'success',
    maintenance: 'warning',
    broken: 'danger',
    retired: 'info',
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap = {
    normal: '正常',
    maintenance: '维护中',
    broken: '故障',
    retired: '已退役',
  }
  return statusMap[status] || status
}

// 获取维护状态类型
const getMaintenanceStatusType = (status: string) => {
  const statusMap = {
    scheduled: 'info',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'danger',
  }
  return statusMap[status] || 'info'
}

// 获取维护状态文本
const getMaintenanceStatusText = (status: string) => {
  const statusMap = {
    scheduled: '计划中',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return statusMap[status] || status
}

// 获取严重程度类型
const getSeverityType = (severity: string) => {
  const severityMap = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  }
  return severityMap[severity] || 'info'
}

// 获取严重程度文本
const getSeverityText = (severity: string) => {
  const severityMap = {
    low: '轻微',
    medium: '中等',
    high: '严重',
    critical: '紧急',
  }
  return severityMap[severity] || severity
}

// 获取故障状态类型
const getFailureStatusType = (status: string) => {
  const statusMap = {
    reported: 'warning',
    in_repair: 'primary',
    resolved: 'success',
    closed: 'info',
  }
  return statusMap[status] || 'info'
}

// 获取故障状态文本
const getFailureStatusText = (status: string) => {
  const statusMap = {
    reported: '已报告',
    in_repair: '维修中',
    resolved: '已解决',
    closed: '已关闭',
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 编辑维护计划
const editPlan = (plan: any) => {
  // TODO: 实现编辑维护计划
  console.log('编辑维护计划:', plan)
}

// 删除维护计划
const deletePlan = (plan: any) => {
  // TODO: 实现删除维护计划
  console.log('删除维护计划:', plan)
}

// 查看维护记录详情
const viewRecord = (record: any) => {
  // TODO: 实现查看维护记录详情
  console.log('查看维护记录:', record)
}

// 查看故障详情
const viewFailure = (failure: any) => {
  // TODO: 实现查看故障详情
  console.log('查看故障详情:', failure)
}

// 更新故障状态
const updateFailureStatus = (failure: any) => {
  // TODO: 实现更新故障状态
  console.log('更新故障状态:', failure)
}

// 初始化
onMounted(() => {
  if (props.equipment) {
    loadMaintenancePlans()
    loadMaintenanceRecords()
    loadFailureRecords()
  }
})
</script>

<style scoped>
.equipment-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-section {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.detail-item.full-width {
  width: 100%;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
  min-width: 100px;
  margin-right: 10px;
}

.specifications {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-tag {
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h4 {
  margin: 0;
  color: #303133;
}

.maintenance-plans,
.maintenance-records,
.failure-records {
  padding: 20px;
}
</style>