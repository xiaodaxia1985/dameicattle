<template>
  <div class="equipment-list">
    <div class="page-header">
      <h2>设备管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加设备
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="设备名称">
          <el-input v-model="searchForm.search" placeholder="请输入设备名称或编码" clearable />
        </el-form-item>
        <el-form-item label="设备分类">
          <el-select v-model="searchForm.categoryId" placeholder="请选择分类" clearable>
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="正常" value="normal" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="故障" value="broken" />
            <el-option label="已退役" value="retired" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadEquipment">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 设备列表 -->
    <div class="equipment-table">
      <el-table :data="equipmentList" v-loading="loading" stripe>
        <el-table-column prop="code" label="设备编码" width="120" />
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="category.name" label="设备分类" width="120" />
        <el-table-column prop="brand" label="品牌" width="100" />
        <el-table-column prop="model" label="型号" width="120" />
        <el-table-column prop="base.name" label="所属基地" width="120" />
        <el-table-column prop="barn.name" label="所属牛棚" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="purchase_date" label="采购日期" width="120">
          <template #default="{ row }">
            {{ row.purchase_date ? formatDate(row.purchase_date) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewEquipment(row)">详情</el-button>
            <el-button size="small" type="primary" @click="editEquipment(row)">编辑</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="maintenance">维护记录</el-dropdown-item>
                  <el-dropdown-item command="failure">故障记录</el-dropdown-item>
                  <el-dropdown-item command="efficiency">效率分析</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadEquipment"
          @current-change="loadEquipment"
        />
      </div>
    </div>

    <!-- 添加/编辑设备对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingEquipment ? '编辑设备' : '添加设备'"
      width="800px"
    >
      <EquipmentForm
        :equipment="editingEquipment"
        :visible="showAddDialog"
        @success="handleSubmit"
        @cancel="closeDialog"
      />
    </el-dialog>

    <!-- 设备详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="设备详情" width="900px">
      <EquipmentDetail :equipment="selectedEquipment" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { equipmentApi } from '@/api/equipment'
import EquipmentForm from './components/EquipmentForm.vue'
import EquipmentDetail from './components/EquipmentDetail.vue'

// 响应式数据
const loading = ref(false)
const equipmentList = ref([])
const categories = ref([] as Array<{ id: number; name: string }>)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingEquipment = ref<any>(null)
const selectedEquipment = ref(null)

// 搜索表单
const searchForm = reactive({
  search: '',
  categoryId: '',
  status: '',
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})

// 加载设备列表
const loadEquipment = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    }
    const response = await equipmentApi.getEquipment(params)
    // 根据API实现，response.data 可能直接是数据或包含data字段
    if (response.data.data) {
      equipmentList.value = response.data.data || []
      pagination.total = response.data.pagination?.total || 0
    } else {
      equipmentList.value = response.data || []
      pagination.total = response.data.length || 0
    }
  } catch (error) {
    ElMessage.error('加载设备列表失败')
  } finally {
    loading.value = false
  }
}

// 加载设备分类
const loadCategories = async () => {
  try {
    const response = await equipmentApi.getCategories()
    categories.value = response.data || []
  } catch (error) {
    console.error('加载设备分类失败:', error)
  }
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    search: '',
    categoryId: '',
    status: '',
  })
  pagination.page = 1
  loadEquipment()
}

// 查看设备详情
const viewEquipment = (equipment: any) => {
  selectedEquipment.value = equipment
  showDetailDialog.value = true
}

// 编辑设备
const editEquipment = (equipment: any) => {
  editingEquipment.value = { ...equipment }
  showAddDialog.value = true
}

// 处理下拉菜单命令
const handleCommand = (command: string, equipment: any) => {
  switch (command) {
    case 'maintenance':
      // 跳转到维护记录页面
      break
    case 'failure':
      // 跳转到故障记录页面
      break
    case 'efficiency':
      // 跳转到效率分析页面
      break
    case 'delete':
      deleteEquipment(equipment)
      break
  }
}

// 删除设备
const deleteEquipment = async (equipment: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${equipment.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await equipmentApi.deleteEquipment(equipment.id)
    ElMessage.success('删除成功')
    loadEquipment()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 处理表单提交
const handleSubmit = async (formData: any) => {
  try {
    if (editingEquipment.value) {
      await equipmentApi.updateEquipment(editingEquipment.value.id, formData)
      ElMessage.success('更新成功')
    } else {
      await equipmentApi.createEquipment(formData)
      ElMessage.success('添加成功')
    }
    closeDialog()
    loadEquipment()
  } catch (error) {
    ElMessage.error(editingEquipment.value ? '更新失败' : '添加失败')
  }
}

// 关闭对话框
const closeDialog = () => {
  showAddDialog.value = false
  editingEquipment.value = null
}

// 获取状态类型
const getStatusType = (status: string) => {
  const statusMap: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    normal: 'success',
    maintenance: 'warning',
    broken: 'danger',
    retired: 'info',
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    normal: '正常',
    maintenance: '维护中',
    broken: '故障',
    retired: '已退役',
  }
  return statusMap[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 初始化
onMounted(() => {
  loadEquipment()
  loadCategories()
})
</script>

<style scoped>
.equipment-list {
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

.search-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.equipment-table {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>