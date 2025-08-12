<template>
  <div class="cattle-list">
    <div class="page-header">
      <h1 class="page-title">牛场管理</h1>
      <p class="page-description">管理牛只档案信息，支持查询、筛选、批量操作</p>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ ensureNumber(cattleStore.total, 0) }}</div>
              <div class="stat-label">总数量</div>
            </div>
            <el-icon class="stat-icon"><DataAnalysis /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card healthy">
            <div class="stat-content">
              <div class="stat-number">{{ cattleStore.healthyCount }}</div>
              <div class="stat-label">健康</div>
            </div>
            <el-icon class="stat-icon"><Check /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card sick">
            <div class="stat-content">
              <div class="stat-number">{{ cattleStore.sickCount }}</div>
              <div class="stat-label">患病</div>
            </div>
            <el-icon class="stat-icon"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card treatment">
            <div class="stat-content">
              <div class="stat-number">{{ cattleStore.treatmentCount }}</div>
              <div class="stat-label">治疗中</div>
            </div>
            <el-icon class="stat-icon"><FirstAidKit /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="page-content">
      <el-card>
        <!-- 搜索和筛选 -->
        <div class="search-section">
          <el-row :gutter="16">
            <el-col :span="5">
              <el-input
                v-model="searchForm.search"
                placeholder="搜索耳标号、品种"
                clearable
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.baseId" placeholder="选择基地" clearable @change="handleBaseChange">
                <el-option
                  v-for="base in baseStore.bases"
                  :key="base.id"
                  :label="base.name"
                  :value="base.id"
                />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.barnId" placeholder="选择牛棚" clearable>
                <el-option
                  v-for="barn in availableBarns"
                  :key="barn.value"
                  :label="barn.label"
                  :value="barn.value"
                />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-select v-model="searchForm.healthStatus" placeholder="健康状态" clearable>
                <el-option label="健康" value="healthy" />
                <el-option label="患病" value="sick" />
                <el-option label="治疗中" value="treatment" />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-select v-model="searchForm.gender" placeholder="性别" clearable>
                <el-option label="公牛" value="male" />
                <el-option label="母牛" value="female" />
              </el-select>
            </el-col>
            <el-col :span="5">
              <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" @click="showAddDialog">
              <el-icon><Plus /></el-icon>
              添加牛只
            </el-button>
            <el-button @click="showBatchImportDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
            <el-button @click="handleExport">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button 
              :disabled="selectedCattle.length === 0"
              @click="showBatchTransferDialog"
            >
              <el-icon><Switch /></el-icon>
              批量转群
            </el-button>
          </div>
          <div class="toolbar-right">
            <el-button-group>
              <el-button 
                :type="viewMode === 'table' ? 'primary' : ''"
                @click="viewMode = 'table'"
              >
                <el-icon><List /></el-icon>
              </el-button>
              <el-button 
                :type="viewMode === 'card' ? 'primary' : ''"
                @click="viewMode = 'card'"
              >
                <el-icon><Grid /></el-icon>
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 表格视图 -->
        <div v-if="viewMode === 'table'">
          <el-table 
            :data="cattleStore.cattleList || []" 
            v-loading="cattleStore.loading"
            @selection-change="handleSelectionChange"
            row-key="id"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="ear_tag" label="耳标号" width="120" fixed="left">
              <template #default="{ row }">
                <el-link type="primary" @click="viewDetail(row)">
                  {{ safeGet(row, 'ear_tag', '-') }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="breed" label="品种" width="120">
              <template #default="{ row }">
                {{ safeGet(row, 'breed', '-') }}
              </template>
            </el-table-column>
            <el-table-column prop="gender" label="性别" width="80">
              <template #default="{ row }">
                <el-tag :type="safeGet(row, 'gender') === 'male' ? 'primary' : 'success'" size="small">
                  {{ safeGet(row, 'gender') === 'male' ? '公' : '母' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="体重(kg)" width="100">
              <template #default="{ row }">
                {{ safeGet(row, 'weight', '-') }}
              </template>
            </el-table-column>
            <el-table-column prop="age_months" label="月龄" width="80">
              <template #default="{ row }">
                {{ safeGet(row, 'age_months', '-') }}
              </template>
            </el-table-column>
            <el-table-column prop="health_status" label="健康状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getHealthStatusType(safeGet(row, 'health_status', 'unknown'))" size="small">
                  {{ getHealthStatusText(safeGet(row, 'health_status', 'unknown')) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="base" label="基地" width="120">
              <template #default="{ row }">
                {{ safeGet(row, 'base.name', '-') }}
              </template>
            </el-table-column>
            <el-table-column prop="barn" label="牛棚" width="120">
              <template #default="{ row }">
                {{ safeGet(row, 'barn.name', '-') }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(safeGet(row, 'created_at', '')) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewDetail(row)">详情</el-button>
                <el-button size="small" type="primary" @click="editCattle(row)">编辑</el-button>
                <el-dropdown @command="(command) => handleMoreAction(command, row)">
                  <el-button size="small">
                    更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="events">生命周期</el-dropdown-item>
                      <el-dropdown-item command="photos">照片管理</el-dropdown-item>
                      <el-dropdown-item command="transfer">转群</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 卡片视图 -->
        <div v-else class="card-view">
          <el-row :gutter="16">
            <el-col :span="6" v-for="cattle in ensureArray(cattleStore.cattleList)" :key="safeGet(cattle, 'id', 'unknown')">
              <el-card class="cattle-card">
                <div class="card-header">
                  <span class="ear-tag">{{ safeGet(cattle, 'ear_tag', '-') }}</span>
                  <el-tag :type="getHealthStatusType(safeGet(cattle, 'health_status', 'unknown'))" size="small">
                    {{ getHealthStatusText(safeGet(cattle, 'health_status', 'unknown')) }}
                  </el-tag>
                </div>
                <div class="card-content">
                  <p><strong>品种:</strong> {{ safeGet(cattle, 'breed', '-') }}</p>
                  <p><strong>性别:</strong> {{ safeGet(cattle, 'gender') === 'male' ? '公' : '母' }}</p>
                  <p><strong>体重:</strong> {{ safeGet(cattle, 'weight', '-') }}kg</p>
                  <p><strong>月龄:</strong> {{ safeGet(cattle, 'age_months', '-') }}</p>
                </div>
                <div class="card-actions">
                  <el-button size="small" @click="viewDetail(cattle)">详情</el-button>
                  <el-button size="small" type="primary" @click="editCattle(cattle)">编辑</el-button>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="ensureNumber(cattleStore.total, 0)"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 对话框组件 - 使用条件渲染避免组件不存在的错误 -->
    <template v-if="showFormDialog">
      <CattleFormDialog
        v-model="showFormDialog"
        :cattle="currentCattle"
        @success="handleFormSuccess"
      />
    </template>

    <template v-if="showImportDialog">
      <BatchImportDialog
        v-model="showImportDialog"
        @success="handleImportSuccess"
      />
    </template>

    <template v-if="showTransferDialog">
      <BatchTransferDialog
        v-model="showTransferDialog"
        :cattle-ids="selectedCattle"
        @success="handleTransferSuccess"
      />
    </template>

    <!-- 生命周期事件对话框 -->
    <el-dialog
      v-model="showLifecycleDialog"
      :title="`${safeGet(currentCattle, 'ear_tag', '未知')} - 生命周期事件`"
      width="80%"
      top="5vh"
    >
      <template v-if="currentCattle && showLifecycleDialog">
        <LifecycleEvents :cattle-id="currentCattle.id" />
      </template>
    </el-dialog>

    <!-- 照片管理对话框 -->
    <el-dialog
      v-model="showPhotoDialog"
      :title="`${safeGet(currentCattle, 'ear_tag', '未知')} - 照片管理`"
      width="80%"
      top="5vh"
    >
      <template v-if="currentCattle && showPhotoDialog">
        <PhotoManager :cattle-id="currentCattle.id" />
      </template>
    </el-dialog>

    <!-- 转群管理对话框 -->
    <el-dialog
      v-model="showSingleTransferDialog"
      :title="`${safeGet(currentCattle, 'ear_tag', '未知')} - 转群管理`"
      width="80%"
      top="5vh"
    >
      <template v-if="currentCattle && showSingleTransferDialog">
        <TransferManager :cattle-id="currentCattle.id" />
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  DataAnalysis, 
  Check, 
  Warning, 
  FirstAidKit,
  Search,
  Plus,
  Upload,
  Download,
  Switch,
  List,
  Grid,
  ArrowDown
} from '@element-plus/icons-vue'
import { useCattleStore } from '@/stores/cattle'
import { useBaseStore } from '@/stores/base'
import { cattleApi, type Cattle } from '@/api/cattle'
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'
import { validatePaginationData, validateDataArray, validateCattleData, validateStatisticsData } from '@/utils/dataValidation'
import { safeApiCall, withPageErrorHandler } from '@/utils/errorHandler'
import CattleFormDialog from '@/components/cattle/CattleFormDialog.vue'
import BatchImportDialog from '@/components/cattle/BatchImportDialog.vue'
import BatchTransferDialog from '@/components/cattle/BatchTransferDialog.vue'
import LifecycleEvents from '@/components/cattle/LifecycleEvents.vue'
import PhotoManager from '@/components/cattle/PhotoManager.vue'
import TransferManager from '@/components/cattle/TransferManager.vue'
import dayjs from 'dayjs'

const cattleStore = useCattleStore()
const baseStore = useBaseStore()
const router = useRouter()

// 搜索表单
const searchForm = reactive({
  search: '',
  baseId: undefined as number | undefined,
  barnId: undefined as number | undefined,
  healthStatus: undefined as 'healthy' | 'sick' | 'treatment' | undefined,
  gender: undefined as 'male' | 'female' | undefined,
  status: 'active' as 'active' | 'sold' | 'dead' | 'transferred'
})

// 可用的牛棚选项
const availableBarns = ref<Array<{
  value: number
  label: string
}>>([])

// 基地变更处理
const handleBaseChange = async (baseId: number | undefined) => {
  searchForm.barnId = undefined
  availableBarns.value = []
  
  if (baseId) {
    try {
      const response = await baseStore.fetchBarnsByBaseId(baseId)
      availableBarns.value = response.map((barn: any) => ({
        value: barn.id,
        label: `${barn.name} (${barn.code})`
      }))
    } catch (error) {
      console.error('加载牛棚选项失败:', error)
      ElMessage.error('加载牛棚选项失败')
    }
  }
}

// 视图模式
const viewMode = ref<'table' | 'card'>('table')

// 选中的牛只
const selectedCattle = ref<number[]>([])

// 对话框状态
const showFormDialog = ref(false)
const showImportDialog = ref(false)
const showTransferDialog = ref(false)
const showDetailDialog = ref(false)
const showLifecycleDialog = ref(false)
const showPhotoDialog = ref(false)
const showSingleTransferDialog = ref(false)

// 当前操作的牛只
const currentCattle = ref<Cattle | null>(null)
const detailCattleId = ref<number | null>(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(20)

onMounted(async () => {
  try {
    // 先加载基地数据
    await baseStore.fetchAllBases()
    
    // 检查路由查询参数，如果有基地和牛棚参数则自动选择
    const route = router.currentRoute.value
    if (route.query.baseId) {
      const baseId = Number(route.query.baseId)
      searchForm.baseId = baseId
      
      // 加载对应基地的牛棚选项
      await handleBaseChange(baseId)
      
      // 如果还有牛棚参数，也自动选择
      if (route.query.barnId) {
        const barnId = Number(route.query.barnId)
        searchForm.barnId = barnId
      }
    }
    
    // 加载牛只列表
    await loadCattleList()
  } catch (error) {
    console.error('初始化数据加载失败:', error)
  }
})

const loadCattleList = withPageErrorHandler(async () => {
  console.log('开始加载牛只列表...')
  console.log('搜索参数:', searchForm)
  
  const result = await safeApiCall(
    () => cattleStore.fetchCattleList({
      ...searchForm,
      page: currentPage.value,
      limit: pageSize.value
    }),
    {
      showMessage: false,
      fallbackValue: null
    }
  )
  
  if (result) {
    console.log('牛只列表加载成功:', cattleStore.cattleList)
  }
}, '加载牛只列表失败')

const handleSearch = () => {
  cattleStore.searchParams.page = 1
  loadCattleList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    baseId: undefined,
    barnId: undefined,
    healthStatus: undefined,
    gender: undefined,
    status: 'active'
  })
  availableBarns.value = []
  handleSearch()
}

const handleSelectionChange = (selection: Cattle[]) => {
  selectedCattle.value = selection.map(item => item.id)
}

const handleCardSelect = (cattleId: number, selected: boolean) => {
  if (selected) {
    if (!selectedCattle.value.includes(cattleId)) {
      selectedCattle.value.push(cattleId)
    }
  } else {
    const index = selectedCattle.value.indexOf(cattleId)
    if (index > -1) {
      selectedCattle.value.splice(index, 1)
    }
  }
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  cattleStore.searchParams.limit = size
  currentPage.value = 1
  cattleStore.searchParams.page = 1
  loadCattleList()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  cattleStore.searchParams.page = page
  loadCattleList()
}

const showAddDialog = () => {
  currentCattle.value = null
  showFormDialog.value = true
}

const viewDetail = (cattle: Cattle) => {
  router.push(`/admin/cattle/detail/${cattle.id}`)
}

const editCattle = (cattle: Cattle) => {
  currentCattle.value = cattle
  showFormDialog.value = true
}

const confirmDelete = async (cattle: Cattle) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除牛只 ${safeGet(cattle, 'ear_tag', '未知')} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    const result = await safeApiCall(
      () => cattleStore.deleteCattle(ensureNumber(cattle.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('删除成功')
      await loadCattleList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleMoreAction = (command: string, cattle: Cattle) => {
  switch (command) {
    case 'events':
      showLifecycleEvents(cattle)
      break
    case 'photos':
      showPhotoManager(cattle)
      break
    case 'transfer':
      showTransferManager(cattle)
      break
    case 'delete':
      confirmDelete(cattle)
      break
  }
}

const showBatchImportDialog = () => {
  showImportDialog.value = true
}

const showBatchTransferDialog = () => {
  if (selectedCattle.value.length === 0) {
    ElMessage.warning('请先选择要转移的牛只')
    return
  }
  showTransferDialog.value = true
}

const handleExport = async () => {
  const result = await safeApiCall(
    () => cattleApi.export(searchForm),
    {
      showMessage: false,
      fallbackValue: null
    }
  )
  
  if (result) {
    try {
      const url = window.URL.createObjectURL(result)
      const link = document.createElement('a')
      link.href = url
      link.download = `cattle_export_${dayjs().format('YYYY-MM-DD')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } catch (error) {
      ElMessage.error('文件下载失败')
    }
  }
}

const handleFormSuccess = () => {
  showFormDialog.value = false
  loadCattleList()
  ElMessage.success(currentCattle.value ? '更新成功' : '添加成功')
}

const handleImportSuccess = () => {
  showImportDialog.value = false
  loadCattleList()
  ElMessage.success('导入成功')
}

const handleTransferSuccess = () => {
  showTransferDialog.value = false
  selectedCattle.value = []
  loadCattleList()
  ElMessage.success('转移成功')
}

const getHealthStatusType = (status: string) => {
  switch (status) {
    case 'healthy': return 'success'
    case 'sick': return 'danger'
    case 'treatment': return 'warning'
    default: return 'info'
  }
}

const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'healthy': return '健康'
    case 'sick': return '患病'
    case 'treatment': return '治疗中'
    default: return '未知'
  }
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

// 显示生命周期事件
const showLifecycleEvents = (cattle: Cattle) => {
  currentCattle.value = cattle
  showLifecycleDialog.value = true
}

// 显示照片管理
const showPhotoManager = (cattle: Cattle) => {
  currentCattle.value = cattle
  showPhotoDialog.value = true
}

// 显示转群管理
const showTransferManager = (cattle: Cattle) => {
  currentCattle.value = cattle
  showSingleTransferDialog.value = true
}
</script>

<style lang="scss" scoped>
.cattle-list {
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
      
      &.healthy {
        border-left: 4px solid #67c23a;
        .stat-number { color: #67c23a; }
        .stat-icon { color: #67c23a; opacity: 0.3; }
      }
      
      &.sick {
        border-left: 4px solid #f56c6c;
        .stat-number { color: #f56c6c; }
        .stat-icon { color: #f56c6c; opacity: 0.3; }
      }
      
      &.treatment {
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
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    .toolbar-left {
      display: flex;
      gap: 8px;
    }
  }
  
  .card-view {
    margin-bottom: 20px;
    
    .el-col {
      margin-bottom: 16px;
    }
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>