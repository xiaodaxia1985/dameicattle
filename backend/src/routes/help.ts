import { Router } from 'express';
import { requirePermission } from '@/middleware/auth';

const router = Router();

// 模拟帮助控制器方法
const helpController = {
  getHelpArticles: (req: any, res: any) => {
    const { category, keyword, page = 1, limit = 20 } = req.query;
    
    // 模拟帮助文章数据
    const articles = [
      {
        id: 1,
        title: '如何开始使用系统',
        content: '系统使用指南...',
        category: 'getting-started',
        tags: ['基础', '入门'],
        status: 'published',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        title: '基地管理功能介绍',
        content: '基地管理功能详细说明...',
        category: 'features',
        tags: ['基地', '管理'],
        status: 'published',
        createdAt: new Date().toISOString()
      }
    ];

    let filteredArticles = articles;
    if (category) {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }
    if (keyword) {
      filteredArticles = filteredArticles.filter(article => 
        article.title.includes(keyword) || article.content.includes(keyword)
      );
    }

    const total = filteredArticles.length;
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedArticles = filteredArticles.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      data: {
        items: paginatedArticles,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  },

  getHelpArticle: (req: any, res: any) => {
    const { id } = req.params;
    
    // 模拟单个文章数据
    const article = {
      id: Number(id),
      title: '如何开始使用系统',
      content: '系统使用指南详细内容...',
      category: 'getting-started',
      tags: ['基础', '入门'],
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: article
    });
  },

  searchHelp: (req: any, res: any) => {
    const { q, type } = req.query;
    
    // 模拟搜索结果
    const results = {
      articles: [
        {
          id: 1,
          title: '搜索结果文章',
          content: '包含搜索关键词的内容...',
          category: 'search-result'
        }
      ],
      faq: [
        {
          id: 1,
          question: '常见问题',
          answer: '问题答案...'
        }
      ],
      videos: [
        {
          id: 1,
          title: '教程视频',
          url: '/videos/tutorial1.mp4'
        }
      ]
    };

    res.json({
      success: true,
      data: results
    });
  },

  getFAQ: (req: any, res: any) => {
    const { category } = req.query;
    
    // 模拟FAQ数据
    const faq = {
      'general': [
        {
          id: 1,
          question: '如何注册账号？',
          answer: '请联系管理员为您创建账号。',
          category: 'general'
        }
      ],
      'technical': [
        {
          id: 2,
          question: '系统支持哪些浏览器？',
          answer: '支持Chrome、Firefox、Safari等现代浏览器。',
          category: 'technical'
        }
      ]
    };

    res.json({
      success: true,
      data: category ? { [category]: (faq as any)[category] || [] } : faq
    });
  },

  getTutorials: (req: any, res: any) => {
    const { category, level } = req.query;
    
    // 模拟教程数据
    const tutorials = [
      {
        id: 1,
        title: '系统基础操作',
        description: '学习系统的基本操作方法',
        category: 'basics',
        level: 'beginner',
        duration: '10分钟',
        videoUrl: '/videos/basic-operations.mp4'
      },
      {
        id: 2,
        title: '高级功能使用',
        description: '掌握系统的高级功能',
        category: 'advanced',
        level: 'advanced',
        duration: '20分钟',
        videoUrl: '/videos/advanced-features.mp4'
      }
    ];

    let filteredTutorials = tutorials;
    if (category) {
      filteredTutorials = filteredTutorials.filter(tutorial => tutorial.category === category);
    }
    if (level) {
      filteredTutorials = filteredTutorials.filter(tutorial => tutorial.level === level);
    }

    res.json({
      success: true,
      data: filteredTutorials
    });
  },

  getManualSection: (req: any, res: any) => {
    const section = req.params.section || req.query.section;
    
    // 模拟用户手册内容
    const manualContent = {
      'getting-started': {
        title: '快速开始',
        content: '欢迎使用智慧养殖管理系统...'
      },
      'user-guide': {
        title: '用户指南',
        content: '详细的用户操作指南...'
      },
      'api-reference': {
        title: 'API参考',
        content: 'API接口文档...'
      }
    };

    res.json({
      success: true,
      data: (manualContent as any)[section] || { title: '未找到', content: '请求的章节不存在' }
    });
  },

  initChatSession: (req: any, res: any) => {
    const { subject, initialMessage } = req.body;
    
    // 模拟创建聊天会话
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.status(201).json({
      success: true,
      data: {
        sessionId,
        subject,
        status: 'active',
        createdAt: new Date().toISOString()
      }
    });
  },

  getChatMessages: (req: any, res: any) => {
    const { sessionId } = req.params;
    
    // 模拟聊天消息
    const messages = [
      {
        id: 1,
        sessionId,
        sender: 'user',
        message: '你好，我需要帮助',
        type: 'text',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        sessionId,
        sender: 'support',
        message: '您好！我是客服小助手，很高兴为您服务。请问有什么可以帮助您的吗？',
        type: 'text',
        timestamp: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        messages,
        sessionId
      }
    });
  },

  sendChatMessage: (req: any, res: any) => {
    const { sessionId } = req.params;
    const { message, type = 'text' } = req.body;
    
    // 模拟发送消息
    const newMessage = {
      id: Date.now(),
      sessionId,
      sender: 'user',
      message,
      type,
      timestamp: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      data: newMessage,
      message: '消息发送成功'
    });
  }
};

// 公开路由（不需要认证）
router.get('/articles', helpController.getHelpArticles);
router.get('/articles/:id', helpController.getHelpArticle);
router.get('/search', helpController.searchHelp);
router.get('/faq', helpController.getFAQ);
router.get('/faq/:category', helpController.getFAQ);
router.get('/tutorials', helpController.getTutorials);
router.get('/manual/:section', helpController.getManualSection);

// 需要认证的路由
router.post('/chat/init', requirePermission('help:chat'), helpController.initChatSession);
router.get('/chat/:sessionId/messages', requirePermission('help:chat'), helpController.getChatMessages);
router.post('/chat/:sessionId/send', requirePermission('help:chat'), helpController.sendChatMessage);

export default router;