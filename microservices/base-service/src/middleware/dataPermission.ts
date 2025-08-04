import { Request, Response, NextFunction } from 'express';
import { User } from '../models';

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const dataPermissionMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.error('未认证', 401, 'UNAUTHORIZED');
    }

    // Set data permission context
    (req as any).dataPermission = {
      userId: user.id,
      baseId: user.base_id,
      canAccessAllBases: user.base_id === null, // Assume null base_id means admin
    };

    next();
  } catch (error) {
    return res.error('权限检查失败', 500, 'PERMISSION_CHECK_FAILED');
  }
};

export const applyBaseFilter = (whereClause: any, req: Request, baseIdField: string = 'base_id') => {
  const dataPermission = (req as any).dataPermission;
  
  if (!dataPermission || dataPermission.canAccessAllBases) {
    // Admin can access all bases
    return whereClause;
  }
  
  if (dataPermission.baseId) {
    // Regular user can only access their base
    whereClause[baseIdField] = dataPermission.baseId;
  } else {
    // No base access
    whereClause[baseIdField] = -1;
  }
  
  return whereClause;
};