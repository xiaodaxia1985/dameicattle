<template>
  <div class="vaccination-management">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <h1>疫苗管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增接种记录
        </el-button>
        <el-button type="warning" @click="showDueReminders">
          <el-icon><Bell /></el-icon>
          到期提醒
          <el-badge v-if="dueCount > 0" :value="dueCount" class="reminder-badge" />
        </el-button>
        <el-button @click="exportRecords">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.total || 0 }}</div>
              <div class="stat-label">总接种记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#E6A23C"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.dueSoon || 0 }}</div>
              <div class="stat-label">即将到期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#F56C6C"><CircleCloseFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.overdue || 0 }}</div>
              <div class="stat-label">已过期</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#409EFF"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.thisMonth || 0 }}</div>
              <div class="stat-label">本月接种</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="牛只耳标">
          <el-input 
            v-model="searchForm.cattleEarTag" 
            placeholder="请输入牛只耳标"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="疫苗名称">
          <el-select 
            v-model="searchForm.vaccineName" 
            placeholder="请选择疫苗"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option 
              v-for="vaccine in vaccineTypes" 
              :key="vaccine" 
              :label="vaccine" 
              :value="vaccine" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="接种日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="正常" value="normal" />
            <el-option label="即将到期" value="due_soon" />
            <el-option label="已过期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchRecords">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table 
        :data="records" 
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="cattleEarTag" label="牛只耳标" width="120" />
        <el-table-column prop="vaccineName" label="疫苗名称" width="150" />
        <el-table-column prop="vaccinationDate" label="接种日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.vaccinationDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="nextDueDate" label="下次到期" width="120">
          <template #default="{ row }">
            <span v-if="row.nextDueDate" :class="getDueDateClass(row.nextDueDate)">
              {{ formatDate(row.nextDueDate) }}
            </span>
            <span v-else class="text-muted">未设置</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余天数" width="100">
          <template #default="{ row }">
            <el-tag 
              v-if="row.nextDueDate"
              :type="getDaysLeftType(getDaysLeft(row.nextDueDate))"
              size="small"
            >
              {{ getDaysLeftText(getDaysLeft(row.nextDueDate)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="batchNumber" label="批次号" width="120" />
        <el-table-column prop="veterinarianName" label="接种兽医" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewRecord(row)"
            >
              查看
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="editRecord(row)"
            >
              编辑
            </el-button>
            <el-button 
              v-if="row.nextDueDate && getDaysLeft(row.nextDueDate) <= 30"
              type="success" 
              size="small" 
              @click="renewVaccination(row)"
            >
              续种
            </el-button>
            <el-popconfirm
              title="确定要删除这条记录吗？"
              @confirm="deleteRecord(row.id)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  size="small"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRecord ? '编辑疫苗记录' : '新增疫苗记录'"
      width="600px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef"
        :model="recordForm" 
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="牛只" prop="cattleId">
          <el-select 
            v-model="recordForm.cattleId" 
            placeholder="请选择牛只"
            filterable
            style="width: 100%"
          >
            <el-option 
              v-for="cattle in cattleList" 
              :key="cattle.id" 
              :label="`${cattle.earTag} - ${cattle.breed}`" 
              :value="cattle.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="疫苗名称" prop="vaccineName">
          <el-select 
            v-model="recordForm.vaccineName" 
            placeholder="请选择疫苗"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option 
              v-for="vaccine in vaccineTypes" 
              :key="vaccine" 
              :label="vaccine" 
              :value="vaccine" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="接种日期" prop="vaccinationDate">
          <el-date-picker
            v-model="recordForm.vaccinationDate"
            type="date"
            placeholder="请选择接种日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="下次到期日期">
          <el-date-picker
            v-model="recordForm.nextDueDate"
            type="date"
            placeholder="请选择下次到期日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input 
            v-model="recordForm.batchNumber" 
            placeholder="请输入疫苗批次号"
          />
        </el-form-item>
        <el-form-item label="接种兽医">
          <el-select 
            v-model="recordForm.veterinarianId" 
            placeholder="请选择兽医"
            style="width: 100%"
          >
            <el-option 
              v-for="vet in veterinarians" 
              :key="vet.id" 
              :label="vet.name" 
              :value="vet.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="recordForm.remark" 
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRecord" :loading="saving">
          {{ editingRecord ? '更新' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="疫苗记录详情"
      width="500px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="牛只耳标">
            {{ selectedRecord.cattleEarTag }}
          </el-descriptions-item>
          <el-descriptions-item label="疫苗名称">
            {{ selectedRecord.vaccineName }}
          </el-descriptions-item>
          <el-descriptions-item label="接种日期">
            {{ formatDate(selectedRecord.vaccinationDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="下次到期日期">
            <span v-if="selectedRecord.nextDueDate" :class="getDueDateClass(selectedRecord.nextDueDate)">
              {{ formatDate(selectedRecord.nextDueDate) }}
            </span>
            <span v-else class="text-muted">未设置</span>
          </el-descriptions-item>
          <el-descriptions-item label="剩余天数">
            <el-tag 
              v-if="selectedRecord.nextDueDate"
              :type="getDaysLeftType(getDaysLeft(selectedRecord.nextDueDate))"
            >
              {{ getDaysLeftText(getDaysLeft(selectedRecord.nextDueDate)) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="批次号">
            {{ selectedRecord.batchNumber || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="接种兽医">
            {{ selectedRecord.veterinarianName || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(selectedRecord.createdAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 到期提醒对话框 -->
    <el-dialog
      v-model="showReminderDialog"
      title="疫苗到期提醒"
      width="800px"
    >
      <div class="reminder-content">
        <el-alert
          title="以下疫苗即将到期或已过期，请及时处理"
          type="warning"
          :closable="false"
          show-icon
          class="reminder-alert"
        />
        <el-table :data="dueRecords" stripe>
          <el-table-column prop="cattleEarTag" label="牛只耳标" width="120" />
          <el-table-column prop="vaccineName" label="疫苗名称" width="150" />
          <el-table-column prop="nextDueDate" label="到期日期" width="120">
            <template #default="{ row }">
              <span :class="getDueDateClass(row.nextDueDate)">
                {{ formatDate(row.nextDueDate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="剩余天数" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getDaysLeftType(getDaysLeft(row.nextDueDate))"
                size="small"
              >
                {{ getDaysLeftText(getDaysLeft(row.nextDueDate)) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button 
                type="success" 
                size="small" 
                @click="renewVaccination(row)"
              >
                续种
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Plus, Download, Search, Bell, Check, Warning, 
  CircleCloseFilled, Calendar 
} from '@element-plus/icons-vue'
import { healthApi } from '@/api/health'
import type { VaccinationRecord } from '@/api/health'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const records = ref<VaccinationRecord[]>([])
const selectedRecords = ref<VaccinationRecord[]>([])
const selectedRecord = ref<VaccinationRecord | null>(null)
const editingRecord = ref<VaccinationRecord | null>(null)
const dueRecords = ref<VaccinationRecord[]>([])

// 对话框显示状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showReminderDialog = ref(false)

// 统计数据
const stats = ref({
  total: 0,
  dueSoon: 0,
  overdue: 0,
  thisMonth: 0
})

// 搜索表单
const searchForm = reactive({
  cattleEarTag: '',
  vaccineName: '',
  dateRange: [],
  status: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 表单数据
const recordForm = reactive({
  cattleId: '',
  vaccineName: '',
  vaccinationDate: '',
  nextDueDate: '',
  batchNumber: '',
  veterinarianId: '',
  remark: ''
})

// 表单验证规则
const formRules = {
  cattleId: [
    { required: true, message: '请选择牛只', trigger: 'change' }
  ],
  vaccineName: [
    { required: true, message: '请输入疫苗名称', trigger: 'blur' }
  ],
  vaccinationDate: [
    { required: true, message: '请选择接种日期', trigger: 'change' }
  ]
}

// 基础数据
const cattleList = ref<Array<{ id: number; earTag: string; breed: string }>>([])
const veterinarians = ref<Array<{ id: number; name: string }>>([])
const vaccineTypes = ref([
  '口蹄疫疫苗',
  '牛瘟疫苗',
  '牛传染性鼻气管炎疫苗',
  '牛病毒性腹泻疫苗',
  '牛副流感疫苗',
  '牛呼吸道合胞体病毒疫苗',
  '炭疽疫苗',
  '布鲁氏菌病疫苗'
])

// 表单引用
const formRef = ref()

// 计算到期数量
const dueCount = computed(() => {
  return records.value.filter(record => {
    if (!record.nextDueDate) return false
    const daysLeft = getDaysLeft(record.nextDueDate)
    return daysLeft <= 30
  }).length
})

// 加载疫苗记录
const loadRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    }
    
    const { data } = await healthApi.getVaccinationRecords(params)
    records.value = data.data || []
    pagination.total = data.total || 0
    
    // 计算统计数据
    calculateStats()
  } catch (error) {
    console.error('加载疫苗记录失败:', error)
    ElMessage.error('加载疫苗记录失败')
  } finally {
    loading.value = false
  }
}

// 计算统计数据
const calculateStats = () => {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  stats.value = {
    total: records.value.length,
    dueSoon: records.value.filter(record => {
      if (!record.nextDueDate) return false
      const daysLeft = getDaysLeft(record.nextDueDate)
      return daysLeft > 0 && daysLeft <= 30
    }).length,
    overdue: records.value.filter(record => {
      if (!record.nextDueDate) return false
      return getDaysLeft(record.nextDueDate) < 0
    }).length,
    thisMonth: records.value.filter(record => {
      const vaccinationDate = new Date(record.vaccinationDate)
      return vaccinationDate >= thisMonthStart
    }).length
  }
}

// 搜索记录
const searchRecords = () => {
  pagination.page = 1
  loadRecords()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    cattleEarTag: '',
    vaccineName: '',
    dateRange: [],
    status: ''
  })
  searchRecords()
}

// 查看记录详情
const viewRecord = (record: VaccinationRecord) => {
  selectedRecord.value = record
  showDetailDialog.value = true
}

// 编辑记录
const editRecord = (record: VaccinationRecord) => {
  editingRecord.value = record
  Object.assign(recordForm, {
    cattleId: record.cattleId,
    vaccineName: record.vaccineName,
    vaccinationDate: record.vaccinationDate,
    nextDueDate: record.nextDueDate,
    batchNumber: record.batchNumber,
    veterinarianId: record.veterinarianId,
    remark: record.remark || ''
  })
  showCreateDialog.value = true
}

// 续种疫苗
const renewVaccination = (record: VaccinationRecord) => {
  editingRecord.value = null
  Object.assign(recordForm, {
    cattleId: record.cattleId,
    vaccineName: record.vaccineName,
    vaccinationDate: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    batchNumber: '',
    veterinarianId: record.veterinarianId,
    remark: `续种 - 上次接种: ${formatDate(record.vaccinationDate)}`
  })
  showCreateDialog.value = true
  showReminderDialog.value = false
}

// 删除记录
const deleteRecord = async (id: string) => {
  try {
    await healthApi.deleteVaccinationRecord(id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 保存记录
const saveRecord = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    if (editingRecord.value) {
      await healthApi.updateVaccinationRecord(editingRecord.value.id, recordForm)
      ElMessage.success('更新成功')
    } else {
      await healthApi.createVaccinationRecord(recordForm)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    loadRecords()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingRecord.value = null
  Object.assign(recordForm, {
    cattleId: '',
    vaccineName: '',
    vaccinationDate: '',
    nextDueDate: '',
    batchNumber: '',
    veterinarianId: '',
    remark: ''
  })
  formRef.value?.resetFields()
}

// 处理选择变化
const handleSelectionChange = (selection: VaccinationRecord[]) => {
  selectedRecords.value = selection
}

// 显示到期提醒
const showDueReminders = () => {
  dueRecords.value = records.value.filter(record => {
    if (!record.nextDueDate) return false
    const daysLeft = getDaysLeft(record.nextDueDate)
    return daysLeft <= 30
  }).sort((a, b) => getDaysLeft(a.nextDueDate!) - getDaysLeft(b.nextDueDate!))
  
  showReminderDialog.value = true
}

// 导出记录
const exportRecords = () => {
  ElMessage.info('导出功能开发中...')
}

// 计算剩余天数
const getDaysLeft = (dueDate: string): number => {
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 获取剩余天数文本
const getDaysLeftText = (days: number): string => {
  if (days < 0) return `已过期${Math.abs(days)}天`
  if (days === 0) return '今天到期'
  return `${days}天后到期`
}

// 获取剩余天数类型
const getDaysLeftType = (days: number): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  if (days < 0) return 'danger'
  if (days <= 7) return 'danger'
  if (days <= 15) return 'warning'
  if (days <= 30) return 'info'
  return 'success'
}

// 获取到期日期样式类
const getDueDateClass = (dueDate: string): string => {
  const days = getDaysLeft(dueDate)
  if (days < 0) return 'text-danger'
  if (days <= 7) return 'text-danger'
  if (days <= 15) return 'text-warning'
  return ''
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

// 加载基础数据
const loadBaseData = async () => {
  // 这里应该加载牛只列表和兽医列表
  // 暂时使用模拟数据
  cattleList.value = []
  veterinarians.value = []
}

// 组件挂载
onMounted(() => {
  loadRecords()
  loadBaseData()
})
</script>

<style scoped>
.vaccination-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.reminder-badge {
  margin-left: 5px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 80px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 15px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.record-detail {
  padding: 10px 0;
}

.text-muted {
  color: #909399;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

.text-warning {
  color: #E6A23C;
  font-weight: bold;
}

.reminder-content {
  padding: 10px 0;
}

.reminder-alert {
  margin-bottom: 20px;
}
</style>