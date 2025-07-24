<template>
  <div class="users-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <p>管理系统用户账户、角色权限和操作日志</p>
    </div>

    <!-- 操作工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="handleAdd" v-if="hasPermission('user:create')">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button 
          type="danger" 
          :disabled="selectedUsers.length === 0"
          @click="handleBatchDelete"
          v-if="hasPermission('user:delete')"
        >
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-input
          v-model="searchForm.keyword"
          placeholder="搜索用户名或姓名"
          style="width: 200px; margin-right: 10px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select
          v-model="searchForm.status"
          placeholder="状态"
          style="width: 120px; margin-right: 10px"
          clearable
          @change="handleSearch"
        >
          <el-option label="正常" value="active" />
          <el-option label="禁用" value="inactive" />
          <el-option label="锁定" value="locked" />
        </el-select>
        <el-select
          v-model="searchForm.role_id"
          placeholder="角色"
          style="width: 150px; margin-right: 10px"
          clearable
          @change="handleSearch"
        >
          <el-option
            v-for="role in roles"
            :key="role.id"
            :label="role.name"
            :value="role.id"
          />
        </el-select>
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

    <!-- 用户列表 -->
    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="users"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.role" :type="getRoleTagType(row.role.name)">
              {{ row.role.name }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="所属基地" width="150">
          <template #default="{ row }">
            <span v-if="row.base">{{ row.base.name }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160">
          <template #default="{ row }">
            <span v-if="row.last_login_at">
              {{ formatDateTime(row.last_login_at) }}
            </span>
            <span v-else>从未登录</span>
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
              v-if="hasPermission('user:update')"
            >
              编辑
            </el-button>
            <el-button
              type="warning"
              size="small"
              @click="handleResetPassword(row)"
              v-if="hasPermission('user:reset-password')"
            >
              重置密码
            </el-button>
            <el-dropdown @command="(command) => handleDropdownCommand(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    :command="`toggle-status:${row.id}`"
                    v-if="hasPermission('user:update')"
                  >
                    {{ row.status === 'active' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :command="`view-logs:${row.id}`"
                    v-if="hasPermission('operation-log:read')"
                  >
                    查看日志
                  </el-dropdown-item>
                  <el-dropdown-item 
                    :command="`delete:${row.id}`"
                    v-if="hasPermission('user:delete')"
                    divided
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
    </div>

    <!-- 用户表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            :disabled="isEdit"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="真实姓名" prop="real_name">
          <el-input v-model="userForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="userForm.role_id" placeholder="请选择角色" style="width: 100%">
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属基地" prop="base_id">
          <el-select v-model="userForm.base_id" placeholder="请选择基地" style="width: 100%" clearable>
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">正常</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
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

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordVisible"
      title="重置密码"
      width="400px"
    >
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="80px"
      >
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="resetPasswordForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordVisible = false">取消</el-button>
          <el-button type="primary" @click="handleResetPasswordSubmit" :loading="resetPasswordLoading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 操作日志对话框 -->
    <el-dialog
      v-model="operationLogVisible"
      title="操作日志"
      width="1000px"
    >
      <div class="log-toolbar">
        <el-date-picker
          v-model="logDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleLogSearch"
        />
        <el-select
          v-model="logSearchForm.action"
          placeholder="操作类型"
          style="width: 150px; margin-left: 10px"
          clearable
          @change="handleLogSearch"
        >
          <el-option label="登录" value="login" />
          <el-option label="登出" value="logout" />
          <el-option label="创建" value="create" />
          <el-option label="更新" value="update" />
          <el-option label="删除" value="delete" />
        </el-select>
        <el-button type="primary" @click="handleLogSearch" style="margin-left: 10px">
          搜索
        </el-button>
      </div>
      
      <el-table
        v-loading="logLoading"
        :data="operationLogs"
        stripe
        border
        style="margin-top: 20px"
      >
        <el-table-column prop="action" label="操作" width="100" />
        <el-table-column prop="resource" label="资源" width="120" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="200">
          <template #default="{ row }">
            <el-popover
              placement="top-start"
              title="操作详情"
              width="400"
              trigger="hover"
              v-if="row.details"
            >
              <template #reference>
                <el-button type="text" size="small">查看详情</el-button>
              </template>
              <pre>{{ JSON.stringify(row.details, null, 2) }}</pre>
            </el-popover>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="logPagination.page"
          v-model:page-size="logPagination.limit"
          :total="logPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleLogSizeChange"
          @current-change="handleLogCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete, Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { userApi, type UserListParams, type CreateUserRequest, type UpdateUserRequest, type OperationLogParams } from '@/api/user'
import { baseApi } from '@/api/base'
import { useAuthStore } from '@/stores/auth'
import type { User, Role, Base } from '@/types/auth'
import type { Base as ApiBase } from '@/api/base'
import type { OperationLog } from '@/api/user'

const authStore = useAuthStore()

// 权限检查
const hasPermission = (permission: string) => {
  return authStore.hasPermission(permission)
}

// 响应式数据
const loading = ref(false)
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const bases = ref<ApiBase[]>([])
const selectedUsers = ref<User[]>([])

// 搜索表单
const searchForm = reactive<UserListParams>({
  keyword: '',
  status: '',
  role_id: undefined,
  base_id: undefined
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 用户表单对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const userFormRef = ref<FormInstance>()

const userForm = reactive<CreateUserRequest & { id?: number }>({
  username: '',
  password: '',
  real_name: '',
  email: '',
  phone: '',
  role_id: 0,
  base_id: undefined,
  status: 'active'
})

const userFormRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 100, message: '密码长度在 6 到 100 个字符', trigger: 'blur' }
  ],
  real_name: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { max: 100, message: '姓名长度不能超过 100 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  role_id: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 重置密码对话框
const resetPasswordVisible = ref(false)
const resetPasswordLoading = ref(false)
const resetPasswordFormRef = ref<FormInstance>()
const currentResetUser = ref<User | null>(null)

const resetPasswordForm = reactive({
  password: '',
  confirmPassword: ''
})

const resetPasswordRules: FormRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 100, message: '密码长度在 6 到 100 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== resetPasswordForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 操作日志对话框
const operationLogVisible = ref(false)
const logLoading = ref(false)
const operationLogs = ref<OperationLog[]>([])
const currentLogUser = ref<User | null>(null)
const logDateRange = ref<any>(null)

const logSearchForm = reactive<OperationLogParams>({
  action: '',
  resource: ''
})

const logPagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑用户' : '新增用户'
})

// 方法
const loadUsers = async () => {
  try {
    loading.value = true
    const params: UserListParams = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    const response = await userApi.getUsers(params)
    // 根据API实现，response 应该是 { data: [...], total: number, page: number, limit: number }
    users.value = response.data || []
    pagination.total = response.total || 0
  } catch (error) {
    console.error('Load users error:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const loadRoles = async () => {
  try {
    roles.value = await userApi.getRoles()
  } catch (error) {
    console.error('Load roles error:', error)
  }
}

const loadBases = async () => {
  try {
    const response = await baseApi.getAllBases()
    // 根据API实现，response.data 应该是基地数组
    bases.value = response.data || []
  } catch (error) {
    console.error('Load bases error:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    role_id: undefined,
    base_id: undefined
  })
  handleSearch()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadUsers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadUsers()
}

const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

const handleAdd = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetUserForm()
}

const handleEdit = (user: User) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.assign(userForm, {
    id: user.id,
    username: user.username,
    real_name: user.real_name,
    email: user.email || '',
    phone: user.phone || '',
    role_id: user.role_id || 0,
    base_id: user.base_id,
    status: user.status
  })
}

const handleDialogClose = () => {
  resetUserForm()
  userFormRef.value?.clearValidate()
}

const resetUserForm = () => {
  Object.assign(userForm, {
    id: undefined,
    username: '',
    password: '',
    real_name: '',
    email: '',
    phone: '',
    role_id: 0,
    base_id: undefined,
    status: 'active'
  })
}

const handleSubmit = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    submitLoading.value = true
    
    if (isEdit.value && userForm.id) {
      const updateData: UpdateUserRequest = {
        real_name: userForm.real_name,
        email: userForm.email || undefined,
        phone: userForm.phone || undefined,
        role_id: userForm.role_id,
        base_id: userForm.base_id,
        status: userForm.status
      }
      await userApi.updateUser(userForm.id, updateData)
      ElMessage.success('用户更新成功')
    } else {
      const createData: CreateUserRequest = {
        username: userForm.username,
        password: userForm.password,
        real_name: userForm.real_name,
        email: userForm.email || undefined,
        phone: userForm.phone || undefined,
        role_id: userForm.role_id,
        base_id: userForm.base_id,
        status: userForm.status
      }
      await userApi.createUser(createData)
      ElMessage.success('用户创建成功')
    }
    
    dialogVisible.value = false
    loadUsers()
  } catch (error: any) {
    console.error('Submit user error:', error)
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

const handleResetPassword = (user: User) => {
  currentResetUser.value = user
  resetPasswordVisible.value = true
  resetPasswordForm.password = ''
  resetPasswordForm.confirmPassword = ''
}

const handleResetPasswordSubmit = async () => {
  if (!resetPasswordFormRef.value || !currentResetUser.value) return
  
  try {
    await resetPasswordFormRef.value.validate()
    resetPasswordLoading.value = true
    
    await userApi.resetPassword(currentResetUser.value.id, resetPasswordForm.password)
    ElMessage.success('密码重置成功')
    resetPasswordVisible.value = false
  } catch (error: any) {
    console.error('Reset password error:', error)
    ElMessage.error(error.message || '密码重置失败')
  } finally {
    resetPasswordLoading.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedUsers.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedUsers.value.map(user => user.id)
    await userApi.batchDeleteUsers(ids)
    ElMessage.success('批量删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Batch delete error:', error)
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

const handleDropdownCommand = async (command: string, user: User) => {
  const [action, id] = command.split(':')
  
  switch (action) {
    case 'toggle-status':
      await handleToggleStatus(user)
      break
    case 'view-logs':
      await handleViewLogs(user)
      break
    case 'delete':
      await handleDelete(user)
      break
  }
}

const handleToggleStatus = async (user: User) => {
  try {
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    const action = newStatus === 'active' ? '启用' : '禁用'
    
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.real_name}" 吗？`,
      `${action}用户确认`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.toggleUserStatus(user.id, newStatus)
    ElMessage.success(`用户${action}成功`)
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Toggle status error:', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const handleViewLogs = async (user: User) => {
  currentLogUser.value = user
  operationLogVisible.value = true
  logPagination.page = 1
  await loadOperationLogs()
}

const handleDelete = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.real_name}" 吗？此操作不可恢复！`,
      '删除用户确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete user error:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const loadOperationLogs = async () => {
  if (!currentLogUser.value) return
  
  try {
    logLoading.value = true
    const params: OperationLogParams = {
      page: logPagination.page,
      limit: logPagination.limit,
      user_id: currentLogUser.value.id,
      ...logSearchForm
    }
    
    if (logDateRange.value) {
      params.start_date = logDateRange.value[0].toISOString().split('T')[0]
      params.end_date = logDateRange.value[1].toISOString().split('T')[0]
    }
    
    const response = await userApi.getOperationLogs(params)
    // 根据API实现，response 应该是 { data: [...], total: number, page: number, limit: number }
    operationLogs.value = response.data || []
    logPagination.total = response.total || 0
  } catch (error) {
    console.error('Load operation logs error:', error)
    ElMessage.error('加载操作日志失败')
  } finally {
    logLoading.value = false
  }
}

const handleLogSearch = () => {
  logPagination.page = 1
  loadOperationLogs()
}

const handleLogSizeChange = (size: number) => {
  logPagination.limit = size
  logPagination.page = 1
  loadOperationLogs()
}

const handleLogCurrentChange = (page: number) => {
  logPagination.page = page
  loadOperationLogs()
}

// 工具方法
const getRoleTagType = (roleName: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const typeMap: { [key: string]: 'success' | 'primary' | 'warning' | 'info' | 'danger' } = {
    '超级管理员': 'danger',
    '系统管理员': 'warning',
    '基地管理员': 'success',
    '普通用户': 'info'
  }
  return typeMap[roleName] || 'info'
}

const getStatusTagType = (status: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const typeMap: { [key: string]: 'success' | 'primary' | 'warning' | 'info' | 'danger' } = {
    'active': 'success',
    'inactive': 'warning',
    'locked': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: { [key: string]: string } = {
    'active': '正常',
    'inactive': '禁用',
    'locked': '锁定'
  }
  return textMap[status] || status
}

const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadUsers()
  loadRoles()
  loadBases()
})
</script>

<style scoped>
.users-container {
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

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.log-toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style>