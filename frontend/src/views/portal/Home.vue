<template>
  <div class="portal-home">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-background">
        <div class="hero-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
      </div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <div class="hero-badge">
              <div class="badge-icon rocket-icon"></div>
              <span class="badge-text">智能化牧场管理领导者</span>
            </div>
            <h1 class="hero-title">
              <span class="title-highlight">智慧牧场</span>
              <br>全生命周期管理系统
            </h1>
            <p class="hero-subtitle">
              运用先进的数字化技术，为现代牧场提供从牛只档案到销售管理的全流程解决方案，
              让牧场管理更智能、更高效、更科学。
            </p>
            <div class="hero-stats">
              <div class="stat-item">
                <div class="stat-number">50+</div>
                <div class="stat-label">服务牧场</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">10万+</div>
                <div class="stat-label">管理牛只</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">99%</div>
                <div class="stat-label">客户满意度</div>
              </div>
            </div>
            <div class="hero-actions">
              <router-link to="/portal/products" class="btn btn-primary">
                <div class="btn-icon icon-search"></div>
                <span>了解产品</span>
              </router-link>
              <router-link to="/portal/contact" class="btn btn-outline">
                <div class="btn-icon icon-chat"></div>
                <span>免费咨询</span>
              </router-link>
            </div>
            <div class="hero-features">
              <div class="feature-item">
                <div class="feature-icon icon-chart"></div>
                <span>数据驱动决策</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon icon-cattle"></div>
                <span>全生命周期管理</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon icon-mobile"></div>
                <span>多平台支持</span>
              </div>
              <div class="feature-item">
                <div class="feature-icon icon-lock"></div>
                <span>数据安全可靠</span>
              </div>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-image">
              <div class="image-container">
                <div class="dashboard-mockup">
                  <div class="mockup-header">
                    <div class="mockup-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div class="mockup-title">智慧牧场管理系统</div>
                  </div>
                  <div class="mockup-content">
                    <div class="mockup-sidebar">
                      <div class="sidebar-item active"><div class="icon-chart" style="display: inline-block; margin-right: 8px;"></div> 数据总览</div>
                      <div class="sidebar-item"><div class="icon-cattle" style="display: inline-block; margin-right: 8px;"></div> 牛场管理</div>
                      <div class="sidebar-item"><div class="icon-medical" style="display: inline-block; margin-right: 8px;"></div> 健康管理</div>
                      <div class="sidebar-item"><div class="icon-feed" style="display: inline-block; margin-right: 8px;"></div> 饲喂管理</div>
                    </div>
                    <div class="mockup-main">
                      <div class="chart-area">
                        <div class="chart-placeholder">
                          <div class="chart-bars">
                            <div class="bar" style="height: 60%"></div>
                            <div class="bar" style="height: 80%"></div>
                            <div class="bar" style="height: 45%"></div>
                            <div class="bar" style="height: 90%"></div>
                            <div class="bar" style="height: 70%"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="floating-cards">
                  <div class="floating-card card-1">
                    <div class="card-icon">
                      <div class="icon-cattle" style="color: white;"></div>
                    </div>
                    <div class="card-text">
                      <div class="card-number">1,234</div>
                      <div class="card-label">健康牛只</div>
                    </div>
                  </div>
                  <div class="floating-card card-2">
                    <div class="card-icon">
                      <div class="icon-chart" style="color: white;"></div>
                    </div>
                    <div class="card-text">
                      <div class="card-number">+15%</div>
                      <div class="card-label">效率提升</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 核心功能介绍 -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2>核心功能</h2>
          <p>全面覆盖肉牛养殖各个环节，提供一站式管理解决方案</p>
        </div>
        <div class="features-grid" :class="{ 'animate-in': isVisible.features }">
          <div class="feature-card" style="animation-delay: 0.1s">
            <div class="feature-icon modern-icon-xl icon-cattle icon-pulse"></div>
            <h3>牛只档案管理</h3>
            <p>建立完整的牛只档案，记录生长发育全过程，支持批量操作和数据导入导出</p>
          </div>
          <div class="feature-card" style="animation-delay: 0.2s">
            <div class="feature-icon modern-icon-xl icon-medical icon-pulse"></div>
            <h3>健康管理</h3>
            <p>实时监测牛只健康状况，建立疫苗接种计划，提供健康预警和诊疗记录管理</p>
          </div>
          <div class="feature-card" style="animation-delay: 0.3s">
            <div class="feature-icon modern-icon-xl icon-feed icon-pulse"></div>
            <h3>精准饲喂</h3>
            <p>科学配制饲料配方，记录饲喂数据，分析饲喂效果，优化饲料成本</p>
          </div>
          <div class="feature-card" style="animation-delay: 0.4s">
            <div class="feature-icon modern-icon-xl icon-package icon-pulse"></div>
            <h3>物资管理</h3>
            <p>管理饲料、药品等生产物资，实现库存预警，优化采购计划</p>
          </div>
          <div class="feature-card" style="animation-delay: 0.5s">
            <div class="feature-icon modern-icon-xl icon-tools icon-pulse"></div>
            <h3>设备管理</h3>
            <p>建立设备档案，制定维护计划，记录故障维修，提高设备使用效率</p>
          </div>
          <div class="feature-card" style="animation-delay: 0.6s">
            <div class="feature-icon modern-icon-xl icon-chart icon-pulse"></div>
            <h3>数据分析</h3>
            <p>提供全面的数据统计分析，生成各类报表，支持决策制定</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 优势特点 -->
    <section class="advantages-section">
      <div class="container">
        <div class="section-header">
          <h2>产品优势</h2>
          <p>基于现代化技术架构，为牧场管理提供强有力的技术支撑</p>
        </div>
        <div class="advantages-grid" :class="{ 'animate-in': isVisible.advantages }">
          <div class="advantage-item" style="animation-delay: 0.1s">
            <div class="advantage-number">01</div>
            <h3>专业性强</h3>
            <p>针对肉牛养殖行业特点量身定制，深度贴合业务需求</p>
          </div>
          <div class="advantage-item" style="animation-delay: 0.2s">
            <div class="advantage-number">02</div>
            <h3>操作简便</h3>
            <p>界面友好，操作简单，支持PC端和移动端多平台使用</p>
          </div>
          <div class="advantage-item" style="animation-delay: 0.3s">
            <div class="advantage-number">03</div>
            <h3>数据安全</h3>
            <p>采用先进的数据加密技术，确保数据安全可靠</p>
          </div>
          <div class="advantage-item" style="animation-delay: 0.4s">
            <div class="advantage-number">04</div>
            <h3>扩展性好</h3>
            <p>模块化设计，支持功能扩展和定制开发</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 新闻动态 -->
    <section class="news-section">
      <div class="container">
        <div class="section-header">
          <h2>新闻动态</h2>
          <p>了解最新的行业资讯和产品动态</p>
        </div>
        <div class="news-grid" v-if="newsList.length > 0" :class="{ 'animate-in': isVisible.news }">
          <div 
            v-for="(news, index) in newsList.slice(0, 3)" 
            :key="news.id" 
            class="news-card"
            :style="{ 'animation-delay': `${(index + 1) * 0.1}s` }"
            @click="$router.push(`/portal/news/${news.id}`)"
          >
            <div class="news-image">
              <img v-if="news.coverImage" :src="news.coverImage" :alt="news.title" />
              <div v-else class="news-placeholder">
                <div class="icon-news modern-icon-lg"></div>
              </div>
            </div>
            <div class="news-content">
              <h3>{{ news.title }}</h3>
              <p>{{ news.summary || news.content.substring(0, 100) + '...' }}</p>
              <div class="news-meta">
                <span class="news-date">{{ formatDate(news.publishTime || news.createdAt) }}</span>
                <span class="news-views">{{ news.viewCount || 0 }} 次浏览</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-news">
          <p>暂无新闻动态</p>
        </div>
        <div class="news-more">
          <router-link to="/portal/news" class="btn btn-outline">查看更多</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { newsApi } from '@/api/news'

interface NewsArticle {
  id: number
  title: string
  summary?: string
  content: string
  coverImage?: string
  publishTime?: string
  createdAt: string
  viewCount?: number
}

const newsList = ref<NewsArticle[]>([])

// 动画状态
const isVisible = ref<Record<string, boolean>>({
  features: false,
  advantages: false,
  news: false
})

const fetchNews = async () => {
  try {
    const response = await newsApi.getPublicNews({
      page: 1,
      limit: 3,
      status: 'published'
    })
    newsList.value = response.data.data || []
  } catch (error) {
    console.error('获取新闻失败:', error)
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 滚动监听
const handleScroll = () => {
  const elements = [
    { key: 'features', selector: '.features-grid' },
    { key: 'advantages', selector: '.advantages-grid' },
    { key: 'news', selector: '.news-grid' }
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
  fetchNews()
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 初始检查
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.portal-home {
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

/* 英雄区域 */
.hero-section {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 0 80px;
  min-height: 100vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.hero-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 5%;
  animation-delay: 2s;
}

.shape-3 {
  width: 100px;
  height: 100px;
  top: 50%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.hero-content {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 现代化图标样式 */
.rocket-icon {
  width: 16px;
  height: 16px;
  position: relative;
  display: inline-block;
}

.rocket-icon::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 12px;
  background: currentColor;
  border-radius: 4px 4px 0 0;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
}

.rocket-icon::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 4px solid currentColor;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin: 0 0 24px 0;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.title-highlight {
  background: linear-gradient(45deg, #fff, #f0f8ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 18px;
  margin: 0 0 32px 0;
  opacity: 0.9;
  line-height: 1.7;
  max-width: 500px;
}

.hero-stats {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
  color: #fff;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(255, 255, 255, 0.4);
}

.btn-outline {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-outline:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 18px;
}

.hero-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.feature-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 英雄区域视觉效果 */
.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-container {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.dashboard-mockup {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.mockup-header {
  background: #f8f9fa;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e9ecef;
}

.mockup-dots {
  display: flex;
  gap: 6px;
}

.mockup-dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #dee2e6;
}

.mockup-dots span:nth-child(1) { background: #ff5f56; }
.mockup-dots span:nth-child(2) { background: #ffbd2e; }
.mockup-dots span:nth-child(3) { background: #27ca3f; }

.mockup-title {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.mockup-content {
  display: flex;
  height: 300px;
}

.mockup-sidebar {
  width: 200px;
  background: #f8f9fa;
  padding: 20px 0;
  border-right: 1px solid #e9ecef;
}

.sidebar-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-item.active {
  background: #667eea;
  color: white;
  font-weight: 500;
}

.mockup-main {
  flex: 1;
  padding: 20px;
  background: white;
}

.chart-area {
  height: 100%;
  display: flex;
  align-items: end;
  justify-content: center;
}

.chart-bars {
  display: flex;
  align-items: end;
  gap: 12px;
  height: 200px;
}

.bar {
  width: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  animation: growUp 2s ease-out;
}

@keyframes growUp {
  from { height: 0; }
  to { height: var(--height); }
}

.floating-cards {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: floatCard 4s ease-in-out infinite;
}

.card-1 {
  top: 20%;
  right: -20px;
  animation-delay: 1s;
}

.card-2 {
  bottom: 20%;
  left: -20px;
  animation-delay: 3s;
}

@keyframes floatCard {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.card-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-number {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 2px;
}

.card-label {
  font-size: 12px;
  color: #6c757d;
}

/* 功能介绍区域 */
.features-section {
  padding: 100px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  position: relative;
}

.features-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(102,126,234,0.03)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
  opacity: 0.5;
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 2;
}

.section-header h2 {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: #2c3e50;
  letter-spacing: -0.01em;
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
  line-height: 1.6;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}

.features-grid.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.feature-card {
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

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.5s;
}

.feature-card:hover::before {
  left: 100%;
}

.feature-card:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
}

.feature-icon {
  font-size: 64px;
  margin-bottom: 25px;
  display: inline-block;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.feature-card h3 {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #2c3e50;
  position: relative;
}

.feature-card h3::after {
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

.feature-card p {
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

/* 优势特点区域 */
.advantages-section {
  padding: 100px 0;
  background: white;
  position: relative;
}

.advantages-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="circles" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="rgba(102,126,234,0.02)"/></pattern></defs><rect width="100" height="100" fill="url(%23circles)"/></svg>');
  opacity: 0.7;
}

.advantages-section .section-header {
  text-align: center;
  margin-bottom: 80px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  position: relative;
  z-index: 2;
}

.advantages-section .section-header h2 {
  font-size: 42px;
  font-weight: 800;
  margin: 0 0 20px 0;
  color: #2c3e50;
  letter-spacing: -0.01em;
  position: relative;
  animation: fadeInDown 1s ease-out;
}

.advantages-section .section-header h2::after {
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

.advantages-section .section-header p {
  font-size: 20px;
  color: #6c757d;
  margin: 0;
  line-height: 1.6;
  animation: fadeInUp 1s ease-out 0.2s both;
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 50px;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}

.advantages-grid.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.advantage-item {
  text-align: center;
  opacity: 0;
  transform: translateY(30px) scale(0.9);
  animation: advantageSlideIn 0.8s ease-out forwards;
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.advantage-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102,126,234,0.1), transparent);
  transition: left 0.6s;
}

.advantage-item:hover::before {
  left: 100%;
}

.advantage-item:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.15);
}

.advantage-number {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
  margin: 0 auto 25px auto;
  position: relative;
  transition: all 0.4s ease;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.advantage-number::before {
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

.advantage-item:hover .advantage-number::before {
  opacity: 0.3;
}

.advantage-item:hover .advantage-number {
  transform: scale(1.1) rotate(10deg);
}

.advantage-item h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 15px 0;
  color: #2c3e50;
  position: relative;
}

.advantage-item h3::after {
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

.advantage-item p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.7;
  margin: 0;
}

@keyframes advantageSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 新闻动态区域 */
.news-section {
  padding: 100px 0;
  background-color: #f8f9fa;
}

.news-section .section-header {
  text-align: center;
  margin-bottom: 80px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.news-section .section-header h2 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #2c3e50;
  letter-spacing: -0.01em;
}

.news-section .section-header p {
  font-size: 20px;
  color: #6c757d;
  margin: 0;
  line-height: 1.6;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 40px;
  margin-bottom: 60px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.news-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.news-image {
  height: 200px;
  overflow: hidden;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
}

.news-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-placeholder {
  font-size: 48px;
  color: #6c757d;
}

.news-content {
  padding: 24px;
}

.news-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
  line-height: 1.4;
}

.news-content p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #adb5bd;
}

.no-news {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.news-more {
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .hero-content {
    gap: 60px;
  }
  
  .hero-title {
    font-size: 48px;
  }
  
  .dashboard-mockup {
    transform: scale(0.9);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 100px 0 60px;
    min-height: auto;
  }
  
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 40px;
  }
  
  .hero-subtitle {
    font-size: 16px;
    max-width: none;
  }
  
  .hero-stats {
    justify-content: center;
    gap: 30px;
  }
  
  .hero-features {
    grid-template-columns: 1fr;
    gap: 12px;
    max-width: 300px;
    margin: 0 auto;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .dashboard-mockup {
    transform: scale(0.8);
  }
  
  .floating-cards {
    display: none; /* 隐藏浮动卡片在移动端 */
  }
  
  .features-grid,
  .advantages-grid,
  .news-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .feature-card {
    padding: 30px 20px;
  }
  
  .features-section,
  .advantages-section,
  .news-section {
    padding: 60px 0;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 80px 0 40px;
  }
  
  .hero-title {
    font-size: 32px;
    line-height: 1.2;
  }
  
  .hero-subtitle {
    font-size: 15px;
  }
  
  .hero-stats {
    gap: 20px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
    padding: 16px 24px;
  }
  
  .dashboard-mockup {
    transform: scale(0.7);
  }
  
  .mockup-content {
    height: 250px;
  }
  
  .mockup-sidebar {
    width: 150px;
  }
  
  .sidebar-item {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .section-header h2 {
    font-size: 24px;
  }
  
  .section-header p {
    font-size: 16px;
  }
  
  .features-section,
  .advantages-section,
  .news-section {
    padding: 50px 0;
  }
  
  .feature-card {
    padding: 25px 20px;
  }
  
  .feature-card h3 {
    font-size: 20px;
  }
  
  .feature-card p {
    font-size: 14px;
  }
}
</style>