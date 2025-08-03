<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <i class="modern-icon icon-cattle modern-icon-xl"></i>
        </div>
        <h1 class="title">肉牛全生命周期管理系统</h1>
        <p class="subtitle">Cattle Lifecycle Management System</p>
        
        <!-- 调试信息 -->
        <div v-if="showDebugInfo" class="debug-info">
          <p>后端连接状态: <span :class="backendStatus.connected ? 'success' : 'error'">
            {{ backendStatus.connected ? '已连接' : '未连接' }}
          </span></p>
          <p>默认账户: test / 123456</p>
        </div>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            class="login-btn"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>默认账号：test / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import type { LoginRequest } from '@/types/auth'
import { healthCheck } from '@/utils/healthCheck'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const showDebugInfo = ref(import.meta.env.MODE === 'development')
const backendStatus = ref({ connected: false })

const loginForm = reactive<LoginRequest>({
  username: 'test',
  password: '123456'
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 100, message: '密码长度在 6 到 100 个字符', trigger: 'blur' }
  ]
}

// 检查后端连接状态
onMounted(async () => {
  if (showDebugInfo.value) {
    backendStatus.value.connected = await healthCheck()
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    console.log('开始登录...', loginForm)
    
    // 使用认证store进行登录
    await authStore.login({
      username: loginForm.username,
      password: loginForm.password
    })
    
    console.log('登录成功')
    ElMessage.success('登录成功')
    
    // 检查是否有重定向参数
    const redirect = router.currentRoute.value.query.redirect as string
    const targetPath = redirect || '/admin/dashboard'
    
    console.log('跳转到:', targetPath)
    router.push(targetPath)
    
  } catch (error: any) {
    console.error('Login error:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  font-size: 64px;
  margin-bottom: 16px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.login-footer p {
  margin: 0;
}

.debug-info {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  margin-top: 16px;
  font-size: 12px;
  text-align: left;
}

.debug-info p {
  margin: 4px 0;
}

.debug-info .success {
  color: #67c23a;
  font-weight: bold;
}

.debug-info .error {
  color: #f56c6c;
  font-weight: bold;
}
</style>