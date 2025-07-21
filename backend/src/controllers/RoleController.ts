import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Role, User } from '@/models';
import { logger } from '@/utils/logger';

export class RoleController {
  public async getRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = {};
      
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Role.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'username', 'real_name'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: {
          roles: rows,
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

  public async getRoleById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id, {
        include: [
          {
            model: User,
            as: 'users',
            attributes: ['id', 'username', 'real_name', 'email'],
          },
        ],
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: '角色不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      res.json({
        success: true,
        data: {
          role,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async createRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { name, description, permissions } = req.body;

      // Check if role name already exists
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'ROLE_EXISTS',
            message: '角色名称已存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      const role = await Role.create({
        name,
        description,
        permissions: permissions || [],
      });

      logger.info(`Role created: ${name}`, {
        roleId: role.id,
        createdBy: req.user?.id,
      });

      res.status(201).json({
        success: true,
        data: {
          role,
        },
        message: '角色创建成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: '角色不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if new name conflicts with existing role
      if (name && name !== role.name) {
        const existingRole = await Role.findOne({ 
          where: { 
            name,
            id: { [Op.ne]: id },
          },
        });
        if (existingRole) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'ROLE_EXISTS',
              message: '角色名称已存在',
              timestamp: new Date().toISOString(),
              path: req.path,
            },
          });
        }
      }

      await role.update({
        name,
        description,
        permissions: permissions || role.permissions,
      });

      logger.info(`Role updated: ${role.name}`, {
        roleId: role.id,
        updatedBy: req.user?.id,
      });

      res.json({
        success: true,
        data: {
          role,
        },
        message: '角色更新成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: '角色不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Check if role is being used by any users
      const userCount = await User.count({ where: { role_id: id } });
      if (userCount > 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'ROLE_IN_USE',
            message: `该角色正在被 ${userCount} 个用户使用，无法删除`,
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      await role.destroy();

      logger.info(`Role deleted: ${role.name}`, {
        roleId: role.id,
        deletedBy: req.user?.id,
      });

      res.json({
        success: true,
        message: '角色删除成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async getPermissions(req: Request, res: Response, next: NextFunction) {
    try {
      // Define all available permissions in the system
      const permissions = [
        // User Management
        { category: '用户管理', permissions: ['users:read', 'users:create', 'users:update', 'users:delete'] },
        
        // Role Management
        { category: '角色管理', permissions: ['roles:read', 'roles:create', 'roles:update', 'roles:delete'] },
        
        // Base Management
        { category: '基地管理', permissions: ['bases:read', 'bases:create', 'bases:update', 'bases:delete'] },
        
        // Cattle Management
        { category: '牛只管理', permissions: ['cattle:read', 'cattle:create', 'cattle:update', 'cattle:delete'] },
        
        // Health Management
        { category: '健康管理', permissions: ['health:read', 'health:create', 'health:update', 'health:delete'] },
        
        // Feeding Management
        { category: '饲喂管理', permissions: ['feeding:read', 'feeding:create', 'feeding:update', 'feeding:delete'] },
        
        // Purchase Management
        { category: '采购管理', permissions: ['purchase:read', 'purchase:create', 'purchase:update', 'purchase:delete'] },
        
        // Sales Management
        { category: '销售管理', permissions: ['sales:read', 'sales:create', 'sales:update', 'sales:delete'] },
        
        // Material Management
        { category: '物资管理', permissions: ['materials:read', 'materials:create', 'materials:update', 'materials:delete'] },
        
        // Equipment Management
        { category: '设备管理', permissions: ['equipment:read', 'equipment:create', 'equipment:update', 'equipment:delete'] },
        
        // News Management
        { category: '新闻管理', permissions: ['news:read', 'news:create', 'news:update', 'news:delete'] },
        
        // System Management
        { category: '系统管理', permissions: ['system:read', 'system:config', 'system:logs', 'system:backup'] },
        
        // Reports
        { category: '报表管理', permissions: ['reports:read', 'reports:export', 'reports:dashboard'] },
      ];

      res.json({
        success: true,
        data: {
          permissions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async assignUsersToRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userIds } = req.body;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: '角色不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Update users with the new role
      await User.update(
        { role_id: parseInt(id) as number },
        { where: { id: userIds } }
      );

      logger.info(`Users assigned to role: ${role.name}`, {
        roleId: role.id,
        userIds,
        assignedBy: req.user?.id,
      });

      res.json({
        success: true,
        message: '用户角色分配成功',
      });
    } catch (error) {
      next(error);
    }
  }

  public async removeUsersFromRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userIds } = req.body;

      const role = await Role.findByPk(id);
      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'ROLE_NOT_FOUND',
            message: '角色不存在',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
      }

      // Remove role from users (set to null)
      await User.update(
        { role_id: null },
        { where: { id: userIds, role_id: parseInt(id) } }
      );

      logger.info(`Users removed from role: ${role.name}`, {
        roleId: role.id,
        userIds,
        removedBy: req.user?.id,
      });

      res.json({
        success: true,
        message: '用户角色移除成功',
      });
    } catch (error) {
      next(error);
    }
  }
}