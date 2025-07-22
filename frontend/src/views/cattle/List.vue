<template>
  <div class="cattle-list">
    <div class="page-header">
      <h1 class="page-title">牛只管理</h1>
      <p class="page-description">管理牛只档案信息，支持查询、筛选、批量操作</p>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ cattleStore.total }}</div>
              <div class="stat-label">总数量</div>
            </div>
            <el-icon class="stat-icon"><Cow /></el-icon>
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
            <el-icon class="stat-icon"><Medicine /></el-icon>
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
              <el-select v-model="searchForm.healthStatus" placeholder="健康状态" clearable>
                <el-option label="健康" value="healthy" />
                <el-option label="患病" value="sick" />
                <el-option label="治疗中" value="treatment" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.gender" placeholder="性别" clearable>
                <el-option label="公牛" value="male" />
                <el-option label="母牛" value="female" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="searchForm.status" placeholder="状态" clearable>
                <el-option label="在场" value="active" />
                <el-option label="已售" value="sold" />
                <el-option label="转出" value="transferred" />
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
            :data="cattleStore.cattleList" 
            v-loading="cattleStore.loading"
            @selection-change="handleSelectionChange"
            row-key="id"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="ear_tag" label="耳标号" width="120" fixed="left">
              <template #default="{ row }">
                <el-link type="primary" @click="viewDetail(row)">
                  {{ row.ear_tag }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="breed" label="品种" width="120" />
            <el-table-column prop="gender" label="性别" width="80">
              <template #default="{ row }">
                <el-tag :type="row.gender === 'male' ? 'primary' : 'success'" size="small">
                  {{ row.gender === 'male' ? '公' : '母' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="体重(kg)" width="100">
              <template #default="{ row }">
                {{ row.weight || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="age_months" label="月龄" width="80">
              <template #default="{ row }">
                {{ row.age_months || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="health_status" label="健康状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getHealthStatusType(row.health_status)" size="small">
                  {{ getHealthStatusText(row.health_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="base" label="基地" width="120">
              <template #default="{ row }">
                {{ row.base?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="barn" label="牛棚" width="120">
              <template #default="{ row }">
                {{ row.barn?.name || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
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
            <el-col :span="6" v-for="cattle in cattleStore.cattleList" :key="cattle.id">
              <CattleCard 
                :cattle="cattle" 
                :selectable="true"
                :selected="selectedCattle.includes(cattle.id)"
                @select="handleCardSelect"
                @view="viewDetail"
                @edit="editCattle"
                @delete="confirmDelete"
              />
            </el-col>
          </el-row>
        </div>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="cattleStore.searchParams.page"
            v-model:page-size="cattleStore.searchParams.limit"
            :page-sizes="[10, 20, 50, 100]"
            :total="cattleStore.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加/编辑牛只对话框 -->
    <CattleFormDialog
      v-model="showFormDialog"
      :cattle="currentCattle"
      @success="handleFormSuccess"
    />

    <!-- 批量导入对话框 -->
    <BatchImportDialog
      v-model="showImportDialog"
      @success="handleImportSuccess"
    />

    <!-- 批量转群对话框 -->
    <BatchTransferDialog
      v-model="showTransferDialog"
      :cattle-ids="selectedCattle"
      @success="handleTransferSuccess"
    />

    <!-- 牛只详情对话框 -->
    <CattleDetailDialog
      v-model="showDetailDialog"
      :cattle-id="detailCattleId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCattleStore } from '@/stores/cattle'
import { useBaseStore } from '@/stores/base'
import type { Cattle } from '@/api/cattle'
import CattleCard from '@/components/cattle/CattleCard.vue'
import CattleFormDialog from '@/components/cattle/CattleFormDialog.vue'
import BatchImportDialog from '@/components/cattle/BatchImportDialog.vue'
import BatchTransferDialog from '@/components/cattle/BatchTransferDialog.vue'
import CattleDetailDialog from '@/components/cattle/CattleDetailDialog.vue'
import dayjs from 'dayjs'

const cattleStore = useCattleStore()
const baseStore = useBaseStore()

// 搜索表单
const searchForm = reactive({
  search: '',
  healthStatus: undefined as 'healthy' | 'sick' | 'treatment' | undefined,
  gender: undefined as 'male' | 'female' | undefined,
  status: 'active' as 'active' | 'sold' | 'dead' | 'transferred'
})

// 视图模式
const viewMode = ref<'table' | 'card'>('table')

// 选中的牛只
const selectedCattle = ref<number[]>([])

// 对话框状态
const showFormDialog = ref(false)
const showImportDialog = ref(false)
const showTransferDialog = ref(false)
const showDetailDialog = ref(false)

// 当前操作的牛只
const currentCattle = ref<Cattle | null>(null)
const detailCattleId = ref<number | null>(null)

onMounted(() => {
  loadCattleList()
  baseStore.fetchBases()
})

const loadCattleList = async () => {
  try {
    await cattleStore.fetchCattleList({
      ...searchForm,
      page: 1
    })
  } catch (error) {
    ElMessage.error('加载牛只列表失败')
  }
}

const handleSearch = () => {
  cattleStore.searchParams.page = 1
  loadCattleList()
}

const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    healthStatus: undefined,
    gender: undefined,
    status: 'active'
  })
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
  cattleStore.searchParams.limit = size
  loadCattleList()
}

const handleCurrentChange = (page: number) => {
  cattleStore.searchParams.page = page
  loadCattleList()
}

const showAddDialog = () => {
  currentCattle.value = null
  showFormDialog.value = true
}

const viewDetail = (cattle: Cattle) => {
  detailCattleId.value = cattle.id
  showDetailDialog.value = true
}

const editCattle = (cattle: Cattle) => {
  currentCattle.value = cattle
  showFormDialog.value = true
}

const confirmDelete = async (cattle: Cattle) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除牛只 ${cattle.ear_tag} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await cattleStore.deleteCattle(cattle.id)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleMoreAction = (command: string, cattle: Cattle) => {
  switch (command) {
    case 'events':
      // 查看生命周期事件
      break
    case 'photos':
      // 照片管理
      break
    case 'transfer':
      // 单个转群
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
  try {
    const { cattleApi } = await import('@/api/cattle')
    const blob = await cattleApi.export(searchForm)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cattle_export_${dayjs().format('YYYY-MM-DD')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
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