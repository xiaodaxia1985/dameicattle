<template>
  <div class="materials-page">
    <div class="page-header">
      <h1 class="page-title">物资档案管理</h1>
      <p class="page-description">管理生产物资基础信息，包括分类、供应商和物资档案</p>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.materials.length }}</div>
              <div class="stat-label">物资总数</div>
            </div>
            <el-icon class="stat-icon"><Box /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.categories.length }}</div>
              <div class="stat-label">分类数量</div>
            </div>
            <el-icon class="stat-icon"><Menu /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.suppliers.length }}</div>
              <div class="stat-label">供应商数量</div>
            </div>
            <el-icon class="stat-icon"><OfficeBuilding /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warning">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.lowStockCount }}</div>
              <div class="stat-label">低库存物资</div>
            </div>
            <el-icon class="stat-icon"><Warning /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 物资档案 -->
        <el-tab-pane label="物资档案" name="materials">
          <div class="tab-header">
            <div class="search-filters">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索物资名称或编码"
                style="width: 250px"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              
              <el-select
                v-model="selectedCategory"
                placeholder="选择分类"
                style="width: 150px"
                clearable
                @change="handleSearch"
              >
                <el-option
                  v-for="category in materialStore.categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>

              <el-select
                v-model="selectedSupplier"
                placeholder="选择供应商"
                style="width: 150px"
                clearable
                @change="handleSearch"
              >
                <el-option
                  v-for="supplier in materialStore.suppliers"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
              </el-select>

              <el-select
                v-model="selectedStatus"
                placeholder="状态"
                style="width: 120px"
                clearable
                @change="handleSearch"
              >
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </div>

            <div class="header-actions">
              <el-button @click="showCategoryDialog">
                <el-icon><Menu /></el-icon>
                分类管理
              </el-button>
              <el-button @click="showSupplierDialog">
                <el-icon><OfficeBuilding /></el-icon>
                供应商管理
              </el-button>
              <el-button type="primary" @click="showMaterialDialog()">
                <el-icon><Plus /></el-icon>
                新增物资
              </el-button>
            </div>
          </div>

          <el-card>
            <el-table
              :data="materialStore.materials"
              v-loading="materialStore.loading"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="code" label="物资编码" width="120" />
              <el-table-column prop="name" label="物资名称" min-width="150" />
              <el-table-column label="分类" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.category?.name || '-' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80" />
              <el-table-column prop="specification" label="规格" min-width="120" show-overflow-tooltip />
              <el-table-column label="供应商" width="120">
                <template #default="{ row }">
                  {{ row.supplier?.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="采购价格" width="100">
                <template #default="{ row }">
                  <span v-if="row.purchase_price">¥{{ row.purchase_price.toFixed(2) }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="安全库存" width="100">
                <template #default="{ row }">
                  {{ row.safety_stock }} {{ row.unit }}
                </template>
              </el-table-column>
              <el-table-column label="当前库存" width="100">
                <template #default="{ row }">
                  <span :class="{ 'low-stock': (row.current_stock || 0) <= row.safety_stock }">
                    {{ row.current_stock || 0 }} {{ row.unit }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                    {{ row.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="showMaterialDialog(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteMaterial(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination">
              <el-pagination
                v-model:current-page="materialStore.currentPage"
                v-model:page-size="materialStore.pageSize"
                :total="materialStore.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 分类管理 -->
        <el-tab-pane label="分类管理" name="categories">
          <div class="tab-header">
            <div class="header-actions">
              <el-button type="primary" @click="showCategoryFormDialog()">
                <el-icon><Plus /></el-icon>
                新增分类
              </el-button>
            </div>
          </div>

          <el-card>
            <el-table :data="materialStore.categories" v-loading="materialStore.loading">
              <el-table-column prop="code" label="分类编码" width="120" />
              <el-table-column prop="name" label="分类名称" min-width="150" />
              <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="showCategoryFormDialog(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteCategory(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>

        <!-- 供应商管理 -->
        <el-tab-pane label="供应商管理" name="suppliers">
          <div class="tab-header">
            <div class="search-filters">
              <el-input
                v-model="supplierSearchKeyword"
                placeholder="搜索供应商名称"
                style="width: 200px"
                clearable
                @input="handleSupplierSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            <div class="header-actions">
              <el-button type="primary" @click="showSupplierFormDialog()">
                <el-icon><Plus /></el-icon>
                新增供应商
              </el-button>
            </div>
          </div>

          <el-card>
            <el-table :data="materialStore.suppliers" v-loading="materialStore.loading">
              <el-table-column prop="name" label="供应商名称" min-width="150" />
              <el-table-column prop="contact_person" label="联系人" width="100" />
              <el-table-column prop="phone" label="联系电话" width="120" />
              <el-table-column prop="email" label="邮箱" width="150" show-overflow-tooltip />
              <el-table-column prop="supplier_type" label="类型" width="100" />
              <el-table-column label="评级" width="100">
                <template #default="{ row }">
                  <el-rate v-model="row.rating" disabled size="small" />
                </template>
              </el-table-column>
              <el-table-column label="信用额度" width="120">
                <template #default="{ row }">
                  ¥{{ row.credit_limit?.toLocaleString() || '0' }}
                </template>
              </el-table-column>
              <el-table-column label="创建时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button size="small" @click="showSupplierFormDialog(row)">编辑</el-button>
                  <el-button size="small" type="danger" @click="handleDeleteSupplier(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination">
              <el-pagination
                v-model:current-page="materialStore.currentPage"
                v-model:page-size="materialStore.pageSize"
                :total="materialStore.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 物资表单对话框 -->
    <el-dialog
      v-model="materialDialogVisible"
      :title="materialForm.id ? '编辑物资' : '新增物资'"
      width="600px"
      @close="resetMaterialForm"
    >
      <el-form
        ref="materialFormRef"
        :model="materialForm"
        :rules="materialRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="物资名称" prop="name">
              <el-input v-model="materialForm.name" placeholder="请输入物资名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物资编码" prop="code">
              <el-input v-model="materialForm.code" placeholder="请输入物资编码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类" prop="category_id">
              <el-select v-model="materialForm.category_id" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="category in materialStore.categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-input v-model="materialForm.unit" placeholder="如：kg、吨、袋、瓶" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="规格说明">
          <el-input
            v-model="materialForm.specification"
            type="textarea"
            :rows="2"
            placeholder="请输入规格说明"
          />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-select v-model="materialForm.supplier_id" placeholder="请选择供应商" style="width: 100%">
                <el-option
                  v-for="supplier in materialStore.suppliers"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购价格">
              <el-input-number
                v-model="materialForm.purchase_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="安全库存" prop="safety_stock">
          <el-input-number
            v-model="materialForm.safety_stock"
            :min="0"
            :precision="2"
            style="width: 200px"
            placeholder="0"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="materialDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveMaterial" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分类表单对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="categoryForm.id ? '编辑分类' : '新增分类'"
      width="500px"
      @close="resetCategoryForm"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="categoryForm.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveCategory" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 供应商表单对话框 -->
    <el-dialog
      v-model="supplierDialogVisible"
      :title="supplierForm.id ? '编辑供应商' : '新增供应商'"
      width="700px"
      @close="resetSupplierForm"
    >
      <el-form
        ref="supplierFormRef"
        :model="supplierForm"
        :rules="supplierRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="供应商名称" prop="name">
              <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人">
              <el-input v-model="supplierForm.contact_person" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="supplierForm.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="supplierForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="地址">
          <el-input v-model="supplierForm.address" placeholder="请输入地址" />
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="供应商类型" prop="supplier_type">
              <el-select v-model="supplierForm.supplier_type" placeholder="请选择类型" style="width: 100%">
                <el-option label="饲料供应商" value="feed" />
                <el-option label="药品供应商" value="medicine" />
                <el-option label="设备供应商" value="equipment" />
                <el-option label="其他" value="other" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评级">
              <el-rate v-model="supplierForm.rating" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="营业执照号">
              <el-input v-model="supplierForm.business_license" placeholder="请输入营业执照号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号">
              <el-input v-model="supplierForm.tax_number" placeholder="请输入税号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="银行账户">
              <el-input v-model="supplierForm.bank_account" placeholder="请输入银行账户" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="信用额度">
              <el-input-number
                v-model="supplierForm.credit_limit"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="付款条件">
          <el-input v-model="supplierForm.payment_terms" placeholder="如：月结30天" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="supplierDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveSupplier" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useMaterialStore } from '@/stores/material'
import type { FormInstance } from 'element-plus'
import type { ProductionMaterial, MaterialCategory, Supplier } from '@/types/material'

// Store
const materialStore = useMaterialStore()

// Reactive data
const activeTab = ref('materials')
const searchKeyword = ref('')
const selectedCategory = ref<number | undefined>()
const selectedSupplier = ref<number | undefined>()
const selectedStatus = ref<string | undefined>()
const supplierSearchKeyword = ref('')
const selectedMaterials = ref<ProductionMaterial[]>([])
const saving = ref(false)

// Dialog visibility
const materialDialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const supplierDialogVisible = ref(false)

// Form refs
const materialFormRef = ref<FormInstance>()
const categoryFormRef = ref<FormInstance>()
const supplierFormRef = ref<FormInstance>()

// Forms
const materialForm = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  category_id: undefined as number | undefined,
  unit: '',
  specification: '',
  supplier_id: undefined as number | undefined,
  purchase_price: undefined as number | undefined,
  safety_stock: 0
})

const categoryForm = reactive({
  id: undefined as number | undefined,
  name: '',
  code: '',
  description: ''
})

const supplierForm = reactive({
  id: undefined as number | undefined,
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  supplier_type: '',
  rating: 0,
  business_license: '',
  tax_number: '',
  bank_account: '',
  credit_limit: 0,
  payment_terms: ''
})

// Form rules
const materialRules = {
  name: [{ required: true, message: '请输入物资名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入物资编码', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  safety_stock: [{ required: true, message: '请输入安全库存', trigger: 'blur' }]
}

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }]
}

const supplierRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }],
  supplier_type: [{ required: true, message: '请选择供应商类型', trigger: 'change' }]
}

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleTabChange = (tabName: string | number) => {
  const tabNameStr = String(tabName)
  activeTab.value = tabNameStr
  switch (tabNameStr) {
    case 'materials':
      loadMaterials()
      break
    case 'categories':
      loadCategories()
      break
    case 'suppliers':
      loadSuppliers()
      break
  }
}

const handleSearch = () => {
  loadMaterials()
}

const handleSupplierSearch = () => {
  loadSuppliers()
}

const handleSelectionChange = (selection: ProductionMaterial[]) => {
  selectedMaterials.value = selection
}

const handleSizeChange = (size: number) => {
  materialStore.pageSize = size
  loadCurrentTabData()
}

const handleCurrentChange = (page: number) => {
  materialStore.currentPage = page
  loadCurrentTabData()
}

const loadCurrentTabData = () => {
  switch (activeTab.value) {
    case 'materials':
      loadMaterials()
      break
    case 'suppliers':
      loadSuppliers()
      break
  }
}

const loadMaterials = async () => {
  try {
    await materialStore.fetchMaterials({
      page: materialStore.currentPage,
      limit: materialStore.pageSize,
      keyword: searchKeyword.value || undefined,
      category_id: selectedCategory.value,
      supplier_id: selectedSupplier.value,
      status: selectedStatus.value
    })
  } catch (error) {
    ElMessage.error('加载物资列表失败')
  }
}

const loadCategories = async () => {
  try {
    await materialStore.fetchCategories()
  } catch (error) {
    ElMessage.error('加载分类列表失败')
  }
}

const loadSuppliers = async () => {
  try {
    await materialStore.fetchSuppliers({
      page: materialStore.currentPage,
      limit: materialStore.pageSize,
      keyword: supplierSearchKeyword.value || undefined
    })
  } catch (error) {
    ElMessage.error('加载供应商列表失败')
  }
}

// Material operations
const showMaterialDialog = (material?: ProductionMaterial) => {
  if (material) {
    Object.assign(materialForm, {
      id: material.id,
      name: material.name,
      code: material.code,
      category_id: material.category_id,
      unit: material.unit,
      specification: material.specification || '',
      supplier_id: material.supplier_id,
      purchase_price: material.purchase_price,
      safety_stock: material.safety_stock
    })
  }
  materialDialogVisible.value = true
}

const resetMaterialForm = () => {
  Object.assign(materialForm, {
    id: undefined,
    name: '',
    code: '',
    category_id: undefined,
    unit: '',
    specification: '',
    supplier_id: undefined,
    purchase_price: undefined,
    safety_stock: 0
  })
  nextTick(() => {
    materialFormRef.value?.clearValidate()
  })
}

const handleSaveMaterial = async () => {
  if (!materialFormRef.value) return
  
  try {
    await materialFormRef.value.validate()
    saving.value = true
    
    if (materialForm.id) {
      await materialStore.updateMaterial(materialForm.id, materialForm)
      ElMessage.success('更新物资成功')
    } else {
      await materialStore.createMaterial(materialForm)
      ElMessage.success('创建物资成功')
    }
    
    materialDialogVisible.value = false
    loadMaterials()
  } catch (error) {
    if (error !== false) { // validation error returns false
      ElMessage.error('保存物资失败')
    }
  } finally {
    saving.value = false
  }
}

const handleDeleteMaterial = async (material: ProductionMaterial) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除物资"${material.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await materialStore.deleteMaterial(material.id)
    ElMessage.success('删除物资成功')
    loadMaterials()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除物资失败')
    }
  }
}

// Category operations
const showCategoryDialog = () => {
  activeTab.value = 'categories'
}

const showCategoryFormDialog = (category?: MaterialCategory) => {
  if (category) {
    Object.assign(categoryForm, {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description || ''
    })
  }
  categoryDialogVisible.value = true
}

const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    id: undefined,
    name: '',
    code: '',
    description: ''
  })
  nextTick(() => {
    categoryFormRef.value?.clearValidate()
  })
}

const handleSaveCategory = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
    saving.value = true
    
    if (categoryForm.id) {
      await materialStore.updateCategory(categoryForm.id, categoryForm)
      ElMessage.success('更新分类成功')
    } else {
      await materialStore.createCategory(categoryForm)
      ElMessage.success('创建分类成功')
    }
    
    categoryDialogVisible.value = false
    loadCategories()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存分类失败')
    }
  } finally {
    saving.value = false
  }
}

const handleDeleteCategory = async (category: MaterialCategory) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await materialStore.deleteCategory(category.id)
    ElMessage.success('删除分类成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除分类失败')
    }
  }
}

// Supplier operations
const showSupplierDialog = () => {
  activeTab.value = 'suppliers'
}

const showSupplierFormDialog = (supplier?: Supplier) => {
  if (supplier) {
    Object.assign(supplierForm, {
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      supplier_type: supplier.supplier_type,
      rating: supplier.rating,
      business_license: supplier.business_license || '',
      tax_number: supplier.tax_number || '',
      bank_account: supplier.bank_account || '',
      credit_limit: supplier.credit_limit,
      payment_terms: supplier.payment_terms || ''
    })
  }
  supplierDialogVisible.value = true
}

const resetSupplierForm = () => {
  Object.assign(supplierForm, {
    id: undefined,
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    supplier_type: '',
    rating: 0,
    business_license: '',
    tax_number: '',
    bank_account: '',
    credit_limit: 0,
    payment_terms: ''
  })
  nextTick(() => {
    supplierFormRef.value?.clearValidate()
  })
}

const handleSaveSupplier = async () => {
  if (!supplierFormRef.value) return
  
  try {
    await supplierFormRef.value.validate()
    saving.value = true
    
    if (supplierForm.id) {
      await materialStore.updateSupplier(supplierForm.id, supplierForm)
      ElMessage.success('更新供应商成功')
    } else {
      await materialStore.createSupplier(supplierForm)
      ElMessage.success('创建供应商成功')
    }
    
    supplierDialogVisible.value = false
    loadSuppliers()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存供应商失败')
    }
  } finally {
    saving.value = false
  }
}

const handleDeleteSupplier = async (supplier: Supplier) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除供应商"${supplier.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await materialStore.deleteSupplier(supplier.id)
    ElMessage.success('删除供应商成功')
    loadSuppliers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除供应商失败')
    }
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      materialStore.fetchCategories(),
      materialStore.fetchSuppliers({ limit: 1000 }), // Load all suppliers for dropdown
      loadMaterials()
    ])
  } catch (error) {
    ElMessage.error('初始化数据失败')
  }
})
</script>

<style scoped>
.materials-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  color: #606266;
  margin: 0;
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32px;
  color: #e4e7ed;
}

.page-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.low-stock {
  color: #e6a23c;
  font-weight: 600;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-card) {
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>