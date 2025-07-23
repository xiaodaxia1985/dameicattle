<template>
  <div class="portal-layout">
    <!-- 门户网站头部 -->
    <header class="portal-header" :class="{ 'scrolled': isScrolled }">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <div class="logo-icon">
              <div class="modern-icon-lg icon-cattle"></div>
            </div>
            <div class="logo-text">
              <h1>智慧牧场</h1>
              <span>肉牛全生命周期管理系统</span>
            </div>
          </div>
          
          <!-- 移动端菜单按钮 -->
          <button class="mobile-menu-btn" @click="toggleMobileMenu" :class="{ 'active': showMobileMenu }">
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <nav class="nav-menu" :class="{ 'mobile-open': showMobileMenu }">
            <router-link to="/portal" class="nav-item" exact @click="closeMobileMenu">
              <div class="nav-icon icon-home"></div>
              <span>首页</span>
            </router-link>
            <router-link to="/portal/about" class="nav-item" @click="closeMobileMenu">
              <div class="nav-icon icon-info"></div>
              <span>关于我们</span>
            </router-link>
            <router-link to="/portal/products" class="nav-item" @click="closeMobileMenu">
              <div class="nav-icon icon-package"></div>
              <span>产品服务</span>
            </router-link>
            <router-link to="/portal/culture" class="nav-item" @click="closeMobileMenu">
              <div class="nav-icon icon-star"></div>
              <span>企业文化</span>
            </router-link>
            <router-link to="/portal/history" class="nav-item" @click="closeMobileMenu">
              <div class="nav-icon icon-chart"></div>
              <span>发展历程</span>
            </router-link>
            <router-link to="/portal/news" class="nav-item" @click="closeMobileMenu">
              <div class="nav-icon icon-news"></div>
              <span>新闻中心</span>
            </router-link>
            <router-link to="/portal/contact" class="nav-item" @click="closeMobileMenu">
              <div class="nav-icon icon-phone"></div>
              <span>联系我们</span>
            </router-link>
            <router-link to="/admin" class="nav-item login-btn" @click="closeMobileMenu">
              <div class="nav-icon icon-lock"></div>
              <span>管理后台</span>
            </router-link>
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
            <div class="footer-logo">
              <div class="logo-icon">
                <div class="modern-icon-lg icon-cattle"></div>
              </div>
              <div class="logo-text">
                <h3>智慧牧场</h3>
                <p>专业的肉牛全生命周期管理解决方案提供商</p>
              </div>
            </div>
          </div>
          <div class="footer-section">
            <h3>产品服务</h3>
            <ul>
              <li><router-link to="/portal/products">产品介绍</router-link></li>
              <li><router-link to="/portal/contact">技术支持</router-link></li>
              <li><router-link to="/portal/news">解决方案</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>公司信息</h3>
            <ul>
              <li><router-link to="/portal/about">关于我们</router-link></li>
              <li><router-link to="/portal/culture">企业文化</router-link></li>
              <li><router-link to="/portal/history">发展历程</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>联系方式</h3>
            <div class="contact-info">
              <p><div class="contact-icon icon-phone"></div> 400-123-4567</p>
              <p><div class="contact-icon icon-email"></div> info@cattle-management.com</p>
              <p><div class="contact-icon icon-location"></div> 北京市朝阳区科技园区</p>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <p>&copy; 2024 智慧牧场管理系统. 保留所有权利.</p>
            <div class="footer-links">
              <a href="#">隐私政策</a>
              <a href="#">服务条款</a>
              <a href="#">网站地图</a>
            </div>
          </div>
        </div>
      </div>
    </footer>

    <!-- 回到顶部按钮 -->
    <button class="back-to-top" @click="scrollToTop" v-show="showBackToTop">
      <div class="icon-arrow-up"></div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 响应式状态
const isScrolled = ref(false)
const showMobileMenu = ref(false)
const showBackToTop = ref(false)

// 处理滚动事件
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  isScrolled.value = scrollTop > 50
  showBackToTop.value = scrollTop > 300
}

// 切换移动端菜单
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
}

// 关闭移动端菜单
const closeMobileMenu = () => {
  showMobileMenu.value = false
}

// 回到顶部
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 生命周期钩子
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // 点击外部关闭移动菜单
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.nav-menu') && !target.closest('.mobile-menu-btn')) {
      showMobileMenu.value = false
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.portal-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 头部样式 */
.portal-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #2c3e50;
  padding: 0;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  transition: all 0.3s ease;
}

.portal-header.scrolled {
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 针对不同屏幕尺寸的优化 */
@media (min-width: 576px) {
  .container {
    padding: 0 30px;
  }
}

@media (min-width: 768px) {
  .container {
    padding: 0 40px;
  }
}

@media (min-width: 992px) {
  .container {
    padding: 0 50px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1200px;
    padding: 0 60px;
  }
}

@media (min-width: 1400px) {
  .container {
    max-width: 1300px;
    padding: 0 80px;
  }
}

@media (min-width: 1600px) {
  .container {
    max-width: 1400px;
    padding: 0 100px;
  }
}

/* 确保页面内容在超大屏幕上不会过度拉伸 */
@media (min-width: 1920px) {
  .container {
    max-width: 1500px;
    padding: 0 120px;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  position: relative;
}

/* Logo样式 */
.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}

.logo-icon {
  font-size: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.logo-text h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
}

.logo-text span {
  font-size: 12px;
  color: #6c757d;
  font-weight: 400;
  display: block;
  margin-top: 2px;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background: #2c3e50;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(7px, 7px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* 导航菜单 */
.nav-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #495057;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

.nav-item:hover {
  background-color: #f8f9fa;
  color: #667eea;
  transform: translateY(-1px);
}

.nav-item.router-link-active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.nav-item.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-left: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.nav-item.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.nav-icon {
  font-size: 16px;
}

/* 主内容区 */
.portal-main {
  flex: 1;
  margin-top: 80px; /* 为固定头部留出空间 */
}

/* 底部样式 */
.portal-footer {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: 60px 0 0;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.footer-logo {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.footer-logo .logo-icon {
  font-size: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.footer-logo .logo-text h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #ecf0f1;
}

.footer-logo .logo-text p {
  margin: 0;
  font-size: 14px;
  color: #bdc3c7;
  line-height: 1.5;
}

.footer-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #ecf0f1;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin: 0 0 12px 0;
}

.footer-section a {
  color: #bdc3c7;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-block;
}

.footer-section a:hover {
  color: #667eea;
  transform: translateX(4px);
}

.contact-info p {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #bdc3c7;
}

.contact-icon {
  font-size: 16px;
  width: 20px;
}

.footer-bottom {
  border-top: 1px solid #34495e;
  padding: 24px 0;
}

.footer-bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-bottom p {
  margin: 0;
  color: #95a5a6;
  font-size: 14px;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: #95a5a6;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: #667eea;
}

/* 回到顶部按钮 */
.back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.back-to-top:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .container {
    padding: 0 20px;
  }
  
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .nav-menu {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    flex-direction: column;
    padding: 20px;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    gap: 4px;
  }
  
  .nav-menu.mobile-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
  
  .nav-item {
    width: 100%;
    justify-content: flex-start;
    padding: 12px 16px;
    border-radius: 8px;
  }
  
  .nav-item.login-btn {
    margin-left: 0;
    margin-top: 8px;
  }
  
  .logo-text h1 {
    font-size: 20px;
  }
  
  .logo-text span {
    font-size: 11px;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }
  
  .footer-bottom-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .footer-links {
    justify-content: center;
  }
  
  .back-to-top {
    width: 45px;
    height: 45px;
    bottom: 20px;
    right: 20px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
  
  .header-content {
    padding: 12px 0;
  }
  
  .logo-icon {
    width: 40px;
    height: 40px;
    font-size: 24px;
  }
  
  .logo-text h1 {
    font-size: 18px;
  }
  
  .portal-main {
    margin-top: 70px;
  }
  
  .footer-links {
    flex-direction: column;
    gap: 12px;
  }
}
</style>