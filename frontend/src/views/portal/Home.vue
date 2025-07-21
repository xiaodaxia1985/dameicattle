<template>
  <div class="portal-home">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-title">肉牛全生命周期管理系统</h1>
            <p class="hero-subtitle">专业的数字化牧场管理解决方案，助力现代化畜牧业发展</p>
            <div class="hero-features">
              <div class="feature-item">
                <i class="icon">📊</i>
                <span>数据驱动决策</span>
              </div>
              <div class="feature-item">
                <i class="icon">🐄</i>
                <span>全生命周期管理</span>
              </div>
              <div class="feature-item">
                <i class="icon">📱</i>
                <span>移动端支持</span>
              </div>
            </div>
            <div class="hero-actions">
              <router-link to="/portal/products" class="btn btn-primary">了解产品</router-link>
              <router-link to="/portal/contact" class="btn btn-outline">联系我们</router-link>
            </div>
          </div>
          <div class="hero-image">
            <div class="image-placeholder">
              <i class="placeholder-icon">🏭</i>
              <p>现代化牧场管理</p>
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
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🐄</div>
            <h3>牛只档案管理</h3>
            <p>建立完整的牛只档案，记录生长发育全过程，支持批量操作和数据导入导出</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🏥</div>
            <h3>健康管理</h3>
            <p>实时监测牛只健康状况，建立疫苗接种计划，提供健康预警和诊疗记录管理</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌾</div>
            <h3>精准饲喂</h3>
            <p>科学配制饲料配方，记录饲喂数据，分析饲喂效果，优化饲料成本</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📦</div>
            <h3>物资管理</h3>
            <p>管理饲料、药品等生产物资，实现库存预警，优化采购计划</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🛠️</div>
            <h3>设备管理</h3>
            <p>建立设备档案，制定维护计划，记录故障维修，提高设备使用效率</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
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
        <div class="advantages-grid">
          <div class="advantage-item">
            <div class="advantage-number">01</div>
            <h3>专业性强</h3>
            <p>针对肉牛养殖行业特点量身定制，深度贴合业务需求</p>
          </div>
          <div class="advantage-item">
            <div class="advantage-number">02</div>
            <h3>操作简便</h3>
            <p>界面友好，操作简单，支持PC端和移动端多平台使用</p>
          </div>
          <div class="advantage-item">
            <div class="advantage-number">03</div>
            <h3>数据安全</h3>
            <p>采用先进的数据加密技术，确保数据安全可靠</p>
          </div>
          <div class="advantage-item">
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
        <div class="news-grid" v-if="newsList.length > 0">
          <div 
            v-for="news in newsList.slice(0, 3)" 
            :key="news.id" 
            class="news-card"
            @click="$router.push(`/portal/news/${news.id}`)"
          >
            <div class="news-image">
              <img v-if="news.coverImage" :src="news.coverImage" :alt="news.title" />
              <div v-else class="news-placeholder">📰</div>
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
import { ref, onMounted } from 'vue'
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

onMounted(() => {
  fetchNews()
})
</script>

<style scoped>
.portal-home {
  min-height: 100vh;
}

/* 英雄区域 */
.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  min-height: 600px;
  display: flex;
  align-items: center;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 20px 0;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 20px;
  margin: 0 0 40px 0;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-features {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.feature-item .icon {
  font-size: 20px;
}

.hero-actions {
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
  text-align: center;
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

.hero-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 400px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.image-placeholder p {
  font-size: 18px;
  margin: 0;
}

/* 功能介绍区域 */
.features-section {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.section-header p {
  font-size: 18px;
  color: #6c757d;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.feature-card {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.feature-card p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 优势特点区域 */
.advantages-section {
  padding: 80px 0;
  background: white;
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.advantage-item {
  text-align: center;
}

.advantage-number {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 20px auto;
}

.advantage-item h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.advantage-item p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 新闻动态区域 */
.news-section {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.news-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
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
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 36px;
  }
  
  .hero-subtitle {
    font-size: 18px;
  }
  
  .hero-features {
    flex-direction: column;
    gap: 15px;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .image-placeholder {
    width: 300px;
    height: 200px;
  }
  
  .placeholder-icon {
    font-size: 60px;
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
}

@media (max-width: 480px) {
  .hero-section {
    padding: 60px 0;
  }
  
  .hero-title {
    font-size: 28px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .features-section,
  .advantages-section,
  .news-section {
    padding: 60px 0;
  }
  
  .section-header h2 {
    font-size: 24px;
  }
}
</style>