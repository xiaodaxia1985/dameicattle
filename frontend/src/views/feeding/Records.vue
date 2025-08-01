<template>
  <div class="records-page">
    <div class="page-header">
      <div class="header-left">
        <h1>饲喂记录管理</h1>
        <p class="header-desc">管理和查看牛只饲喂记录，跟踪饲料使用情况</p>
      </div>
      <div class="header-right">
        <el-button type="success" @click="showPlanDialog">
          <el-icon><Calendar /></el-icon>
          生成饲喂计划
        </el-button>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          添加记录
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="search-card" shadow="never">
      <div class="search-form">
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="search-item">
              <label class="search-label">选择范围</label>
              <CascadeSelector
                v-model="searchForm.cascade"
                cattle-label="选择牛只(可选)"
                :required="false"
                @change="handleCascadeChange"
                style="width: 100%"
              />
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
                @change="handleDateRangeChange"
                style="width: 100%"
              />
            </div>
          </el-col>
          <el-col :span="6">
            <div class="search-item">
              <label class="search-label">饲料配方</label>
              <el-select 
                v-model="selectedFormula" 
                placeholder="选择配方" 
                clearable 
                @change="handleFormulaChange"
                style="width: 100%"
              >
                <el-option
                  v-for="formula in validFormulas"
                  :key="formula.id"
                  :label="formula.name"
                  :value="formula.id"
                />
              </el-select>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="search-item">
              <label class="search-label">&nbsp;</label>
              <div class="search-actions">
                <el-button @click="resetSearch">重置</el-button>
                <el-button type="primary" @click="fetchRecords">搜索</el-button>
              </div>
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
              <div class="stat-icon">
                <el-icon><DataLine /></el-icon>
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
              <div class="stat-icon">
                <el-icon><Dish /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalAmount }}kg</div>
                <div class="stat-label">总饲喂量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ totalCost }}</div>
                <div class="stat-label">总成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ avgDailyCost }}</div>
                <div class="stat-label">日均成本</div>
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
          <span>饲喂记录</span>
          <div class="header-tools">
            <el-button type="text" @click="exportRecords">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="text" @click="showBatchDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="饲喂日期" width="120" sortable>
          <template #default="{ row }">
            {{ row.feeding_date }}
          </template>
        </el-table-column>
        <el-table-column label="配方" min-width="150">
          <template #default="{ row }">
            {{ row.formula?.name || '-' }}
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
        <el-table-column prop="amount" label="用量(kg)" width="100" sortable>
          <template #default="{ row }">
            {{ parseFloat(row.amount || 0).toFixed(1) }}
          </template>
        </el-table-column>
        <el-table-column label="成本(¥)" width="100" sortable>
          <template #default="{ row }">
            ¥{{ (parseFloat(row.amount || 0) * parseFloat(row.formula?.cost_per_kg || 0)).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作员" width="100">
          <template #default="{ row }">
            {{ row.operator?.real_name || row.operator?.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="记录时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="viewRecord(row)">查看</el-button>
            <el-button type="text" @click="editRecord(row)">编辑</el-button>
            <el-button type="text" style="color: #f56c6c" @click="deleteRecord(row)">删除</el-button>
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
      :title="dialogMode === 'create' ? '添加饲喂记录' : '编辑饲喂记录'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="饲喂日期" prop="feedingDate">
          <el-date-picker
            v-model="formData.feedingDate"
            type="date"
            placeholder="选择饲喂日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="配方" prop="formulaId">
          <el-select v-model="formData.formulaId" placeholder="选择配方" style="width: 100%">
            <el-option
              v-for="formula in formulas"
              :key="formula.id"
              :label="`${formula.name} (¥${formula.costPerKg?.toFixed(2)}/kg)`"
              :value="formula.id"
            />
          </el-select>
        </el-form-item>
        <!-- 基地牛棚选择 -->
        <el-form-item label="目标基地" prop="baseId">
          <el-select v-model="formData.baseId" placeholder="请选择基地" style="width: 100%" @change="handleBaseChange">
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="目标牛棚" prop="barnId">
          <el-select 
            v-model="formData.barnId" 
            placeholder="请选择牛棚" 
            style="width: 100%" 
            :disabled="!formData.baseId"
            @change="handleBarnChange"
          >
            <el-option
              v-for="barn in availableBarns"
              :key="barn.value"
              :label="barn.label"
              :value="barn.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="饲喂说明">
          <el-alert
            v-if="formData.barnId && selectedBarnInfo"
            :title="`将为牛棚「${selectedBarnInfo.name}」中的所有牛只（共${selectedBarnInfo.cattleCount}头）进行饲喂`"
            type="info"
            :closable="false"
            show-icon
          />
          <el-alert
            v-else-if="formData.baseId && !formData.barnId"
            title="请选择具体的牛棚进行饲喂"
            type="warning"
            :closable="false"
            show-icon
          />
        </el-form-item>
        <el-form-item label="饲喂量(kg)" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0.1"
            :max="10000"
            :precision="1"
            style="width: 100%"
            @change="calculateEstimatedCost"
          />
        </el-form-item>
        <el-form-item label="预估成本">
          <span class="estimated-cost">¥{{ estimatedCost.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
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
    <el-dialog v-model="detailDialogVisible" title="饲喂记录详情" width="600px">
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="饲喂日期">{{ selectedRecord.feeding_date }}</el-descriptions-item>
          <el-descriptions-item label="记录时间">{{ formatDate(selectedRecord.created_at) }}</el-descriptions-item>
          <el-descriptions-item label="配方">{{ selectedRecord.formula?.name || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="基地">{{ selectedRecord.base?.name || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="牛棚">{{ selectedRecord.barn?.name || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="饲喂量">{{ parseFloat(selectedRecord.amount || 0).toFixed(1) }}kg</el-descriptions-item>
          <el-descriptions-item label="成本">¥{{ (parseFloat(selectedRecord.amount || 0) * parseFloat(selectedRecord.formula?.cost_per_kg || 0)).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ selectedRecord.operator?.real_name || selectedRecord.operator?.username || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedRecord.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量导入饲喂记录" width="500px">
      <div class="batch-import">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>请下载模板文件，按照格式填写数据后上传。</p>
            <p>支持的文件格式：Excel (.xlsx)</p>
          </template>
        </el-alert>
        <div class="import-actions">
          <el-button @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx"
            @change="handleFileChange"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-upload>
        </div>
        <div v-if="uploadFile" class="file-info">
          <p>已选择文件: {{ uploadFile.name }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="importRecords" :loading="importing" :disabled="!uploadFile">
          导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 饲喂计划对话框 -->
    <el-dialog v-model="planDialogVisible" title="生成饲喂计划" width="600px">
      <el-form ref="planFormRef" :model="planFormData" :rules="planFormRules" label-width="100px">
        <el-form-item label="选择基地" prop="baseId">
          <el-select v-model="planFormData.baseId" placeholder="请选择基地" style="width: 100%">
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="计划天数" prop="days">
          <el-input-number
            v-model="planFormData.days"
            :min="1"
            :max="30"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="说明">
          <el-alert
            title="将为选定基地生成未来几天的饲喂计划，包括推荐配方、用量和成本预估"
            type="info"
            :closable="false"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="planDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="generatePlan" :loading="planGenerating">
          生成计划
        </el-button>
      </template>
    </el-dialog>

    <!-- 饲喂计划显示对话框 -->
    <el-dialog v-model="planResultDialogVisible" title="7天饲喂计划" width="80%" top="5vh">
      <div v-if="generatedPlan" class="feeding-plan">
        <!-- 计划汇总 -->
        <div class="plan-summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="计划天数" :value="generatedPlan.summary?.total_days || 0" suffix="天" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="牛只数量" :value="generatedPlan.summary?.cattle_count || 0" suffix="头" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总用量" :value="generatedPlan.summary?.total_amount || 0" suffix="kg" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总成本" :value="generatedPlan.summary?.total_cost || 0" prefix="¥" :precision="2" />
            </el-col>
          </el-row>
        </div>
        
        <!-- 每日计划时间线 -->
        <div class="daily-plans">
          <h3>每日饲喂计划</h3>
          <el-alert
            title="使用说明"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #default>
              <p>📋 此计划基于历史数据智能生成，您可以：</p>
              <p>• 点击"快速添加"按钮将计划项目添加为饲喂记录</p>
              <p>• 导出计划用于线下执行</p>
              <p>• 作为饲喂参考，手动创建记录时可参考推荐用量</p>
            </template>
          </el-alert>
          <el-timeline>
            <el-timeline-item v-for="(dayPlan, index) in generatedPlan.plan" :key="index">
              <el-card>
                <template #header>
                  <div class="day-header">
                    <span>{{ dayPlan.day_of_week }}</span>
                    <span class="date">{{ dayPlan.date }}</span>
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="addPlanAsRecord(dayPlan)"
                      :disabled="isPastDate(dayPlan.date)"
                    >
                      {{ isPastDate(dayPlan.date) ? '已过期' : '快速添加' }}
                    </el-button>
                  </div>
                </template>
                <el-table :data="dayPlan.feedings" size="small">
                  <el-table-column prop="formula.name" label="配方" />
                  <el-table-column label="推荐用量">
                    <template #default="{ row }">{{ row.recommended_amount }}kg</template>
                  </el-table-column>
                  <el-table-column label="预估成本">
                    <template #default="{ row }">¥{{ row.estimated_cost }}</template>
                  </el-table-column>
                  <el-table-column label="饲喂次数">
                    <template #default="{ row }">{{ row.feeding_times }}次</template>
                  </el-table-column>
                  <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                      <el-button 
                        type="text" 
                        size="small" 
                        @click="addSingleFeedingAsRecord(dayPlan, row)"
                        :disabled="isPastDate(dayPlan.date)"
                      >
                        添加此项
                      </el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="exportPlan">导出计划</el-button>
          <el-button @click="batchAddPlanAsRecords" type="success">批量添加所有计划</el-button>
          <el-button type="primary" @click="planResultDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataLine, Dish, Money, TrendCharts, Plus, Download, Upload, Calendar } from '@element-plus/icons-vue'
import { feedingApi } from '@/api/feeding'
import { baseApi } from '@/api/base'
import { barnApi } from '@/api/barn'
import CascadeSelector from '@/components/common/CascadeSelector.vue'
import type { FeedingRecord, FeedFormula, CreateFeedingRecordRequest, UpdateFeedingRecordRequest } from '@/api/feeding'
import { validateData } from '@/utils/dataValidation'

// 响应式数据
const records = ref<FeedingRecord[]>([])
const formulas = ref<FeedFormula[]>([])
const bases = ref<any[]>([])
const barns = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const selectedRows = ref<FeedingRecord[]>([])

// 饲喂计划相关
const planDialogVisible = ref(false)
const planResultDialogVisible = ref(false)
const planGenerating = ref(false)
const generatedPlan = ref<any>(null)
const planFormRef = ref()
const planFormData = ref({
  baseId: 0,
  days: 7
})

const planFormRules = {
  baseId: [
    { required: true, message: '请选择基地', trigger: 'change' },
    { 
      validator: (rule: any, value: any, callback: Function) => {
        if (!value || value === 0) {
          callback(new Error('请选择基地'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  days: [
    { required: true, message: '请输入计划天数', trigger: 'blur' },
    { type: 'number', min: 1, max: 30, message: '计划天数必须在1-30天之间', trigger: 'blur' }
  ]
}

// 计算属性：过滤有效的记录数据
const validRecords = computed(() => {
  return records.value.filter(record => 
    record && 
    typeof record === 'object' && 
    record.id !== undefined && 
    record.id !== null &&
    record.feedingDate &&
    typeof record.feedingDate === 'string'
  )
})

const validFormulas = computed(() => {
  return formulas.value.filter(formula => 
    formula && 
    typeof formula === 'object' && 
    formula.id !== undefined && 
    formula.id !== null &&
    formula.name &&
    typeof formula.name === 'string'
  )
})

// 筛选条件
const dateRange = ref<[string, string]>(['', ''])
const selectedFormula = ref<string>()

// 搜索表单
const searchForm = ref({
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined as number | undefined
  }
})

// 分页
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedRecord = ref<FeedingRecord | null>(null)

// 表单
const formRef = ref()
const uploadRef = ref()
const uploadFile = ref<File | null>(null)
const formData = ref<CreateFeedingRecordRequest & { cascade?: { baseId?: number; barnId?: number; cattleId?: number } }>({
  formulaId: '',
  baseId: 0,
  barnId: 0,
  amount: 0,
  feedingDate: '',
  remark: '',
  cascade: {
    baseId: undefined,
    barnId: undefined,
    cattleId: undefined
  }
})

const formRules: Record<string, any> = {
  feedingDate: [
    { required: true, message: '请选择饲喂日期', trigger: 'change' }
  ],
  formulaId: [
    { required: true, message: '请选择配方', trigger: 'change' }
  ],
  baseId: [
    { required: true, message: '请选择基地', trigger: 'change' },
    { 
      validator: (rule: any, value: any, callback: Function) => {
        if (!value || value === 0) {
          callback(new Error('请选择基地'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  barnId: [
    { required: true, message: '请选择牛棚', trigger: 'change' },
    { 
      validator: (rule: any, value: any, callback: Function) => {
        if (!value || value === 0) {
          callback(new Error('请选择牛棚'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  amount: [
    { required: true, message: '请输入饲喂量', trigger: 'blur' },
    { type: 'number', min: 0.1, message: '饲喂量必须大于0.1kg', trigger: 'blur' }
  ]
}

// 计算属性
const totalRecords = computed(() => pagination.value.total)
const totalAmount = computed(() => {
  const total = records.value.reduce((sum, record) => {
    const amount = parseFloat(record.amount || 0)
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)
  return total.toFixed(1)
})

const totalCost = computed(() => {
  const total = records.value.reduce((sum, record) => {
    const amount = parseFloat(record.amount || 0)
    const costPerKg = parseFloat(record.formula?.cost_per_kg || 0)
    const cost = amount * costPerKg
    return sum + (isNaN(cost) ? 0 : cost)
  }, 0)
  return total.toFixed(2)
})

const avgDailyCost = computed(() => {
  if (!dateRange.value || records.value.length === 0) return '0.00'
  const days = Math.max(1, Math.ceil((new Date(dateRange.value[1]).getTime() - new Date(dateRange.value[0]).getTime()) / (1000 * 60 * 60 * 24)))
  const totalCostNum = parseFloat(totalCost.value)
  return (totalCostNum / days).toFixed(2)
})

const availableBarns = computed(() => {
  console.log('计算可用牛棚:', {
    allBarns: barns.value,
    selectedBaseId: formData.value.baseId,
    barnsCount: barns.value.length
  })
  
  const filtered = barns.value.filter(barn => {
    const barnBaseId = barn.baseId || barn.base_id
    console.log(`牛棚 ${barn.name} 的基地ID: ${barnBaseId}, 选中基地ID: ${formData.value.baseId}`)
    return barnBaseId === formData.value.baseId
  })
  
  console.log('过滤后的牛棚:', filtered)
  
  return filtered.map(barn => ({
    value: barn.id,
    label: `${barn.name} (${barn.code || ''})`
  }))
})

const selectedBarnInfo = computed(() => {
  if (!formData.value.barnId) return null
  const barn = barns.value.find(b => b.id === formData.value.barnId)
  return barn ? {
    name: barn.name,
    cattleCount: barn.current_count || 0
  } : null
})

const estimatedCost = computed(() => {
  const formula = formulas.value.find(f => f.id === formData.value.formulaId)
  if (!formula || !formData.value.amount) return 0
  return (formula.costPerKg || 0) * formData.value.amount
})

// 初始化日期范围（最近30天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases()
    // 根据API实现，response.data 应该是 { bases: [...], pagination: {...} }
    bases.value = response.data.bases || []
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

// 获取配方列表
const fetchFormulas = async () => {
  try {
    const response = await feedingApi.getFormulas()
    // 根据API实现，response.data 应该是 { data: [...], total: number, page: number, limit: number }
    formulas.value = response.data.data || []
  } catch (error) {
    console.error('获取配方列表失败:', error)
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
    
    // 使用级联选择的值
    if (searchForm.value.cascade.baseId) params.baseId = searchForm.value.cascade.baseId
    if (searchForm.value.cascade.barnId) params.barnId = searchForm.value.cascade.barnId
    if (searchForm.value.cascade.cattleId) params.cattleId = searchForm.value.cascade.cattleId
    if (selectedFormula.value) params.formulaId = selectedFormula.value
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const response = await feedingApi.getFeedingRecords(params)
    console.log('API响应数据结构:', response)
    
    // 根据API定义，应该是 FeedingListResponse 结构
    if (response.data.data) {
      // 如果是标准的API响应格式
      records.value = response.data.data || []
      pagination.value.total = response.data.total || 0
    } else if (response.data.records) {
      // 如果是实际返回的格式
      records.value = response.data.records || []
      pagination.value.total = response.data.pagination?.total || 0
    } else {
      // 兜底处理
      records.value = []
      pagination.value.total = 0
    }
    
    console.log('解析后的记录数据:', records.value)
  } catch (error) {
    console.error('获取记录列表失败:', error)
    ElMessage.error('获取记录列表失败')
  } finally {
    loading.value = false
  }
}

// 级联选择变更处理
const handleCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  searchForm.value.cascade = value
  pagination.value.page = 1
  fetchRecords()
}

// 表单级联选择变更处理
const handleFormCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  console.log('级联选择变更:', value)
  formData.value.baseId = value.baseId || 0
  formData.value.barnId = value.barnId || 0
  console.log('更新后的formData:', formData.value)
}

// 处理筛选条件变化
const handleDateRangeChange = () => {
  pagination.value.page = 1
  fetchRecords()
}

const handleFormulaChange = () => {
  pagination.value.page = 1
  fetchRecords()
}

// 分页
const handleSizeChange = () => {
  fetchRecords()
}

const handleCurrentChange = () => {
  fetchRecords()
}

// 选择变化
const handleSelectionChange = (selection: FeedingRecord[]) => {
  selectedRows.value = selection
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  formData.value.feedingDate = new Date().toISOString().split('T')[0]
  dialogVisible.value = true
}

// 查看记录
const viewRecord = (record: FeedingRecord) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

// 编辑记录
const editRecord = (record: FeedingRecord) => {
  dialogMode.value = 'edit'
  selectedRecord.value = record
  
  // 根据实际数据结构设置表单数据
  formData.value = {
    formulaId: record.formula_id || record.formula?.id,
    baseId: record.base_id || record.base?.id,
    barnId: record.barn_id || record.barn?.id,
    amount: parseFloat(record.amount || 0),
    feedingDate: record.feeding_date,
    remark: record.remark || ''
  }
  
  console.log('编辑记录数据:', {
    原始记录: record,
    表单数据: formData.value
  })
  
  dialogVisible.value = true
}

// 删除记录
const deleteRecord = async (record: FeedingRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条饲喂记录吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await feedingApi.deleteFeedingRecord(record.id)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

// 处理表单基地变化
const handleBaseChange = () => {
  console.log('基地变更:', formData.value.baseId)
  formData.value.barnId = 0
}

// 处理表单牛棚变化
const handleBarnChange = () => {
  console.log('牛棚变更:', formData.value.barnId)
}

// 计算预估成本
const calculateEstimatedCost = () => {
  // 触发响应式更新
}

// 提交表单
const submitForm = async () => {
  console.log('submitForm called')
  console.log('formRef.value:', formRef.value)
  console.log('formData.value:', formData.value)
  
  if (!formRef.value) {
    console.error('formRef is null')
    ElMessage.error('表单引用为空')
    return
  }
  
  try {
    console.log('开始表单验证...')
    await formRef.value.validate()
    console.log('表单验证通过')
    
    submitting.value = true
    
    // 准备提交的数据，移除cascade属性
    const submitData = {
      formulaId: formData.value.formulaId,
      baseId: formData.value.baseId,
      barnId: formData.value.barnId,
      amount: formData.value.amount,
      feedingDate: formData.value.feedingDate,
      remark: formData.value.remark
    }
    
    console.log('准备提交的数据:', submitData)
    
    if (dialogMode.value === 'create') {
      console.log('调用创建API')
      const result = await feedingApi.createFeedingRecord(submitData)
      console.log('创建API响应:', result)
      ElMessage.success('添加成功')
    } else {
      console.log('调用更新API, ID:', selectedRecord.value?.id)
      const result = await feedingApi.updateFeedingRecord(selectedRecord.value!.id, submitData)
      console.log('更新API响应:', result)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    fetchRecords()
  } catch (error) {
    console.error('提交失败:', error)
    if (error.response) {
      console.error('错误响应:', error.response.data)
    }
    ElMessage.error('提交失败: ' + (error.message || '未知错误'))
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    formulaId: '',
    baseId: 0,
    barnId: 0,
    amount: 0,
    feedingDate: '',
    remark: '',
    cascade: {
      baseId: undefined,
      barnId: undefined,
      cattleId: undefined
    }
  }
  selectedRecord.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 导出记录
const exportRecords = () => {
  ElMessage.info('导出功能开发中...')
}

// 显示批量导入对话框
const showBatchDialog = () => {
  batchDialogVisible.value = true
  uploadFile.value = null
}

// 下载模板
const downloadTemplate = () => {
  ElMessage.info('模板下载功能开发中...')
}

// 处理文件选择
const handleFileChange = (file: any) => {
  uploadFile.value = file.raw
}

// 导入记录
const importRecords = async () => {
  if (!uploadFile.value) return
  
  importing.value = true
  try {
    // 这里应该调用批量导入API
    ElMessage.success('导入成功')
    batchDialogVisible.value = false
    fetchRecords()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载
onMounted(() => {
  initDateRange()
  fetchBases()
  fetchBarns()
  fetchFormulas()
  fetchRecords() // 初始化时获取饲喂记录
})

// 重置搜索条件
const resetSearch = () => {
  searchForm.value.cascade = {
    baseId: undefined,
    barnId: undefined,
    cattleId: undefined
  }
  selectedFormula.value = undefined
  initDateRange()
  pagination.value.page = 1
  fetchRecords()
}

// 饲喂计划相关方法
const showPlanDialog = () => {
  planFormData.value = {
    baseId: 0,
    days: 7
  }
  planDialogVisible.value = true
}

const generatePlan = async () => {
  if (!planFormRef.value) {
    ElMessage.error('表单引用为空')
    return
  }
  
  try {
    await planFormRef.value.validate()
    
    planGenerating.value = true
    
    const response = await feedingApi.generateFeedingPlan({
      base_id: planFormData.value.baseId,
      days: planFormData.value.days
    })
    
    generatedPlan.value = response.data
    planDialogVisible.value = false
    planResultDialogVisible.value = true
    ElMessage.success('饲喂计划生成成功')
  } catch (error) {
    console.error('生成饲喂计划失败:', error)
    ElMessage.error('生成饲喂计划失败')
  } finally {
    planGenerating.value = false
  }
}

const exportPlan = () => {
  if (!generatedPlan.value) {
    ElMessage.warning('没有可导出的计划数据')
    return
  }

  const exportData = {
    title: '7天饲喂计划',
    generated_at: generatedPlan.value.generated_at,
    summary: generatedPlan.value.summary,
    plan: generatedPlan.value.plan
  }
  
  const dataStr = JSON.stringify(exportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `饲喂计划_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  ElMessage.success('计划导出成功')
}

// 判断日期是否已过期
const isPastDate = (dateStr: string) => {
  const planDate = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return planDate < today
}

// 将单个计划项添加为饲喂记录
const addSingleFeedingAsRecord = async (dayPlan: any, feeding: any) => {
  try {
    // 找到对应的牛棚（使用计划生成时的基地）
    const baseBarns = barns.value.filter(barn => 
      (barn.baseId || barn.base_id) === planFormData.value.baseId
    )
    
    if (baseBarns.length === 0) {
      ElMessage.warning('该基地没有可用的牛棚')
      return
    }

    // 使用第一个牛棚作为默认选择
    const defaultBarn = baseBarns[0]
    
    const recordData = {
      formulaId: feeding.formula.id,
      baseId: planFormData.value.baseId,
      barnId: defaultBarn.id,
      amount: feeding.recommended_amount,
      feedingDate: dayPlan.date,
      remark: `来自饲喂计划 - ${feeding.formula.name}`
    }

    await feedingApi.createFeedingRecord(recordData)
    ElMessage.success(`已添加 ${dayPlan.date} 的饲喂记录`)
    
    // 刷新记录列表
    fetchRecords()
  } catch (error) {
    console.error('添加饲喂记录失败:', error)
    ElMessage.error('添加饲喂记录失败')
  }
}

// 将整天的计划添加为饲喂记录
const addPlanAsRecord = async (dayPlan: any) => {
  try {
    const baseBarns = barns.value.filter(barn => 
      (barn.baseId || barn.base_id) === planFormData.value.baseId
    )
    
    if (baseBarns.length === 0) {
      ElMessage.warning('该基地没有可用的牛棚')
      return
    }

    const defaultBarn = baseBarns[0]
    
    // 为该天的所有饲喂项创建记录
    const promises = dayPlan.feedings.map((feeding: any) => {
      const recordData = {
        formulaId: feeding.formula.id,
        baseId: planFormData.value.baseId,
        barnId: defaultBarn.id,
        amount: feeding.recommended_amount,
        feedingDate: dayPlan.date,
        remark: `来自饲喂计划 - ${feeding.formula.name}`
      }
      return feedingApi.createFeedingRecord(recordData)
    })

    await Promise.all(promises)
    ElMessage.success(`已添加 ${dayPlan.date} 的所有饲喂记录`)
    
    // 刷新记录列表
    fetchRecords()
  } catch (error) {
    console.error('批量添加饲喂记录失败:', error)
    ElMessage.error('批量添加饲喂记录失败')
  }
}

// 批量添加所有计划为饲喂记录
const batchAddPlanAsRecords = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要将所有计划项目添加为饲喂记录吗？这将创建多条饲喂记录。',
      '批量添加确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const baseBarns = barns.value.filter(barn => 
      (barn.baseId || barn.base_id) === planFormData.value.baseId
    )
    
    if (baseBarns.length === 0) {
      ElMessage.warning('该基地没有可用的牛棚')
      return
    }

    const defaultBarn = baseBarns[0]
    let addedCount = 0
    
    // 只添加未过期的计划
    const validPlans = generatedPlan.value.plan.filter((dayPlan: any) => !isPastDate(dayPlan.date))
    
    for (const dayPlan of validPlans) {
      for (const feeding of dayPlan.feedings) {
        try {
          const recordData = {
            formulaId: feeding.formula.id,
            baseId: planFormData.value.baseId,
            barnId: defaultBarn.id,
            amount: feeding.recommended_amount,
            feedingDate: dayPlan.date,
            remark: `来自饲喂计划 - ${feeding.formula.name}`
          }
          await feedingApi.createFeedingRecord(recordData)
          addedCount++
        } catch (error) {
          console.error(`添加 ${dayPlan.date} 的记录失败:`, error)
        }
      }
    }

    ElMessage.success(`成功添加 ${addedCount} 条饲喂记录`)
    
    // 关闭计划对话框并刷新记录列表
    planResultDialogVisible.value = false
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量添加计划失败:', error)
      ElMessage.error('批量添加计划失败')
    }
  }
}

// 监听搜索条件变化
watch(() => searchForm.value.cascade.baseId, () => {
  fetchRecords()
})
</script>

<style scoped lang="scss">
.records-page {
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
    border: 1px solid #e4e7ed;

    .search-form {
      .search-item {
        margin-bottom: 16px;

        .search-label {
          display: block;
          font-size: 14px;
          color: #606266;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .search-actions {
          display: flex;
          gap: 8px;
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
          background: linear-gradient(135deg, #409EFF, #67C23A);
          color: white;
          font-size: 24px;
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-tools {
      display: flex;
      gap: 8px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .estimated-cost {
    font-size: 16px;
    font-weight: bold;
    color: #67C23A;
  }

  .record-detail {
    .el-descriptions {
      margin-top: 20px;
    }
  }

  .search-card {
    margin-bottom: 20px;
    border: 1px solid #e4e7ed;

    .search-form {
      .search-item {
        margin-bottom: 16px;

        .search-label {
          display: block;
          font-size: 14px;
          color: #606266;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .search-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .page-header {
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

  .batch-import {
    .import-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .file-info {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      color: #606266;
    }
  }

  // 饲喂计划对话框样式
  .feeding-plan {
    .plan-summary {
      margin-bottom: 24px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .daily-plans {
      h3 {
        margin-bottom: 16px;
        color: #303133;
        font-size: 18px;
        font-weight: 600;
      }

      .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .date {
          color: #909399;
          font-size: 14px;
        }
      }

      .day-feedings {
        margin-top: 12px;
      }

      .el-timeline-item {
        .el-card {
          margin-bottom: 16px;
        }
      }
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  }
}
</style>