const { Op } = require('sequelize');
const { 
  HelpArticle, 
  HelpCategory, 
  FAQ, 
  Feedback, 
  SupportTicket, 
  TicketReply, 
  ChatSession, 
  ChatMessage,
  Tutorial,
  TutorialProgress,
  User 
} = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

class HelpController {
  // 获取帮助文章列表
  async getHelpArticles(req, res) {
    try {
      const { category, keyword, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {
        status: 'published'
      };

      if (category) {
        whereClause.category = category;
      }

      if (keyword) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${keyword}%` } },
          { content: { [Op.iLike]: `%${keyword}%` } },
          { tags: { [Op.contains]: [keyword] } }
        ];
      }

      const { count, rows } = await HelpArticle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: HelpCategory,
            as: 'categoryInfo',
            attributes: ['id', 'name', 'description']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          items: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('获取帮助文章失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_HELP_ARTICLES_FAILED',
          message: '获取帮助文章失败'
        }
      });
    }
  }

  // 获取帮助文章详情
  async getHelpArticle(req, res) {
    try {
      const { id } = req.params;

      const article = await HelpArticle.findOne({
        where: { 
          id,
          status: 'published'
        },
        include: [
          {
            model: HelpCategory,
            as: 'categoryInfo',
            attributes: ['id', 'name', 'description']
          }
        ]
      });

      if (!article) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: '文章不存在'
          }
        });
      }

      // 增加浏览次数
      await article.increment('viewCount');

      res.json({
        success: true,
        data: article
      });
    } catch (error) {
      logger.error('获取帮助文章详情失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_HELP_ARTICLE_FAILED',
          message: '获取文章详情失败'
        }
      });
    }
  }

  // 搜索帮助内容
  async searchHelp(req, res) {
    try {
      const { q, type } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'SEARCH_QUERY_REQUIRED',
            message: '搜索关键词不能为空'
          }
        });
      }

      const results = {
        articles: [],
        faqs: [],
        tutorials: []
      };

      const searchCondition = {
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { content: { [Op.iLike]: `%${q}%` } }
        ]
      };

      // 搜索文章
      if (!type || type === 'article') {
        results.articles = await HelpArticle.findAll({
          where: {
            ...searchCondition,
            status: 'published'
          },
          attributes: ['id', 'title', 'summary', 'category', 'updatedAt'],
          limit: 10
        });
      }

      // 搜索FAQ
      if (!type || type === 'faq') {
        results.faqs = await FAQ.findAll({
          where: {
            [Op.or]: [
              { question: { [Op.iLike]: `%${q}%` } },
              { answer: { [Op.iLike]: `%${q}%` } }
            ],
            status: 'active'
          },
          attributes: ['id', 'question', 'answer', 'category'],
          limit: 10
        });
      }

      // 搜索教程
      if (!type || type === 'tutorial') {
        results.tutorials = await Tutorial.findAll({
          where: {
            ...searchCondition,
            status: 'published'
          },
          attributes: ['id', 'title', 'description', 'category', 'duration'],
          limit: 10
        });
      }

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('搜索帮助内容失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEARCH_HELP_FAILED',
          message: '搜索失败'
        }
      });
    }
  }

  // 获取常见问题
  async getFAQ(req, res) {
    try {
      const { category } = req.query;

      const whereClause = {
        status: 'active'
      };

      if (category) {
        whereClause.category = category;
      }

      const faqs = await FAQ.findAll({
        where: whereClause,
        order: [['sortOrder', 'ASC'], ['updatedAt', 'DESC']]
      });

      // 按分类分组
      const groupedFAQs = faqs.reduce((acc, faq) => {
        const category = faq.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(faq);
        return acc;
      }, {});

      res.json({
        success: true,
        data: groupedFAQs
      });
    } catch (error) {
      logger.error('获取FAQ失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_FAQ_FAILED',
          message: '获取常见问题失败'
        }
      });
    }
  }

  // 提交用户反馈
  async submitFeedback(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '输入数据验证失败',
            details: errors.array()
          }
        });
      }

      const { type, title, content, priority = 'medium', attachments = [] } = req.body;
      const userId = req.user.id;

      const feedback = await Feedback.create({
        userId,
        type,
        title,
        content,
        priority,
        attachments,
        status: 'submitted'
      });

      // 创建对应的工单
      const ticket = await SupportTicket.create({
        userId,
        subject: title || `${type}反馈`,
        description: content,
        priority,
        status: 'open',
        source: 'feedback',
        sourceId: feedback.id
      });

      res.status(201).json({
        success: true,
        data: {
          feedback,
          ticketId: ticket.id
        },
        message: '反馈提交成功，我们会尽快处理'
      });
    } catch (error) {
      logger.error('提交反馈失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SUBMIT_FEEDBACK_FAILED',
          message: '提交反馈失败'
        }
      });
    }
  }

  // 获取用户工单列表
  async getUserTickets(req, res) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const userId = req.user.id;
      const offset = (page - 1) * limit;

      const whereClause = { userId };

      if (status) {
        whereClause.status = status;
      }

      const { count, rows } = await SupportTicket.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'realName', 'email']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          items: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('获取用户工单失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_USER_TICKETS_FAILED',
          message: '获取工单列表失败'
        }
      });
    }
  }

  // 获取工单详情
  async getTicketDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const ticket = await SupportTicket.findOne({
        where: { 
          id,
          userId // 只能查看自己的工单
        },
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'realName', 'email']
          },
          {
            model: TicketReply,
            as: 'replies',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'realName', 'email']
              }
            ],
            order: [['createdAt', 'ASC']]
          }
        ]
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: '工单不存在'
          }
        });
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      logger.error('获取工单详情失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_TICKET_DETAIL_FAILED',
          message: '获取工单详情失败'
        }
      });
    }
  }

  // 回复工单
  async replyTicket(req, res) {
    try {
      const { id } = req.params;
      const { content, attachments = [] } = req.body;
      const userId = req.user.id;

      // 验证工单是否存在且属于当前用户
      const ticket = await SupportTicket.findOne({
        where: { id, userId }
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: '工单不存在'
          }
        });
      }

      if (ticket.status === 'closed') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TICKET_CLOSED',
            message: '工单已关闭，无法回复'
          }
        });
      }

      const reply = await TicketReply.create({
        ticketId: id,
        userId,
        content,
        attachments,
        isStaff: false
      });

      // 更新工单状态
      await ticket.update({
        status: 'in_progress',
        lastReplyAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: reply,
        message: '回复成功'
      });
    } catch (error) {
      logger.error('回复工单失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REPLY_TICKET_FAILED',
          message: '回复工单失败'
        }
      });
    }
  }

  // 初始化在线客服会话
  async initChatSession(req, res) {
    try {
      const { subject, initialMessage } = req.body;
      const userId = req.user.id;

      const session = await ChatSession.create({
        userId,
        subject: subject || '在线咨询',
        status: 'active'
      });

      // 发送初始消息
      if (initialMessage) {
        await ChatMessage.create({
          sessionId: session.id,
          userId,
          message: initialMessage,
          type: 'text',
          isStaff: false
        });
      }

      res.status(201).json({
        success: true,
        data: {
          sessionId: session.id,
          subject: session.subject,
          status: session.status
        },
        message: '会话创建成功'
      });
    } catch (error) {
      logger.error('初始化聊天会话失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INIT_CHAT_SESSION_FAILED',
          message: '创建会话失败'
        }
      });
    }
  }

  // 获取聊天消息历史
  async getChatMessages(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // 验证会话是否属于当前用户
      const session = await ChatSession.findOne({
        where: { id: sessionId, userId }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: '会话不存在'
          }
        });
      }

      const messages = await ChatMessage.findAll({
        where: { sessionId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'realName', 'email']
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      res.json({
        success: true,
        data: {
          session,
          messages
        }
      });
    } catch (error) {
      logger.error('获取聊天消息失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_CHAT_MESSAGES_FAILED',
          message: '获取消息历史失败'
        }
      });
    }
  }

  // 发送聊天消息
  async sendChatMessage(req, res) {
    try {
      const { sessionId } = req.params;
      const { message, type = 'text' } = req.body;
      const userId = req.user.id;

      // 验证会话是否存在且活跃
      const session = await ChatSession.findOne({
        where: { 
          id: sessionId, 
          userId,
          status: 'active'
        }
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND_OR_INACTIVE',
            message: '会话不存在或已结束'
          }
        });
      }

      const chatMessage = await ChatMessage.create({
        sessionId,
        userId,
        message,
        type,
        isStaff: false
      });

      // 更新会话最后活动时间
      await session.update({
        lastActivityAt: new Date()
      });

      res.status(201).json({
        success: true,
        data: chatMessage,
        message: '消息发送成功'
      });
    } catch (error) {
      logger.error('发送聊天消息失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEND_CHAT_MESSAGE_FAILED',
          message: '发送消息失败'
        }
      });
    }
  }

  // 获取教程列表
  async getTutorials(req, res) {
    try {
      const { category, level } = req.query;

      const whereClause = {
        status: 'published'
      };

      if (category) {
        whereClause.category = category;
      }

      if (level) {
        whereClause.level = level;
      }

      const tutorials = await Tutorial.findAll({
        where: whereClause,
        attributes: [
          'id', 'title', 'description', 'category', 'level', 
          'duration', 'videoUrl', 'thumbnailUrl', 'viewCount'
        ],
        order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']]
      });

      // 如果用户已登录，获取学习进度
      if (req.user) {
        const userId = req.user.id;
        const progressData = await TutorialProgress.findAll({
          where: { userId },
          attributes: ['tutorialId', 'progress', 'completed']
        });

        const progressMap = progressData.reduce((acc, item) => {
          acc[item.tutorialId] = {
            progress: item.progress,
            completed: item.completed
          };
          return acc;
        }, {});

        tutorials.forEach(tutorial => {
          tutorial.dataValues.userProgress = progressMap[tutorial.id] || {
            progress: 0,
            completed: false
          };
        });
      }

      res.json({
        success: true,
        data: tutorials
      });
    } catch (error) {
      logger.error('获取教程列表失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_TUTORIALS_FAILED',
          message: '获取教程列表失败'
        }
      });
    }
  }

  // 更新教程学习进度
  async updateTutorialProgress(req, res) {
    try {
      const { id } = req.params;
      const { progress, completed = false } = req.body;
      const userId = req.user.id;

      // 验证教程是否存在
      const tutorial = await Tutorial.findByPk(id);
      if (!tutorial) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TUTORIAL_NOT_FOUND',
            message: '教程不存在'
          }
        });
      }

      const [tutorialProgress, created] = await TutorialProgress.findOrCreate({
        where: { userId, tutorialId: id },
        defaults: {
          userId,
          tutorialId: id,
          progress,
          completed
        }
      });

      if (!created) {
        await tutorialProgress.update({
          progress,
          completed,
          lastWatchedAt: new Date()
        });
      }

      // 增加教程观看次数
      if (created || progress > tutorialProgress.progress) {
        await tutorial.increment('viewCount');
      }

      res.json({
        success: true,
        data: tutorialProgress,
        message: '学习进度更新成功'
      });
    } catch (error) {
      logger.error('更新教程进度失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_TUTORIAL_PROGRESS_FAILED',
          message: '更新学习进度失败'
        }
      });
    }
  }

  // 管理员：创建帮助文章
  async createHelpArticle(req, res) {
    try {
      // 检查管理员权限
      if (!req.user.permissions.includes('help:write')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '权限不足'
          }
        });
      }

      const { title, content, category, tags = [], status = 'draft' } = req.body;
      const authorId = req.user.id;

      const article = await HelpArticle.create({
        title,
        content,
        category,
        tags,
        status,
        authorId
      });

      res.status(201).json({
        success: true,
        data: article,
        message: '帮助文章创建成功'
      });
    } catch (error) {
      logger.error('创建帮助文章失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_HELP_ARTICLE_FAILED',
          message: '创建文章失败'
        }
      });
    }
  }

  // 管理员：获取所有工单
  async getAllTickets(req, res) {
    try {
      // 检查管理员权限
      if (!req.user.permissions.includes('support:read')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '权限不足'
          }
        });
      }

      const { status, priority, assignee, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};

      if (status) whereClause.status = status;
      if (priority) whereClause.priority = priority;
      if (assignee) whereClause.assigneeId = assignee;

      const { count, rows } = await SupportTicket.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'realName', 'email']
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'realName', 'email']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          items: rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('获取所有工单失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ALL_TICKETS_FAILED',
          message: '获取工单列表失败'
        }
      });
    }
  }

  // 管理员：分配工单
  async assignTicket(req, res) {
    try {
      // 检查管理员权限
      if (!req.user.permissions.includes('support:write')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: '权限不足'
          }
        });
      }

      const { id } = req.params;
      const { assigneeId } = req.body;

      const ticket = await SupportTicket.findByPk(id);
      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TICKET_NOT_FOUND',
            message: '工单不存在'
          }
        });
      }

      await ticket.update({
        assigneeId,
        status: 'in_progress'
      });

      res.json({
        success: true,
        data: ticket,
        message: '工单分配成功'
      });
    } catch (error) {
      logger.error('分配工单失败:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ASSIGN_TICKET_FAILED',
          message: '分配工单失败'
        }
      });
    }
  }
}

module.exports = new HelpController();