<template>
  <div class="portal-layout">
    <!-- 门户网站头部 -->
    <header class="portal-header">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <h1>肉牛全生命周期管理系统</h1>
          </div>
          <nav class="nav-menu">
            <router-link to="/portal" class="nav-item" exact>首页</router-link>
            <router-link to="/portal/about" class="nav-item">关于我们</router-link>
            <router-link to="/portal/products" class="nav-item">产品服务</router-link>
            <router-link to="/portal/culture" class="nav-item">企业文化</router-link>
            <router-link to="/portal/history" class="nav-item">发展历程</router-link>
            <router-link to="/portal/news" class="nav-item">新闻中心</router-link>
            <router-link to="/portal/contact" class="nav-item">联系我们</router-link>
            <router-link to="/" class="nav-item login-btn">管理后台</router-link>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="portal-main">
      <router-view />
    </main>

    <!-- 门户网站底部 -->
    <footer class="portal-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h3>关于我们</h3>
            <p>专业的肉牛全生命周期管理解决方案提供商</p>
          </div>
          <div class="footer-section">
            <h3>联系方式</h3>
            <p>电话：400-123-4567</p>
            <p>邮箱：info@cattle-management.com</p>
          </div>
          <div class="footer-section">
            <h3>快速链接</h3>
            <ul>
              <li><router-link to="/portal/news">新闻中心</router-link></li>
              <li><router-link to="/">管理系统</router-link></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 肉牛全生命周期管理系统. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 门户网站布局组件
</script>

<style scoped>
.portal-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.portal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-item {
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-item.login-btn {
  background-color: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.nav-item.login-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
}

.portal-main {
  flex: 1;
}

.portal-footer {
  background-color: #2c3e50;
  color: white;
  padding: 40px 0 20px;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.footer-section h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #ecf0f1;
}

.footer-section p {
  margin: 8px 0;
  color: #bdc3c7;
  line-height: 1.6;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin: 8px 0;
}

.footer-section a {
  color: #bdc3c7;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section a:hover {
  color: #ecf0f1;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #34495e;
}

.footer-bottom p {
  margin: 0;
  color: #95a5a6;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .nav-menu {
    justify-content: center;
  }
  
  .logo h1 {
    font-size: 20px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
</style>