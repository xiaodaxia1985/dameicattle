import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { User, Role } from '@/models';
import { logger } from '@/utils/logger';
import { applyBaseFilter } from '@/middleware/dataPermission';

export class UserController {
  public async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      
      if (search) {
        whereClause[Op.or] = [
          { username: { [Op.iLike]: `%${search}%` } },
          { real_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      // Apply data permission filtering - users can only see users from their base (unless admin)
      const filteredWhereClause = applyBaseFilter(whereClause, req);

      const { count, rows } = await User.findAndCountAll({
        where: filteredWhereClause,
        include: [{ model: Role, as: 'role' }],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: {
          users: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(count / Number(limit)),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id, {
        include: [{ model: Role, as: 'role' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async createUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { username, password, real_name, email, phone, role_id, base_id } = req.body;

      // Check if username already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: '用户名已存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const user = await User.create({
        username,
        password_hash: password,
        real_name,
        email,
        phone,
        role_id,
        base_id,
        status: 'active',
      });

      logger.info(`User created: ${username}`, {
        userId: user.id,
        createdBy: req.user?.id,
      });

      res.status(201).json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        message: '用户创建成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { real_name, email, phone, role_id, base_id, status } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      await user.update({
        real_name,
        email,
        phone,
        role_id,
        base_id,
        status,
      });

      logger.info(`User updated: ${user.username}`, {
        userId: user.id,
        updatedBy: req.user?.id,
      });

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        message: '用户更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      await user.destroy();

      logger.info(`User deleted: ${user.username}`, {
        userId: user.id,
        deletedBy: req.user?.id,
      });

      res.json({
        success: true,
        message: '用户删除成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      
      const user = await User.findByPk(userId, {
        include: [{ model: Role, as: 'role' }],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
          permissions: user.role?.permissions || [],
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.id;
      const { real_name, email, phone } = req.body;

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      await user.update({
        real_name,
        email,
        phone,
      });

      logger.info(`Profile updated: ${user.username}`, {
        userId: user.id,
      });

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        message: '个人资料更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { password } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check data permission - users can only reset passwords for users in their base (unless admin)
      const filteredWhereClause = applyBaseFilter({ id }, req);
      const accessibleUser = await User.findOne({ where: filteredWhereClause });
      
      if (!accessibleUser) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权限重置该用户密码',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      await user.update({ password_hash: hashedPassword });

      logger.info(`Password reset for user: ${user.username}`, {
        userId: user.id,
        resetBy: req.user?.id,
      });

      res.json({
        success: true,
        message: '密码重置成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async batchDeleteUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_IDS',
            message: '请提供有效的用户ID列表',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check data permission - users can only delete users from their base (unless admin)
      const filteredWhereClause = applyBaseFilter({ id: { [Op.in]: ids } }, req);
      const accessibleUsers = await User.findAll({ where: filteredWhereClause });
      
      if (accessibleUsers.length !== ids.length) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: '无权限删除部分用户',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const deletedCount = await User.destroy({
        where: filteredWhereClause,
      });

      logger.info(`Batch deleted ${deletedCount} users`, {
        userIds: ids,
        deletedBy: req.user?.id,
      });

      res.json({
        success: true,
        message: `成功删除 ${deletedCount} 个用户`,
      });
    } catch (error) {
      next(error);
    }
  }

  public async toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'locked'].includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: '无效的用户状态',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check data permission - users can only toggle status for users in their base (unless admin)
      const filteredWhereClause = applyBaseFilter({ id }, req);
      const user = await User.findOne({ where: filteredWhereClause });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: '用户不存在或无权限访问',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      await user.update({ status });

      logger.info(`User status changed: ${user.username} -> ${status}`, {
        userId: user.id,
        oldStatus: user.status,
        newStatus: status,
        changedBy: req.user?.id,
      });

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
        message: '用户状态更新成功',
      });
    } catch (error) {
      next(error);
    }
  }
}