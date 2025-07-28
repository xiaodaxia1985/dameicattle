<template>
  <div class="roles-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>角色管理</h2>
      <p>管理系统角色和权限分配</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd" v-if="hasPermission('role:create')">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedRoles.length === 0"
          @click="handleBatchDelete"
          v-if="hasPermission('role:delete')"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索角色名称"
          style="width: 200px; margin-right: 10px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </div>

    <!-- 角色列表 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="filteredRoles"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="权限数量" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ (row.permissions || []).length }} 个权限</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户数量" width="120">
          <template #default="{ row }">
            <el-tag type="success">{{ row.user_count || 0 }} 个用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(row)"
              v-if="hasPermission('role:update')"
            >
              编辑
            </el-button>
            <el-button
              type="success"
              size="small"
              @click="handlePermissions(row)"
              v-if="hasPermission('role:update')"
            >
              权限配置
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              v-if="hasPermission('role:delete') && row.user_count === 0"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 角色表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleFormRules"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 权限配置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限配置"
      width="800px"
      @close="handlePermissionDialogClose"
    >
      <div class="permission-header">
        <h3>{{ currentRole?.name }} - 权限配置</h3>
        <p>请选择该角色拥有的权限</p>
      </div>

      <div class="permission-content" v-loading="permissionLoading">
        <div class="permission-actions">
          <el-button @click="handleSelectAll">全选</el-button>
          <el-button @click="handleSelectNone">全不选</el-button>
          <el-button type="primary" @click="handleExpandAll">
            {{ expandAll ? '收起全部' : '展开全部' }}
          </el-button>
        </div>

        <el-tree
          ref="permissionTreeRef"
          :data="permissionTree"
          :props="treeProps"
          show-checkbox
          node-key="key"
          :default-expand-all="expandAll"
          :default-checked-keys="selectedPermissions"
          @check="handlePermissionCheck"
          class="permission-tree"
          v-if="permissionTree.length > 0"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <span class="node-label">{{ data.name }}</span>
              <span class="node-description" v-if="data.description">
                {{ data.description }}
              </span>
            </div>
          </template>
        </el-tree>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handlePermissionSubmit" :loading="permissionSubmitLoading">
            保存权限
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Search, Refresh, Delete } from '@element-plus/icons-vue'
import { userApi } from '@/api/user'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/auth'

const authStore = useAuthStore()

// 权限检查
const hasPermission = (permission: string) => {
  return authStore.hasPermission(permission)
}

// 响应式数据
const loading = ref(false)
const roles = ref<Role[]>([])
const selectedRoles = ref<Role[]>([])
const searchKeyword = ref('')

// 角色表单对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const roleFormRef = ref<FormInstance>()

const roleForm = reactive<{ id?: number; name: string; description: string }>({
  name: '',
  description: ''
})

const roleFormRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '角色名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 权限配置对话框
const permissionDialogVisible = ref(false)
const permissionLoading = ref(false)
const permissionSubmitLoading = ref(false)
const currentRole = ref<Role | null>(null)
const permissionTreeRef = ref()
const expandAll = ref(false)
const selectedPermissions = ref<string[]>([])

// 权限树数据
const permissionTree = ref<any[]>([])
const treeProps = {
  children: 'children',
  label: 'name'
}

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑角色' : '新增角色'
})

const filteredRoles = computed(() => {
  if (!searchKeyword.value) return roles.value
  return roles.value.filter(role => 
    role.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchKeyword.value.toLowerCase()))
  )
})

// 方法
const loadRoles = async () => {
  try {
    loading.value = true
    console.log('加载角色列表...')
    
    const response = await userApi.getRolesList({
      keyword: searchKeyword.value
    })
    
    console.log('角色列表API响应:', response)
    roles.value = response.data || []
    
    console.log('角色列表加载完成:', {
      rolesCount: roles.value.length
    })
  } catch (error) {
    console.error('Load roles error:', error)
    ElMessage.error('加载角色列表失败')
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    permissionLoading.value = true
    const permissions = await userApi.getPermissions()
    
    // 构建权限树
    permissionTree.value = buildPermissionTree(permissions)
  } catch (error) {
    console.error('Load permissions error:', error)
    ElMessage.error('加载权限列表失败')
  } finally {
    permissionLoading.value = false
  }
}

const buildPermissionTree = (permissions: { [key: string]: string[] }) => {
  const tree: any[] = []
  
  Object.keys(permissions).forEach(module => {
    const moduleNode = {
      key: module,
      name: getModuleName(module),
      description: getModuleDescription(module),
      children: permissions[module].map(permission => ({
        key: permission,
        name: getPermissionName(permission),
        description: getPermissionDescription(permission)
      }))
    }
    tree.push(moduleNode)
  })
  
  return tree
}

const getModuleName = (module: string) => {
  const moduleNames: { [key: string]: string } = {
    'user': '用户管理',
    'role': '角色管理',
    'base': '基地管理',
    'cattle': '牛场管理',
    'health': '健康管理',
    'feeding': '饲喂管理',
    'purchase': '采购管理',
    'sales': '销售管理',
    'material': '物资管理',
    'equipment': '设备管理',
    'news': '新闻管理',
    'operation-log': '操作日志',
    'dashboard': '数据总览'
  }
  return moduleNames[module] || module
}

const getModuleDescription = (module: string) => {
  const descriptions: { [key: string]: string } = {
    'user': '用户账户管理相关权限',
    'role': '角色权限管理相关权限',
    'base': '基地信息管理相关权限',
    'cattle': '牛只档案管理相关权限',
    'health': '健康诊疗管理相关权限',
    'feeding': '饲喂配方管理相关权限',
    'purchase': '采购订单管理相关权限',
    'sales': '销售订单管理相关权限',
    'material': '生产物资管理相关权限',
    'equipment': '生产设备管理相关权限',
    'news': '新闻内容管理相关权限',
    'operation-log': '操作日志查看相关权限',
    'dashboard': '数据总览查看相关权限'
  }
  return descriptions[module] || ''
}

const getPermissionName = (permission: string) => {
  const parts = permission.split(':')
  const action = parts[1]
  
  const actionNames: { [key: string]: string } = {
    'create': '创建',
    'read': '查看',
    'update': '编辑',
    'delete': '删除',
    'import': '导入',
    'export': '导出',
    'reset-password': '重置密码'
  }
  
  return actionNames[action] || action
}

const getPermissionDescription = (permission: string) => {
  const parts = permission.split(':')
  const module = parts[0]
  const action = parts[1]
  
  return `${getModuleName(module)}的${getPermissionName(permission)}权限`
}

const handleSearch = () => {
  // 搜索功能由计算属性实现
}

const handleReset = () => {
  searchKeyword.value = ''
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetRoleForm()
}

const handleEdit = (role: Role) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(roleForm, {
    id: role.id,
    name: role.name,
    description: role.description || ''
  })
}

const handleDialogClose = () => {
  resetRoleForm()
  roleFormRef.value?.clearValidate()
}

const resetRoleForm = () => {
  Object.assign(roleForm, {
    id: undefined,
    name: '',
    description: ''
  })
}

const handleSubmit = async () => {
  if (!roleFormRef.value) return
  
  try {
    await roleFormRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value && roleForm.id) {
      await userApi.updateRole(roleForm.id, {
        name: roleForm.name,
        description: roleForm.description
      })
      ElMessage.success('角色更新成功')
    } else {
      await userApi.createRole({
        name: roleForm.name,
        description: roleForm.description,
        permissions: []
      })
      ElMessage.success('角色创建成功')
    }
    
    dialogVisible.value = false
    loadRoles()
  } catch (error: any) {
    console.error('Submit role error:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可恢复！`,
      '删除角色确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.deleteRole(role.id)
    ElMessage.success('角色删除成功')
    loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete role error:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handlePermissions = async (role: Role) => {
  currentRole.value = role
  selectedPermissions.value = [...role.permissions]
  permissionDialogVisible.value = true
  
  if (permissionTree.value.length === 0) {
    await loadPermissions()
  }
  
  // 等待权限树加载完成后设置选中状态
  await nextTick()
  setPermissionTreeChecked(role.permissions)
}

const setPermissionTreeChecked = (permissions: string[]) => {
  if (!permissionTreeRef.value || !permissionTree.value.length) {
    console.log('权限树未准备好，稍后重试...')
    setTimeout(() => setPermissionTreeChecked(permissions), 100)
    return
  }
  
  console.log('设置权限树选中状态:', {
    permissions,
    hasWildcard: permissions.includes('*'),
    treeLength: permissionTree.value.length
  })
  
  // 如果有通配符权限，选中所有权限
  if (permissions.includes('*')) {
    console.log('检测到通配符权限，选中所有权限')
    handleSelectAll()
    return
  }
  
  // 收集所有叶子节点的key
  const allLeafKeys: string[] = []
  const collectLeafKeys = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        collectLeafKeys(node.children)
      } else {
        allLeafKeys.push(node.key)
      }
    })
  }
  collectLeafKeys(permissionTree.value)
  
  console.log('所有叶子节点权限:', allLeafKeys)
  
  // 过滤出用户实际拥有的权限
  const checkedKeys = allLeafKeys.filter(key => permissions.includes(key))
  
  console.log('用户拥有的权限:', checkedKeys)
  
  permissionTreeRef.value.setCheckedKeys(checkedKeys)
}

const handlePermissionDialogClose = () => {
  currentRole.value = null
  selectedPermissions.value = []
}

const handleSelectAll = () => {
  if (!permissionTreeRef.value || !permissionTree.value.length) return
  
  const allKeys: string[] = []
  const collectKeys = (nodes: any[]) => {
    nodes.forEach(node => {
      if (node && node.key) {
        allKeys.push(node.key)
        if (node.children && Array.isArray(node.children)) {
          collectKeys(node.children)
        }
      }
    })
  }
  collectKeys(permissionTree.value)
  
  permissionTreeRef.value.setCheckedKeys(allKeys)
}

const handleSelectNone = () => {
  if (!permissionTreeRef.value) return
  permissionTreeRef.value.setCheckedKeys([])
}

const handleExpandAll = () => {
  if (!permissionTreeRef.value || !permissionTree.value.length) return
  
  expandAll.value = !expandAll.value
  
  // 手动展开/收起节点
  permissionTree.value.forEach(node => {
    if (node && node.key && permissionTreeRef.value?.store?.nodesMap) {
      const treeNode = permissionTreeRef.value.store.nodesMap[node.key]
      if (treeNode) {
        treeNode.expanded = expandAll.value
      }
    }
  })
}

const handlePermissionCheck = () => {
  // 权限选择变化时的处理
}

const handlePermissionSubmit = async () => {
  if (!currentRole.value || !permissionTreeRef.value) return
  
  try {
    permissionSubmitLoading.value = true
    
    const checkedKeys = permissionTreeRef.value.getCheckedKeys() || []
    const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys() || []
    
    // 只保存叶子节点的权限
    const leafPermissions = checkedKeys.filter((key: string) => {
      return key && typeof key === 'string' && key.includes(':') // 权限格式为 module:action
    })
    
    await userApi.updateRole(currentRole.value.id, {
      permissions: leafPermissions
    })
    
    ElMessage.success('权限配置保存成功')
    permissionDialogVisible.value = false
    loadRoles()
  } catch (error: any) {
    console.error('Submit permissions error:', error)
    ElMessage.error(error.message || '权限配置保存失败')
  } finally {
    permissionSubmitLoading.value = false
  }
}

const handleSelectionChange = (selection: Role[]) => {
  selectedRoles.value = selection
}

const handleBatchDelete = async () => {
  if (selectedRoles.value.length === 0) return
  
  // 检查是否有角色仍有用户
  const rolesWithUsers = selectedRoles.value.filter(role => role.user_count > 0)
  if (rolesWithUsers.length > 0) {
    ElMessage.error(`以下角色仍有用户，无法删除：${rolesWithUsers.map(r => r.name).join(', ')}`)
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRoles.value.length} 个角色吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 逐个删除角色（如果后端没有批量删除接口）
    for (const role of selectedRoles.value) {
      await userApi.deleteRole(role.id)
    }
    
    ElMessage.success('批量删除成功')
    loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Batch delete error:', error)
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 工具方法
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.roles-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.permission-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.permission-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.permission-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.permission-content {
  min-height: 400px;
}

.permission-actions {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  display: flex;
  gap: 10px;
}

.permission-tree {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.node-label {
  font-weight: 500;
  color: #303133;
}

.node-description {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 8px 0;
}

:deep(.el-tree-node__label) {
  width: 100%;
}
</style>