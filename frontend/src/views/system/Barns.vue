<template>
  <div class="barns-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">牛棚管理</h1>
        <p class="page-description">管理基地下的牛棚信息，包括容量、类型等配置</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加牛棚
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalBarns || 0 }}</div>
              <div class="stat-label">总牛棚数</div>
            </div>
            <el-icon class="stat-icon"><House /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card capacity">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalCapacity || 0 }}</div>
              <div class="stat-label">总容量</div>
            </div>
            <el-icon class="stat-icon"><DataAnalysis /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card occupied">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.totalCurrentCount || 0 }}</div>
              <div class="stat-label">已使用</div>
            </div>
            <el-icon class="stat-icon"><Check /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card utilization">
            <div class="stat-content">
              <div class="stat-number">{{ statistics.averageUtilization || 0 }}%</div>
              <div class="stat-label">平均利用率</div>
            </div>
            <el-icon class="stat-icon"><TrendCharts /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="page-content">
      <el-card>
        <!-- 搜索和筛选 -->
        <div class="search-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-input
                v-model="searchForm.search"
                placeholder="搜索牛棚名称、编码"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="4">
              <CascadeSelector
              v-model="searchForm.cascade"
              placeholder="选择基地"
              @change="handleCascadeChange"
            />
          </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.barn_type" placeholder="牛棚类型" clearable>
                <el-option label="育肥棚" value="育肥棚" />
                <el-option label="繁殖棚" value="繁殖棚" />
                <el-option label="隔离棚" value="隔离棚" />
                <el-option label="治疗棚" value="治疗棚" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 牛棚列表 -->
        <el-table :data="barnList" v-loading="loading" row-key="id">
          <el-table-column prop="name" label="牛棚名称" width="150" />
          <el-table-column prop="code" label="编码" width="120" />
          <el-table-column prop="base.name" label="所属基地" width="150" />
          <el-table-column prop="barn_type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getBarnTypeColor(row.barn_type)" size="small">
                {{ row.barn_type || '未设置' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="capacity" label="容量" width="80" />
          <el-table-column prop="current_count" label="当前数量" width="100" />
          <el-table-column label="利用率" width="120">
            <template #default="{ row }">
              <el-progress
                :percentage="Math.round((row.current_count / row.capacity) * 100)"
                :color="getUtilizationColor(row.current_count / row.capacity)"
                :stroke-width="8"
              />
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetail(row)">详情</el-button>
              <el-button size="small" type="primary" @click="editBarn(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteBarn(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 牛棚表单对话框 -->
    <el-dialog
      v-model="showFormDialog"
      :title="currentBarn ? '编辑牛棚' : '添加牛棚'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="barnForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="牛棚名称" prop="name">
          <el-input v-model="barnForm.name" placeholder="请输入牛棚名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="barnForm.code" placeholder="请输入牛棚编码" />
        </el-form-item>
        <el-form-item label="所属基地" prop="cascade">
          <CascadeSelector
            v-model="barnForm.cascade"
            :required="true"
            placeholder="请选择基地"
          />
        </el-form-item>
        <el-form-item label="牛棚类型" prop="barn_type">
          <el-select v-model="barnForm.barn_type" placeholder="请选择牛棚类型" style="width: 100%">
            <el-option label="育肥棚" value="育肥棚" />
            <el-option label="繁殖棚" value="繁殖棚" />
            <el-option label="隔离棚" value="隔离棚" />
            <el-option label="治疗棚" value="治疗棚" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="容量" prop="capacity">
          <el-input-number
            v-model="barnForm.capacity"
            :min="1"
            :max="1000"
            placeholder="请输入容量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="barnForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ currentBarn ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Search,
  House,
  DataAnalysis,
  Check,
  TrendCharts
} from '@element-plus/icons-vue'
import { useBaseStore } from '@/stores/base'
import { barnApi, type Barn } from '@/api/barn'
import { validatePaginationData, validateDataArray } from '@/utils/dataValidation'
import CascadeSelector from '@/components/common/CascadeSelector.vue'

const baseStore = useBaseStore()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const showFormDialog = ref(false)
const currentBarn = ref<Barn | null>(null)
const formRef = ref<FormInstance>()

// 列表数据
const barnList = ref<Barn[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 统计数据
const statistics = ref({
  totalBarns: 0,
  totalCapacity: 0,
  totalCurrentCount: 0,
  averageUtilization: 0
})

// 搜索表单
const searchForm = reactive({
  search: '',
  base_id: undefined as number | undefined,
  barn_type: undefined as string | undefined,
  cascade: {
    baseId: undefined,
    barnId: undefined,
    cattleId: undefined
  }
})

// 牛棚表单
const barnForm = reactive({
  name: '',
  code: '',
  base_id: undefined as number | undefined,
  barn_type: '',
  capacity: 50,
  description: '',
  cascade: {
    baseId: undefined,
    barnId: undefined,
    cattleId: undefined
  }
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入牛棚名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入牛棚编码', trigger: 'blur' },
    { min: 2, max: 50, message: '编码长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_-]+$/i, message: '编码只能包含字母、数字、下划线和横线', trigger: 'blur' }
  ],
  cascade: [
    {
      required: true,
      message: '请选择所属基地',
      trigger: 'change',
      validator: (rule: any, value: any, callback: any) => {
        if (value && value.baseId) {
          callback()
        } else {
          callback(new Error('请选择所属基地'))
        }
      }
    }
  ],
  barn_type: [
    { required: true, message: '请选择牛棚类型', trigger: 'change' }
  ],
  capacity: [
    { required: true, message: '请输入容量', trigger: 'blur' },
    { type: 'number', min: 1, max: 1000, message: '容量必须在 1 到 1000 之间', trigger: 'blur' }
  ]
}

onMounted(() => {
  loadBarnList()
  loadStatistics()
  baseStore.fetchBases()
})

const loadBarnList = async () => {
  try {
    loading.value = true
    const params = {
      ...searchForm,
      page: currentPage.value,
      limit: pageSize.value
    }
    
    const response = await barnApi.getBarns(params)
    
    // 使用数据验证工具处理响应
    const validatedData = validatePaginationData(response.data || response)
    
    // 验证每个牛棚数据
    barnList.value = validateDataArray(validatedData.data, validateBarnData)
    total.value = validatedData.pagination.total
  } catch (error) {
    console.error('加载牛棚列表失败:', error)
    ElMessage.error('加载牛棚列表失败')
    barnList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

const loadStatistics = async () => {
  try {
    const response = await barnApi.getStatistics(searchForm.base_id ? { base_id: searchForm.base_id } : {})
    statistics.value = response.data.overview
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadBarnList()
  loadStatistics()
}

// 处理级联选择变更
const handleCascadeChange = () => {
  if (searchForm.cascade && searchForm.cascade.baseId) {
    searchForm.base_id = searchForm.cascade.baseId
  } else {
    searchForm.base_id = undefined
  }
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    base_id: undefined,
    barn_type: undefined,
    cascade: {
      baseId: undefined,
      barnId: undefined,
      cattleId: undefined
    }
  })
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadBarnList()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadBarnList()
}

const showAddDialog = () => {
  currentBarn.value = null
  resetForm()
  showFormDialog.value = true
}

const viewDetail = (barn: Barn) => {
  // TODO: 实现详情查看
  ElMessage.info('详情功能待实现')
}

const editBarn = (barn: Barn) => {
  currentBarn.value = barn
  Object.assign(barnForm, {
    name: barn.name,
    code: barn.code,
    base_id: barn.base_id,
    barn_type: barn.barn_type || '',
    capacity: barn.capacity,
    description: barn.description || '',
    cascade: {
      baseId: barn.base_id,
      barnId: undefined,
      cattleId: undefined
    }
  })
  showFormDialog.value = true
}

const deleteBarn = async (barn: Barn) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除牛棚 ${barn.name} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await barnApi.deleteBarn(barn.id)
    ElMessage.success('删除成功')
    loadBarnList()
    loadStatistics()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 确保base_id字段正确设置
    if (barnForm.cascade && barnForm.cascade.baseId) {
      barnForm.base_id = barnForm.cascade.baseId
    }
    
    if (currentBarn.value) {
      await barnApi.updateBarn(currentBarn.value.id, barnForm)
      ElMessage.success('更新成功')
    } else {
      await barnApi.createBarn(barnForm)
      ElMessage.success('创建成功')
    }
    
    showFormDialog.value = false
    loadBarnList()
    loadStatistics()
  } catch (error: any) {
    if (error.message) {
      ElMessage.error(error.message)
    }
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  Object.assign(barnForm, {
    name: '',
    code: '',
    base_id: undefined,
    barn_type: '',
    capacity: 50,
    description: '',
    cascade: {
      baseId: undefined,
      barnId: undefined,
      cattleId: undefined
    }
  })
  formRef.value?.clearValidate()
}

const getBarnTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    '育肥棚': 'success',
    '繁殖棚': 'primary',
    '隔离棚': 'warning',
    '治疗棚': 'danger',
    '其他': 'info'
  }
  return colors[type] || 'info'
}

const getUtilizationColor = (rate: number) => {
  if (rate < 0.5) return '#67c23a'
  if (rate < 0.8) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style lang="scss" scoped>
.barns-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-content {
      .page-title {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 8px 0;
      }
      
      .page-description {
        color: #909399;
        margin: 0;
      }
    }
  }
  
  .statistics-cards {
    margin-bottom: 20px;
    
    .stat-card {
      position: relative;
      overflow: hidden;
      
      :deep(.el-card__body) {
        padding: 20px;
      }
      
      .stat-content {
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
      
      .stat-icon {
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 40px;
        color: #e4e7ed;
      }
      
      &.capacity {
        border-left: 4px solid #409eff;
        .stat-number { color: #409eff; }
        .stat-icon { color: #409eff; opacity: 0.3; }
      }
      
      &.occupied {
        border-left: 4px solid #67c23a;
        .stat-number { color: #67c23a; }
        .stat-icon { color: #67c23a; opacity: 0.3; }
      }
      
      &.utilization {
        border-left: 4px solid #e6a23c;
        .stat-number { color: #e6a23c; }
        .stat-icon { color: #e6a23c; opacity: 0.3; }
      }
    }
  }
  
  .search-section {
    margin-bottom: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>