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
      const permissions = {
        // User Management
        'user': ['user:create', 'user:read', 'user:update', 'user:delete', 'user:reset-password'],
        
        // Role Management
        'role': ['role:create', 'role:read', 'role:update', 'role:delete'],
        
        // Base Management
        'base': ['base:create', 'base:read', 'base:update', 'base:delete'],
        
        // Cattle Management
        'cattle': ['cattle:create', 'cattle:read', 'cattle:update', 'cattle:delete'],
        
        // Health Management
        'health': ['health:create', 'health:read', 'health:update', 'health:delete'],
        
        // Feeding Management
        'feeding': ['feeding:create', 'feeding:read', 'feeding:update', 'feeding:delete'],
        
        // Purchase Management
        'purchase': ['purchase:create', 'purchase:read', 'purchase:update', 'purchase:delete', 'purchase:approve'],
        
        // Sales Management
        'sales': ['sales:create', 'sales:read', 'sales:update', 'sales:delete'],
        
        // Material Management
        'material': ['material:create', 'material:read', 'material:update', 'material:delete'],
        
        // Inventory Management
        'inventory': ['inventory:create', 'inventory:read', 'inventory:update', 'inventory:delete'],
        
        // Equipment Management
        'equipment': ['equipment:create', 'equipment:read', 'equipment:update', 'equipment:delete'],
        
        // News Management
        'news': ['news:create', 'news:read', 'news:update', 'news:delete'],
        
        // Operation Log Management
        'operation-log': ['operation-log:read', 'operation-log:export'],
        
        // System Management
        'system': ['system:logs', 'system:manage', 'system:admin'],
        
        // Dashboard and Reports
        'dashboard': ['dashboard:read'],
        'reports': ['reports:read', 'reports:export'],
        
        // Special Permissions
        'special': ['*', 'bases:all']
      };

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