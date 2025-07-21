import { Router } from 'express';
import { BarnController } from '@/controllers/BarnController';
import { authMiddleware } from '@/middleware/auth';
import {
  createBarnValidator,
  updateBarnValidator,
  getBarnValidator,
  getBarnListValidator,
  deleteBarnValidator,
  getBarnStatisticsValidator,
} from '@/validators/barn';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * @swagger
 * /api/barns:
 *   get:
 *     summary: 获取牛棚列表
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: 每页数量
 *       - in: query
 *         name: base_id
 *         schema:
 *           type: integer
 *         description: 基地ID
 *       - in: query
 *         name: barn_type
 *         schema:
 *           type: string
 *           enum: [育肥棚, 繁殖棚, 隔离棚, 治疗棚, 其他]
 *         description: 牛棚类型
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get('/', (req, res) => BarnController.getBarns(req as any, res));

/**
 * @swagger
 * /api/barns/statistics:
 *   get:
 *     summary: 获取牛棚统计信息
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: base_id
 *         schema:
 *           type: integer
 *         description: 基地ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get('/statistics', (req, res) => BarnController.getBarnStatistics(req as any, res));

/**
 * @swagger
 * /api/barns/options:
 *   get:
 *     summary: 获取牛棚选项（用于下拉选择）
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: base_id
 *         schema:
 *           type: integer
 *         description: 基地ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get('/options', (req, res) => BarnController.getBarnOptions(req as any, res));

/**
 * @swagger
 * /api/barns/{id}:
 *   get:
 *     summary: 获取牛棚详情
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 牛棚ID
 *     responses:
 *       200:
 *         description: 获取成功
 *       404:
 *         description: 牛棚不存在
 *       401:
 *         description: 未认证
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', (req, res) => BarnController.getBarn(req as any, res));

/**
 * @swagger
 * /api/barns:
 *   post:
 *     summary: 创建牛棚
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - base_id
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 description: 牛棚名称
 *               code:
 *                 type: string
 *                 description: 牛棚编码
 *               base_id:
 *                 type: integer
 *                 description: 基地ID
 *               capacity:
 *                 type: integer
 *                 description: 牛棚容量
 *               barn_type:
 *                 type: string
 *                 enum: [育肥棚, 繁殖棚, 隔离棚, 治疗棚, 其他]
 *                 description: 牛棚类型
 *               description:
 *                 type: string
 *                 description: 描述
 *               facilities:
 *                 type: object
 *                 description: 设施信息
 *     responses:
 *       201:
 *         description: 创建成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       409:
 *         description: 牛棚编码已存在
 *       500:
 *         description: 服务器错误
 */
router.post('/', (req, res) => BarnController.createBarn(req as any, res));

/**
 * @swagger
 * /api/barns/{id}:
 *   put:
 *     summary: 更新牛棚
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 牛棚ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 牛棚名称
 *               code:
 *                 type: string
 *                 description: 牛棚编码
 *               capacity:
 *                 type: integer
 *                 description: 牛棚容量
 *               barn_type:
 *                 type: string
 *                 enum: [育肥棚, 繁殖棚, 隔离棚, 治疗棚, 其他]
 *                 description: 牛棚类型
 *               description:
 *                 type: string
 *                 description: 描述
 *               facilities:
 *                 type: object
 *                 description: 设施信息
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 请求参数错误
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 牛棚不存在
 *       409:
 *         description: 牛棚编码已存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', (req, res) => BarnController.updateBarn(req as any, res));

/**
 * @swagger
 * /api/barns/{id}:
 *   delete:
 *     summary: 删除牛棚
 *     tags: [Barns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: 牛棚ID
 *     responses:
 *       200:
 *         description: 删除成功
 *       400:
 *         description: 牛棚内还有牛只，无法删除
 *       401:
 *         description: 未认证
 *       403:
 *         description: 权限不足
 *       404:
 *         description: 牛棚不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', (req, res) => BarnController.deleteBarn(req as any, res));

export default router;