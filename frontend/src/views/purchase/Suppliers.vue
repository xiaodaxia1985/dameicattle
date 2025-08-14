<template>
  <div class="suppliers-container">
    <div class="page-header">
      <h2>供应商管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增供应商
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="供应商名称">
          <el-input v-model="searchForm.name" placeholder="请输入供应商名称" clearable />
        </el-form-item>
        <el-form-item label="供应商类型">
          <el-select v-model="searchForm.supplierType" placeholder="请选择类型" clearable>
            <el-option label="牛只供应商" value="cattle" />
            <el-option label="物资供应商" value="material" />
            <el-option label="设备供应商" value="equipment" />
          </el-select>
        </el-form-item>
        <el-form-item label="评级">
          <el-select v-model="searchForm.rating" placeholder="请选择评级" clearable>
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 供应商列表 -->
    <el-card class="table-card">
      <el-table 
        :data="suppliers" 
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="供应商名称" min-width="150" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="supplierType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getSupplierTypeColor(row.supplierType)">
              {{ getSupplierTypeText(row.supplierType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评级" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="creditLimit" label="信用额度" width="120">
          <template #default="{ row }">
            ¥{{ row.creditLimit?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
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

    <!-- 供应商表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入供应商名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商类型" prop="supplierType">
              <el-select v-model="form.supplierType" placeholder="请选择类型">
                <el-option label="牛只供应商" value="cattle" />
                <el-option label="物资供应商" value="material" />
                <el-option label="设备供应商" value="equipment" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="form.contactPerson" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评级">
              <el-rate v-model="form.rating" show-score />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" placeholder="请输入地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业执照号">
              <el-input v-model="form.businessLicense" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号">
              <el-input v-model="form.taxNumber" placeholder="请输入税号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行账户">
              <el-input v-model="form.bankAccount" placeholder="请输入银行账户" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用额度">
              <el-input-number 
                v-model="form.creditLimit" 
                :min="0" 
                :precision="2"
                placeholder="请输入信用额度"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="付款条件">
          <el-input v-model="form.paymentTerms" placeholder="请输入付款条件" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { purchaseApi, type Supplier } from '@/api/purchase'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const suppliers = ref<Supplier[]>([])
const selectedSuppliers = ref<Supplier[]>([])

// 搜索表单
const searchForm = reactive({
  name: '',
  supplierType: '',
  rating: undefined as number | undefined
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  id: null as number | null,
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  rating: 0,
  supplierType: '',
  businessLicense: '',
  taxNumber: '',
  bankAccount: '',
  creditLimit: 0,
  paymentTerms: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入供应商名称', trigger: 'blur' },
    { min: 2, max: 100, message: '供应商名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  contactPerson: [
    { required: true, message: '请输入联系人', trigger: 'blur' },
    { min: 2, max: 50, message: '联系人长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  supplierType: [
    { required: true, message: '请选择供应商类型', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' },
    { min: 5, max: 200, message: '地址长度在 5 到 200 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑供应商' : '新增供应商')

// 方法
const fetchSuppliers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      name: searchForm.name,
      supplierType: searchForm.supplierType,
      rating: searchForm.rating
    }
    
    console.log('🔍 获取供应商列表参数:', params)
    const response = await purchaseApi.getSuppliers(params)
    console.log('📥 供应商列表响应:', response)
    
    // 处理后端返回的数据结构
    if (response.data && typeof response.data === 'object') {
      // 如果返回的是包含suppliers和pagination的对象
      if (response.data.suppliers && Array.isArray(response.data.suppliers)) {
        suppliers.value = response.data.suppliers
        if (response.data.pagination) {
          pagination.total = response.data.pagination.total || 0
        }
      }
      // 如果返回的是包含data字段的对象
      else if (response.data.data && response.data.data.suppliers && Array.isArray(response.data.data.suppliers)) {
        suppliers.value = response.data.data.suppliers
        if (response.data.data.pagination) {
          pagination.total = response.data.data.pagination.total || 0
        }
      }
      // 如果返回的是包含items的对象
      else if (response.data.items && Array.isArray(response.data.items)) {
        suppliers.value = response.data.items
        pagination.total = response.data.total || 0
      }
      // 如果直接返回数组
      else if (Array.isArray(response.data)) {
        suppliers.value = response.data
        pagination.total = response.data.length
      }
      // 其他情况，初始化为空数组
      else {
        suppliers.value = []
        pagination.total = 0
      }
    } else {
      // 如果response.data直接是数组
      suppliers.value = Array.isArray(response.data) ? response.data : []
      pagination.total = suppliers.value.length
    }
    
    console.log('✅ 供应商列表解析结果:', { 
      count: suppliers.value.length, 
      total: pagination.total,
      sample: suppliers.value[0] || null
    })
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    ElMessage.error('获取供应商列表失败')
    suppliers.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchSuppliers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    supplierType: '',
    rating: null
  })
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: Supplier) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleView = (row: Supplier) => {
  // 实现查看详情逻辑
  ElMessage.info('查看供应商详情功能开发中')
}

const handleDelete = async (row: Supplier) => {
  try {
    await ElMessageBox.confirm('确定要删除这个供应商吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await purchaseApi.deleteSupplier(row.id)
    ElMessage.success('删除成功')
    fetchSuppliers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 确保所有必填字段都有值
    const submitData = {
      name: form.name?.trim(),
      contactPerson: form.contactPerson?.trim(),
      phone: form.phone?.trim(),
      email: form.email?.trim() || '',
      address: form.address?.trim() || '',
      supplierType: form.supplierType || 'material',
      businessLicense: form.businessLicense?.trim() || '',
      taxNumber: form.taxNumber?.trim() || '',
      bankAccount: form.bankAccount?.trim() || '',
      creditLimit: Number(form.creditLimit) || 0,
      paymentTerms: form.paymentTerms?.trim() || '',
      rating: Number(form.rating) || 5,
      remark: form.remark?.trim() || ''
    }
    
    console.log('🚀 提交供应商表单数据:', submitData)
    
    if (isEdit.value && form.id) {
      await purchaseApi.updateSupplier(form.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await purchaseApi.createSupplier(submitData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchSuppliers()
  } catch (error) {
    console.error('供应商操作失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '操作失败'
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    rating: 0,
    supplierType: '',
    businessLicense: '',
    taxNumber: '',
    bankAccount: '',
    creditLimit: 0,
    paymentTerms: ''
  })
}

const handleSelectionChange = (selection: Supplier[]) => {
  selectedSuppliers.value = selection
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  fetchSuppliers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchSuppliers()
}

const getSupplierTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    cattle: '牛只供应商',
    material: '物资供应商',
    equipment: '设备供应商'
  }
  return typeMap[type] || type
}

const getSupplierTypeColor = (type: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    cattle: 'success',
    material: 'primary',
    equipment: 'warning'
  }
  return colorMap[type] || 'info'
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 生命周期
onMounted(() => {
  fetchSuppliers()
})
</script>

<style scoped>
.suppliers-container {
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

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>