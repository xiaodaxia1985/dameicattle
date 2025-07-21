<template>
  <div class="customers-container">
    <div class="page-header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.name" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="searchForm.customerType" placeholder="请选择类型" clearable>
            <el-option 
              v-for="type in customerTypes" 
              :key="type.customer_type" 
              :label="type.customer_type" 
              :value="type.customer_type" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="评级">
          <el-select v-model="searchForm.creditRating" placeholder="请选择评级" clearable>
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

    <!-- 客户列表 -->
    <el-card class="table-card">
      <el-table 
        :data="customers" 
        v-loading="loading"
        stripe
      >
        <el-table-column prop="name" label="客户名称" min-width="150" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="150" />
        <el-table-column prop="customer_type" label="类型" width="120" />
        <el-table-column prop="credit_rating" label="评级" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.credit_rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="信用额度" width="120">
          <template #default="{ row }">
            ¥{{ row.credit_limit?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleVisit(row)">回访</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
              v-if="row.status === 'active'"
            >
              停用
            </el-button>
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

    <!-- 客户表单对话框 -->
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
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户类型" prop="customer_type">
              <el-select v-model="form.customer_type" placeholder="请选择类型">
                <el-option label="个人" value="个人" />
                <el-option label="企业" value="企业" />
                <el-option label="经销商" value="经销商" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="form.contact_person" placeholder="请输入联系人" />
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
              <el-rate v-model="form.credit_rating" show-score />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" placeholder="请输入地址" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业执照号">
              <el-input v-model="form.business_license" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号">
              <el-input v-model="form.tax_number" placeholder="请输入税号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="银行账户">
              <el-input v-model="form.bank_account" placeholder="请输入银行账户" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用额度">
              <el-input-number 
                v-model="form.credit_limit" 
                :min="0" 
                :precision="2"
                placeholder="请输入信用额度"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="付款条件">
          <el-input v-model="form.payment_terms" placeholder="请输入付款条件" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 客户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="客户详情"
      width="1000px"
    >
      <div v-if="currentCustomer" class="customer-detail">
        <!-- 基本信息 -->
        <el-card class="detail-section">
          <template #header>基本信息</template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>客户名称：</label>
                <span>{{ currentCustomer.name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>客户类型：</label>
                <span>{{ currentCustomer.customer_type }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>信用评级：</label>
                <el-rate v-model="currentCustomer.credit_rating" disabled show-score />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>联系人：</label>
                <span>{{ currentCustomer.contact_person }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>联系电话：</label>
                <span>{{ currentCustomer.phone }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>邮箱：</label>
                <span>{{ currentCustomer.email }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="detail-item">
                <label>地址：</label>
                <span>{{ currentCustomer.address }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>营业执照号：</label>
                <span>{{ currentCustomer.business_license }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>税号：</label>
                <span>{{ currentCustomer.tax_number }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>银行账户：</label>
                <span>{{ currentCustomer.bank_account }}</span>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>信用额度：</label>
                <span class="amount">¥{{ currentCustomer.credit_limit?.toLocaleString() || 0 }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>付款条件：</label>
                <span>{{ currentCustomer.payment_terms }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>状态：</label>
                <el-tag :type="currentCustomer.status === 'active' ? 'success' : 'danger'">
                  {{ currentCustomer.status === 'active' ? '启用' : '停用' }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 回访记录 -->
        <el-card class="detail-section">
          <template #header>
            <div class="section-header">
              <span>回访记录</span>
              <el-button size="small" type="primary" @click="handleVisit(currentCustomer)">
                <el-icon><Plus /></el-icon>
                添加回访
              </el-button>
            </div>
          </template>
          <el-table :data="currentCustomer.visit_records || []" border>
            <el-table-column prop="visit_date" label="回访日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.visit_date) }}
              </template>
            </el-table-column>
            <el-table-column prop="visit_type" label="回访类型" width="120" />
            <el-table-column prop="purpose" label="回访目的" min-width="150" />
            <el-table-column prop="content" label="回访内容" min-width="200" />
            <el-table-column prop="result" label="回访结果" min-width="150" />
            <el-table-column prop="next_visit_date" label="下次回访" width="120">
              <template #default="{ row }">
                {{ formatDate(row.next_visit_date) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </el-dialog>

    <!-- 回访记录表单对话框 -->
    <el-dialog
      v-model="visitDialogVisible"
      title="添加回访记录"
      width="600px"
    >
      <el-form
        ref="visitFormRef"
        :model="visitForm"
        :rules="visitRules"
        label-width="120px"
      >
        <el-form-item label="回访日期" prop="visit_date">
          <el-date-picker
            v-model="visitForm.visit_date"
            type="date"
            placeholder="请选择回访日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="回访类型" prop="visit_type">
          <el-select v-model="visitForm.visit_type" placeholder="请选择回访类型">
            <el-option label="电话回访" value="电话回访" />
            <el-option label="实地拜访" value="实地拜访" />
            <el-option label="邮件回访" value="邮件回访" />
          </el-select>
        </el-form-item>
        <el-form-item label="回访目的" prop="purpose">
          <el-input v-model="visitForm.purpose" placeholder="请输入回访目的" />
        </el-form-item>
        <el-form-item label="回访内容" prop="content">
          <el-input v-model="visitForm.content" type="textarea" placeholder="请输入回访内容" />
        </el-form-item>
        <el-form-item label="回访结果">
          <el-input v-model="visitForm.result" type="textarea" placeholder="请输入回访结果" />
        </el-form-item>
        <el-form-item label="下次回访日期">
          <el-date-picker
            v-model="visitForm.next_visit_date"
            type="date"
            placeholder="请选择下次回访日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVisit" :loading="submitting">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { salesApi, type Customer } from '@/api/sales'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const customers = ref<Customer[]>([])
const customerTypes = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  name: '',
  customerType: '',
  creditRating: undefined as number | undefined
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const visitDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const visitFormRef = ref()
const currentCustomer = ref<Customer | null>(null)

// 表单数据
const form = reactive({
  id: null as number | null,
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  credit_rating: 0,
  customer_type: '',
  business_license: '',
  tax_number: '',
  bank_account: '',
  credit_limit: 0,
  payment_terms: ''
})

// 回访表单
const visitForm = reactive({
  customer_id: null as number | null,
  visit_date: '',
  visit_type: '',
  purpose: '',
  content: '',
  result: '',
  next_visit_date: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  customer_type: [{ required: true, message: '请选择客户类型', trigger: 'change' }]
}

// 回访表单验证规则
const visitRules = {
  visit_date: [{ required: true, message: '请选择回访日期', trigger: 'change' }],
  visit_type: [{ required: true, message: '请选择回访类型', trigger: 'change' }],
  purpose: [{ required: true, message: '请输入回访目的', trigger: 'blur' }],
  content: [{ required: true, message: '请输入回访内容', trigger: 'blur' }]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑客户' : '新增客户')

// 方法
const fetchCustomers = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchForm.name,
      customer_type: searchForm.customerType,
      credit_rating: searchForm.creditRating
    }
    const response = await salesApi.getCustomers(params)
    customers.value = response.data.items || []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error('获取客户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCustomerTypes = async () => {
  try {
    const response = await salesApi.getCustomerTypes()
    customerTypes.value = response.data || []
  } catch (error) {
    console.error('获取客户类型失败')
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchCustomers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    customerType: '',
    creditRating: null
  })
  handleSearch()
}

const handleAdd = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: Customer) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleView = (row: Customer) => {
  // 获取客户详情
  salesApi.getCustomer(row.id).then(response => {
    currentCustomer.value = response.data
    detailDialogVisible.value = true
  }).catch(() => {
    ElMessage.error('获取客户详情失败')
  })
}

const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm('确定要停用这个客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await salesApi.deleteCustomer(row.id)
    ElMessage.success('客户已停用')
    fetchCustomers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('停用失败')
    }
  }
}

const handleVisit = (row: Customer) => {
  // 重置表单
  Object.assign(visitForm, {
    customer_id: row.id,
    visit_date: new Date(),
    visit_type: '',
    purpose: '',
    content: '',
    result: '',
    next_visit_date: ''
  })
  
  currentCustomer.value = row
  visitDialogVisible.value = true
}

const submitVisit = async () => {
  if (!visitFormRef.value || !visitForm.customer_id) return
  
  try {
    await visitFormRef.value.validate()
    submitting.value = true
    
    await salesApi.createCustomerVisit(visitForm.customer_id, visitForm)
    ElMessage.success('回访记录添加成功')
    visitDialogVisible.value = false
    
    // 如果当前正在查看客户详情，刷新客户信息
    if (detailDialogVisible.value && currentCustomer.value) {
      const updatedCustomer = await salesApi.getCustomer(currentCustomer.value.id)
      currentCustomer.value = updatedCustomer.data
    }
  } catch (error) {
    ElMessage.error('添加回访记录失败')
  } finally {
    submitting.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await salesApi.updateCustomer(form.id as number, form)
      ElMessage.success('更新成功')
    } else {
      await salesApi.createCustomer(form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchCustomers()
  } catch (error) {
    ElMessage.error('操作失败')
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
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    credit_rating: 0,
    customer_type: '',
    business_license: '',
    tax_number: '',
    bank_account: '',
    credit_limit: 0,
    payment_terms: ''
  })
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  fetchCustomers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchCustomers()
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(() => {
  fetchCustomers()
  fetchCustomerTypes()
})
</script>

<style scoped>
.customers-container {
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

.detail-section {
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 10px;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
}

.detail-item .amount {
  color: #e6a23c;
  font-weight: bold;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>