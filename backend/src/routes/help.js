const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const helpController = require('../controllers/helpController');

/**
 * @swagger
 * tags:
 *   name: Help
 *   description: 在线帮助和客服系统
 */

/**
 * @swagger
 * /api/v1/help/articles:
 *   get:
 *     summary: 获取帮助文章列表
 *     tags: [Help]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 文章分类
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取帮助文章列表
 */
router.get('/articles', helpController.getHelpArticles);

/**
 * @swagger
 * /api/v1/help/articles/{id}:
 *   get:
 *     summary: 获取帮助文章详情
 *     tags: [Help]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 文章ID
 *     responses:
 *       200:
 *         description: 成功获取文章详情
 */
router.get('/articles/:id', helpController.getHelpArticle);

/**
 * @swagger
 * /api/v1/help/search:
 *   get:
 *     summary: 搜索帮助内容
 *     tags: [Help]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [article, faq, video]
 *         description: 搜索类型
 *     responses:
 *       200:
 *         description: 搜索结果
 */
router.get('/search', helpController.searchHelp);

/**
 * @swagger
 * /api/v1/help/faq:
 *   get:
 *     summary: 获取常见问题列表
 *     tags: [Help]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 问题分类
 *     responses:
 *       200:
 *         description: 常见问题列表
 */
router.get('/faq', helpController.getFAQ);

/**
 * @swagger
 * /api/v1/help/feedback:
 *   post:
 *     summary: 提交用户反馈
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [bug, suggestion, question, complaint]
 *                 description: 反馈类型
 *               title:
 *                 type: string
 *                 description: 反馈标题
 *               content:
 *                 type: string
 *                 description: 反馈内容
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *                 description: 优先级
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 附件URL列表
 *     responses:
 *       201:
 *         description: 反馈提交成功
 */
router.post('/feedback', authenticateToken, helpController.submitFeedback);

/**
 * @swagger
 * /api/v1/help/tickets:
 *   get:
 *     summary: 获取用户工单列表
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: 工单状态
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: 工单列表
 */
router.get('/tickets', authenticateToken, helpController.getUserTickets);

/**
 * @swagger
 * /api/v1/help/tickets/{id}:
 *   get:
 *     summary: 获取工单详情
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 工单详情
 */
router.get('/tickets/:id', authenticateToken, helpController.getTicketDetail);

/**
 * @swagger
 * /api/v1/help/tickets/{id}/reply:
 *   post:
 *     summary: 回复工单
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: 回复内容
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: 附件URL列表
 *     responses:
 *       201:
 *         description: 回复成功
 */
router.post('/tickets/:id/reply', authenticateToken, helpController.replyTicket);

/**
 * @swagger
 * /api/v1/help/chat/init:
 *   post:
 *     summary: 初始化在线客服会话
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: 咨询主题
 *               initialMessage:
 *                 type: string
 *                 description: 初始消息
 *     responses:
 *       201:
 *         description: 会话创建成功
 */
router.post('/chat/init', authenticateToken, helpController.initChatSession);

/**
 * @swagger
 * /api/v1/help/chat/{sessionId}/messages:
 *   get:
 *     summary: 获取聊天消息历史
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 消息历史
 */
router.get('/chat/:sessionId/messages', authenticateToken, helpController.getChatMessages);

/**
 * @swagger
 * /api/v1/help/chat/{sessionId}/send:
 *   post:
 *     summary: 发送聊天消息
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: 消息内容
 *               type:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *                 description: 消息类型
 *     responses:
 *       201:
 *         description: 消息发送成功
 */
router.post('/chat/:sessionId/send', authenticateToken, helpController.sendChatMessage);

/**
 * @swagger
 * /api/v1/help/tutorials:
 *   get:
 *     summary: 获取教程视频列表
 *     tags: [Help]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 教程分类
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: 难度级别
 *     responses:
 *       200:
 *         description: 教程列表
 */
router.get('/tutorials', helpController.getTutorials);

/**
 * @swagger
 * /api/v1/help/tutorials/{id}/progress:
 *   post:
 *     summary: 更新教程学习进度
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - progress
 *             properties:
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: 学习进度百分比
 *               completed:
 *                 type: boolean
 *                 description: 是否完成
 *     responses:
 *       200:
 *         description: 进度更新成功
 */
router.post('/tutorials/:id/progress', authenticateToken, helpController.updateTutorialProgress);

// 管理员接口
/**
 * @swagger
 * /api/v1/help/admin/articles:
 *   post:
 *     summary: 创建帮助文章（管理员）
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 default: draft
 *     responses:
 *       201:
 *         description: 文章创建成功
 */
router.post('/admin/articles', authenticateToken, helpController.createHelpArticle);

/**
 * @swagger
 * /api/v1/help/admin/tickets:
 *   get:
 *     summary: 获取所有工单（管理员）
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 工单列表
 */
router.get('/admin/tickets', authenticateToken, helpController.getAllTickets);

/**
 * @swagger
 * /api/v1/help/admin/tickets/{id}/assign:
 *   post:
 *     summary: 分配工单（管理员）
 *     tags: [Help]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assigneeId
 *             properties:
 *               assigneeId:
 *                 type: integer
 *                 description: 分配给的用户ID
 *     responses:
 *       200:
 *         description: 分配成功
 */
router.post('/admin/tickets/:id/assign', authenticateToken, helpController.assignTicket);

module.exports = router;