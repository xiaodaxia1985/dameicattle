<template>
  <div class="category-manager">
    <div class="page-header">
      <h2>新闻分类管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建分类
      </el-button>
    </div>

    <!-- 分类列表 -->
    <el-card>
      <el-table v-loading="loading" :data="categories" stripe>
        <el-table-column prop="name" label="分类名称" min-width="150" />
        <el-table-column prop="code" label="分类代码" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新建分类'"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="请输入分类名称"
            maxlength="100"
          />
        </el-form-item>

        <el-form-item label="分类代码" prop="code">
          <el-input
            v-model="form.code"
            placeholder="请输入分类代码（大写字母和下划线）"
            maxlength="50"
            :disabled="isEdit"
          />
          <div class="form-tip">分类代码创建后不可修改，建议使用大写字母和下划线</div>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述（可选）"
            maxlength="500"
          />
        </el-form-item>

        <el-form-item label="排序">
          <el-input-number
            v-model="form.sortOrder"
            :min="0"
            :max="999"
            placeholder="数字越小排序越靠前"
          />
        </el-form-item>

        <el-form-item label="状态">
          <el-switch
            v-model="form.isActive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { newsApi, type NewsCategory } from '@/api/news'
import { formatDate } from '@/utils/date'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const categories = ref<NewsCategory[]>([])

const formRef = ref<FormInstance>()
const form = reactive({
  id: 0,
  name: '',
  code: '',
  description: '',
  sortOrder: 0,
  isActive: true
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 100, message: '分类名称长度在 1 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入分类代码', trigger: 'blur' },
    { min: 1, max: 50, message: '分类代码长度在 1 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Z_]+$/, message: '分类代码只能包含大写字母和下划线', trigger: 'blur' }
  ]
}

// 获取分类列表
const fetchCategories = async () => {
  loading.value = true
  try {
    // 先测试端点连通性
    const isConnected = await newsApi.testCategoriesEndpoint()
    if (!isConnected) {
      console.warn('新闻分类端点连通性测试失败，但仍尝试获取数据...')
    }
    
    const response = await newsApi.getCategories()
    categories.value = response.data
  } catch (error: any) {
    console.error('获取分类列表失败:', error)
    
    let errorMessage = '获取分类列表失败'
    if (error.message?.includes('timeout')) {
      errorMessage = '请求超时，请检查网络连接'
    } else if (error.response?.status >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    }
    
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 新建分类
const handleCreate = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

// 编辑分类
const handleEdit = (row: NewsCategory) => {
  isEdit.value = true
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description || '',
    sortOrder: row.sortOrder,
    isActive: row.isActive
  })
  dialogVisible.value = true
}

// 删除分类
const handleDelete = async (row: NewsCategory) => {
  try {
    await ElMessageBox.confirm(
      `确认删除分类"${row.name}"吗？删除后无法恢复！`,
      '警告',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    await newsApi.deleteCategory(row.id)
    ElMessage.success('分类删除成功')
    fetchCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除分类失败:', error)
      ElMessage.error('删除分类失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const data = {
      name: form.name,
      code: form.code,
      description: form.description,
      sortOrder: form.sortOrder,
      isActive: form.isActive
    }

    if (isEdit.value) {
      await newsApi.updateCategory(form.id, data)
      ElMessage.success('分类更新成功')
    } else {
      // 首先尝试备用端点，如果失败再使用重试机制
      try {
        await newsApi.createCategoryFallback(data)
        ElMessage.success('分类创建成功')
      } catch (fallbackError) {
        console.log('备用端点失败，尝试重试机制...')
        await newsApi.createCategoryWithRetry(data, 3)
        ElMessage.success('分类创建成功')
      }
    }

    dialogVisible.value = false
    fetchCategories()
  } catch (error: any) {
    console.error('保存分类失败:', error)
    
    // 处理不同类型的错误
    let errorMessage = '保存分类失败'
    
    if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
      errorMessage = '请求超时，请检查网络连接后重试'
    } else if (error.response?.status === 409) {
      errorMessage = '分类代码已存在，请使用其他代码'
    } else if (error.response?.status === 422) {
      errorMessage = '数据验证失败，请检查输入内容'
    } else if (error.response?.status >= 500) {
      errorMessage = '服务器错误，请稍后重试'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 对话框关闭处理
const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: 0,
    name: '',
    code: '',
    description: '',
    sortOrder: 0,
    isActive: true
  })
}

// 初始化
onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-manager {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  text-align: right;
}
</style>