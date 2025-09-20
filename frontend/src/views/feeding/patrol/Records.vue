<template>
  <div class="patrol-records-page">
    <div class="page-header">
      <div class="header-left">
        <h1>巡圈记录管理</h1>
        <p class="header-desc">记录和管理牛棚巡圈检查情况，监控牛只状态和环境条件</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          添加巡圈记录
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
      <div class="search-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <CascadeSelector
              v-model="searchCascadeValue"
              baseLabel="选择基地"
              barnLabel="选择牛棚"
              :cattleLabel="''"
              baseProp="baseId"
              barnProp="barnId"
            />
          </el-col>
          <el-col :span="6">
            <div class="search-item">
              <label class="search-label">巡圈类型</label>
              <el-select v-model="searchForm.patrolType" placeholder="选择类型" clearable @change="handleSearch">
                <el-option label="喂食前巡圈" value="before_feeding" />
                <el-option label="喂食后巡圈" value="after_feeding" />
                <el-option label="常规巡圈" value="routine" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="search-item">
              <label class="search-label">时间范围</label>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                @change="handleSearch"
                style="width: 100%"
              />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon patrol">
                <el-icon><View /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ records.length }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon lying">
                <el-icon><Moon /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ avgLyingRate }}%</div>
                <div class="stat-label">平均躺卧率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon temperature">
                <el-icon><Sunny /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ avgTemperature }}°C</div>
                <div class="stat-label">平均温度</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon abnormal">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalAbnormalCattle }}</div>
                <div class="stat-label">异常牛只</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 记录列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>巡圈记录</span>
          <div class="header-tools">
            <el-button link @click="exportRecords">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="巡圈日期" width="120" sortable>
          <template #default="{ row }">
            {{ row.patrol_date }}
          </template>
        </el-table-column>
        <el-table-column label="巡圈时间" width="100">
          <template #default="{ row }">
            {{ row.patrol_time }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getPatrolTypeTag(row.patrol_type)">
              {{ getPatrolTypeText(row.patrol_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="基地" width="120">
          <template #default="{ row }">
            {{ row.base?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="牛棚" width="120">
          <template #default="{ row }">
            {{ row.barn?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="牛只数量" width="100">
          <template #default="{ row }">
            {{ row.total_cattle_count }}头
          </template>
        </el-table-column>
        <el-table-column label="躺卧率" width="100" sortable>
          <template #default="{ row }">
            <span :class="getLyingRateClass(row.lying_rate)">
              {{ row.lying_rate ? parseFloat(row.lying_rate).toFixed(1) : '-' }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column label="温度" width="80">
          <template #default="{ row }">
            {{ row.temperature ? `${row.temperature}°C` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="湿度" width="80">
          <template #default="{ row }">
            {{ row.humidity ? `${row.humidity}%` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="异常牛只" width="100">
          <template #default="{ row }">
            <span v-if="row.abnormal_cattle_count > 0" class="abnormal-count">
              {{ row.abnormal_cattle_count }}头
            </span>
            <span v-else class="normal-count">正常</span>
          </template>
        </el-table-column>
        <el-table-column label="巡圈人员" width="120">
          <template #default="{ row }">
            {{ row.patrol_person?.real_name || row.patrol_person_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link @click="viewRecord(row)">查看</el-button>
            <el-button link @click="editRecord(row)">编辑</el-button>
            <el-button link style="color: #f56c6c" @click="deleteRecord(row)">删除</el-button>
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
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加巡圈记录' : '编辑巡圈记录'"
      width="800px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="巡圈日期" prop="patrolDate">
              <el-date-picker
                v-model="formData.patrolDate"
                type="date"
                placeholder="选择巡圈日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="巡圈时间" prop="patrolTime">
              <el-time-picker
                v-model="formData.patrolTime"
                placeholder="选择巡圈时间"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <CascadeSelector
              v-model="formCascadeValue"
              baseLabel="基地"
              barnLabel="牛棚"
              :cattleLabel="''"
              baseProp="base_id"
              barnProp="barn_id"
            />
          </el-col>
        </el-row>

        <el-form-item label="巡圈类型" prop="patrol_type">
          <el-radio-group v-model="formData.patrol_type">
            <el-radio label="before_feeding">喂食前巡圈</el-radio>
            <el-radio label="after_feeding">喂食后巡圈</el-radio>
            <el-radio label="routine">常规巡圈</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 牛只状态 -->
        <el-divider content-position="left">牛只状态</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="总牛只数" prop="total_cattle_count">
              <el-input-number
                v-model="formData.total_cattle_count"
                :min="0"
                :max="1000"
                style="width: 100%"
                readonly
                @change="calculateLyingRate"
              />
              <div class="field-hint" style="color: #909399; font-size: 12px; margin-top: 4px;">自动从牛棚获取，不可修改</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="站立牛只数">
              <el-input-number
                v-model="formData.standing_cattle_count"
                :min="0"
                :max="formData.total_cattle_count"
                style="width: 100%"
                @change="calculateLyingRate"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="躺卧率">
              <el-input
                :value="calculatedLyingRate + '%'"
                readonly
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="异常牛只数">
              <el-input-number
                v-model="formData.abnormal_cattle_count"
                :min="0"
                :max="formData.total_cattle_count"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="异常描述">
              <el-input
                v-model="formData.abnormal_cattle_description"
                placeholder="描述异常牛只的具体情况"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 设施检查 -->
        <el-divider content-position="left">设施检查</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="草料槽清洁">
              <el-switch
                v-model="formData.feed_trough_clean"
                active-text="干净"
                inactive-text="需清理"
              />
            </el-form-item>
            <el-form-item label="草料槽备注">
              <el-input
                v-model="formData.feed_trough_notes"
                placeholder="草料槽检查备注"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="水槽清洁">
              <el-switch
                v-model="formData.water_trough_clean"
                active-text="干净"
                inactive-text="需清理"
              />
            </el-form-item>
            <el-form-item label="水槽备注">
              <el-input
                v-model="formData.water_trough_notes"
                placeholder="水槽检查备注"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 环境数据 -->
        <el-divider content-position="left">环境数据</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="温度(°C)">
              <el-input-number
                v-model="formData.temperature"
                :min="-50"
                :max="60"
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="湿度(%)">
              <el-input-number
                v-model="formData.humidity"
                :min="0"
                :max="100"
                :precision="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="获取物联网数据">
              <el-button @click="fetchIoTData" :loading="iotLoading" :disabled="!formData.barn_id">
                <el-icon><Refresh /></el-icon>
                获取实时数据
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="环境备注">
          <el-input
            v-model="formData.environment_notes"
            placeholder="环境相关备注"
            type="textarea"
            :rows="2"
          />
        </el-form-item>

        <el-form-item label="总体备注">
          <el-input
            v-model="formData.overall_notes"
            placeholder="本次巡圈的总体备注"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ dialogMode === 'create' ? '添加' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 记录详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="巡圈记录详情" width="800px">
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="巡圈日期">{{ selectedRecord.patrol_date }}</el-descriptions-item>
          <el-descriptions-item label="巡圈时间">{{ selectedRecord.patrol_time }}</el-descriptions-item>
          <el-descriptions-item label="巡圈类型">
            <el-tag :type="getPatrolTypeTag(selectedRecord.patrol_type)">
              {{ getPatrolTypeText(selectedRecord.patrol_type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="基地">{{ selectedRecord.base?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="牛棚">{{ selectedRecord.barn?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总牛只数">{{ selectedRecord.total_cattle_count }}头</el-descriptions-item>
          <el-descriptions-item label="躺卧牛只数">{{ selectedRecord.lying_cattle_count || '-' }}头</el-descriptions-item>
          <el-descriptions-item label="躺卧率">{{ selectedRecord.lying_rate ? parseFloat(selectedRecord.lying_rate).toFixed(1) : '-' }}%</el-descriptions-item>
          <el-descriptions-item label="异常牛只数">
            <span v-if="selectedRecord.abnormal_cattle_count > 0" class="abnormal-count">
              {{ selectedRecord.abnormal_cattle_count }}头
            </span>
            <span v-else class="normal-count">无异常</span>
          </el-descriptions-item>
          <el-descriptions-item label="异常描述" :span="2">
            {{ selectedRecord.abnormal_cattle_description || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="草料槽">
            <el-tag :type="selectedRecord.feed_trough_clean ? 'success' : 'warning'">
              {{ selectedRecord.feed_trough_clean ? '干净' : '需清理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="水槽">
            <el-tag :type="selectedRecord.water_trough_clean ? 'success' : 'warning'">
              {{ selectedRecord.water_trough_clean ? '干净' : '需清理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="温度">{{ selectedRecord.temperature ? `${selectedRecord.temperature}°C` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="湿度">{{ selectedRecord.humidity ? `${selectedRecord.humidity}%` : '-' }}</el-descriptions-item>
          <el-descriptions-item label="巡圈人员">{{ selectedRecord.patrol_person?.real_name || selectedRecord.patrol_person_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="记录时间">{{ formatDate(selectedRecord.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="总体备注" :span="2">{{ selectedRecord.overall_notes || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, View, Moon, Sunny, Warning, Download, Refresh } from '@element-plus/icons-vue'
import { patrolApi } from '@/api/patrol'
import { baseApi } from '@/api/base'
import { barnApi } from '@/api/barn'
import CascadeSelector from '@/components/common/CascadeSelector.vue'
import type { PatrolRecord, CreatePatrolRecordRequest, UpdatePatrolRecordRequest } from '@/api/patrol'

// 响应式数据
const records = ref<PatrolRecord[]>([])
const bases = ref<any[]>([])
const barns = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const iotLoading = ref(false)
const selectedRows = ref<PatrolRecord[]>([])

// 搜索表单
const searchForm = ref({
  baseId: undefined as number | undefined,
  barnId: undefined as number | undefined,
  patrolType: undefined as string | undefined
})

// 级联选择器的值
const searchCascadeValue = ref<{baseId?: number; barnId?: number}>({})
const formCascadeValue = ref<{baseId?: number; barnId?: number}>({})

// 监听搜索级联选择器变化
watch(searchCascadeValue, (newValue) => {
  searchForm.value.baseId = newValue.baseId
  searchForm.value.barnId = newValue.barnId
  handleSearch()
}, { deep: true })

// 监听表单级联选择器变化
watch(formCascadeValue, (newValue) => {
  if (newValue.baseId !== undefined) {
    formData.value.base_id = newValue.baseId
    formData.value.barn_id = 0
  }
  if (newValue.barnId !== undefined) {
    formData.value.barn_id = newValue.barnId
    handleFormBarnChange()
  }
}, { deep: true })
const dateRange = ref<[string, string]>(['', ''])

// 分页
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedRecord = ref<PatrolRecord | null>(null)

// 表单
const formRef = ref()
const formData = ref<CreatePatrolRecordRequest & { patrolDate?: string; patrolTime?: string; standing_cattle_count?: number }>({
  base_id: 0,
  barn_id: 0,
  patrol_date: '',
  patrol_time: '',
  patrol_type: 'before_feeding',
  total_cattle_count: 0,
  standing_cattle_count: 0,
  lying_cattle_count: 0,
  abnormal_cattle_count: 0,
  abnormal_cattle_description: '',
  feed_trough_clean: true,
  feed_trough_notes: '',
  water_trough_clean: true,
  water_trough_notes: '',
  temperature: undefined,
  humidity: undefined,
  environment_notes: '',
  overall_notes: '',
  images: [],
  patrolDate: '',
  patrolTime: ''
})

const formRules = {
  patrolDate: [
    { required: true, message: '请选择巡圈日期', trigger: 'change' }
  ],
  patrolTime: [
    { required: true, message: '请选择巡圈时间', trigger: 'change' }
  ],
  base_id: [
    { required: true, message: '请选择基地', trigger: 'change' }
  ],
  barn_id: [
    { required: true, message: '请选择牛棚', trigger: 'change' }
  ],
  patrol_type: [
    { required: true, message: '请选择巡圈类型', trigger: 'change' }
  ],
  total_cattle_count: [
    { required: true, message: '请输入总牛只数', trigger: 'blur' },
    { type: 'number', min: 0, message: '总牛只数不能小于0', trigger: 'blur' }
  ]
}

// 计算属性
const availableBarns = computed(() => {
  if (!searchForm.value.baseId) return []
  return barns.value.filter(barn => barn.base_id === searchForm.value.baseId)
})

const formAvailableBarns = computed(() => {
  if (!formData.value.base_id) return []
  return barns.value.filter(barn => barn.base_id === formData.value.base_id)
})

const calculatedLyingRate = computed(() => {
  if (formData.value.total_cattle_count === 0) return 0
  const standingCount = formData.value.standing_cattle_count || 0
  const lyingCount = formData.value.total_cattle_count - standingCount
  return Math.round((lyingCount / formData.value.total_cattle_count) * 100 * 100) / 100
})

const avgLyingRate = computed(() => {
  if (records.value.length === 0) return 0
  const total = records.value.reduce((sum, record) => sum + (parseFloat(record.lying_rate) || 0), 0)
  return Math.round(total / records.value.length * 100) / 100
})

const avgTemperature = computed(() => {
  const validRecords = records.value.filter(record => record.temperature !== undefined)
  if (validRecords.length === 0) return 0
  const total = validRecords.reduce((sum, record) => sum + (record.temperature || 0), 0)
  return Math.round(total / validRecords.length * 10) / 10
})

const totalAbnormalCattle = computed(() => {
  return records.value.reduce((sum, record) => sum + (record.abnormal_cattle_count || 0), 0)
})

// 初始化日期范围（最近7天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 7)
  const startDate = start.toISOString().split('T')[0]
  const endDate = end.toISOString().split('T')[0]
  
  console.log('初始化日期范围:', { startDate, endDate })
  console.log('当前日期:', new Date().toISOString())
  
  dateRange.value = [startDate, endDate]
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data.bases || []
    if (bases.value.length > 0) {
      searchForm.value.baseId = bases.value[0].id
    }
  } catch (error) {
    console.error('获取基地列表失败:', error)
  }
}

// 获取牛棚列表
const fetchBarns = async () => {
  try {
    const response = await barnApi.getBarns()
    barns.value = response.data.barns || []
  } catch (error) {
    console.error('获取牛棚列表失败:', error)
  }
}

// 获取记录列表
const fetchRecords = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    
    if (searchForm.value.baseId) params.base_id = searchForm.value.baseId
    if (searchForm.value.barnId) params.barn_id = searchForm.value.barnId
    if (searchForm.value.patrolType) params.patrol_type = searchForm.value.patrolType
    if (dateRange.value[0]) params.start_date = dateRange.value[0]
    if (dateRange.value[1]) params.end_date = dateRange.value[1]
    
    console.log('fetchRecords 请求参数:', params)
    console.log('searchForm 当前值:', searchForm.value)
    console.log('dateRange 当前值:', dateRange.value)
    
    const response = await patrolApi.getPatrolRecords(params)
    console.log('fetchRecords API 响应:', response)
    
    records.value = response.data.records || []
    pagination.value.total = response.data.pagination?.total || 0
    
    console.log('设置后的 records:', records.value.length, '条记录')
  } catch (error) {
    console.error('获取巡圈记录失败:', error)
    ElMessage.error('获取巡圈记录失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchRecords()
}

const handleBaseChange = () => {
  searchForm.value.barnId = undefined
  handleSearch()
}

// 分页处理
const handleSizeChange = () => {
  fetchRecords()
}

const handleCurrentChange = () => {
  fetchRecords()
}

// 选择变化
const handleSelectionChange = (selection: PatrolRecord[]) => {
  selectedRows.value = selection
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  formData.value.patrolDate = new Date().toISOString().split('T')[0]
  formData.value.patrolTime = new Date().toTimeString().slice(0, 5)
  if (bases.value.length > 0) {
    formCascadeValue.value = {
      baseId: bases.value[0].id,
      barnId: undefined
    }
  }
  dialogVisible.value = true
}

// 查看记录
const viewRecord = (record: PatrolRecord) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

// 编辑记录
const editRecord = (record: PatrolRecord) => {
  dialogMode.value = 'edit'
  selectedRecord.value = record
  
  formData.value = {
    base_id: record.base_id,
    barn_id: record.barn_id,
    patrol_date: record.patrol_date,
    patrol_time: record.patrol_time,
    patrol_type: record.patrol_type,
    total_cattle_count: record.total_cattle_count,
    standing_cattle_count: record.standing_cattle_count,
    lying_cattle_count: record.lying_cattle_count,
    abnormal_cattle_count: record.abnormal_cattle_count,
    abnormal_cattle_description: record.abnormal_cattle_description,
    feed_trough_clean: record.feed_trough_clean,
    feed_trough_notes: record.feed_trough_notes,
    water_trough_clean: record.water_trough_clean,
    water_trough_notes: record.water_trough_notes,
    temperature: record.temperature,
    humidity: record.humidity,
    environment_notes: record.environment_notes,
    overall_notes: record.overall_notes,
    images: record.images,
    patrolDate: record.patrol_date,
    patrolTime: record.patrol_time
  }
  
  // 设置级联选择器的值
  formCascadeValue.value = {
    baseId: record.base_id,
    barnId: record.barn_id
  }
  
  dialogVisible.value = true
}

// 删除记录
const deleteRecord = async (record: PatrolRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条巡圈记录吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await patrolApi.deletePatrolRecord(record.id)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

// 表单处理
const handleFormBaseChange = () => {
  formData.value.barn_id = 0
  formData.value.total_cattle_count = 0
}

const handleFormBarnChange = async () => {
  if (!formData.value.barn_id) {
    formData.value.total_cattle_count = 0
    return
  }

  try {
    // 从选中的牛棚获取牛只数量
    const selectedBarn = formAvailableBarns.value.find(barn => barn.id === formData.value.barn_id)
    if (selectedBarn) {
      formData.value.total_cattle_count = selectedBarn.current_count || 0
      // 重置站立牛只数，让用户重新输入
      formData.value.standing_cattle_count = 0
      ElMessage.success(`已自动获取牛棚牛只数量：${formData.value.total_cattle_count}头`)
    }
  } catch (error) {
    console.error('获取牛棚牛只数量失败:', error)
    ElMessage.error('获取牛棚牛只数量失败')
  }
}

const calculateLyingRate = () => {
  // 躺卧率会通过计算属性自动计算
}

// 获取物联网数据
const fetchIoTData = async () => {
  if (!formData.value.barn_id) {
    ElMessage.warning('请先选择牛棚')
    return
  }

  iotLoading.value = true
  try {
    const response = await patrolApi.getIoTDeviceData({ barn_id: formData.value.barn_id })
    const { device, data } = response.data

    if (!device) {
      ElMessage.info('该牛棚未配置温湿度传感器')
      return
    }

    if (!device.is_online) {
      ElMessage.warning('设备离线，无法获取实时数据')
      return
    }

    if (data) {
      if (data.temperature !== undefined) {
        formData.value.temperature = data.temperature
      }
      if (data.humidity !== undefined) {
        formData.value.humidity = data.humidity
      }
      formData.value.iot_device_id = device.device_id
      formData.value.iot_data_source = 'iot_sensor'
      ElMessage.success('成功获取物联网设备数据')
    } else {
      ElMessage.warning('设备暂无数据')
    }
  } catch (error) {
    console.error('获取物联网数据失败:', error)
    ElMessage.error('获取物联网数据失败')
  } finally {
    iotLoading.value = false
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 确保数据类型正确，移除undefined字段
    const submitData: any = {
      base_id: Number(formData.value.base_id),
      barn_id: Number(formData.value.barn_id),
      patrol_date: formData.value.patrolDate,
      patrol_time: formData.value.patrolTime,
      patrol_type: formData.value.patrol_type,
      total_cattle_count: Number(formData.value.total_cattle_count),
      standing_cattle_count: Number(formData.value.standing_cattle_count || 0),
      lying_cattle_count: Number(formData.value.lying_cattle_count || 0),
      abnormal_cattle_count: Number(formData.value.abnormal_cattle_count || 0),
      abnormal_cattle_description: formData.value.abnormal_cattle_description || '',
      feed_trough_clean: Boolean(formData.value.feed_trough_clean),
      feed_trough_notes: formData.value.feed_trough_notes || '',
      water_trough_clean: Boolean(formData.value.water_trough_clean),
      water_trough_notes: formData.value.water_trough_notes || '',
      environment_notes: formData.value.environment_notes || '',
      iot_data_source: formData.value.iot_data_source || 'manual',
      overall_notes: formData.value.overall_notes || '',
      images: formData.value.images || []
    }
    
    // 只有当字段有值时才添加到提交数据中
    if (formData.value.temperature !== undefined && formData.value.temperature !== null) {
      submitData.temperature = Number(formData.value.temperature)
    }
    if (formData.value.humidity !== undefined && formData.value.humidity !== null) {
      submitData.humidity = Number(formData.value.humidity)
    }
    if (formData.value.iot_device_id) {
      submitData.iot_device_id = formData.value.iot_device_id
    }
    
    // 调试：打印提交的数据
    console.log('提交的数据:', JSON.stringify(submitData, null, 2))
    
    if (dialogMode.value === 'create') {
      await patrolApi.createPatrolRecord(submitData)
      ElMessage.success('添加成功')
    } else {
      // 更新时只发送允许更新的字段（不包括base_id, barn_id, patrol_date, patrol_time, patrol_type）
      // 计算躺卧牛只数
      const standingCount = Number(formData.value.standing_cattle_count || 0)
      const totalCount = Number(formData.value.total_cattle_count)
      const lyingCount = totalCount - standingCount
      
      const updateData: any = {
        total_cattle_count: totalCount,
        standing_cattle_count: standingCount,
        lying_cattle_count: lyingCount,
        abnormal_cattle_count: Number(formData.value.abnormal_cattle_count || 0),
        abnormal_cattle_description: formData.value.abnormal_cattle_description || '',
        feed_trough_clean: Boolean(formData.value.feed_trough_clean),
        feed_trough_notes: formData.value.feed_trough_notes || '',
        water_trough_clean: Boolean(formData.value.water_trough_clean),
        water_trough_notes: formData.value.water_trough_notes || '',
        environment_notes: formData.value.environment_notes || '',
        overall_notes: formData.value.overall_notes || '',
        images: formData.value.images || []
      }
      
      // 只有当字段有值时才添加到更新数据中
      if (formData.value.temperature !== undefined && formData.value.temperature !== null) {
        updateData.temperature = Number(formData.value.temperature)
      }
      if (formData.value.humidity !== undefined && formData.value.humidity !== null) {
        updateData.humidity = Number(formData.value.humidity)
      }
      
      console.log('更新数据:', JSON.stringify(updateData, null, 2))
      const updateResponse = await patrolApi.updatePatrolRecord(selectedRecord.value!.id, updateData)
      console.log('更新响应:', updateResponse)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    
    // 编辑保存后刷新数据
    dialogVisible.value = false
    
    // 如果是编辑模式，临时清除日期范围限制以确保能看到更新的记录
    if (dialogMode.value === 'edit') {
      console.log('编辑模式：清除日期范围限制以显示所有记录')
      dateRange.value = ['', '']
      ElMessage.success('记录更新成功，已显示所有记录')
    }
    
    // 延迟刷新确保状态更新完成
    setTimeout(() => {
      fetchRecords()
    }, 100)
  } catch (error) {
    console.error('提交失败:', error)
    // 显示更详细的错误信息
    if (error.response?.data?.error?.message) {
      ElMessage.error(`提交失败: ${error.response.data.error.message}`)
    } else if (error.response?.data?.errors) {
      // 显示验证错误详情
      const errorMessages = error.response.data.errors.map(err => `${err.param}: ${err.msg}`).join('; ')
      ElMessage.error(`验证失败: ${errorMessages}`)
    } else {
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    base_id: 0,
    barn_id: 0,
    patrol_date: '',
    patrol_time: '',
    patrol_type: 'before_feeding',
    total_cattle_count: 0,
    standing_cattle_count: 0,
    lying_cattle_count: 0,
    abnormal_cattle_count: 0,
    abnormal_cattle_description: '',
    feed_trough_clean: true,
    feed_trough_notes: '',
    water_trough_clean: true,
    water_trough_notes: '',
    temperature: undefined,
    humidity: undefined,
    environment_notes: '',
    overall_notes: '',
    images: [],
    patrolDate: '',
    patrolTime: ''
  }
  // 重置级联选择器
  formCascadeValue.value = {}
  selectedRecord.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 导出记录
const exportRecords = () => {
  ElMessage.info('导出功能开发中...')
}

// 工具函数
const getPatrolTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    before_feeding: '喂食前巡圈',
    after_feeding: '喂食后巡圈',
    routine: '常规巡圈'
  }
  return typeMap[type] || type
}

const getPatrolTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    before_feeding: 'primary',
    after_feeding: 'success',
    routine: 'info'
  }
  return tagMap[type] || 'info'
}

const getLyingRateClass = (rate: number | string) => {
  const numRate = typeof rate === 'string' ? parseFloat(rate) : rate
  if (numRate >= 80) return 'high-lying-rate'
  if (numRate >= 60) return 'medium-lying-rate'
  return 'low-lying-rate'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载
onMounted(async () => {
  initDateRange()
  await fetchBases()  // 等待基地列表加载完成
  await fetchBarns()  // 等待牛棚列表加载完成
  fetchRecords()      // 然后加载记录
})
</script>

<style scoped lang="scss">
.patrol-records-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .header-left {
      h1 {
        margin: 0 0 4px 0;
        color: #303133;
        font-size: 24px;
        font-weight: 600;
      }

      .header-desc {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .search-card {
    margin-bottom: 20px;

    .search-form {
      .search-item {
        .search-label {
          display: block;
          font-size: 14px;
          color: #606266;
          margin-bottom: 8px;
          font-weight: 500;
        }
      }
    }
  }

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.patrol {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.lying {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.temperature {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.abnormal {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #303133;
            line-height: 1;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .abnormal-count {
    color: #f56c6c;
    font-weight: 500;
  }

  .normal-count {
    color: #67c23a;
  }

  .high-lying-rate {
    color: #67c23a;
    font-weight: 500;
  }

  .medium-lying-rate {
    color: #e6a23c;
    font-weight: 500;
  }

  .low-lying-rate {
    color: #f56c6c;
    font-weight: 500;
  }

  .record-detail {
    .abnormal-count {
      color: #f56c6c;
      font-weight: 500;
    }

    .normal-count {
      color: #67c23a;
    }
  }
}
</style>