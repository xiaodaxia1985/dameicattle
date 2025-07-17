<template>
  <div class="not-found">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-description">抱歉，您访问的页面不存在或已被删除</p>
      <el-button type="primary" @click="$router.push('/')">
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 404页面
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.error-content {
  text-align: center;
  
  .error-code {
    font-size: 120px;
    font-weight: bold;
    color: var(--el-color-primary);
    margin: 0;
  }
  
  .error-title {
    font-size: 32px;
    margin: 20px 0;
    color: var(--el-text-color-primary);
  }
  
  .error-description {
    font-size: 16px;
    color: var(--el-text-color-secondary);
    margin-bottom: 30px;
  }
}
</style>