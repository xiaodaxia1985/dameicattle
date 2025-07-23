<template>
  <div class="products-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <h1>产品服务</h1>
        <p>全面的肉牛全生命周期管理解决方案</p>
      </div>
    </section>

    <!-- 产品概述 -->
    <section class="product-overview">
      <div class="container">
        <div class="overview-content">
          <div class="overview-text">
            <h2>产品概述</h2>
            <p>
              我们的肉牛全生命周期管理系统是一套完整的数字化牧场管理解决方案，
              涵盖了从牛只档案管理到销售管理的全业务流程。系统采用现代化的技术架构，
              支持PC端和移动端多平台使用，为牧场管理者提供全方位的数据支持和决策依据。
            </p>
            <div class="product-highlights">
              <div class="highlight-item">
                <div class="icon modern-icon icon-check"></div>
                <span>全流程覆盖</span>
              </div>
              <div class="highlight-item">
                <div class="icon modern-icon icon-mobile"></div>
                <span>多平台支持</span>
              </div>
              <div class="highlight-item">
                <div class="icon modern-icon icon-lock"></div>
                <span>数据安全</span>
              </div>
              <div class="highlight-item">
                <div class="icon modern-icon icon-lightning"></div>
                <span>高效便捷</span>
              </div>
            </div>
          </div>
          <div class="overview-image">
            <div class="image-placeholder">
              <div class="placeholder-icon modern-icon-xl icon-computer"></div>
              <p>系统界面展示</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心功能模块 -->
    <section class="modules-section">
      <div class="container">
        <div class="section-header">
          <h2>核心功能模块</h2>
          <p>完整的业务功能覆盖，满足牧场管理的各种需求</p>
        </div>
        <div class="modules-grid" :class="{ 'animate-in': isVisible.modules }">
          <div class="module-card" style="animation-delay: 0.1s">
            <div class="module-icon modern-icon-xl icon-cattle icon-pulse"></div>
            <h3>牛只档案管理</h3>
            <ul class="module-features">
              <li>完整的牛只基本信息管理</li>
              <li>生命周期事件记录</li>
              <li>照片管理和批量操作</li>
              <li>耳标管理和打印</li>
              <li>数据导入导出功能</li>
            </ul>
            <div class="module-benefits">
              <span class="benefit-tag">提高管理效率</span>
              <span class="benefit-tag">数据追溯</span>
            </div>
          </div>

          <div class="module-card" style="animation-delay: 0.2s">
            <div class="module-icon modern-icon-xl icon-medical icon-pulse"></div>
            <h3>健康管理</h3>
            <ul class="module-features">
              <li>健康状态实时监测</li>
              <li>诊疗记录管理</li>
              <li>疫苗接种计划</li>
              <li>健康预警系统</li>
              <li>统计分析报表</li>
            </ul>
            <div class="module-benefits">
              <span class="benefit-tag">降低死亡率</span>
              <span class="benefit-tag">预防疾病</span>
            </div>
          </div>

          <div class="module-card" style="animation-delay: 0.3s">
            <div class="module-icon modern-icon-xl icon-feed icon-pulse"></div>
            <h3>精准饲喂</h3>
            <ul class="module-features">
              <li>科学饲料配方管理</li>
              <li>饲喂记录和统计</li>
              <li>成本核算分析</li>
              <li>饲喂效果评估</li>
              <li>智能饲喂建议</li>
            </ul>
            <div class="module-benefits">
              <span class="benefit-tag">降低成本</span>
              <span class="benefit-tag">提高效率</span>
            </div>
          </div>

          <div class="module-card" style="animation-delay: 0.4s">
            <div class="module-icon modern-icon-xl icon-package icon-pulse"></div>
            <h3>物资管理</h3>
            <ul class="module-features">
              <li>生产物资档案管理</li>
              <li>库存管理和预警</li>
              <li>出入库记录跟踪</li>
              <li>供应商管理</li>
              <li>成本分析统计</li>
            </ul>
            <div class="module-benefits">
              <span class="benefit-tag">库存优化</span>
              <span class="benefit-tag">成本控制</span>
            </div>
          </div>

          <div class="module-card" style="animation-delay: 0.5s">
            <div class="module-icon modern-icon-xl icon-tools icon-pulse"></div>
            <h3>设备管理</h3>
            <ul class="module-features">
              <li>设备档案和状态管理</li>
              <li>维护计划制定</li>
              <li>故障报修处理</li>
              <li>维护记录跟踪</li>
              <li>设备效率分析</li>
            </ul>
            <div class="module-benefits">
              <span class="benefit-tag">延长寿命</span>
              <span class="benefit-tag">减少故障</span>
            </div>
          </div>

          <div class="module-card" style="animation-delay: 0.6s">
            <div class="module-icon modern-icon-xl icon-chart icon-pulse"></div>
            <h3>数据分析</h3>
            <ul class="module-features">
              <li>实时数据仪表盘</li>
              <li>多维度统计分析</li>
              <li>趋势预测分析</li>
              <li>自定义报表生成</li>
              <li>数据导出功能</li>
            </ul>
            <div class="module-benefits">
              <span class="benefit-tag">科学决策</span>
              <span class="benefit-tag">精准管理</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 技术特色 -->
    <section class="tech-features">
      <div class="container">
        <div class="section-header">
          <h2>技术特色</h2>
          <p>采用先进的技术架构，确保系统稳定可靠</p>
        </div>
        <div class="tech-grid" :class="{ 'animate-in': isVisible.tech }">
          <div class="tech-item" style="animation-delay: 0.1s">
            <div class="tech-icon modern-icon-lg icon-innovation icon-pulse"></div>
            <h3>现代化架构</h3>
            <p>采用前后端分离架构，微服务设计，支持高并发访问</p>
          </div>
          <div class="tech-item" style="animation-delay: 0.2s">
            <div class="tech-icon modern-icon-lg icon-mobile icon-pulse"></div>
            <h3>多端适配</h3>
            <p>支持PC端、移动端、微信小程序多平台访问</p>
          </div>
          <div class="tech-item" style="animation-delay: 0.3s">
            <div class="tech-icon modern-icon-lg icon-cloud icon-pulse"></div>
            <h3>云端部署</h3>
            <p>支持云端部署和本地部署，灵活选择部署方式</p>
          </div>
          <div class="tech-item" style="animation-delay: 0.4s">
            <div class="tech-icon modern-icon-lg icon-lock icon-pulse"></div>
            <h3>安全可靠</h3>
            <p>数据加密传输，权限精细控制，确保数据安全</p>
          </div>
          <div class="tech-item" style="animation-delay: 0.5s">
            <div class="tech-icon modern-icon-lg icon-lightning icon-pulse"></div>
            <h3>高性能</h3>
            <p>优化的数据库设计，缓存机制，响应速度快</p>
          </div>
          <div class="tech-item" style="animation-delay: 0.6s">
            <div class="tech-icon modern-icon-lg icon-tools icon-pulse"></div>
            <h3>易扩展</h3>
            <p>模块化设计，支持功能定制和二次开发</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 服务支持 -->
    <section class="service-support">
      <div class="container">
        <div class="section-header">
          <h2>服务支持</h2>
          <p>全方位的服务支持，确保系统稳定运行</p>
        </div>
        <div class="service-content">
          <div class="service-list" :class="{ 'animate-in': isVisible.services }">
            <div class="service-item" style="animation-delay: 0.1s">
              <div class="service-icon">
                <div class="modern-icon-lg icon-rocket icon-bounce"></div>
              </div>
              <div class="service-info">
                <h3>系统部署</h3>
                <p>提供专业的系统部署服务，确保系统正常运行</p>
              </div>
            </div>
            <div class="service-item" style="animation-delay: 0.2s">
              <div class="service-icon">
                <div class="modern-icon-lg icon-book icon-bounce"></div>
              </div>
              <div class="service-info">
                <h3>培训服务</h3>
                <p>提供系统使用培训，帮助用户快速掌握系统操作</p>
              </div>
            </div>
            <div class="service-item" style="animation-delay: 0.3s">
              <div class="service-icon">
                <div class="modern-icon-lg icon-tools icon-bounce"></div>
              </div>
              <div class="service-info">
                <h3>技术支持</h3>
                <p>7×24小时技术支持，及时解决系统使用问题</p>
              </div>
            </div>
            <div class="service-item" style="animation-delay: 0.4s">
              <div class="service-icon">
                <div class="modern-icon-lg icon-refresh icon-bounce"></div>
              </div>
              <div class="service-info">
                <h3>系统维护</h3>
                <p>定期系统维护和更新，保持系统最佳状态</p>
              </div>
            </div>
            <div class="service-item" style="animation-delay: 0.5s">
              <div class="service-icon">
                <div class="modern-icon-lg icon-chart icon-bounce"></div>
              </div>
              <div class="service-info">
                <h3>数据迁移</h3>
                <p>协助客户进行数据迁移，确保数据完整性</p>
              </div>
            </div>
            <div class="service-item" style="animation-delay: 0.6s">
              <div class="service-icon">
                <div class="modern-icon-lg icon-target icon-bounce"></div>
              </div>
              <div class="service-info">
                <h3>定制开发</h3>
                <p>根据客户特殊需求，提供定制化开发服务</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 成功案例 -->
    <section class="success-cases">
      <div class="container">
        <div class="section-header">
          <h2>成功案例</h2>
          <p>已为多家大型牧场提供专业服务</p>
        </div>
        <div class="cases-grid" :class="{ 'animate-in': isVisible.cases }">
          <div class="case-card" style="animation-delay: 0.1s">
            <div class="case-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-building icon-spin"></div>
              </div>
            </div>
            <div class="case-content">
              <h3>某大型牧场集团</h3>
              <div class="case-stats">
                <span class="stat">管理牛只: 5000+</span>
                <span class="stat">基地数量: 3个</span>
              </div>
              <p>通过系统实施，该牧场集团实现了统一管理，提高了管理效率30%，降低了运营成本15%。</p>
            </div>
          </div>
          <div class="case-card" style="animation-delay: 0.2s">
            <div class="case-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-feed icon-spin"></div>
              </div>
            </div>
            <div class="case-content">
              <h3>现代化养殖合作社</h3>
              <div class="case-stats">
                <span class="stat">管理牛只: 2000+</span>
                <span class="stat">基地数量: 2个</span>
              </div>
              <p>系统帮助合作社建立了标准化管理流程，提升了牛只健康率，增加了经济效益。</p>
            </div>
          </div>
          <div class="case-card" style="animation-delay: 0.3s">
            <div class="case-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-cattle icon-spin"></div>
              </div>
            </div>
            <div class="case-content">
              <h3>家庭农场联盟</h3>
              <div class="case-stats">
                <span class="stat">管理牛只: 1500+</span>
                <span class="stat">基地数量: 5个</span>
              </div>
              <p>通过移动端应用，农场主可以随时随地管理牧场，大大提高了工作效率。</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 联系咨询 -->
    <section class="contact-cta">
      <div class="container">
        <div class="cta-content">
          <h2>了解更多产品信息</h2>
          <p>如果您对我们的产品感兴趣，欢迎联系我们获取详细资料和演示</p>
          <div class="cta-actions">
            <router-link to="/portal/contact" class="btn btn-primary">立即咨询</router-link>
            <a href="tel:400-123-4567" class="btn btn-outline">电话咨询</a>
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
  modules: false,
  tech: false,
  services: false,
  cases: false
})

// 滚动监听
const handleScroll = () => {
  const elements = [
    { key: 'modules', selector: '.modules-grid' },
    { key: 'tech', selector: '.tech-grid' },
    { key: 'services', selector: '.service-list' },
    { key: 'cases', selector: '.cases-grid' }
  ]

  elements.forEach(({ key, selector }) => {
    const element = document.querySelector(selector)
    if (element && !isVisible.value[key]) {
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      if (rect.top < windowHeight * 0.8) {
        isVisible.value[key] = true
      }
    }
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
.products-page {
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
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="tech" width="50" height="50" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="40" cy="10" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23tech)"/></svg>');
  animation: techPattern 15s linear infinite;
}

@keyframes techPattern {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-50px, -50px); }
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

/* 产品概述 */
.product-overview {
  padding: 80px 0;
  background: white;
}

.overview-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.overview-text h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 24px 0;
  color: #2c3e50;
}

.overview-text p {
  font-size: 16px;
  line-height: 1.8;
  color: #6c757d;
  margin: 0 0 30px 0;
}

.product-highlights {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #2c3e50;
}

.highlight-item .icon {
  font-size: 20px;
  color: #667eea;
}

.overview-image {
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

/* 功能模块 */
.modules-section {
  padding: 100px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
}

.modules-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="modules" width="30" height="30" patternUnits="userSpaceOnUse"><rect x="0" y="0" width="1" height="1" fill="rgba(102,126,234,0.03)"/><rect x="15" y="15" width="1" height="1" fill="rgba(102,126,234,0.03)"/></pattern></defs><rect width="100" height="100" fill="url(%23modules)"/></svg>');
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

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 40px;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}

.modules-grid.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.module-card {
  background: white;
  padding: 50px 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  animation: cardSlideIn 0.8s ease-out forwards;
  position: relative;
  overflow: hidden;
}

.module-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.module-card:hover::before {
  left: 100%;
}

.module-card:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
}

.module-icon {
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.module-card h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.module-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.module-features li {
  padding: 8px 0;
  font-size: 14px;
  color: #6c757d;
  position: relative;
  padding-left: 20px;
}

.module-features li::before {
  content: '•';
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: 0;
}

.module-benefits {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.benefit-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* 技术特色 */
.tech-features {
  padding: 80px 0;
  background: white;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.tech-item {
  text-align: center;
  padding: 30px 20px;
}

.tech-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.tech-item h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.tech-item p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 服务支持 */
.service-support {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.service-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.service-item {
  background: white;
  padding: 30px;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.service-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.service-info h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.service-info p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 成功案例 */
.success-cases {
  padding: 80px 0;
  background: white;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.case-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.case-card:hover {
  transform: translateY(-5px);
}

.case-image {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: white;
}

.case-content {
  padding: 30px;
}

.case-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.case-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.stat {
  background-color: #f8f9fa;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  color: #6c757d;
}

.case-content p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 联系咨询 */
.contact-cta {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.cta-content h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.cta-content p {
  font-size: 18px;
  margin: 0 0 30px 0;
  opacity: 0.9;
}

.cta-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 36px;
  }
  
  .page-header p {
    font-size: 18px;
  }
  
  .overview-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .product-highlights {
    grid-template-columns: 1fr;
  }
  
  .image-placeholder {
    width: 300px;
    height: 200px;
  }
  
  .placeholder-icon {
    font-size: 60px;
  }
  
  .modules-grid,
  .tech-grid,
  .service-list,
  .cases-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .overview-text h2,
  .cta-content h2 {
    font-size: 28px;
  }
  
  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .case-stats {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 60px 0;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .product-overview,
  .modules-section,
  .tech-features,
  .service-support,
  .success-cases,
  .contact-cta {
    padding: 60px 0;
  }
  
  .module-card,
  .service-item,
  .case-content {
    padding: 20px;
  }
  
  .service-item {
    flex-direction: column;
    text-align: center;
  }
}
</style>