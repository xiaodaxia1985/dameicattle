import { SecurityService } from '@/services/SecurityService';
import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { SecurityLog } from '@/models';

describe('Security Services', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
    await redisClient.quit();
  });

  describe('SecurityService', () => {
    beforeEach(() => {
      SecurityService.initialize();
    });

    describe('password validation', () => {
      it('should validate strong password', () => {
        const strongPassword = 'StrongP@ssw0rd123';
        const validation = SecurityService.validatePasswordStrength(strongPassword);

        expect(validation.valid).toBe(true);
        expect(validation.errors).toHaveLength(0);
        expect(validation.score).toBeGreaterThan(80);
      });

      it('should reject weak password', () => {
        const weakPassword = '123';
        const validation = SecurityService.validatePasswordStrength(weakPassword);

        expect(validation.valid).toBe(false);
        expect(validation.errors.length).toBeGreaterThan(0);
        expect(validation.score).toBeLessThan(50);
      });

      it('should check password length requirement', () => {
        const shortPassword = 'Abc1!';
        const validation = SecurityService.validatePasswordStrength(shortPassword);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('密码长度至少需要8位');
      });

      it('should check uppercase requirement', () => {
        const noUpperPassword = 'password123!';
        const validation = SecurityService.validatePasswordStrength(noUpperPassword);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('密码必须包含大写字母');
      });

      it('should check lowercase requirement', () => {
        const noLowerPassword = 'PASSWORD123!';
        const validation = SecurityService.validatePasswordStrength(noLowerPassword);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('密码必须包含小写字母');
      });

      it('should check number requirement', () => {
        const noNumberPassword = 'Password!';
        const validation = SecurityService.validatePasswordStrength(noNumberPassword);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('密码必须包含数字');
      });

      it('should check special character requirement', () => {
        const noSpecialPassword = 'Password123';
        const validation = SecurityService.validatePasswordStrength(noSpecialPassword);

        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('密码必须包含特殊字符');
      });
    });

    describe('password hashing and verification', () => {
      it('should hash and verify password correctly', async () => {
        const password = 'TestPassword123!';
        
        const hashedPassword = await SecurityService.hashPassword(password);
        expect(hashedPassword).toBeTruthy();
        expect(hashedPassword).not.toBe(password);

        const isValid = await SecurityService.verifyPassword(password, hashedPassword);
        expect(isValid).toBe(true);

        const isInvalid = await SecurityService.verifyPassword('WrongPassword', hashedPassword);
        expect(isInvalid).toBe(false);
      });

      it('should generate different hashes for same password', async () => {
        const password = 'TestPassword123!';
        
        const hash1 = await SecurityService.hashPassword(password);
        const hash2 = await SecurityService.hashPassword(password);
        
        expect(hash1).not.toBe(hash2);
        
        // Both hashes should verify the same password
        expect(await SecurityService.verifyPassword(password, hash1)).toBe(true);
        expect(await SecurityService.verifyPassword(password, hash2)).toBe(true);
      });
    });

    describe('token generation', () => {
      it('should generate secure token with default length', () => {
        const token = SecurityService.generateSecureToken();
        
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token.length).toBe(64); // 32 bytes = 64 hex characters
      });

      it('should generate secure token with custom length', () => {
        const length = 16;
        const token = SecurityService.generateSecureToken(length);
        
        expect(token).toBeTruthy();
        expect(token.length).toBe(length * 2); // hex encoding doubles the length
      });

      it('should generate different tokens each time', () => {
        const token1 = SecurityService.generateSecureToken();
        const token2 = SecurityService.generateSecureToken();
        
        expect(token1).not.toBe(token2);
      });
    });

    describe('data encryption and decryption', () => {
      it('should encrypt and decrypt data correctly', () => {
        const originalData = 'Sensitive information that needs encryption';
        
        const encryptedData = SecurityService.encryptSensitiveData(originalData);
        expect(encryptedData).toBeTruthy();
        expect(encryptedData).not.toBe(originalData);
        expect(encryptedData).toContain(':'); // Should contain IV separator

        const decryptedData = SecurityService.decryptSensitiveData(encryptedData);
        expect(decryptedData).toBe(originalData);
      });

      it('should encrypt same data differently each time', () => {
        const data = 'Test data for encryption';
        
        const encrypted1 = SecurityService.encryptSensitiveData(data);
        const encrypted2 = SecurityService.encryptSensitiveData(data);
        
        expect(encrypted1).not.toBe(encrypted2);
        
        // Both should decrypt to the same original data
        expect(SecurityService.decryptSensitiveData(encrypted1)).toBe(data);
        expect(SecurityService.decryptSensitiveData(encrypted2)).toBe(data);
      });

      it('should handle custom encryption key', () => {
        const data = 'Test data';
        const customKey = 'my-custom-encryption-key';
        
        const encrypted = SecurityService.encryptSensitiveData(data, customKey);
        const decrypted = SecurityService.decryptSensitiveData(encrypted, customKey);
        
        expect(decrypted).toBe(data);
      });
    });

    describe('IP address management', () => {
      it('should allow all IPs when no restrictions configured', () => {
        const testIps = ['192.168.1.1', '10.0.0.1', '127.0.0.1'];
        
        testIps.forEach(ip => {
          expect(SecurityService.isIpAllowed(ip)).toBe(true);
        });
      });

      it('should respect IP whitelist', () => {
        const policy = SecurityService.getSecurityPolicy();
        policy.access_policy.ip_whitelist = ['192.168.1.1', '10.0.0.1'];
        SecurityService.updateSecurityPolicy(policy);

        expect(SecurityService.isIpAllowed('192.168.1.1')).toBe(true);
        expect(SecurityService.isIpAllowed('10.0.0.1')).toBe(true);
        expect(SecurityService.isIpAllowed('172.16.0.1')).toBe(false);
      });

      it('should respect IP blacklist', () => {
        const policy = SecurityService.getSecurityPolicy();
        policy.access_policy.ip_whitelist = []; // Clear whitelist
        policy.access_policy.ip_blacklist = ['192.168.1.100', '10.0.0.100'];
        SecurityService.updateSecurityPolicy(policy);

        expect(SecurityService.isIpAllowed('192.168.1.1')).toBe(true);
        expect(SecurityService.isIpAllowed('192.168.1.100')).toBe(false);
        expect(SecurityService.isIpAllowed('10.0.0.100')).toBe(false);
      });

      it('should prioritize blacklist over whitelist', () => {
        const policy = SecurityService.getSecurityPolicy();
        policy.access_policy.ip_whitelist = ['192.168.1.1'];
        policy.access_policy.ip_blacklist = ['192.168.1.1']; // Same IP in both lists
        SecurityService.updateSecurityPolicy(policy);

        expect(SecurityService.isIpAllowed('192.168.1.1')).toBe(false);
      });
    });

    describe('login attempt tracking', () => {
      const testIdentifier = 'test@example.com';

      beforeEach(() => {
        // Reset login attempts for clean test state
        SecurityService['loginAttempts'].clear();
      });

      it('should not be locked initially', () => {
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);
      });

      it('should track failed login attempts', () => {
        SecurityService.recordLoginAttempt(testIdentifier, false);
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);

        // Record multiple failed attempts
        for (let i = 0; i < 4; i++) {
          SecurityService.recordLoginAttempt(testIdentifier, false);
        }
        
        // Should be locked after max attempts
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(true);
      });

      it('should clear attempts on successful login', () => {
        // Record some failed attempts
        for (let i = 0; i < 3; i++) {
          SecurityService.recordLoginAttempt(testIdentifier, false);
        }

        // Successful login should clear attempts
        SecurityService.recordLoginAttempt(testIdentifier, true);
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);

        // Should be able to fail again without immediate lockout
        SecurityService.recordLoginAttempt(testIdentifier, false);
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);
      });

      it('should respect lockout duration', async () => {
        // Trigger lockout
        for (let i = 0; i < 5; i++) {
          SecurityService.recordLoginAttempt(testIdentifier, false);
        }
        
        expect(SecurityService.isLoginLocked(testIdentifier)).toBe(true);

        // Simulate time passing (this is a simplified test)
        // In a real scenario, you'd need to manipulate time or wait
        const attempts = SecurityService['loginAttempts'].get(testIdentifier);
        if (attempts && attempts.lockedUntil) {
          attempts.lockedUntil = new Date(Date.now() - 1000); // Set to past
          expect(SecurityService.isLoginLocked(testIdentifier)).toBe(false);
        }
      });
    });

    describe('security event logging', () => {
      it('should log security events', async () => {
        const event = {
          event_type: 'login_attempt' as const,
          user_id: 1,
          ip_address: '192.168.1.1',
          user_agent: 'Test User Agent',
          details: { username: 'testuser' },
          risk_level: 'low' as const,
          timestamp: new Date()
        };

        await SecurityService.logSecurityEvent(event);

        // Verify event was saved to database
        const savedEvent = await SecurityLog.findOne({
          where: {
            event_type: event.event_type,
            user_id: event.user_id,
            ip_address: event.ip_address
          }
        });

        expect(savedEvent).toBeTruthy();
        expect(savedEvent?.event_type).toBe(event.event_type);
        expect(savedEvent?.risk_level).toBe(event.risk_level);
      });

      it('should handle high-risk events', async () => {
        const highRiskEvent = {
          event_type: 'brute_force_attempt' as const,
          ip_address: '192.168.1.100',
          user_agent: 'Malicious Agent',
          details: { attempts: 10 },
          risk_level: 'critical' as const,
          timestamp: new Date()
        };

        // This should trigger additional security measures
        await SecurityService.logSecurityEvent(highRiskEvent);

        const savedEvent = await SecurityLog.findOne({
          where: {
            event_type: highRiskEvent.event_type,
            ip_address: highRiskEvent.ip_address
          }
        });

        expect(savedEvent).toBeTruthy();
        expect(savedEvent?.risk_level).toBe('critical');
      });
    });

    describe('audit logging', () => {
      it('should log audit events', async () => {
        const auditData = {
          audit_type: 'data_change' as const,
          user_id: 1,
          resource_type: 'user',
          resource_id: '123',
          action: 'update',
          old_values: { name: 'Old Name' },
          new_values: { name: 'New Name' },
          ip_address: '192.168.1.1',
          user_agent: 'Test Agent',
          success: true
        };

        await SecurityService.logAudit(auditData);

        const auditLogs = SecurityService.getAuditLogs({ limit: 1 });
        expect(auditLogs).toHaveLength(1);
        expect(auditLogs[0].audit_type).toBe(auditData.audit_type);
        expect(auditLogs[0].user_id).toBe(auditData.user_id);
        expect(auditLogs[0].action).toBe(auditData.action);
      });

      it('should filter audit logs', async () => {
        // Add multiple audit entries
        const auditEntries = [
          {
            audit_type: 'access' as const,
            user_id: 1,
            resource_type: 'user',
            action: 'read',
            ip_address: '192.168.1.1',
            user_agent: 'Test Agent',
            success: true
          },
          {
            audit_type: 'data_change' as const,
            user_id: 2,
            resource_type: 'cattle',
            action: 'create',
            ip_address: '192.168.1.2',
            user_agent: 'Test Agent',
            success: true
          }
        ];

        for (const entry of auditEntries) {
          await SecurityService.logAudit(entry);
        }

        // Filter by user_id
        const userLogs = SecurityService.getAuditLogs({ user_id: 1 });
        expect(userLogs.length).toBeGreaterThan(0);
        userLogs.forEach(log => expect(log.user_id).toBe(1));

        // Filter by resource_type
        const cattleLogs = SecurityService.getAuditLogs({ resource_type: 'cattle' });
        expect(cattleLogs.length).toBeGreaterThan(0);
        cattleLogs.forEach(log => expect(log.resource_type).toBe('cattle'));

        // Filter by action
        const createLogs = SecurityService.getAuditLogs({ action: 'create' });
        expect(createLogs.length).toBeGreaterThan(0);
        createLogs.forEach(log => expect(log.action).toBe('create'));
      });
    });

    describe('threat detection and management', () => {
      it('should detect and record threats', async () => {
        const mockRequest = {
          ip: '192.168.1.100',
          get: jest.fn().mockReturnValue('Malicious User Agent'),
          url: '/api/test',
          method: 'POST',
          body: { query: "'; DROP TABLE users; --" },
          query: {}
        } as any;

        await SecurityService.detectThreat(mockRequest, { suspicious: true });

        const threats = SecurityService.getDetectedThreats();
        expect(threats.length).toBeGreaterThan(0);

        const sqlThreat = threats.find(t => t.threat_type === 'sql_injection');
        expect(sqlThreat).toBeTruthy();
        expect(sqlThreat?.source_ip).toBe('192.168.1.100');
        expect(sqlThreat?.status).toBe('detected');
      });

      it('should update threat status', () => {
        // First create a threat
        const threats = SecurityService.getDetectedThreats();
        if (threats.length > 0) {
          const threatId = threats[0].threat_id;
          const updated = SecurityService.updateThreatStatus(
            threatId, 
            'investigating', 
            ['Blocked IP address', 'Notified security team']
          );

          expect(updated).toBe(true);

          const updatedThreat = SecurityService.getDetectedThreats().find(t => t.threat_id === threatId);
          expect(updatedThreat?.status).toBe('investigating');
          expect(updatedThreat?.mitigation_actions).toContain('Blocked IP address');
        }
      });

      it('should filter threats by criteria', async () => {
        // Ensure we have some threats for testing
        const mockRequest = {
          ip: '192.168.1.101',
          get: jest.fn().mockReturnValue('Test Agent'),
          url: '/api/test',
          method: 'GET',
          body: { script: '<script>alert("xss")</script>' },
          query: {}
        } as any;

        await SecurityService.detectThreat(mockRequest, {});

        // Filter by threat type
        const sqlThreats = SecurityService.getDetectedThreats({ threat_type: 'sql_injection' });
        sqlThreats.forEach(threat => expect(threat.threat_type).toBe('sql_injection'));

        // Filter by severity
        const highThreats = SecurityService.getDetectedThreats({ severity: 'high' });
        highThreats.forEach(threat => expect(threat.severity).toBe('high'));

        // Filter by status
        const detectedThreats = SecurityService.getDetectedThreats({ status: 'detected' });
        detectedThreats.forEach(threat => expect(threat.status).toBe('detected'));
      });
    });

    describe('security policy management', () => {
      it('should get current security policy', () => {
        const policy = SecurityService.getSecurityPolicy();

        expect(policy).toBeTruthy();
        expect(policy.password_policy).toBeTruthy();
        expect(policy.session_policy).toBeTruthy();
        expect(policy.access_policy).toBeTruthy();
        expect(policy.audit_policy).toBeTruthy();
      });

      it('should update security policy', () => {
        const updates = {
          password_policy: {
            min_length: 10,
            require_uppercase: true,
            require_lowercase: true,
            require_numbers: true,
            require_special_chars: false,
            max_age_days: 60,
            history_count: 3
          }
        };

        SecurityService.updateSecurityPolicy(updates);

        const updatedPolicy = SecurityService.getSecurityPolicy();
        expect(updatedPolicy.password_policy.min_length).toBe(10);
        expect(updatedPolicy.password_policy.require_special_chars).toBe(false);
        expect(updatedPolicy.password_policy.max_age_days).toBe(60);
      });
    });

    describe('security report generation', () => {
      it('should generate security report', async () => {
        const timeRange = {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          end: new Date()
        };

        const report = await SecurityService.generateSecurityReport(timeRange);

        expect(report).toBeTruthy();
        expect(report.summary).toBeTruthy();
        expect(typeof report.summary.total_events).toBe('number');
        expect(typeof report.summary.high_risk_events).toBe('number');
        expect(typeof report.summary.threats_detected).toBe('number');
        expect(typeof report.summary.audit_entries).toBe('number');

        expect(typeof report.event_distribution).toBe('object');
        expect(typeof report.threat_distribution).toBe('object');
        expect(Array.isArray(report.top_risk_ips)).toBe(true);
        expect(Array.isArray(report.recommendations)).toBe(true);
      });

      it('should provide security recommendations', async () => {
        const timeRange = {
          start: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          end: new Date()
        };

        const report = await SecurityService.generateSecurityReport(timeRange);

        expect(report.recommendations).toBeTruthy();
        expect(report.recommendations.length).toBeGreaterThan(0);
        report.recommendations.forEach(recommendation => {
          expect(typeof recommendation).toBe('string');
          expect(recommendation.length).toBeGreaterThan(0);
        });
      });
    });
  });
});

describe('Security Integration Tests', () => {
  // 这里可以添加集成测试，测试安全服务与其他组件的协作
  it.skip('should integrate security logging with audit system', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });

  it.skip('should integrate threat detection with monitoring system', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });

  it.skip('should integrate security policies with authentication system', async () => {
    // 集成测试将在完整的应用程序测试中实现
  });
});