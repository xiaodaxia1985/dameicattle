import { createTestToken, createAdminToken } from '../helpers/auth';
import jwt from 'jsonwebtoken';

describe('Authentication Tests', () => {
  describe('createTestToken', () => {
    it('should create a valid JWT token', () => {
      const token = createTestToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should create token with custom payload', () => {
      const customPayload = {
        id: 999,
        username: 'customuser',
        role: 'admin'
      };
      
      const token = createTestToken(customPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
      
      expect(decoded.id).toBe(999);
      expect(decoded.username).toBe('customuser');
      expect(decoded.role).toBe('admin');
    });

    it('should create admin token with correct role', () => {
      const token = createAdminToken();
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret') as any;
      
      expect(decoded.role).toBe('admin');
      expect(decoded.username).toBe('admin');
    });
  });

  describe('Token validation', () => {
    it('should validate token expiration', () => {
      const expiredToken = jwt.sign(
        { id: 1, username: 'test' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // 已过期
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET || 'test-secret');
      }).toThrow('jwt expired');
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET || 'test-secret');
      }).toThrow();
    });
  });
});