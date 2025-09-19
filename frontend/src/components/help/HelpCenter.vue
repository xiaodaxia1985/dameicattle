<template>
  <div class="help-center">
    <!-- 搜索区域 -->
    <div class="search-section">
      <div class="search-header">
        <h1>帮助中心</h1>
        <p>搜索您需要的帮助信息</p>
      </div>
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="输入关键词搜索帮助内容..."
          size="large"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-access">
      <div class="access-grid">
        <div class="access-item" @click="showFAQ">
          <el-icon class="access-icon"><QuestionFilled /></el-icon>
          <h3>常见问题</h3>
          <p>查看常见问题解答</p>
        </div>
        <div class="access-item" @click="showTutorials">
          <el-icon class="access-icon"><VideoPlay /></el-icon>
          <h3>视频教程</h3>
          <p>观看操作演示视频</p>
        </div>
        <div class="access-item" @click="showUserManual">
          <el-icon class="access-icon"><Document /></el-icon>
          <h3>用户手册</h3>
          <p>详细的使用说明文档</p>
        </div>
        <div class="access-item" @click="startChat">
          <el-icon class="access-icon"><ChatDotRound /></el-icon>
          <h3>在线客服</h3>
          <p>与客服人员实时沟通</p>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area">
      <!-- 搜索结果 -->
      <div v-if="showSearchResults" class="search-results">
        <h2>搜索结果</h2>
        <div v-if="searchResults.articles.length > 0" class="result-section">
          <h3>帮助文章</h3>
          <div class="article-list">
            <div
              v-for="article in searchResults.articles"
              :key="article.id"
              class="article-item"
              @click="viewArticle(article.id)"
            >
              <h4>{{ article.title }}</h4>
              <p>{{ article.summary }}</p>
              <div class="article-meta">
                <span class="category">{{ article.category }}</span>
                <span class="date">{{ formatDate(article.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="searchResults.faqs.length > 0" class="result-section">
          <h3>常见问题</h3>
          <div class="faq-list">
            <el-collapse>
              <el-collapse-item
                v-for="faq in searchResults.faqs"
                :key="faq.id"
                :title="faq.question"
              >
                <div v-html="faq.answer"></div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>

        <div v-if="searchResults.tutorials.length > 0" class="result-section">
          <h3>视频教程</h3>
          <div class="tutorial-list">
            <div
              v-for="tutorial in searchResults.tutorials"
              :key="tutorial.id"
              class="tutorial-item"
              @click="viewTutorial(tutorial.id)"
            >
              <div class="tutorial-info">
                <h4>{{ tutorial.title }}</h4>
                <p>{{ tutorial.description }}</p>
                <div class="tutorial-meta">
                  <span class="duration">{{ tutorial.duration }}分钟</span>
                  <span class="category">{{ tutorial.category }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isSearchEmpty" class="no-results">
          <el-empty description="没有找到相关内容">
            <el-button @click="clearSearch">清除搜索</el-button>
          </el-empty>
        </div>
      </div>

      <!-- 常见问题 -->
      <div v-else-if="currentView === 'faq'" class="faq-section">
        <div class="section-header">
          <h2>常见问题</h2>
          <el-button @click="goBack" link>
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
        </div>
        
        <div class="faq-categories">
          <el-tabs v-model="activeFAQCategory" @tab-change="loadFAQ">
            <el-tab-pane
              v-for="category in faqCategories"
              :key="category.key"
              :label="category.label"
              :name="category.key"
            >
              <el-collapse v-model="activeFAQItems">
                <el-collapse-item
                  v-for="faq in faqList"
                  :key="faq.id"
                  :name="faq.id.toString()"
                  :title="faq.question"
                >
                  <div v-html="faq.answer"></div>
                </el-collapse-item>
              </el-collapse>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 视频教程 -->
      <div v-else-if="currentView === 'tutorials'" class="tutorials-section">
        <div class="section-header">
          <h2>视频教程</h2>
          <el-button @click="goBack" link>
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        </div>

        <div class="tutorial-filters">
          <el-select v-model="tutorialCategory" placeholder="选择分类" @change="loadTutorials">
            <el-option label="全部" value=""></el-option>
            <el-option label="基础操作" value="basic"></el-option>
            <el-option label="牛场管理" value="cattle"></el-option>
            <el-option label="健康管理" value="health"></el-option>
            <el-option label="饲喂管理" value="feeding"></el-option>
          </el-select>
          
          <el-select v-model="tutorialLevel" placeholder="选择难度" @change="loadTutorials">
            <el-option label="全部" value=""></el-option>
            <el-option label="初级" value="beginner"></el-option>
            <el-option label="中级" value="intermediate"></el-option>
            <el-option label="高级" value="advanced"></el-option>
          </el-select>
        </div>

        <div class="tutorial-grid">
          <div
            v-for="tutorial in tutorialList"
            :key="tutorial.id"
            class="tutorial-card"
            @click="viewTutorial(tutorial.id)"
          >
            <div class="tutorial-thumbnail">
              <img :src="tutorial.thumbnailUrl" :alt="tutorial.title" />
              <div class="play-overlay">
                <el-icon class="play-icon"><VideoPlay /></el-icon>
              </div>
              <div class="duration-badge">{{ tutorial.duration }}分钟</div>
            </div>
            <div class="tutorial-content">
              <h4>{{ tutorial.title }}</h4>
              <p>{{ tutorial.description }}</p>
              <div class="tutorial-meta">
                <span class="level">{{ getLevelText(tutorial.level) }}</span>
                <span class="views">{{ tutorial.viewCount }}次观看</span>
              </div>
              <div v-if="tutorial.userProgress" class="progress-bar">
                <el-progress
                  :percentage="tutorial.userProgress.progress"
                  :status="tutorial.userProgress.completed ? 'success' : ''"
                  :show-text="false"
                  :stroke-width="4"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 用户手册 -->
      <div v-else-if="currentView === 'manual'" class="manual-section">
        <div class="section-header">
          <h2>用户手册</h2>
          <el-button @click="goBack" link>
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        </div>

        <div class="manual-content">
          <div class="manual-sidebar">
            <el-menu
              :default-active="activeManualSection"
              @select="selectManualSection"
            >
              <el-menu-item index="quick-start">
                <el-icon><Promotion /></el-icon>
                <span>快速开始</span>
              </el-menu-item>
              <el-menu-item index="user-management">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
              <el-menu-item index="cattle-management">
                <el-icon><Grid /></el-icon>
                <span>牛只管理</span>
              </el-menu-item>
              <el-menu-item index="health-management">
                <el-icon><FirstAidKit /></el-icon>
                <span>健康管理</span>
              </el-menu-item>
              <el-menu-item index="feeding-management">
                <el-icon><Bowl /></el-icon>
                <span>饲喂管理</span>
              </el-menu-item>
            </el-menu>
          </div>
          <div class="manual-main">
            <div class="manual-article" v-html="manualContent"></div>
          </div>
        </div>
      </div>

      <!-- 默认首页 -->
      <div v-else class="home-content">
        <div class="featured-articles">
          <h2>推荐文章</h2>
          <div class="article-grid">
            <div
              v-for="article in featuredArticles"
              :key="article.id"
              class="featured-article"
              @click="viewArticle(article.id)"
            >
              <h3>{{ article.title }}</h3>
              <p>{{ article.summary }}</p>
              <div class="article-footer">
                <span class="category">{{ article.category }}</span>
                <span class="views">{{ article.viewCount }}次浏览</span>
              </div>
            </div>
          </div>
        </div>

        <div class="recent-updates">
          <h2>最近更新</h2>
          <div class="update-list">
            <div
              v-for="article in recentArticles"
              :key="article.id"
              class="update-item"
              @click="viewArticle(article.id)"
            >
              <div class="update-content">
                <h4>{{ article.title }}</h4>
                <p>{{ article.summary }}</p>
              </div>
              <div class="update-date">
                {{ formatDate(article.updatedAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 在线客服对话框 -->
    <ChatDialog
      v-if="showChatDialog"
      @close="showChatDialog = false"
    />

    <!-- 文章详情对话框 -->
    <ArticleDialog
      v-if="showArticleDialog"
      :article-id="selectedArticleId"
      @close="showArticleDialog = false"
    />

    <!-- 视频播放对话框 -->
    <VideoDialog
      v-if="showVideoDialog"
      :tutorial-id="selectedTutorialId"
      @close="showVideoDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  QuestionFilled,
  VideoPlay,
  Document,
  ChatDotRound,
  ArrowLeft,
  Promotion,
  User,
  Grid,
  FirstAidKit,
  Bowl
} from '@element-plus/icons-vue'
import { helpApi } from '@/api/help'
import { formatDate } from '@/utils/date'
import ChatDialog from './ChatDialog.vue'
import ArticleDialog from './ArticleDialog.vue'
import VideoDialog from './VideoDialog.vue'

// 响应式数据
const searchQuery = ref('')
const currentView = ref('home')
const showSearchResults = ref(false)
const showChatDialog = ref(false)
const showArticleDialog = ref(false)
const showVideoDialog = ref(false)
const selectedArticleId = ref(null)
const selectedTutorialId = ref(null)

// 搜索结果
const searchResults = reactive({
  articles: [],
  faqs: [],
  tutorials: []
})

// FAQ相关
const activeFAQCategory = ref('general')
const activeFAQItems = ref([])
const faqCategories = ref([
  { key: 'general', label: '常规问题' },
  { key: 'login', label: '登录问题' },
  { key: 'cattle', label: '牛只管理' },
  { key: 'health', label: '健康管理' },
  { key: 'technical', label: '技术问题' }
])
const faqList = ref([])

// 教程相关
const tutorialCategory = ref('')
const tutorialLevel = ref('')
const tutorialList = ref([])

// 用户手册相关
const activeManualSection = ref('quick-start')
const manualContent = ref('')

// 首页内容
const featuredArticles = ref([])
const recentArticles = ref([])

// 计算属性
const isSearchEmpty = computed(() => {
  return searchResults.articles.length === 0 &&
         searchResults.faqs.length === 0 &&
         searchResults.tutorials.length === 0
})

// 方法
const handleSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }

  try {
    const response = await helpApi.searchHelp(searchQuery.value)
    // 根据API实现，response.data 应该是搜索结果数据
    Object.assign(searchResults, response.data || {})
    showSearchResults.value = true
    currentView.value = 'search'
  } catch (error) {
    ElMessage.error('搜索失败')
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  showSearchResults.value = false
  currentView.value = 'home'
}

const showFAQ = () => {
  currentView.value = 'faq'
  loadFAQ()
}

const showTutorials = () => {
  currentView.value = 'tutorials'
  loadTutorials()
}

const showUserManual = () => {
  currentView.value = 'manual'
  loadManualContent()
}

const startChat = () => {
  showChatDialog.value = true
}

const goBack = () => {
  currentView.value = 'home'
}

const loadFAQ = async () => {
  try {
    const response = await helpApi.getFAQ(activeFAQCategory.value)
    faqList.value = response.data[activeFAQCategory.value] || []
  } catch (error) {
    ElMessage.error('加载常见问题失败')
  }
}

const loadTutorials = async () => {
  try {
    const params = {}
    if (tutorialCategory.value) params.category = tutorialCategory.value
    if (tutorialLevel.value) params.level = tutorialLevel.value
    
    const response = await helpApi.getTutorials(params)
    // 根据API实现，response.data 应该是教程列表数据
    tutorialList.value = response.data || []
  } catch (error) {
    ElMessage.error('加载视频教程失败')
  }
}

const loadManualContent = async () => {
  try {
    const response = await helpApi.getManualSection(activeManualSection.value)
    manualContent.value = response.data.content
  } catch (error) {
    ElMessage.error('加载用户手册失败')
  }
}

const selectManualSection = (section) => {
  activeManualSection.value = section
  loadManualContent()
}

const viewArticle = (articleId) => {
  selectedArticleId.value = articleId
  showArticleDialog.value = true
}

const viewTutorial = (tutorialId) => {
  selectedTutorialId.value = tutorialId
  showVideoDialog.value = true
}

const getLevelText = (level) => {
  const levelMap = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }
  return levelMap[level] || level
}

const loadHomeContent = async () => {
  try {
    // 加载推荐文章
    const featuredResponse = await helpApi.getHelpArticles({ featured: true, limit: 6 })
    featuredArticles.value = featuredResponse.data.items

    // 加载最近更新
    const recentResponse = await helpApi.getHelpArticles({ limit: 5 })
    recentArticles.value = recentResponse.data.items
  } catch (error) {
    console.error('加载首页内容失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadHomeContent()
})
</script>

<style scoped>
.help-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.search-section {
  text-align: center;
  margin-bottom: 40px;
}

.search-header h1 {
  font-size: 2.5em;
  color: #333;
  margin-bottom: 10px;
}

.search-header p {
  color: #666;
  font-size: 1.1em;
  margin-bottom: 30px;
}

.search-box {
  max-width: 600px;
  margin: 0 auto;
}

.quick-access {
  margin-bottom: 40px;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.access-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.access-item:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.access-icon {
  font-size: 3em;
  color: #409eff;
  margin-bottom: 15px;
}

.access-item h3 {
  color: #333;
  margin-bottom: 10px;
}

.access-item p {
  color: #666;
  font-size: 0.9em;
}

.content-area {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h2 {
  color: #333;
  margin: 0;
}

.search-results .result-section {
  margin-bottom: 40px;
}

.search-results .result-section h3 {
  color: #409eff;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.article-list .article-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.article-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.article-item h4 {
  color: #333;
  margin-bottom: 10px;
}

.article-item p {
  color: #666;
  margin-bottom: 15px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: #999;
}

.category {
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
}

.tutorial-filters {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.tutorial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.tutorial-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tutorial-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.tutorial-thumbnail {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.tutorial-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-icon {
  color: white;
  font-size: 24px;
}

.duration-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.tutorial-content {
  padding: 15px;
}

.tutorial-content h4 {
  color: #333;
  margin-bottom: 8px;
}

.tutorial-content p {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 10px;
}

.tutorial-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #999;
  margin-bottom: 10px;
}

.level {
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 6px;
  border-radius: 3px;
}

.progress-bar {
  margin-top: 10px;
}

.manual-content {
  display: flex;
  gap: 30px;
}

.manual-sidebar {
  width: 250px;
  flex-shrink: 0;
}

.manual-main {
  flex: 1;
}

.manual-article {
  line-height: 1.8;
  color: #333;
}

.manual-article h1,
.manual-article h2,
.manual-article h3 {
  color: #409eff;
  margin-top: 30px;
  margin-bottom: 15px;
}

.manual-article p {
  margin-bottom: 15px;
}

.manual-article ul,
.manual-article ol {
  margin-bottom: 15px;
  padding-left: 30px;
}

.home-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
}

.featured-articles h2,
.recent-updates h2 {
  color: #333;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.featured-article {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.featured-article:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.featured-article h3 {
  color: #333;
  margin-bottom: 10px;
}

.featured-article p {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  color: #999;
}

.update-list {
  space-y: 15px;
}

.update-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 15px;
}

.update-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.update-content {
  flex: 1;
}

.update-content h4 {
  color: #333;
  margin-bottom: 5px;
}

.update-content p {
  color: #666;
  font-size: 0.9em;
}

.update-date {
  color: #999;
  font-size: 0.8em;
  white-space: nowrap;
  margin-left: 15px;
}

.no-results {
  text-align: center;
  padding: 60px 20px;
}

@media (max-width: 768px) {
  .help-center {
    padding: 15px;
  }
  
  .access-grid {
    grid-template-columns: 1fr;
  }
  
  .tutorial-grid {
    grid-template-columns: 1fr;
  }
  
  .home-content {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .manual-content {
    flex-direction: column;
  }
  
  .manual-sidebar {
    width: 100%;
  }
}
</style>