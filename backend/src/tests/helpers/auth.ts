import jwt from 'jsonwebtoken';

export const createTestToken = (payload: any = {}) => {
  const defaultPayload = {
    id: 1,
    username: 'testuser',
    role: 'user',
    baseId: 1,
    ...payload
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

export const createAdminToken = () => {
  return createTestToken({
    id: 1,
    username: 'admin',
    role: 'admin',
    baseId: null
  });
};

export const createManagerToken = (baseId: number = 1) => {
  return createTestToken({
    id: 2,
    username: 'manager',
    role: 'manager',
    baseId
  });
};

export const createUserToken = (baseId: number = 1) => {
  return createTestToken({
    id: 3,
    username: 'user',
    role: 'user',
    baseId
  });
};

export const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`
});

export const mockAuthMiddleware = (user: any = null) => {
  return (req: any, res: any, next: any) => {
    req.user = user || {
      id: 1,
      username: 'testuser',
      role: 'user',
      baseId: 1
    };
    next();
  };
};