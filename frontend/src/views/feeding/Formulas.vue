<template>
  <div class="formulas-page">
    <div class="page-header">
      <h1>饲料配方管理</h1>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索配方名称"
          style="width: 200px"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新建配方
        </el-button>
      </div>
    </div>

    <!-- 配方列表 -->
    <el-card>
      <el-table :data="validFormulas" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="配方名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="成分" min-width="300">
          <template #default="{ row }">
            <div class="ingredients-list">
              <el-tag
                v-for="(ingredient, index) in ensureArray(safeGet(row, 'ingredients', [])).slice(0, 3)"
                :key="index"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ safeGet(ingredient, 'name', '') }} {{ safeGet(ingredient, 'ratio', 0) }}%
              </el-tag>
              <el-tag v-if="ensureArray(safeGet(row, 'ingredients', [])).length > 3" size="small" type="info">
                +{{ ensureArray(safeGet(row, 'ingredients', [])).length - 3 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="costPerKg" label="成本(¥/kg)" width="120">
          <template #default="{ row }">
            ¥{{ ensureNumber(safeGet(row, 'costPerKg', safeGet(row, 'cost_per_kg', 0)), 0).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdByName" label="创建人" width="100">
          <template #default="{ row }">
            {{ safeGet(row, 'createdByName', safeGet(row, 'created_by_name', safeGet(row, 'creator.real_name', '-'))) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(safeGet(row, 'createdAt', safeGet(row, 'created_at', ''))) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="viewFormula(row)">查看</el-button>
            <el-button type="text" @click="editFormula(row)">编辑</el-button>
            <el-button type="text" @click="copyFormula(row)">复制</el-button>
            <el-button type="text" style="color: #f56c6c" @click="deleteFormula(row)">删除</el-button>
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

    <!-- 创建/编辑配方对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新建配方' : '编辑配方'"
      width="90%"
      :close-on-click-modal="false"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="配方名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入配方名称" />
        </el-form-item>
        <el-form-item label="配方描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入配方描述"
          />
        </el-form-item>
        <el-form-item label="配方成分" prop="ingredients">
          <IngredientEditor
            v-model="formData.ingredients"
            @save="handleIngredientsSave"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ dialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 配方详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="配方详情" width="80%">
      <div v-if="selectedFormula" class="formula-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="配方名称">{{ selectedFormula.name }}</el-descriptions-item>
            <el-descriptions-item label="成本">¥{{ selectedFormula.costPerKg?.toFixed(2) }}/kg</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ selectedFormula.createdByName }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(selectedFormula.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">{{ selectedFormula.description || '无' }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="detail-section">
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
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import { feedingApi } from '@/api/feeding'
import type { FeedFormula, CreateFormulaRequest, UpdateFormulaRequest, IngredientItem } from '@/api/feeding'
import IngredientEditor from '@/components/feeding/IngredientEditor.vue'
import IngredientTable from '@/components/feeding/IngredientTable.vue'
import { validateData, validateDataArray, ensureArray, ensureNumber } from '@/utils/dataValidation'
import { safeApiCall, withPageErrorHandler, withFormErrorHandler } from '@/utils/errorHandler'
import { safeGet } from '@/utils/safeAccess'

// 响应式数据
const formulas = ref<FeedFormula[]>([])
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const selectedRows = ref<FeedFormula[]>([])

// 计算属性：过滤有效的配方数据
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
const selectedFormula = ref<FeedFormula | null>(null)

// 表单
const formRef = ref()
const formData = ref<CreateFormulaRequest>({
  name: '',
  description: '',
  ingredients: []
})

const formRules = {
  name: [
    { required: true, message: '请输入配方名称', trigger: 'blur' },
    { min: 2, max: 50, message: '配方名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  ingredients: [
    { required: true, message: '请添加配方成分', trigger: 'change' },
    { validator: validateIngredients, trigger: 'change' }
  ]
}

// 计算属性
const totalRatio = computed(() => {
  return formData.value.ingredients.reduce((sum, ingredient) => sum + (ingredient.ratio || 0), 0)
})

const estimatedCost = computed(() => {
  return formData.value.ingredients.reduce((sum, ingredient) => {
    return sum + ((ingredient.ratio || 0) / 100) * (ingredient.cost || 0)
  }, 0)
})

// 验证配方成分
function validateIngredients(rule: any, value: IngredientItem[], callback: any) {
  if (!value || value.length === 0) {
    callback(new Error('请添加至少一个配方成分'))
    return
  }
  
  const total = value.reduce((sum: number, ingredient: IngredientItem) => sum + (ingredient.ratio || 0), 0)
  if (Math.abs(total - 100) > 0.01) {
    callback(new Error(`配方成分比重总和必须等于100%，当前为${total.toFixed(1)}%`))
    return
  }
  
  for (const ingredient of value) {
    if (!ingredient.name || ingredient.name.trim() === '') {
      callback(new Error('请填写所有成分名称'))
      return
    }
    if (!ingredient.weight || ingredient.weight <= 0) {
      callback(new Error('请填写所有成分重量，且必须大于0'))
      return
    }
    if (ingredient.cost < 0) {
      callback(new Error('成分成本不能为负数'))
      return
    }
    if (ingredient.energy < 0) {
      callback(new Error('成分能量不能为负数'))
      return
    }
    if (!ingredient.ratio || ingredient.ratio <= 0) {
      callback(new Error('请填写所有成分比重，且必须大于0'))
      return
    }
  }
  
  callback()
}

// 获取配方列表
const fetchFormulas = withPageErrorHandler(async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: searchKeyword.value || undefined
    }
    
    console.log('🔍 饲料配方API调用参数:', params)
    
    const result = await safeApiCall(
      () => feedingApi.getFormulas(params),
      {
        showMessage: false,
        fallbackValue: { data: { data: [], total: 0 } }
      }
    )
    
    console.log('📥 饲料配方API原始响应:', result)
    
    if (result && result.data) {
      // 尝试多种可能的数据结构
      let formulasData = []
      
      // 检查不同的数据结构
      if (result.data.data) {
        formulasData = ensureArray(result.data.data)
      } else if (result.data.formulas) {
        formulasData = ensureArray(result.data.formulas)
      } else if (Array.isArray(result.data)) {
        formulasData = result.data
      } else {
        formulasData = []
      }
      
      console.log('📋 提取的配方数据:', formulasData)
      
      formulas.value = validateDataArray(formulasData, (formula: any) => {
        if (!formula || typeof formula !== 'object') return null
        
        console.log('🔧 处理单条配方:', formula)
        
        // 标准化数据字段，处理不同的字段名
        const normalizedFormula = {
          id: safeGet(formula, 'id', ''),
          name: safeGet(formula, 'name', ''),
          description: safeGet(formula, 'description', ''),
          ingredients: ensureArray(safeGet(formula, 'ingredients', [])),
          costPerKg: ensureNumber(safeGet(formula, 'costPerKg', safeGet(formula, 'cost_per_kg', 0)), 0),
          createdBy: safeGet(formula, 'createdBy', safeGet(formula, 'created_by', '')),
          createdByName: safeGet(formula, 'createdByName', safeGet(formula, 'created_by_name', safeGet(formula, 'creator.real_name', ''))),
          createdAt: safeGet(formula, 'createdAt', safeGet(formula, 'created_at', '')),
          updatedAt: safeGet(formula, 'updatedAt', safeGet(formula, 'updated_at', ''))
        }
        
        console.log('✅ 标准化后的配方:', normalizedFormula)
        
        // 验证必要字段
        return normalizedFormula.id && normalizedFormula.name ? normalizedFormula : null
      })
      
      // 获取总数
      let total = 0
      if (result.data.total !== undefined) {
        total = ensureNumber(result.data.total, 0)
      } else if (result.data.pagination && result.data.pagination.total !== undefined) {
        total = ensureNumber(result.data.pagination.total, 0)
      } else {
        total = formulas.value.length
      }
      
      pagination.value.total = total
      
      console.log('✅ 饲料配方数据加载完成:', formulas.value.length, '条记录，总数:', pagination.value.total)
    } else {
      console.log('❌ 饲料配方API返回空数据')
      formulas.value = []
      pagination.value.total = 0
    }
  } finally {
    loading.value = false
  }
}, '获取配方列表失败')

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchFormulas()
}

// 分页
const handleSizeChange = () => {
  fetchFormulas()
}

const handleCurrentChange = () => {
  fetchFormulas()
}

// 选择变化
const handleSelectionChange = (selection: FeedFormula[]) => {
  selectedRows.value = selection
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

// 查看配方
const viewFormula = (formula: FeedFormula) => {
  selectedFormula.value = formula
  detailDialogVisible.value = true
}

// 编辑配方
const editFormula = (formula: FeedFormula) => {
  dialogMode.value = 'edit'
  selectedFormula.value = formula
  formData.value = {
    name: formula.name,
    description: formula.description,
    ingredients: [...formula.ingredients]
  }
  dialogVisible.value = true
}

// 复制配方
const copyFormula = (formula: FeedFormula) => {
  dialogMode.value = 'create'
  formData.value = {
    name: formula.name + ' (副本)',
    description: formula.description,
    ingredients: [...formula.ingredients]
  }
  dialogVisible.value = true
}

// 删除配方
const deleteFormula = async (formula: FeedFormula) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配方"${safeGet(formula, 'name', '未知')}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await safeApiCall(
      () => feedingApi.deleteFormula(ensureNumber(formula.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('删除成功')
      fetchFormulas()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除配方失败')
    }
  }
}

// 处理成分保存
const handleIngredientsSave = (ingredients: IngredientItem[]) => {
  formData.value.ingredients = ingredients
}

// 提交表单
const submitForm = withFormErrorHandler(async () => {
  if (!formRef.value) {
    ElMessage.error('表单引用为空')
    return
  }
  
  await formRef.value.validate()
  submitting.value = true
  
  try {
    if (dialogMode.value === 'create') {
      const result = await safeApiCall(
        () => feedingApi.createFormula(formData.value),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      if (result !== null) {
        dialogVisible.value = false
        fetchFormulas()
      }
    } else {
      const result = await safeApiCall(
        () => feedingApi.updateFormula(ensureNumber(selectedFormula.value?.id, 0), formData.value),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      if (result !== null) {
        dialogVisible.value = false
        fetchFormulas()
      }
    }
  } finally {
    submitting.value = false
  }
}, dialogMode.value === 'create' ? '创建成功' : '更新成功', '提交失败')

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    ingredients: [{
      name: '',
      weight: 0,
      cost: 0,
      energy: 0,
      ratio: 0
    }]
  }
  selectedFormula.value = null
  
  // 使用 nextTick 确保 DOM 更新后再清除验证
  nextTick(() => {
    if (formRef.value && typeof formRef.value.clearValidate === 'function') {
      formRef.value.clearValidate()
    }
  })
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载
onMounted(() => {
  fetchFormulas()
})
</script>

<style scoped lang="scss">
.formulas-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .ingredients-list {
    .el-tag {
      margin-right: 4px;
      margin-bottom: 4px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .ingredients-editor {
    width: 100%;

    .ingredients-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-weight: bold;
    }

    .ingredient-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      padding: 8px;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }

    .ingredients-summary {
      margin-top: 12px;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;

      .summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;

        &:last-child {
          margin-bottom: 0;
        }

        .error {
          color: #f56c6c;
        }
      }
    }
  }

  .formula-detail {
    .detail-section {
      margin-bottom: 20px;

      h3 {
        margin-bottom: 12px;
        color: #303133;
      }
    }
  }
}
</style>