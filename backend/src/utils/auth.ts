import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user: any): string => {
  const payload = {
    id: user.id,
    username: user.username,
    realName: user.realName,
    roleId: user.roleId,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};