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
      <el-table :data="formulas" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="配方名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="成分" min-width="300">
          <template #default="{ row }">
            <div class="ingredients-list">
              <el-tag
                v-for="(ingredient, index) in row.ingredients.slice(0, 3)"
                :key="index"
                size="small"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ ingredient.name }} {{ ingredient.ratio }}%
              </el-tag>
              <el-tag v-if="row.ingredients.length > 3" size="small" type="info">
                +{{ row.ingredients.length - 3 }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="costPerKg" label="成本(¥/kg)" width="120">
          <template #default="{ row }">
            ¥{{ row.costPerKg?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdByName" label="创建人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
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
      width="800px"
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
          <div class="ingredients-editor">
            <div class="ingredients-header">
              <span>成分配比</span>
              <el-button type="text" @click="addIngredient">
                <el-icon><Plus /></el-icon>
                添加成分
              </el-button>
            </div>
            <div class="ingredients-list">
              <div
                v-for="(ingredient, index) in formData.ingredients"
                :key="index"
                class="ingredient-item"
              >
                <el-input
                  v-model="ingredient.name"
                  placeholder="成分名称"
                  style="width: 120px"
                />
                <el-input-number
                  v-model="ingredient.ratio"
                  :min="0"
                  :max="100"
                  :precision="1"
                  style="width: 100px"
                  @change="calculateTotalRatio"
                />
                <span>%</span>
                <el-input
                  v-model="ingredient.unit"
                  placeholder="单位"
                  style="width: 80px"
                />
                <el-input-number
                  v-model="ingredient.cost"
                  :min="0"
                  :precision="2"
                  style="width: 100px"
                  @change="calculateCost"
                />
                <span>¥/kg</span>
                <el-button
                  type="text"
                  style="color: #f56c6c"
                  @click="removeIngredient(index)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="ingredients-summary">
              <div class="summary-item">
                <span>总比例: {{ totalRatio }}%</span>
                <span :class="{ 'error': totalRatio !== 100 }">
                  {{ totalRatio === 100 ? '✓' : '⚠️ 比例总和应为100%' }}
                </span>
              </div>
              <div class="summary-item">
                <span>预估成本: ¥{{ estimatedCost.toFixed(2) }}/kg</span>
              </div>
            </div>
          </div>
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
    <el-dialog v-model="detailDialogVisible" title="配方详情" width="600px">
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
          <h3>配方成分</h3>
          <el-table :data="selectedFormula.ingredients" border>
            <el-table-column prop="name" label="成分名称" />
            <el-table-column prop="ratio" label="比例" width="80">
              <template #default="{ row }">{{ row.ratio }}%</template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="cost" label="成本(¥/kg)" width="100">
              <template #default="{ row }">¥{{ row.cost?.toFixed(2) || '0.00' }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete } from '@element-plus/icons-vue'
import { feedingApi } from '@/api/feeding'
import type { FeedFormula, CreateFormulaRequest, UpdateFormulaRequest } from '@/api/feeding'

// 响应式数据
const formulas = ref<FeedFormula[]>([])
const loading = ref(false)
const submitting = ref(false)
const searchKeyword = ref('')
const selectedRows = ref<FeedFormula[]>([])

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
function validateIngredients(rule: any, value: any, callback: any) {
  if (!value || value.length === 0) {
    callback(new Error('请添加至少一个配方成分'))
    return
  }
  
  const total = value.reduce((sum: number, ingredient: any) => sum + (ingredient.ratio || 0), 0)
  if (Math.abs(total - 100) > 0.1) {
    callback(new Error('配方成分比例总和必须等于100%'))
    return
  }
  
  for (const ingredient of value) {
    if (!ingredient.name || !ingredient.ratio || ingredient.ratio <= 0) {
      callback(new Error('请完善所有成分信息'))
      return
    }
  }
  
  callback()
}

// 获取配方列表
const fetchFormulas = async () => {
  loading.value = true
  try {
    const response = await feedingApi.getFormulas({
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: searchKeyword.value
    })
    // 根据API实现，response.data 应该是 { data: [...], total: number, page: number, limit: number }
    formulas.value = response.data.data || []
    pagination.value.total = response.data.total || 0
  } catch (error) {
    console.error('获取配方列表失败:', error)
    ElMessage.error('获取配方列表失败')
  } finally {
    loading.value = false
  }
}

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
      `确定要删除配方"${formula.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await feedingApi.deleteFormula(formula.id)
    ElMessage.success('删除成功')
    fetchFormulas()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除配方失败:', error)
      ElMessage.error('删除配方失败')
    }
  }
}

// 添加成分
const addIngredient = () => {
  formData.value.ingredients.push({
    name: '',
    ratio: 0,
    unit: '%',
    cost: 0
  })
}

// 移除成分
const removeIngredient = (index: number) => {
  formData.value.ingredients.splice(index, 1)
  calculateTotalRatio()
  calculateCost()
}

// 计算总比例
const calculateTotalRatio = () => {
  // 触发响应式更新
}

// 计算成本
const calculateCost = () => {
  // 触发响应式更新
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (dialogMode.value === 'create') {
      await feedingApi.createFormula(formData.value)
      ElMessage.success('创建成功')
    } else {
      await feedingApi.updateFormula(selectedFormula.value!.id, formData.value)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    fetchFormulas()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    ingredients: []
  }
  selectedFormula.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
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