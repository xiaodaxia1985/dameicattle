<template>
  <div class="about-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <h1>关于我们</h1>
        <p>专业的肉牛全生命周期管理解决方案提供商</p>
      </div>
    </section>

    <!-- 公司简介 -->
    <section class="company-intro">
      <div class="container">
        <div class="intro-content">
          <div class="intro-text">
            <h2>公司简介</h2>
            <p>
              我们是一家专注于现代化畜牧业数字化转型的科技公司，致力于为肉牛养殖行业提供全面的信息化管理解决方案。
              通过先进的技术手段和深度的行业理解，我们帮助牧场实现精细化管理，提高养殖效率，降低运营成本。
            </p>
            <p>
              自成立以来，我们始终坚持以客户需求为导向，以技术创新为驱动，不断完善产品功能，优化用户体验。
              我们的系统已经在多个大型牧场得到成功应用，获得了客户的一致好评。
            </p>
            <div class="company-stats" :class="{ 'animate-in': isVisible.stats }">
              <div class="stat-item" style="animation-delay: 0.1s">
                <div class="stat-number">{{ animatedStats.farms }}+</div>
                <div class="stat-label">服务牧场</div>
              </div>
              <div class="stat-item" style="animation-delay: 0.2s">
                <div class="stat-number">{{ (animatedStats.cattle / 10000).toFixed(0) }}万+</div>
                <div class="stat-label">管理牛只</div>
              </div>
              <div class="stat-item" style="animation-delay: 0.3s">
                <div class="stat-number">{{ animatedStats.satisfaction }}%</div>
                <div class="stat-label">客户满意度</div>
              </div>
            </div>
          </div>
          <div class="intro-image">
            <div class="image-placeholder">
              <div class="placeholder-icon modern-icon-xl icon-innovation"></div>
              <p>现代化办公环境</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心价值观 -->
    <section class="values-section">
      <div class="container">
        <div class="section-header">
          <h2>核心价值观</h2>
          <p>我们的价值观指导着我们的每一个决策和行动</p>
        </div>
        <div class="values-grid" :class="{ 'animate-in': isVisible.values }">
          <div class="value-card" style="animation-delay: 0.1s">
            <div class="value-icon modern-icon-xl icon-target icon-bounce"></div>
            <h3>专业专注</h3>
            <p>深耕畜牧业信息化领域，专注于为客户提供最专业的解决方案</p>
          </div>
          <div class="value-card" style="animation-delay: 0.2s">
            <div class="value-icon modern-icon-xl icon-innovation icon-bounce"></div>
            <h3>创新驱动</h3>
            <p>持续技术创新，运用最新技术为传统畜牧业注入数字化活力</p>
          </div>
          <div class="value-card" style="animation-delay: 0.3s">
            <div class="value-icon modern-icon-xl icon-handshake icon-bounce"></div>
            <h3>客户至上</h3>
            <p>以客户需求为中心，提供贴心的服务和持续的技术支持</p>
          </div>
          <div class="value-card" style="animation-delay: 0.4s">
            <div class="value-icon modern-icon-xl icon-growth icon-bounce"></div>
            <h3>可持续发展</h3>
            <p>推动畜牧业可持续发展，为绿色农业贡献科技力量</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 团队介绍 -->
    <section class="team-section">
      <div class="container">
        <div class="section-header">
          <h2>核心团队</h2>
          <p>拥有丰富经验的专业团队，为您提供优质服务</p>
        </div>
        <div class="team-grid" :class="{ 'animate-in': isVisible.team }">
          <div class="team-member" style="animation-delay: 0.1s">
            <div class="member-avatar">
              <div class="avatar-placeholder">CEO</div>
            </div>
            <h3>张总经理</h3>
            <p class="member-title">首席执行官</p>
            <p class="member-desc">15年畜牧业管理经验，致力于推动行业数字化转型</p>
          </div>
          <div class="team-member" style="animation-delay: 0.2s">
            <div class="member-avatar">
              <div class="avatar-placeholder">CTO</div>
            </div>
            <h3>李技术总监</h3>
            <p class="member-title">技术总监</p>
            <p class="member-desc">资深软件架构师，专注于农业信息化系统开发</p>
          </div>
          <div class="team-member" style="animation-delay: 0.3s">
            <div class="member-avatar">
              <div class="avatar-placeholder">CPO</div>
            </div>
            <h3>王博士</h3>
            <p class="member-title">产品总监</p>
            <p class="member-desc">畜牧业专家，深度理解行业需求和发展趋势</p>
          </div>
          <div class="team-member" style="animation-delay: 0.4s">
            <div class="member-avatar">
              <div class="avatar-placeholder">CSM</div>
            </div>
            <h3>刘经理</h3>
            <p class="member-title">客户成功经理</p>
            <p class="member-desc">专业的客户服务团队负责人，确保客户满意度</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 资质荣誉 -->
    <section class="honors-section">
      <div class="container">
        <div class="section-header">
          <h2>资质荣誉</h2>
          <p>获得的认证和荣誉是我们专业能力的体现</p>
        </div>
        <div class="honors-grid" :class="{ 'animate-in': isVisible.honors }">
          <div class="honor-item" style="animation-delay: 0.1s">
            <div class="honor-icon modern-icon-xl icon-trophy icon-spin"></div>
            <h3>高新技术企业</h3>
            <p>获得国家高新技术企业认定</p>
          </div>
          <div class="honor-item" style="animation-delay: 0.2s">
            <div class="honor-icon modern-icon-xl icon-certificate icon-spin"></div>
            <h3>软件著作权</h3>
            <p>拥有多项软件著作权证书</p>
          </div>
          <div class="honor-item" style="animation-delay: 0.3s">
            <div class="honor-icon modern-icon-xl icon-medal icon-spin"></div>
            <h3>行业优秀奖</h3>
            <p>获得畜牧业信息化优秀解决方案奖</p>
          </div>
          <div class="honor-item" style="animation-delay: 0.4s">
            <div class="honor-icon modern-icon-xl icon-check icon-spin"></div>
            <h3>ISO认证</h3>
            <p>通过ISO9001质量管理体系认证</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 联系信息 -->
    <section class="contact-info">
      <div class="container">
        <div class="contact-content">
          <div class="contact-text">
            <h2>联系我们</h2>
            <p>如果您对我们的产品和服务感兴趣，欢迎随时联系我们</p>
            <div class="contact-actions">
              <router-link to="/portal/contact" class="btn btn-primary">立即联系</router-link>
              <router-link to="/portal/products" class="btn btn-outline">了解产品</router-link>
            </div>
          </div>
          <div class="contact-details">
            <div class="contact-item">
              <div class="contact-icon">
                <div class="icon-phone"></div>
              </div>
              <div>
                <h4>联系电话</h4>
                <p>400-123-4567</p>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <div class="icon-email"></div>
              </div>
              <div>
                <h4>邮箱地址</h4>
                <p>info@cattle-management.com</p>
              </div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">
                <div class="icon-location"></div>
              </div>
              <div>
                <h4>公司地址</h4>
                <p>北京市朝阳区科技园区创新大厦</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 动画状态
const isVisible = ref<Record<string, boolean>>({
  stats: false,
  values: false,
  team: false,
  honors: false
})

// 数字动画状态
const animatedStats = ref<Record<string, number>>({
  farms: 0,
  cattle: 0,
  satisfaction: 0
})

// 滚动监听
const handleScroll = () => {
  const elements = [
    { key: 'stats', selector: '.company-stats' },
    { key: 'values', selector: '.values-grid' },
    { key: 'team', selector: '.team-grid' },
    { key: 'honors', selector: '.honors-grid' }
  ]

  elements.forEach(({ key, selector }) => {
    const element = document.querySelector(selector)
    if (element && !isVisible.value[key]) {
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      if (rect.top < windowHeight * 0.8) {
        isVisible.value[key] = true
        
        // 如果是统计数据，启动数字动画
        if (key === 'stats') {
          animateNumbers()
        }
      }
    }
  })
}

// 数字动画
const animateNumbers = () => {
  const targets: Record<string, number> = { farms: 50, cattle: 100000, satisfaction: 99 }
  const duration = 2000
  const steps = 60
  const stepTime = duration / steps

  Object.keys(targets).forEach(key => {
    let current = 0
    const target = targets[key]
    const increment = target / steps

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      
      if (key === 'cattle') {
        animatedStats.value[key] = Math.floor(current)
      } else {
        animatedStats.value[key] = Math.floor(current)
      }
    }, stepTime)
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 初始检查
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  width: 100%;
}

/* 通用容器样式 - 确保内容居中且有合适边距 */
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

/* 页面头部 */
.page-header {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 0 80px;
  text-align: center;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  animation: grain 20s linear infinite;
}

@keyframes grain {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -5%); }
  20% { transform: translate(-10%, 5%); }
  30% { transform: translate(5%, -10%); }
  40% { transform: translate(-5%, 15%); }
  50% { transform: translate(-10%, 5%); }
  60% { transform: translate(15%, 0%); }
  70% { transform: translate(0%, 10%); }
  80% { transform: translate(-15%, 0%); }
  90% { transform: translate(10%, 5%); }
}

.page-header h1 {
  font-size: 56px;
  font-weight: 800;
  margin: 0 0 20px 0;
  position: relative;
  z-index: 2;
  animation: slideInDown 1s ease-out;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.page-header p {
  font-size: 22px;
  margin: 0;
  opacity: 0.95;
  position: relative;
  z-index: 2;
  animation: slideInUp 1s ease-out 0.3s both;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 公司简介 */
.company-intro {
  padding: 100px 0;
  background: white;
  position: relative;
}

.intro-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.intro-text h2 {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 30px 0;
  color: #2c3e50;
  position: relative;
  animation: fadeInLeft 1s ease-out;
}

.intro-text h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.intro-text p {
  font-size: 18px;
  line-height: 1.8;
  color: #6c757d;
  margin: 0 0 25px 0;
  animation: fadeInLeft 1s ease-out 0.2s both;
}

.company-stats {
  display: flex;
  gap: 50px;
  margin-top: 50px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out;
}

.company-stats.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.stat-item {
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.8s ease-out forwards;
  position: relative;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
  opacity: 0;
  animation: fadeIn 0.5s ease-out 0.5s forwards;
}

.stat-number {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
  text-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.stat-label {
  font-size: 16px;
  color: #6c757d;
  font-weight: 500;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.intro-image {
  display: flex;
  justify-content: center;
}

.image-placeholder {
  width: 400px;
  height: 300px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid #dee2e6;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.image-placeholder p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 核心价值观 */
.values-section {
  padding: 100px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
}

.values-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(102,126,234,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  opacity: 0.5;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
}

.section-header h2 {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: #2c3e50;
  position: relative;
  animation: fadeInDown 1s ease-out;
}

.section-header h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.section-header p {
  font-size: 20px;
  color: #6c757d;
  margin: 0;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}

.values-grid.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.value-card {
  background: white;
  padding: 50px 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  animation: cardSlideIn 0.8s ease-out forwards;
  position: relative;
  overflow: hidden;
}

.value-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.value-card:hover::before {
  left: 100%;
}

.value-card:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
}

.value-icon {
  font-size: 64px;
  margin-bottom: 25px;
  display: inline-block;
  animation: iconBounce 2s ease-in-out infinite;
}

@keyframes iconBounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.value-card h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #2c3e50;
  position: relative;
}

.value-card h3::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
}

.value-card p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.7;
  margin: 0;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 团队介绍 */
.team-section {
  padding: 100px 0;
  background: white;
  position: relative;
}

.team-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 49%, rgba(102, 126, 234, 0.02) 50%, transparent 51%);
  background-size: 20px 20px;
}

.team-section .section-header {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
}

.team-section .section-header h2 {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: #2c3e50;
  position: relative;
  animation: fadeInDown 1s ease-out;
}

.team-section .section-header h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.team-section .section-header p {
  font-size: 20px;
  color: #6c757d;
  margin: 0;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 50px;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}

.team-grid.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.team-member {
  text-align: center;
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  animation: memberSlideIn 0.8s ease-out forwards;
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.team-member::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
  transition: left 0.6s;
}

.team-member:hover::before {
  left: 100%;
}

.team-member:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.15);
}

.member-avatar {
  width: 140px;
  height: 140px;
  margin: 0 auto 25px auto;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.4s ease;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.member-avatar::before {
  content: '';
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.team-member:hover .member-avatar::before {
  opacity: 0.3;
}

.team-member:hover .member-avatar {
  transform: scale(1.1) rotate(5deg);
}

.avatar-placeholder {
  font-size: 56px;
  color: white;
  animation: avatarFloat 3s ease-in-out infinite;
}

@keyframes avatarFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(2deg); }
}

.team-member h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #2c3e50;
  position: relative;
}

.team-member h3::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
}

.member-title {
  font-size: 18px;
  color: #667eea;
  font-weight: 600;
  margin: 0 0 15px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.member-desc {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.7;
  margin: 0;
}

@keyframes memberSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 资质荣誉 */
.honors-section {
  padding: 100px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
}

.honors-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="hexagon" width="50" height="43.4" patternUnits="userSpaceOnUse"><polygon points="25,0 43.3,12.5 43.3,37.5 25,50 6.7,37.5 6.7,12.5" fill="none" stroke="rgba(102,126,234,0.03)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23hexagon)"/></svg>');
  opacity: 0.7;
}

.honors-section .section-header {
  text-align: center;
  margin-bottom: 80px;
  position: relative;
  z-index: 2;
}

.honors-section .section-header h2 {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: #2c3e50;
  position: relative;
  animation: fadeInDown 1s ease-out;
}

.honors-section .section-header h2::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
}

.honors-section .section-header p {
  font-size: 20px;
  color: #6c757d;
  margin: 0;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.honors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}

.honors-grid.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.honor-item {
  background: white;
  padding: 50px 40px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  animation: honorSlideIn 0.8s ease-out forwards;
  position: relative;
  overflow: hidden;
}

.honor-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent);
  transition: left 0.6s;
}

.honor-item:hover::before {
  left: 100%;
}

.honor-item:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
}

.honor-icon {
  font-size: 72px;
  margin-bottom: 25px;
  display: inline-block;
  animation: honorIconSpin 3s ease-in-out infinite;
  filter: drop-shadow(0 4px 20px rgba(255, 215, 0, 0.3));
}

@keyframes honorIconSpin {
  0%, 100% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(5deg) scale(1.1); }
  50% { transform: rotate(0deg) scale(1); }
  75% { transform: rotate(-5deg) scale(1.1); }
}

.honor-item h3 {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 15px 0;
  color: #2c3e50;
  position: relative;
}

.honor-item h3::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 1px;
}

.honor-item p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.7;
  margin: 0;
}

@keyframes honorSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 联系信息 */
.contact-info {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.contact-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.contact-text h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.contact-text p {
  font-size: 18px;
  margin: 0 0 30px 0;
  opacity: 0.9;
}

.contact-actions {
  display: flex;
  gap: 20px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s;
  display: inline-block;
}

.btn-primary {
  background-color: white;
  color: #667eea;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.btn-outline {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-outline:hover {
  background-color: white;
  color: #667eea;
}

.contact-details {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.contact-icon {
  font-size: 24px;
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-item h4 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.contact-item p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 36px;
  }
  
  .page-header p {
    font-size: 18px;
  }
  
  .intro-content,
  .contact-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .company-stats {
    justify-content: center;
    gap: 30px;
  }
  
  .image-placeholder {
    width: 300px;
    height: 200px;
  }
  
  .placeholder-icon {
    font-size: 60px;
  }
  
  .values-grid,
  .team-grid,
  .honors-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .intro-text h2,
  .contact-text h2 {
    font-size: 28px;
  }
  
  .contact-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 60px 0;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .company-intro,
  .values-section,
  .team-section,
  .honors-section,
  .contact-info {
    padding: 60px 0;
  }
  
  .company-stats {
    flex-direction: column;
    gap: 20px;
  }
  
  .value-card,
  .honor-item {
    padding: 30px 20px;
  }
}
</style>