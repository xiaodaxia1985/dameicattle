import { Request, Response, NextFunction } from 'express';
import { User } from '@/models';

// Extend Request interface to include data permission context
declare global {
  namespace Express {
    interface Request {
      dataPermission?: {
        baseId?: number;
        isAdmin?: boolean;
        canAccessAllBases?: boolean;
      };
    }
  }
}

/**
 * Data permission middleware that enforces base-level data isolation
 * Users can only access data from their assigned base unless they have admin privileges
 */
export const dataPermissionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Get user with role information
    const userWithRole = await User.findByPk(user.id, {
      include: [{ model: require('@/models').Role, as: 'role' }],
    });

    if (!userWithRole) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    // Check if user has admin privileges (can access all bases)
    const permissions = userWithRole.role?.permissions || [];
    const isAdmin = permissions.includes('system:admin') || permissions.includes('bases:all');
    
    // Set data permission context
    req.dataPermission = {
      baseId: userWithRole.base_id,
      isAdmin,
      canAccessAllBases: isAdmin,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Apply base filter to query where clause
 */
export const applyBaseFilter = (whereClause: any, req: Request): any => {
  const dataPermission = req.dataPermission;
  
  if (!dataPermission || dataPermission.canAccessAllBases) {
    return whereClause;
  }

  // If user has a specific base assigned, filter by that base
  if (dataPermission.baseId) {
    return {
      ...whereClause,
      base_id: dataPermission.baseId,
    };
  }

  // If user has no base assigned and is not admin, they can't access any data
  return {
    ...whereClause,
    base_id: null, // This will return no results
  };
};

/**
 * Check if user can access a specific base
 */
export const canAccessBase = (req: Request, baseId: number): boolean => {
  const dataPermission = req.dataPermission;
  
  if (!dataPermission) {
    return false;
  }

  // Admin can access all bases
  if (dataPermission.canAccessAllBases) {
    return true;
  }

  // User can access their assigned base
  return dataPermission.baseId === baseId;
};

/**
 * Middleware to require admin privileges
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const dataPermission = req.dataPermission;
  
  if (!dataPermission || !dataPermission.isAdmin) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'ADMIN_REQUIRED',
        message: 'Administrator privileges required',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
  }

  next();
};

/**
 * Middleware to require base access
 */
export const requireBaseAccess = (baseIdParam: string = 'baseId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const baseId = parseInt(req.params[baseIdParam] || req.body[baseIdParam] || req.query[baseIdParam] as string);
    
    if (!baseId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BASE_ID_REQUIRED',
          message: 'Base ID is required',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    if (!canAccessBase(req, baseId)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'BASE_ACCESS_DENIED',
          message: 'Access to this base is not allowed',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
    }

    next();
  };
};

// Alias for dataPermissionMiddleware
export const dataPermission = dataPermissionMiddleware;