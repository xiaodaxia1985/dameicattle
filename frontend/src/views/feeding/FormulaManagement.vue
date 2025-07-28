<template>
  <div class="formula-management">
    <div class="page-header">
      <h1>饲料配方管理</h1>
      <p class="page-description">管理饲料配方，包含成分的名称、重量、成本、能量和所占比重信息</p>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="search-section">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索配方名称或描述"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
      
      <div class="action-buttons">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建配方
        </el-button>
      </div>
    </div>

    <!-- 配方列表 -->
    <div class="formula-list">
      <el-table
        :data="formulas"
        v-loading="loading"
        border
        stripe
        @row-click="handleRowClick"
      >
        <el-table-column prop="name" label="配方名称" width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewFormula(row)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="成分数量" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ row.ingredients?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="总能量" width="120" align="center">
          <template #default="{ row }">
            <span class="energy-value">{{ calculateTotalEnergy(row.ingredients) }} MJ/kg</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="costPerKg" label="成本/kg" width="120" align="center">
          <template #default="{ row }">
            <span class="cost-value">¥{{ (row.costPerKg || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdByName" label="创建人" width="120" />
        
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewFormula(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editFormula(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteFormula(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建/编辑配方对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="80%"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <el-form
        ref="formulaFormRef"
        :model="formulaForm"
        :rules="formulaRules"
        label-width="100px"
      >
        <el-form-item label="配方名称" prop="name">
          <el-input
            v-model="formulaForm.name"
            placeholder="请输入配方名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="配方描述" prop="description">
          <el-input
            v-model="formulaForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入配方描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="配方成分" prop="ingredients">
          <IngredientEditor
            v-model="formulaForm.ingredients"
            @save="handleIngredientsSave"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSaveFormula" :loading="saving">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看配方详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="配方详情"
      width="70%"
    >
      <div v-if="selectedFormula" class="formula-detail">
        <div class="basic-info">
          <h3>基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="配方名称">{{ selectedFormula.name }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ selectedFormula.createdByName }}</el-descriptions-item>
            <el-descriptions-item label="成本/kg">¥{{ (selectedFormula.costPerKg || 0).toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(selectedFormula.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="配方描述" :span="2">
              {{ selectedFormula.description || '暂无描述' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="ingredients-info">
          <IngredientTable
            :ingredients="selectedFormula.ingredients || []"
            :show-summary="true"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { feedingApi } from '@/api/feeding'
import type { FeedFormula, IngredientItem } from '@/api/feeding'
import IngredientEditor from '@/components/feeding/IngredientEditor.vue'
import IngredientTable from '@/components/feeding/IngredientTable.vue'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const formulas = ref<FeedFormula[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')

// 对话框相关
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const selectedFormula = ref<FeedFormula | null>(null)

// 表单数据
const formulaForm = reactive({
  name: '',
  description: '',
  ingredients: [] as IngredientItem[]
})

// 表单验证规则
const formulaRules = {
  name: [
    { required: true, message: '请输入配方名称', trigger: 'blur' },
    { min: 1, max: 100, message: '配方名称长度在1到100个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ],
  ingredients: [
    { required: true, message: '请添加配方成分', trigger: 'change' },
    { 
      validator: (rule: any, value: IngredientItem[], callback: Function) => {
        if (!value || value.length === 0) {
          callback(new Error('至少需要添加一种成分'))
          return
        }
        
        const totalRatio = value.reduce((sum, item) => sum + (item.ratio || 0), 0)
        if (Math.abs(totalRatio - 100) > 0.01) {
          callback(new Error(`成分比重总和必须等于100%，当前为${totalRatio.toFixed(1)}%`))
          return
        }
        
        callback()
      }, 
      trigger: 'change' 
    }
  ]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑配方' : '新建配方')

// 生命周期
onMounted(() => {
  fetchFormulas()
})

// 方法
const fetchFormulas = async () => {
  loading.value = true
  try {
    const response = await feedingApi.getFormulas({
      page: currentPage.value,
      limit: pageSize.value,
      keyword: searchKeyword.value
    })
    
    formulas.value = response.data.data
    total.value = response.data.total
  } catch (error) {
    ElMessage.error('获取配方列表失败')
    console.error('Error fetching formulas:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchFormulas()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchFormulas()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  fetchFormulas()
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editFormula = (formula: FeedFormula) => {
  isEdit.value = true
  selectedFormula.value = formula
  
  // 填充表单数据
  formulaForm.name = formula.name
  formulaForm.description = formula.description || ''
  formulaForm.ingredients = JSON.parse(JSON.stringify(formula.ingredients || []))
  
  dialogVisible.value = true
}

const viewFormula = (formula: FeedFormula) => {
  selectedFormula.value = formula
  viewDialogVisible.value = true
}

const deleteFormula = async (formula: FeedFormula) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配方"${formula.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await feedingApi.deleteFormula(formula.id)
    ElMessage.success('配方删除成功')
    fetchFormulas()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除配方失败')
      console.error('Error deleting formula:', error)
    }
  }
}

const handleSaveFormula = async () => {
  // 表单验证
  const formulaFormRef = ref()
  if (!formulaFormRef.value) return
  
  try {
    await formulaFormRef.value.validate()
  } catch (error) {
    return
  }
  
  saving.value = true
  try {
    const formData = {
      name: formulaForm.name,
      description: formulaForm.description,
      ingredients: formulaForm.ingredients
    }
    
    if (isEdit.value && selectedFormula.value) {
      await feedingApi.updateFormula(selectedFormula.value.id, formData)
      ElMessage.success('配方更新成功')
    } else {
      await feedingApi.createFormula(formData)
      ElMessage.success('配方创建成功')
    }
    
    dialogVisible.value = false
    fetchFormulas()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新配方失败' : '创建配方失败')
    console.error('Error saving formula:', error)
  } finally {
    saving.value = false
  }
}

const handleDialogClose = () => {
  resetForm()
}

const resetForm = () => {
  formulaForm.name = ''
  formulaForm.description = ''
  formulaForm.ingredients = []
  selectedFormula.value = null
}

const handleIngredientsSave = (ingredients: IngredientItem[]) => {
  formulaForm.ingredients = ingredients
}

const handleRowClick = (row: FeedFormula) => {
  viewFormula(row)
}

// 工具函数
const calculateTotalEnergy = (ingredients: IngredientItem[] = []) => {
  const totalEnergy = ingredients.reduce((sum, item) => {
    return sum + ((item.energy || 0) * (item.ratio || 0) / 100)
  }, 0)
  return totalEnergy.toFixed(1)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.formula-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.page-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.formula-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.energy-value {
  font-weight: 600;
  color: #67C23A;
}

.cost-value {
  font-weight: 600;
  color: #E6A23C;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.formula-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.basic-info {
  margin-bottom: 24px;
}

.basic-info h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.ingredients-info {
  margin-top: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .search-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-section .el-input {
    width: 100% !important;
  }
}
</style>