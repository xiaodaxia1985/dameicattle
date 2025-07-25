import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User, UserAttributes } from '@/models/User';
import { Role } from '@/models/Role';
import { logger } from '@/utils/logger';
import { redisClient } from '@/config/redis';

// Define authenticated request interface
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Extend Express Request interface globally
declare global {
  namespace Express {
    interface User extends UserAttributes {}
    interface Request {
      user?: User;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Enhanced JWT Strategy configuration with Redis token validation
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    },
    async (payload, done) => {
      try {
        // Check if token exists in Redis (for session management)
        const storedToken = await redisClient.get(`token:${payload.id}`);
        if (!storedToken) {
          logger.warn(`Token not found in Redis for user ${payload.id}`);
          return done(null, false, { message: 'Token not found in session store' });
        }

        // Find user with role information
        const user = await User.findByPk(payload.id, {
          attributes: { exclude: ['password_hash'] },
          include: [{ 
            model: Role, 
            as: 'role',
            attributes: ['id', 'name', 'description', 'permissions']
          }],
        });
        
        if (!user) {
          logger.warn(`User not found for token payload: ${payload.id}`);
          return done(null, false, { message: 'User not found' });
        }

        // Check if user account is active
        if (user.status !== 'active') {
          logger.warn(`Inactive user attempted access: ${user.username}`);
          return done(null, false, { message: 'Account is not active' });
        }

        // Check if account is locked
        if (user.isAccountLocked && user.isAccountLocked()) {
          logger.warn(`Locked user attempted access: ${user.username}`);
          return done(null, false, { message: 'Account is locked' });
        }

        return done(null, user);
      } catch (error) {
        logger.error('JWT Strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// Enhanced authentication middleware with better error handling
export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  // Check if authorization header exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authorization token is required',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  const token = authHeader.substring(7);
  
  // Verify token format
  if (!token || token.length < 10) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN_FORMAT',
        message: 'Invalid token format',
        timestamp: new Date().toISOString(),
        path: req.path,
      },
    });
    return;
  }

  passport.authenticate('jwt', { session: false }, async (err: any, user: User | false, info: any) => {
    if (err) {
      logger.error('Authentication error:', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: 'Internal authentication error',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    if (!user) {
      // Determine specific error based on info
      let errorCode = 'UNAUTHORIZED';
      let errorMessage = 'Authentication failed';
      
      if (info?.message) {
        switch (info.message) {
          case 'Token not found in session store':
            errorCode = 'TOKEN_EXPIRED';
            errorMessage = 'Token has expired or been revoked';
            break;
          case 'User not found':
            errorCode = 'USER_NOT_FOUND';
            errorMessage = 'User account not found';
            break;
          case 'Account is not active':
            errorCode = 'ACCOUNT_INACTIVE';
            errorMessage = 'User account is not active';
            break;
          case 'Account is locked':
            errorCode = 'ACCOUNT_LOCKED';
            errorMessage = 'User account is locked';
            break;
          default:
            if (info.name === 'TokenExpiredError') {
              errorCode = 'TOKEN_EXPIRED';
              errorMessage = 'Token has expired';
            } else if (info.name === 'JsonWebTokenError') {
              errorCode = 'INVALID_TOKEN';
              errorMessage = 'Invalid token';
            }
        }
      }

      res.status(401).json({
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Verify token matches the one stored in Redis
    try {
      const storedToken = await redisClient.get(`token:${user.id}`);
      if (storedToken !== token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_MISMATCH',
            message: 'Token does not match session',
            timestamp: new Date().toISOString(),
            path: req.path,
          },
        });
        return;
      }
    } catch (redisError) {
      logger.error('Redis token verification error:', redisError);
      // Continue without Redis check if Redis is unavailable
    }

    req.user = user as User;
    next();
    return;
  })(req, res, next);
};

// Legacy alias for backward compatibility - now uses enhanced auth
export const authMiddleware = auth;

// Enhanced permission middleware with detailed error messages
export const requirePermission = (permission: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    // Check if user is authenticated
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required for this action',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Check if user has role information
    if (!user.role) {
      logger.warn(`User ${user.username} has no role assigned`);
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_ROLE_ASSIGNED',
          message: 'User has no role assigned',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    // Check if role has permissions
    if (!user.role.permissions || !Array.isArray(user.role.permissions)) {
      logger.warn(`Role ${user.role.name} has no permissions configured`);
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_PERMISSIONS_CONFIGURED',
          message: 'Role has no permissions configured',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const userPermissions = user.role.permissions as string[];
    const requiredPermissions = Array.isArray(permission) ? permission : [permission];
    
    // Check if user has all required permissions
    const missingPermissions = requiredPermissions.filter(perm => !userPermissions.includes(perm));
    
    if (missingPermissions.length > 0) {
      logger.warn(`User ${user.username} missing permissions: ${missingPermissions.join(', ')}`);
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Missing required permissions: ${missingPermissions.join(', ')}`,
          details: {
            required: requiredPermissions,
            missing: missingPermissions,
            userRole: user.role.name,
            userPermissions: userPermissions
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};

// Middleware to require any of the specified permissions (OR logic)
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required for this action',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    if (!user.role || !user.role.permissions || !Array.isArray(user.role.permissions)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_PERMISSIONS_CONFIGURED',
          message: 'User role has no permissions configured',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const userPermissions = user.role.permissions as string[];
    const hasAnyPermission = permissions.some(perm => userPermissions.includes(perm));
    
    if (!hasAnyPermission) {
      logger.warn(`User ${user.username} missing any of required permissions: ${permissions.join(', ')}`);
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Requires any of the following permissions: ${permissions.join(', ')}`,
          details: {
            requiredAny: permissions,
            userRole: user.role.name,
            userPermissions: userPermissions
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};

// Middleware to require specific role
export const requireRole = (roleName: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required for this action',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    if (!user.role) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_ROLE_ASSIGNED',
          message: 'User has no role assigned',
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    const requiredRoles = Array.isArray(roleName) ? roleName : [roleName];
    const userRole = user.role.name;
    
    if (!requiredRoles.includes(userRole)) {
      logger.warn(`User ${user.username} with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`);
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Requires one of the following roles: ${requiredRoles.join(', ')}`,
          details: {
            required: requiredRoles,
            userRole: userRole
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        },
      });
      return;
    }

    next();
  };
};

// Generate JWT token
export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as jwt.SignOptions);
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

// Alias for authenticate
export const authenticate = auth;