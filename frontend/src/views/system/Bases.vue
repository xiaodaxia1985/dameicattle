<template>
  <div class="bases-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h2>基地管理</h2>
        <p>管理养殖基地信息和牛棚配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleAddBase">
          <el-icon><Plus /></el-icon>
          新增基地
        </el-button>
        <el-button @click="handleImport">
          <el-icon><Upload /></el-icon>
          导入数据
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button 
          v-if="selectedBases.length > 0" 
          type="danger" 
          @click="handleBatchDelete"
        >
          <el-icon><Delete /></el-icon>
          批量删除 ({{ selectedBases.length }})
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="基地名称">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入基地名称或编码"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="searchForm.managerId" placeholder="请选择负责人" clearable>
            <el-option
              v-for="manager in managers"
              :key="manager.id"
              :label="manager.name"
              :value="manager.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="text" @click="advancedSearchVisible = true">
            高级搜索
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button 
              :type="sortField === 'name' ? 'primary' : 'default'"
              @click="handleSort('name')"
            >
              按名称排序
              <el-icon v-if="sortField === 'name'">
                <component :is="sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </el-button>
            <el-button 
              :type="sortField === 'createdAt' ? 'primary' : 'default'"
              @click="handleSort('createdAt')"
            >
              按创建时间排序
              <el-icon v-if="sortField === 'createdAt'">
                <component :is="sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </el-button>
            <el-button 
              :type="sortField === 'area' ? 'primary' : 'default'"
              @click="handleSort('area')"
            >
              按面积排序
              <el-icon v-if="sortField === 'area'">
                <component :is="sortOrder === 'asc' ? 'ArrowUp' : 'ArrowDown'" />
              </el-icon>
            </el-button>
          </el-button-group>
        </div>
        
        <div class="toolbar-right">
          <el-text type="info" size="small">
            共 {{ pagination.total }} 个基地
          </el-text>
        </div>
      </div>
    </div>

    <!-- 高级搜索对话框 -->
    <el-dialog v-model="advancedSearchVisible" title="高级搜索" width="600px">
      <el-form :model="advancedSearchForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="基地名称">
              <el-input v-model="advancedSearchForm.name" placeholder="请输入基地名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基地编码">
              <el-input v-model="advancedSearchForm.code" placeholder="请输入基地编码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="详细地址">
          <el-input v-model="advancedSearchForm.address" placeholder="请输入地址关键词" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人">
              <el-select v-model="advancedSearchForm.managerId" placeholder="请选择负责人" clearable>
                <el-option
                  v-for="manager in managers"
                  :key="manager.id"
                  :label="manager.name"
                  :value="manager.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="占地面积">
              <el-row :gutter="10">
                <el-col :span="11">
                  <el-input-number 
                    v-model="advancedSearchForm.areaMin" 
                    placeholder="最小面积"
                    :min="0"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="2" style="text-align: center; line-height: 32px;">-</el-col>
                <el-col :span="11">
                  <el-input-number 
                    v-model="advancedSearchForm.areaMax" 
                    placeholder="最大面积"
                    :min="0"
                    style="width: 100%"
                  />
                </el-col>
              </el-row>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="advancedSearchForm.createdAtStart"
            type="date"
            placeholder="开始日期"
            style="width: 48%; margin-right: 4%"
          />
          <el-date-picker
            v-model="advancedSearchForm.createdAtEnd"
            type="date"
            placeholder="结束日期"
            style="width: 48%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="handleResetAdvancedSearch">重置</el-button>
        <el-button type="primary" @click="handleAdvancedSearch">搜索</el-button>
      </template>
    </el-dialog>

    <!-- 基地列表 -->
    <div class="content-section">
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 基地卡片列表 -->
          <div class="bases-grid">
            <el-card
              v-for="base in bases"
              :key="base.id"
              class="base-card"
              :class="{ 
                active: selectedBase?.id === base.id,
                selected: selectedBases.some(b => b.id === base.id),
                favorite: favoriteBaseIds.has(base.id)
              }"
              @click="handleSelectBase(base)"
            >
              <template #header>
                <div class="card-header">
                  <div class="card-left">
                    <el-checkbox 
                      :model-value="selectedBases.some(b => b.id === base.id)"
                      @change="(checked) => handleBaseSelection(base, !!checked)"
                      @click.stop
                    />
                    <div class="base-info">
                      <h3>
                        {{ base.name }}
                        <el-icon 
                          v-if="favoriteBaseIds.has(base.id)" 
                          class="favorite-icon"
                        >
                          <StarFilled />
                        </el-icon>
                      </h3>
                      <span class="base-code">{{ base.code }}</span>
                    </div>
                  </div>
                  <div class="card-actions">
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleToggleFavorite(base.id)"
                      :class="{ 'is-favorite': favoriteBaseIds.has(base.id) }"
                    >
                      <el-icon>
                        <component :is="favoriteBaseIds.has(base.id) ? 'StarFilled' : 'Star'" />
                      </el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleCopyBase(base)"
                    >
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleEditBase(base)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleViewLocation(base)"
                    >
                      <el-icon><Location /></el-icon>
                    </el-button>
                    <el-button
                      type="text"
                      size="small"
                      @click.stop="handleDeleteBase(base)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              
              <div class="base-content">
                <div class="base-detail">
                  <p><el-icon><Location /></el-icon> {{ base.address }}</p>
                  <p><el-icon><User /></el-icon> {{ base.managerName || '未分配' }}</p>
                  <p><el-icon><Crop /></el-icon> {{ base.area }} 亩</p>
                </div>
                
                <div class="base-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ getBaseStats(base.id)?.barnCount || 0 }}</span>
                    <span class="stat-label">牛棚数量</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">{{ getBaseStats(base.id)?.cattleCount || 0 }}</span>
                    <span class="stat-label">牛只数量</span>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

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
        </el-col>

        <el-col :span="8">
          <!-- 右侧详情面板 -->
          <div class="detail-panel">
            <el-tabs v-model="activeTab" v-if="selectedBase">
              <!-- 基地详情 -->
              <el-tab-pane label="基地详情" name="detail">
                <div class="detail-content">
                  <div class="detail-item">
                    <label>基地名称：</label>
                    <span>{{ selectedBase.name }}</span>
                  </div>
                  <div class="detail-item">
                    <label>基地编码：</label>
                    <span>{{ selectedBase.code }}</span>
                  </div>
                  <div class="detail-item">
                    <label>详细地址：</label>
                    <span>{{ selectedBase.address }}</span>
                  </div>
                  <div class="detail-item">
                    <label>占地面积：</label>
                    <span>{{ selectedBase.area }} 亩</span>
                  </div>
                  <div class="detail-item">
                    <label>负责人：</label>
                    <span>{{ selectedBase.managerName || '未分配' }}</span>
                  </div>
                  <div class="detail-item">
                    <label>创建时间：</label>
                    <span>{{ formatDate(selectedBase.createdAt) }}</span>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 牛棚管理 -->
              <el-tab-pane label="牛棚管理" name="barns">
                <div class="barns-section">
                  <BarnVisualization
                    :barns="currentBarns"
                    @add-barn="handleAddBarn"
                    @edit-barn="handleEditBarn"
                    @delete-barn="handleDeleteBarn"
                    @select-barn="handleSelectBarn"
                  />
                </div>
              </el-tab-pane>

              <!-- 地图定位 -->
              <el-tab-pane label="地图定位" name="map">
                <div class="map-section">
                  <div id="base-map" class="map-container"></div>
                  <div class="map-info">
                    <p><strong>经纬度：</strong>{{ selectedBase.latitude }}, {{ selectedBase.longitude }}</p>
                    <p><strong>地址：</strong>{{ selectedBase.address }}</p>
                    <el-button type="primary" size="small" @click="handleUpdateLocation">
                      更新位置
                    </el-button>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>

            <div v-else class="empty-panel">
              <el-empty description="请选择一个基地查看详情" />
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 基地表单对话框 -->
    <el-dialog
      v-model="baseDialogVisible"
      :title="baseDialogTitle"
      width="600px"
      @close="handleCloseBaseDialog"
    >
      <el-form
        ref="baseFormRef"
        :model="baseForm"
        :rules="baseFormRules"
        label-width="100px"
      >
        <el-form-item label="基地名称" prop="name">
          <el-input v-model="baseForm.name" placeholder="请输入基地名称" />
        </el-form-item>
        <el-form-item label="基地编码" prop="code">
          <el-input v-model="baseForm.code" placeholder="请输入基地编码" />
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input
            v-model="baseForm.address"
            type="textarea"
            :rows="3"
            placeholder="请输入详细地址"
          />
        </el-form-item>
        <el-form-item label="占地面积">
          <el-input-number
            v-model="baseForm.area"
            :min="0"
            :precision="2"
            placeholder="请输入占地面积"
          />
          <span style="margin-left: 8px;">亩</span>
        </el-form-item>
        <el-form-item label="负责人">
          <el-select v-model="baseForm.managerId" placeholder="请选择负责人" clearable>
            <el-option
              v-for="manager in managers"
              :key="manager.id"
              :label="manager.name"
              :value="manager.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="地理位置">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input-number
                v-model="baseForm.latitude"
                :precision="6"
                placeholder="纬度"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-input-number
                v-model="baseForm.longitude"
                :precision="6"
                placeholder="经度"
                style="width: 100%"
              />
            </el-col>
          </el-row>
          <el-button type="text" @click="handleSelectLocation">
            <el-icon><Location /></el-icon>
            地图选择
          </el-button>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="baseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBase">确定</el-button>
      </template>
    </el-dialog>

    <!-- 牛棚表单对话框 -->
    <el-dialog
      v-model="barnDialogVisible"
      :title="barnDialogTitle"
      width="500px"
      @close="handleCloseBarnDialog"
    >
      <el-form
        ref="barnFormRef"
        :model="barnForm"
        :rules="barnFormRules"
        label-width="100px"
      >
        <el-form-item label="牛棚名称" prop="name">
          <el-input v-model="barnForm.name" placeholder="请输入牛棚名称" />
        </el-form-item>
        <el-form-item label="牛棚编码" prop="code">
          <el-input v-model="barnForm.code" placeholder="请输入牛棚编码" />
        </el-form-item>
        <el-form-item label="容纳数量" prop="capacity">
          <el-input-number
            v-model="barnForm.capacity"
            :min="1"
            placeholder="请输入容纳数量"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="牛棚类型">
          <el-select v-model="barnForm.barnType" placeholder="请选择牛棚类型">
            <el-option label="育肥棚" value="fattening" />
            <el-option label="繁殖棚" value="breeding" />
            <el-option label="隔离棚" value="isolation" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="barnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveBarn">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="数据导入" width="500px">
      <div class="import-section">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <p>1. 请下载模板文件，按照模板格式填写数据</p>
          <p>2. 支持 Excel (.xlsx) 和 CSV (.csv) 格式</p>
          <p>3. 导入前请确保数据格式正确</p>
        </el-alert>
        
        <div class="template-download">
          <el-button @click="handleDownloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
        </div>
        
        <el-upload
          ref="uploadRef"
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.csv"
          @change="handleFileChange"
        >
          <el-button type="primary">
            <el-icon><Upload /></el-icon>
            选择文件
          </el-button>
        </el-upload>
        
        <div v-if="importFile" class="file-info">
          <p>已选择文件：{{ importFile.name }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmImport" :disabled="!importFile">
          开始导入
        </el-button>
      </template>
    </el-dialog>

    <!-- 地图选择对话框 -->
    <el-dialog v-model="mapDialogVisible" title="选择位置" width="800px">
      <div id="location-map" class="location-map"></div>
      <template #footer>
        <el-button @click="mapDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmLocation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import {
  Plus,
  Edit,
  Delete,
  Location,
  User,
  Crop,
  Upload,
  Download,
  ArrowUp,
  ArrowDown,
  Star,
  StarFilled,
  CopyDocument
} from '@element-plus/icons-vue'
import { useBaseStore } from '@/stores/base'
import { baseApi } from '@/api/base'
import type { Base, Barn } from '@/api/base'
import BarnVisualization from '@/components/BarnVisualization.vue'
import dayjs from 'dayjs'

// Store
const baseStore = useBaseStore()

// 响应式数据
const bases = ref<Base[]>([])
const selectedBase = ref<Base | null>(null)
const currentBarns = ref<Barn[]>([])
const managers = ref<any[]>([])
const baseStats = ref<Record<number, any>>({})
const activeTab = ref('detail')

// 批量操作相关
const selectedBases = ref<Base[]>([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  managerId: undefined as number | undefined
})

// 高级搜索相关
const advancedSearchVisible = ref(false)
const advancedSearchForm = reactive({
  name: '',
  code: '',
  address: '',
  managerId: undefined as number | undefined,
  areaMin: undefined as number | undefined,
  areaMax: undefined as number | undefined,
  createdAtStart: '',
  createdAtEnd: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 基地表单
const baseDialogVisible = ref(false)
const baseDialogTitle = ref('')
const baseForm = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  address: '',
  area: undefined as number | undefined,
  managerId: undefined as number | undefined,
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined
})

const baseFormRef = ref<FormInstance>()
const baseFormRules: FormRules = {
  name: [
    { required: true, message: '请输入基地名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入基地编码', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
  ]
}

// 牛棚表单
const barnDialogVisible = ref(false)
const barnDialogTitle = ref('')
const barnForm = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  baseId: undefined as number | undefined,
  capacity: undefined as number | undefined,
  barnType: ''
})

const barnFormRef = ref<FormInstance>()
const barnFormRules: FormRules = {
  name: [
    { required: true, message: '请输入牛棚名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入牛棚编码', trigger: 'blur' }
  ],
  capacity: [
    { required: true, message: '请输入容纳数量', trigger: 'blur' }
  ]
}

// 导入相关
const importDialogVisible = ref(false)
const importFile = ref<File | null>(null)
const uploadRef = ref()

// 地图相关
const mapDialogVisible = ref(false)
const selectedLocation = ref<{ latitude: number; longitude: number } | null>(null)

// 基地收藏功能
const favoriteBaseIds = ref<Set<number>>(new Set())

// 基地排序功能
const sortField = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 计算属性
const isEditMode = computed(() => !!baseForm.id)

// 方法
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getBaseStats = (baseId: number) => {
  return baseStats.value[baseId]
}

// 处理基地选择
const handleBaseSelection = (base: Base, checked: boolean) => {
  if (checked) {
    if (!selectedBases.value.some(b => b.id === base.id)) {
      selectedBases.value.push(base)
    }
  } else {
    const index = selectedBases.value.findIndex(b => b.id === base.id)
    if (index > -1) {
      selectedBases.value.splice(index, 1)
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedBases.value.length === 0) {
    ElMessage.warning('请选择要删除的基地')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedBases.value.length} 个基地吗？此操作不可恢复。`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const deletePromises = selectedBases.value.map(base => baseApi.deleteBase(base.id))
    await Promise.all(deletePromises)
    
    ElMessage.success(`成功删除 ${selectedBases.value.length} 个基地`)
    selectedBases.value = []
    fetchBases()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
      console.error(error)
    }
  }
}

// 高级搜索
const handleAdvancedSearch = () => {
  const params = { ...advancedSearchForm } as any
  
  // 过滤空值
  Object.keys(params).forEach(key => {
    if (params[key] === '' || params[key] === undefined) {
      delete params[key]
    }
  })

  pagination.page = 1
  fetchBasesWithAdvancedSearch(params)
}

// 使用高级搜索参数获取基地列表
const fetchBasesWithAdvancedSearch = async (params: any = {}) => {
  try {
    const response = await baseApi.getBases({
      page: pagination.page,
      limit: pagination.limit,
      ...params
    })
    
    // 根据API实现，response.data 应该是 { bases: [...], pagination: {...} }
    bases.value = response.data.bases || []
    pagination.total = response.data.pagination?.total || 0
    
    // 获取统计信息
    for (const base of bases.value) {
      try {
        const stats = await baseApi.getBaseStatistics(base.id)
        baseStats.value[base.id] = stats.data
      } catch (error) {
        console.warn(`获取基地 ${base.id} 统计信息失败:`, error)
        baseStats.value[base.id] = { barnCount: 0, cattleCount: 0 }
      }
    }
  } catch (error) {
    ElMessage.error('搜索失败')
    console.error(error)
  }
}

// 重置高级搜索
const handleResetAdvancedSearch = () => {
  Object.assign(advancedSearchForm, {
    name: '',
    code: '',
    address: '',
    managerId: undefined,
    areaMin: undefined,
    areaMax: undefined,
    createdAtStart: '',
    createdAtEnd: ''
  })
  advancedSearchVisible.value = false
  fetchBases()
}

// 基地复制功能
const handleCopyBase = async (base: Base) => {
  try {
    const copyData = {
      name: `${base.name}_副本`,
      code: `${base.code}_COPY_${Date.now()}`,
      address: base.address,
      area: base.area,
      managerId: base.managerId,
      latitude: base.latitude,
      longitude: base.longitude
    }

    await baseApi.createBase(copyData)
    ElMessage.success('基地复制成功')
    fetchBases()
  } catch (error) {
    ElMessage.error('基地复制失败')
    console.error(error)
  }
}

// 切换收藏状态
const handleToggleFavorite = (baseId: number) => {
  if (favoriteBaseIds.value.has(baseId)) {
    favoriteBaseIds.value.delete(baseId)
    ElMessage.success('已取消收藏')
  } else {
    favoriteBaseIds.value.add(baseId)
    ElMessage.success('已添加收藏')
  }
  
  // 保存到本地存储
  localStorage.setItem('favoriteBaseIds', JSON.stringify([...favoriteBaseIds.value]))
}

// 加载收藏列表
const loadFavorites = () => {
  try {
    const saved = localStorage.getItem('favoriteBaseIds')
    if (saved) {
      const ids = JSON.parse(saved)
      favoriteBaseIds.value = new Set(ids)
    }
  } catch (error) {
    console.error('加载收藏列表失败:', error)
  }
}

// 排序处理
const handleSort = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'asc'
  }
  
  sortBases()
}

// 排序基地列表
const sortBases = () => {
  if (!sortField.value) return
  
  bases.value.sort((a, b) => {
    let aValue = (a as any)[sortField.value]
    let bValue = (b as any)[sortField.value]
    
    // 处理不同类型的排序
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (sortOrder.value === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases({
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
      managerId: searchForm.managerId
    })
    
    // 根据API实现，response.data 应该是 { bases: [...], pagination: {...} }
    bases.value = response.data.bases || []
    pagination.total = response.data.pagination?.total || 0
    
    // 获取每个基地的统计信息
    for (const base of bases.value) {
      try {
        const stats = await baseApi.getBaseStatistics(base.id)
        baseStats.value[base.id] = stats.data
      } catch (error) {
        console.warn(`获取基地 ${base.id} 统计信息失败:`, error)
        baseStats.value[base.id] = { barnCount: 0, cattleCount: 0 }
      }
    }
  } catch (error) {
    ElMessage.error('获取基地列表失败')
    console.error(error)
  }
}

// 获取负责人列表
const fetchManagers = async () => {
  try {
    // 这里应该调用用户API获取负责人列表
    // 暂时使用模拟数据
    managers.value = [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
      { id: 3, name: '王五' }
    ]
  } catch (error) {
    console.error('获取负责人列表失败:', error)
  }
}

// 获取牛棚列表
const fetchBarns = async (baseId: number) => {
  try {
    const response = await baseApi.getBarnsByBaseId(baseId)
    currentBarns.value = response.data
  } catch (error) {
    ElMessage.error('获取牛棚列表失败')
    console.error(error)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchBases()
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.managerId = undefined
  pagination.page = 1
  fetchBases()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchBases()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchBases()
}

// 选择基地
const handleSelectBase = (base: Base) => {
  selectedBase.value = base
  activeTab.value = 'detail'
  fetchBarns(base.id)
}

// 新增基地
const handleAddBase = () => {
  baseDialogTitle.value = '新增基地'
  resetBaseForm()
  baseDialogVisible.value = true
}

// 编辑基地
const handleEditBase = (base: Base) => {
  baseDialogTitle.value = '编辑基地'
  Object.assign(baseForm, {
    id: base.id,
    name: base.name,
    code: base.code,
    address: base.address,
    area: base.area,
    managerId: base.managerId,
    latitude: base.latitude,
    longitude: base.longitude
  })
  baseDialogVisible.value = true
}

// 删除基地
const handleDeleteBase = async (base: Base) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除基地"${base.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await baseApi.deleteBase(base.id)
    ElMessage.success('删除成功')
    
    if (selectedBase.value?.id === base.id) {
      selectedBase.value = null
    }
    
    fetchBases()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 查看位置
const handleViewLocation = (base: Base) => {
  selectedBase.value = base
  activeTab.value = 'map'
  nextTick(() => {
    initBaseMap()
  })
}

// 保存基地
const handleSaveBase = async () => {
  if (!baseFormRef.value) return
  
  try {
    await baseFormRef.value.validate()
    
    const data = {
      name: baseForm.name,
      code: baseForm.code,
      address: baseForm.address,
      area: baseForm.area,
      managerId: baseForm.managerId,
      latitude: baseForm.latitude,
      longitude: baseForm.longitude
    }
    
    if (isEditMode.value) {
      await baseApi.updateBase(baseForm.id!, data)
      ElMessage.success('更新成功')
    } else {
      await baseApi.createBase(data)
      ElMessage.success('创建成功')
    }
    
    baseDialogVisible.value = false
    fetchBases()
  } catch (error) {
    ElMessage.error(isEditMode.value ? '更新失败' : '创建失败')
    console.error(error)
  }
}

// 关闭基地对话框
const handleCloseBaseDialog = () => {
  resetBaseForm()
  baseFormRef.value?.clearValidate()
}

// 重置基地表单
const resetBaseForm = () => {
  Object.assign(baseForm, {
    id: undefined,
    name: '',
    code: '',
    address: '',
    area: undefined,
    managerId: undefined,
    latitude: undefined,
    longitude: undefined
  })
}

// 新增牛棚
const handleAddBarn = () => {
  if (!selectedBase.value) return
  
  barnDialogTitle.value = '新增牛棚'
  resetBarnForm()
  barnForm.baseId = selectedBase.value.id
  barnDialogVisible.value = true
}

// 编辑牛棚
const handleEditBarn = (barn: Barn) => {
  barnDialogTitle.value = '编辑牛棚'
  Object.assign(barnForm, {
    id: barn.id,
    name: barn.name,
    code: barn.code,
    baseId: barn.baseId,
    capacity: barn.capacity,
    barnType: barn.barnType
  })
  barnDialogVisible.value = true
}

// 删除牛棚
const handleDeleteBarn = async (barn: Barn) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除牛棚"${barn.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await baseApi.deleteBarn(barn.id)
    ElMessage.success('删除成功')
    
    if (selectedBase.value) {
      fetchBarns(selectedBase.value.id)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 保存牛棚
const handleSaveBarn = async () => {
  if (!barnFormRef.value) return
  
  try {
    await barnFormRef.value.validate()
    
    const data = {
      name: barnForm.name,
      code: barnForm.code,
      baseId: barnForm.baseId!,
      capacity: barnForm.capacity!,
      barnType: barnForm.barnType
    }
    
    if (barnForm.id) {
      await baseApi.updateBarn(barnForm.id, data)
      ElMessage.success('更新成功')
    } else {
      await baseApi.createBarn(data)
      ElMessage.success('创建成功')
    }
    
    barnDialogVisible.value = false
    
    if (selectedBase.value) {
      fetchBarns(selectedBase.value.id)
    }
  } catch (error) {
    ElMessage.error(barnForm.id ? '更新失败' : '创建失败')
    console.error(error)
  }
}

// 关闭牛棚对话框
const handleCloseBarnDialog = () => {
  resetBarnForm()
  barnFormRef.value?.clearValidate()
}

// 重置牛棚表单
const resetBarnForm = () => {
  Object.assign(barnForm, {
    id: undefined,
    name: '',
    code: '',
    baseId: undefined,
    capacity: undefined,
    barnType: ''
  })
}

// 选择牛棚
const handleSelectBarn = (barn: Barn) => {
  console.log('选择牛棚:', barn)
}

// 导入数据
const handleImport = () => {
  importDialogVisible.value = true
}

// 导出数据
const handleExport = async () => {
  try {
    const exportData = await baseApi.getBases({
      keyword: searchForm.keyword,
      managerId: searchForm.managerId,
      limit: 1000
    })
    
    // 准备导出数据
    const csvData = [
      ['基地名称', '基地编码', '详细地址', '占地面积(亩)', '负责人', '纬度', '经度', '创建时间'],
      ...exportData.data.data.map(base => [
        base.name,
        base.code,
        base.address,
        base.area || '',
        base.managerName || '',
        base.latitude || '',
        base.longitude || '',
        formatDate(base.createdAt)
      ])
    ]
    
    // 创建CSV内容
    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
    
    // 创建并下载文件
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `基地数据_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`
    link.click()
    
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
    console.error(error)
  }
}

// 下载模板
const handleDownloadTemplate = () => {
  // 创建模板数据
  const templateData = [
    ['基地名称', '基地编码', '详细地址', '占地面积(亩)', '纬度', '经度'],
    ['示例基地', 'BASE001', '示例地址', '100', '39.9042', '116.4074']
  ]
  
  // 创建CSV内容
  const csvContent = templateData.map(row => row.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // 下载文件
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = '基地数据导入模板.csv'
  link.click()
}

// 文件选择
const handleFileChange = (file: UploadFile) => {
  importFile.value = file.raw || null
}

// 确认导入
const handleConfirmImport = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  try {
    const fileContent = await readFileContent(importFile.value)
    const data = parseCSVContent(fileContent)
    
    // 验证数据
    const validation = validateImportData(data)
    if (!validation.valid) {
      ElMessage.error(validation.message)
      return
    }
    
    // 批量创建基地
    let successCount = 0
    let errorCount = 0
    
    for (const row of data) {
      try {
        await baseApi.createBase({
          name: row.name,
          code: row.code,
          address: row.address,
          area: row.area ? parseFloat(row.area) : undefined,
          latitude: row.latitude ? parseFloat(row.latitude) : undefined,
          longitude: row.longitude ? parseFloat(row.longitude) : undefined
        })
        successCount++
      } catch (error) {
        errorCount++
        console.error(`创建基地 ${row.name} 失败:`, error)
      }
    }
    
    if (errorCount === 0) {
      ElMessage.success(`成功导入 ${successCount} 条记录`)
    } else {
      ElMessage.warning(`导入完成：成功 ${successCount} 条，失败 ${errorCount} 条`)
    }
    
    importDialogVisible.value = false
    importFile.value = null
    fetchBases()
  } catch (error) {
    ElMessage.error('数据导入失败')
    console.error(error)
  }
}

// 读取文件内容
const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}

// 解析CSV内容
const parseCSVContent = (content: string) => {
  const lines = content.split('\n').filter(line => line.trim())
  const data = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length >= 3) {
      data.push({
        name: values[0]?.trim(),
        code: values[1]?.trim(),
        address: values[2]?.trim(),
        area: values[3]?.trim(),
        latitude: values[4]?.trim(),
        longitude: values[5]?.trim()
      })
    }
  }
  
  return data
}

// 解析CSV行
const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

// 验证导入数据
const validateImportData = (data: any[]): { valid: boolean; message?: string } => {
  if (data.length === 0) {
    return { valid: false, message: '没有有效的数据行' }
  }
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row.name) {
      return { valid: false, message: `第${i + 2}行：基地名称不能为空` }
    }
    if (!row.code) {
      return { valid: false, message: `第${i + 2}行：基地编码不能为空` }
    }
    if (!row.address) {
      return { valid: false, message: `第${i + 2}行：详细地址不能为空` }
    }
  }
  
  return { valid: true }
}

// 更新位置
const handleUpdateLocation = () => {
  if (!selectedBase.value) return
  
  baseForm.latitude = selectedBase.value.latitude
  baseForm.longitude = selectedBase.value.longitude
  
  mapDialogVisible.value = true
  nextTick(() => {
    initLocationMap()
  })
}

// 选择位置
const handleSelectLocation = () => {
  mapDialogVisible.value = true
  nextTick(() => {
    initLocationMap()
  })
}

// 确认位置
const handleConfirmLocation = () => {
  if (selectedLocation.value) {
    baseForm.latitude = selectedLocation.value.latitude
    baseForm.longitude = selectedLocation.value.longitude
  }
  mapDialogVisible.value = false
}

// 初始化基地地图
const initBaseMap = () => {
  if (!selectedBase.value || !selectedBase.value.latitude || !selectedBase.value.longitude) {
    const mapContainer = document.getElementById('base-map')
    if (mapContainer) {
      mapContainer.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 300px; background: #f5f5f5; border: 1px dashed #ddd; border-radius: 4px;">
          <div style="text-align: center; color: #909399;">
            <p style="margin: 0 0 8px 0; font-size: 14px;">暂无位置信息</p>
            <p style="margin: 0; font-size: 12px;">请在编辑基地时设置经纬度</p>
          </div>
        </div>
      `
    }
    return
  }
  
  const mapContainer = document.getElementById('base-map')
  if (mapContainer) {
    const { latitude, longitude } = selectedBase.value
    mapContainer.innerHTML = `
      <div style="height: 300px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px; position: relative; overflow: hidden;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: white;">
          <div style="width: 20px; height: 20px; background: #ff4757; border-radius: 50%; margin: 0 auto 12px; box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.3); animation: pulse 2s infinite;"></div>
          <div style="background: rgba(0,0,0,0.7); padding: 8px 12px; border-radius: 4px; font-size: 12px;">
            <div>纬度: ${latitude.toFixed(6)}</div>
            <div>经度: ${longitude.toFixed(6)}</div>
          </div>
        </div>
        <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
          ${selectedBase.value.name}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
        }
      </style>
    `
  }
}

// 初始化位置选择地图
const initLocationMap = () => {
  const mapContainer = document.getElementById('location-map')
  if (mapContainer) {
    const defaultLat = baseForm.latitude || 39.9042
    const defaultLng = baseForm.longitude || 116.4074
    
    mapContainer.innerHTML = `
      <div style="height: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 4px; position: relative; overflow: hidden; cursor: crosshair;" id="interactive-map">
        <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px;">
          点击地图选择位置
        </div>
        <div id="map-marker" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: #ff4757; border-radius: 50%; box-shadow: 0 0 0 4px rgba(255, 71, 87, 0.3); animation: pulse 2s infinite;"></div>
        <div id="coordinates-display" style="position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; font-size: 12px;">
          纬度: ${defaultLat.toFixed(6)}, 经度: ${defaultLng.toFixed(6)}
        </div>
      </div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 71, 87, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 71, 87, 0); }
        }
      </style>
    `
    
    const interactiveMap = document.getElementById('interactive-map')
    if (interactiveMap) {
      interactiveMap.addEventListener('click', (e) => {
        const rect = interactiveMap.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        const lat = 39.9042 + (200 - y) * 0.0001
        const lng = 116.4074 + (x - 200) * 0.0001
        
        const marker = document.getElementById('map-marker')
        if (marker) {
          marker.style.left = x + 'px'
          marker.style.top = y + 'px'
        }
        
        const coordsDisplay = document.getElementById('coordinates-display')
        if (coordsDisplay) {
          coordsDisplay.textContent = `纬度: ${lat.toFixed(6)}, 经度: ${lng.toFixed(6)}`
        }
        
        selectedLocation.value = { latitude: lat, longitude: lng }
      })
    }
  }
}

// 生命周期
onMounted(() => {
  fetchBases()
  fetchManagers()
  loadFavorites()
})
</script>

<style scoped lang="scss">
.bases-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .header-left {
    h2 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    p {
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

.search-section {
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .toolbar {
    margin-top: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .toolbar-left {
      display: flex;
      gap: 12px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
}

.content-section {
  .bases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 20px;

    .base-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.active {
        border-color: #409eff;
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }

      &.selected {
        border-color: #67c23a;
        box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
      }

      &.favorite {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-top: 20px solid #f56c6c;
          z-index: 1;
        }
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;

          .base-info {
            h3 {
              margin: 0 0 4px 0;
              color: #303133;
              font-size: 18px;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 8px;

              .favorite-icon {
                color: #f56c6c;
                font-size: 16px;
              }
            }

            .base-code {
              color: #909399;
              font-size: 12px;
              background: #f0f0f0;
              padding: 2px 8px;
              border-radius: 4px;
            }
          }
        }

        .card-actions {
          display: flex;
          gap: 4px;

          .is-favorite {
            color: #f56c6c;
          }
        }
      }

      .base-content {
        .base-detail {
          margin-bottom: 16px;

          p {
            margin: 8px 0;
            color: #606266;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;

            .el-icon {
              color: #909399;
            }
          }
        }

        .base-stats {
          display: flex;
          justify-content: space-around;
          padding-top: 16px;
          border-top: 1px solid #ebeef5;

          .stat-item {
            text-align: center;

            .stat-value {
              display: block;
              font-size: 24px;
              font-weight: 600;
              color: #409eff;
              margin-bottom: 4px;
            }

            .stat-label {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .detail-panel {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    min-height: 600px;

    .detail-content {
      padding: 20px;

      .detail-item {
        display: flex;
        margin-bottom: 16px;
        align-items: flex-start;

        label {
          min-width: 100px;
          color: #606266;
          font-weight: 500;
        }

        span {
          color: #303133;
          flex: 1;
          word-break: break-all;
        }
      }
    }

    .barns-section {
      padding: 20px;
    }

    .map-section {
      padding: 20px;

      .map-container {
        margin-bottom: 16px;
        height: 300px;
      }

      .map-info {
        p {
          margin: 8px 0;
          color: #606266;
          font-size: 14px;
        }
      }
    }

    .empty-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
    }
  }
}

.import-section {
  .template-download {
    margin-bottom: 16px;
  }

  .file-info {
    margin-top: 16px;
    padding: 12px;
    background: #f0f9ff;
    border: 1px solid #b3d8ff;
    border-radius: 4px;

    p {
      margin: 0;
      color: #409eff;
      font-size: 14px;
    }
  }
}

.location-map {
  height: 400px;
  border-radius: 4px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .bases-container {
    padding: 10px;
  }

  .content-section {
    .bases-grid {
      grid-template-columns: 1fr;
    }
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;

    .header-right {
      justify-content: center;
    }
  }
}
</style>