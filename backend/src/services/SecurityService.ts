import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { sequelize } from '@/config/database';
import { SecurityLog, User } from '@/models';
import { logger } from '@/utils/logger';
import { redisClient } from '@/config/redis';

export interface SecurityEvent {
  event_type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'password_change' | 
             'permission_denied' | 'suspicious_activity' | 'data_access' | 'data_modification' | 
             'security_violation' | 'brute_force_attempt';
  user_id?: number;
  ip_address: string;
  user_agent: string;
  details: any;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface SecurityPolicy {
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    max_age_days: number;
    history_count: number;
  };
  session_policy: {
    max_duration_hours: number;
    idle_timeout_minutes: number;
    concurrent_sessions_limit: number;
    require_2fa: boolean;
  };
  access_policy: {
    max_login_attempts: number;
    lockout_duration_minutes: number;
    ip_whitelist: string[];
    ip_blacklist: string[];
    require_https: boolean;
  };
  audit_policy: {
    log_all_access: boolean;
    log_data_changes: boolean;
    retention_days: number;
    alert_on_suspicious: boolean;
  };
}

export interface SecurityAudit {
  audit_id: string;
  audit_type: 'access' | 'data_change' | 'permission_change' | 'system_change';
  user_id?: number;
  resource_type: string;
  resource_id?: string;
  action: string;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  success: boolean;
  error_message?: string;
}

export interface SecurityThreat {
  threat_id: string;
  threat_type: 'brute_force' | 'sql_injection' | 'xss_attempt' | 'csrf_attempt' | 
               'unauthorized_access' | 'data_exfiltration' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  user_id?: number;
  description: string;
  evidence: any;
  detected_at: Date;
  status: 'detected' | 'investigating' | 'mitigated' | 'resolved';
  mitigation_actions: string[];
}

export class SecurityService {
  private static securityPolicy: SecurityPolicy = {
    password_policy: {
      min_length: 8,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_special_chars: true,
      max_age_days: 90,
      history_count: 5
    },
    session_policy: {
      max_duration_hours: 8,
      idle_timeout_minutes: 30,
      concurrent_sessions_limit: 3,
      require_2fa: false
    },
    access_policy: {
      max_login_attempts: 5,
      lockout_duration_minutes: 15,
      ip_whitelist: [],
      ip_blacklist: [],
      require_https: true
    },
    audit_policy: {
      log_all_access: true,
      log_data_changes: true,
      retention_days: 365,
      alert_on_suspicious: true
    }
  };

  private static auditLogs: SecurityAudit[] = [];
  private static detectedThreats: SecurityThreat[] = [];
  private static loginAttempts: Map<string, { count: number; lastAttempt: Date; lockedUntil?: Date }> = new Map();

  /**
   * 初始化安全服务
   */
  static initialize(): void {
    // 启动定期安全检查
    this.startSecurityMonitoring();
    
    // 清理过期的登录尝试记录
    this.startLoginAttemptCleanup();
    
    logger.info('安全服务初始化完成');
  }

  /**
   * 验证密码强度
   */
  static validatePasswordStrength(password: string): {
    valid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // 检查长度
    if (password.length < this.securityPolicy.password_policy.min_length) {
      errors.push(`密码长度至少需要${this.securityPolicy.password_policy.min_length}位`);
    } else {
      score += 20;
    }

    // 检查大写字母
    if (this.securityPolicy.password_policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    } else if (/[A-Z]/.test(password)) {
      score += 20;
    }

    // 检查小写字母
    if (this.securityPolicy.password_policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    } else if (/[a-z]/.test(password)) {
      score += 20;
    }

    // 检查数字
    if (this.securityPolicy.password_policy.require_numbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    } else if (/\d/.test(password)) {
      score += 20;
    }

    // 检查特殊字符
    if (this.securityPolicy.password_policy.require_special_chars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 20;
    }

    return {
      valid: errors.length === 0,
      errors,
      score: Math.min(100, score)
    };
  }

  /**
   * 安全哈希密码
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 验证密码
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * 生成安全的随机令牌
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 加密敏感数据
   */
  static encryptSensitiveData(data: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密敏感数据
   */
  static decryptSensitiveData(encryptedData: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const algorithm = 'aes-256-gcm';
    
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * 检查IP地址是否被允许
   */
  static isIpAllowed(ipAddress: string): boolean {
    const { ip_whitelist, ip_blacklist } = this.securityPolicy.access_policy;

    // 检查黑名单
    if (ip_blacklist.length > 0 && ip_blacklist.includes(ipAddress)) {
      return false;
    }

    // 检查白名单（如果配置了白名单，只允许白名单中的IP）
    if (ip_whitelist.length > 0 && !ip_whitelist.includes(ipAddress)) {
      return false;
    }

    return true;
  }

  /**
   * 检查登录尝试是否被锁定
   */
  static isLoginLocked(identifier: string): boolean {
    const attempts = this.loginAttempts.get(identifier);
    
    if (!attempts) {
      return false;
    }

    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
      return true;
    }

    return false;
  }

  /**
   * 记录登录尝试
   */
  static recordLoginAttempt(identifier: string, success: boolean): void {
    const now = new Date();
    const attempts = this.loginAttempts.get(identifier) || { count: 0, lastAttempt: now };

    if (success) {
      // 成功登录，清除尝试记录
      this.loginAttempts.delete(identifier);
      return;
    }

    // 失败的登录尝试
    attempts.count++;
    attempts.lastAttempt = now;

    if (attempts.count >= this.securityPolicy.access_policy.max_login_attempts) {
      // 达到最大尝试次数，锁定账户
      const lockoutDuration = this.securityPolicy.access_policy.lockout_duration_minutes * 60 * 1000;
      attempts.lockedUntil = new Date(now.getTime() + lockoutDuration);
      
      // 记录安全事件
      this.logSecurityEvent({
        event_type: 'brute_force_attempt',
        ip_address: identifier,
        user_agent: '',
        details: {
          attempts_count: attempts.count,
          locked_until: attempts.lockedUntil
        },
        risk_level: 'high',
        timestamp: now
      });
    }

    this.loginAttempts.set(identifier, attempts);
  }

  /**
   * 记录安全事件
   */
  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // 保存到数据库
      await SecurityLog.create({
        event_type: event.event_type,
        user_id: event.user_id,
        ip_address: event.ip_address,
        user_agent: event.user_agent,
        details: event.details,
        risk_level: event.risk_level,
        timestamp: event.timestamp
      });

      // 如果是高风险事件，发送警报
      if (event.risk_level === 'high' || event.risk_level === 'critical') {
        await this.sendSecurityAlert(event);
      }

      logger.info('安全事件记录', {
        eventType: event.event_type,
        riskLevel: event.risk_level,
        userId: event.user_id,
        ipAddress: event.ip_address
      });
    } catch (error) {
      logger.error('记录安全事件失败:', error);
    }
  }

  /**
   * 记录审计日志
   */
  static async logAudit(audit: Omit<SecurityAudit, 'audit_id' | 'timestamp'>): Promise<void> {
    const auditRecord: SecurityAudit = {
      ...audit,
      audit_id: this.generateSecureToken(16),
      timestamp: new Date()
    };

    this.auditLogs.push(auditRecord);

    // 保持审计日志在合理范围内
    if (this.auditLogs.length > 10000) {
      this.auditLogs.shift();
    }

    // 异步保存到Redis
    this.saveAuditToRedis(auditRecord).catch(error => {
      logger.error('保存审计日志到Redis失败:', error);
    });

    logger.debug('审计日志记录', {
      auditType: audit.audit_type,
      userId: audit.user_id,
      resourceType: audit.resource_type,
      action: audit.action
    });
  }

  /**
   * 检测安全威胁
   */
  static async detectThreat(req: Request, suspiciousActivity: any): Promise<void> {
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    const userAgent = req.get('User-Agent') || '';
    const userId = (req as any).user?.id;

    // SQL注入检测
    if (this.detectSqlInjection(req)) {
      await this.recordThreat({
        threat_type: 'sql_injection',
        severity: 'high',
        source_ip: ipAddress,
        user_id: userId,
        description: 'SQL注入尝试检测',
        evidence: {
          url: req.url,
          method: req.method,
          body: req.body,
          query: req.query
        }
      });
    }

    // XSS攻击检测
    if (this.detectXssAttempt(req)) {
      await this.recordThreat({
        threat_type: 'xss_attempt',
        severity: 'medium',
        source_ip: ipAddress,
        user_id: userId,
        description: 'XSS攻击尝试检测',
        evidence: {
          url: req.url,
          body: req.body,
          query: req.query
        }
      });
    }

    // 异常访问模式检测
    if (await this.detectAnomalousAccess(ipAddress, userId)) {
      await this.recordThreat({
        threat_type: 'unauthorized_access',
        severity: 'medium',
        source_ip: ipAddress,
        user_id: userId,
        description: '异常访问模式检测',
        evidence: suspiciousActivity
      });
    }
  }

  /**
   * 获取安全策略
   */
  static getSecurityPolicy(): SecurityPolicy {
    return { ...this.securityPolicy };
  }

  /**
   * 更新安全策略
   */
  static updateSecurityPolicy(updates: Partial<SecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...updates };
    logger.info('安全策略已更新', updates);
  }

  /**
   * 获取审计日志
   */
  static getAuditLogs(filters?: {
    user_id?: number;
    resource_type?: string;
    action?: string;
    start_date?: Date;
    end_date?: Date;
    limit?: number;
  }): SecurityAudit[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.user_id) {
        logs = logs.filter(log => log.user_id === filters.user_id);
      }
      if (filters.resource_type) {
        logs = logs.filter(log => log.resource_type === filters.resource_type);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.start_date) {
        logs = logs.filter(log => log.timestamp >= filters.start_date!);
      }
      if (filters.end_date) {
        logs = logs.filter(log => log.timestamp <= filters.end_date!);
      }
    }

    // 按时间倒序排列
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // 应用限制
    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * 获取检测到的威胁
   */
  static getDetectedThreats(filters?: {
    threat_type?: string;
    severity?: string;
    status?: string;
    limit?: number;
  }): SecurityThreat[] {
    let threats = [...this.detectedThreats];

    if (filters) {
      if (filters.threat_type) {
        threats = threats.filter(threat => threat.threat_type === filters.threat_type);
      }
      if (filters.severity) {
        threats = threats.filter(threat => threat.severity === filters.severity);
      }
      if (filters.status) {
        threats = threats.filter(threat => threat.status === filters.status);
      }
    }

    // 按检测时间倒序排列
    threats.sort((a, b) => b.detected_at.getTime() - a.detected_at.getTime());

    // 应用限制
    if (filters?.limit) {
      threats = threats.slice(0, filters.limit);
    }

    return threats;
  }

  /**
   * 更新威胁状态
   */
  static updateThreatStatus(threatId: string, status: SecurityThreat['status'], mitigationActions?: string[]): boolean {
    const threat = this.detectedThreats.find(t => t.threat_id === threatId);
    
    if (!threat) {
      return false;
    }

    threat.status = status;
    if (mitigationActions) {
      threat.mitigation_actions.push(...mitigationActions);
    }

    logger.info('威胁状态已更新', {
      threatId,
      newStatus: status,
      mitigationActions
    });

    return true;
  }

  /**
   * 生成安全报告
   */
  static async generateSecurityReport(timeRange: { start: Date; end: Date }): Promise<{
    summary: {
      total_events: number;
      high_risk_events: number;
      threats_detected: number;
      audit_entries: number;
    };
    event_distribution: Record<string, number>;
    threat_distribution: Record<string, number>;
    top_risk_ips: Array<{ ip: string; risk_score: number; event_count: number }>;
    recommendations: string[];
  }> {
    try {
      // 获取时间范围内的安全事件
      const securityEvents = await SecurityLog.findAll({
        where: {
          timestamp: {
            [require('sequelize').Op.between]: [timeRange.start, timeRange.end]
          }
        }
      });

      // 获取审计日志
      const auditLogs = this.getAuditLogs({
        start_date: timeRange.start,
        end_date: timeRange.end
      });

      // 获取威胁
      const threats = this.detectedThreats.filter(
        threat => threat.detected_at >= timeRange.start && threat.detected_at <= timeRange.end
      );

      // 统计分析
      const eventDistribution: Record<string, number> = {};
      const threatDistribution: Record<string, number> = {};
      const ipRiskScores: Map<string, { score: number; count: number }> = new Map();

      // 分析安全事件
      securityEvents.forEach(event => {
        eventDistribution[event.event_type] = (eventDistribution[event.event_type] || 0) + 1;
        
        // 计算IP风险评分
        const riskScore = this.calculateRiskScore(event.risk_level);
        const existing = ipRiskScores.get(event.ip_address) || { score: 0, count: 0 };
        ipRiskScores.set(event.ip_address, {
          score: existing.score + riskScore,
          count: existing.count + 1
        });
      });

      // 分析威胁
      threats.forEach(threat => {
        threatDistribution[threat.threat_type] = (threatDistribution[threat.threat_type] || 0) + 1;
      });

      // 生成风险IP排行
      const topRiskIps = Array.from(ipRiskScores.entries())
        .map(([ip, data]) => ({
          ip,
          risk_score: data.score,
          event_count: data.count
        }))
        .sort((a, b) => b.risk_score - a.risk_score)
        .slice(0, 10);

      // 生成建议
      const recommendations = this.generateSecurityRecommendations(
        securityEvents,
        threats,
        auditLogs
      );

      return {
        summary: {
          total_events: securityEvents.length,
          high_risk_events: securityEvents.filter(e => e.risk_level === 'high' || e.risk_level === 'critical').length,
          threats_detected: threats.length,
          audit_entries: auditLogs.length
        },
        event_distribution: eventDistribution,
        threat_distribution: threatDistribution,
        top_risk_ips: topRiskIps,
        recommendations
      };
    } catch (error) {
      logger.error('生成安全报告失败:', error);
      throw error;
    }
  }

  // 私有辅助方法

  private static startSecurityMonitoring(): void {
    // 每小时执行一次安全检查
    setInterval(async () => {
      try {
        await this.performSecurityScan();
      } catch (error) {
        logger.error('安全扫描失败:', error);
      }
    }, 60 * 60 * 1000); // 1小时
  }

  private static startLoginAttemptCleanup(): void {
    // 每15分钟清理过期的登录尝试记录
    setInterval(() => {
      const now = new Date();
      const expiredKeys: string[] = [];

      this.loginAttempts.forEach((attempts, key) => {
        // 清理超过1小时的记录
        if (now.getTime() - attempts.lastAttempt.getTime() > 60 * 60 * 1000) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach(key => this.loginAttempts.delete(key));
    }, 15 * 60 * 1000); // 15分钟
  }

  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // 这里可以集成实际的警报发送服务
      logger.warn('安全警报', {
        eventType: event.event_type,
        riskLevel: event.risk_level,
        details: event.details
      });

      // 可以发送邮件、短信或推送通知
    } catch (error) {
      logger.error('发送安全警报失败:', error);
    }
  }

  private static async saveAuditToRedis(audit: SecurityAudit): Promise<void> {
    try {
      const key = `audit:${audit.audit_id}`;
      const ttl = this.securityPolicy.audit_policy.retention_days * 24 * 60 * 60;
      
      await redisClient.setex(key, ttl, JSON.stringify(audit));
    } catch (error) {
      logger.error('保存审计日志到Redis失败:', error);
    }
  }

  private static async recordThreat(threat: Omit<SecurityThreat, 'threat_id' | 'detected_at' | 'status' | 'mitigation_actions'>): Promise<void> {
    const threatRecord: SecurityThreat = {
      ...threat,
      threat_id: this.generateSecureToken(16),
      detected_at: new Date(),
      status: 'detected',
      mitigation_actions: []
    };

    this.detectedThreats.push(threatRecord);

    // 保持威胁记录在合理范围内
    if (this.detectedThreats.length > 1000) {
      this.detectedThreats.shift();
    }

    // 记录安全事件
    await this.logSecurityEvent({
      event_type: 'security_violation',
      user_id: threat.user_id,
      ip_address: threat.source_ip,
      user_agent: '',
      details: {
        threat_type: threat.threat_type,
        description: threat.description,
        evidence: threat.evidence
      },
      risk_level: threat.severity === 'critical' ? 'critical' : 'high',
      timestamp: new Date()
    });

    logger.warn('安全威胁检测', {
      threatType: threat.threat_type,
      severity: threat.severity,
      sourceIp: threat.source_ip
    });
  }

  private static detectSqlInjection(req: Request): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'|\"|;|--|\*|\|)/,
      /(\bSCRIPT\b)/i
    ];

    const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.url;
    
    return sqlPatterns.some(pattern => pattern.test(checkString));
  }

  private static detectXssAttempt(req: Request): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);
    
    return xssPatterns.some(pattern => pattern.test(checkString));
  }

  private static async detectAnomalousAccess(ipAddress: string, userId?: number): Promise<boolean> {
    try {
      // 检查短时间内的大量请求
      const recentRequests = await redisClient.get(`requests:${ipAddress}`);
      if (recentRequests && parseInt(recentRequests) > 100) { // 1分钟内超过100个请求
        return true;
      }

      // 检查异常时间访问
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) { // 凌晨或深夜访问
        return true;
      }

      return false;
    } catch (error) {
      logger.error('检测异常访问失败:', error);
      return false;
    }
  }

  private static async performSecurityScan(): Promise<void> {
    try {
      // 检查过期密码
      await this.checkExpiredPasswords();
      
      // 检查异常会话
      await this.checkAnomalousSessions();
      
      // 检查权限异常
      await this.checkPermissionAnomalies();
      
      logger.debug('安全扫描完成');
    } catch (error) {
      logger.error('安全扫描失败:', error);
    }
  }

  private static async checkExpiredPasswords(): Promise<void> {
    try {
      const maxAge = this.securityPolicy.password_policy.max_age_days;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      const usersWithExpiredPasswords = await User.findAll({
        where: {
          password_changed_at: {
            [require('sequelize').Op.lt]: cutoffDate
          }
        }
      });

      for (const user of usersWithExpiredPasswords) {
        await this.logSecurityEvent({
          event_type: 'security_violation',
          user_id: user.id,
          ip_address: '',
          user_agent: '',
          details: {
            violation_type: 'expired_password',
            password_age_days: Math.floor((Date.now() - user.password_changed_at.getTime()) / (24 * 60 * 60 * 1000))
          },
          risk_level: 'medium',
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('检查过期密码失败:', error);
    }
  }

  private static async checkAnomalousSessions(): Promise<void> {
    // 这里可以实现会话异常检查逻辑
    // 例如：检查同一用户的多个并发会话、异常地理位置等
  }

  private static async checkPermissionAnomalies(): Promise<void> {
    // 这里可以实现权限异常检查逻辑
    // 例如：检查权限提升、异常权限使用等
  }

  private static calculateRiskScore(riskLevel: string): number {
    switch (riskLevel) {
      case 'low': return 1;
      case 'medium': return 3;
      case 'high': return 7;
      case 'critical': return 10;
      default: return 0;
    }
  }

  private static generateSecurityRecommendations(
    events: any[],
    threats: SecurityThreat[],
    audits: SecurityAudit[]
  ): string[] {
    const recommendations: string[] = [];

    // 基于事件分析生成建议
    const highRiskEvents = events.filter(e => e.risk_level === 'high' || e.risk_level === 'critical');
    if (highRiskEvents.length > 10) {
      recommendations.push('检测到大量高风险安全事件，建议加强访问控制和监控');
    }

    // 基于威胁分析生成建议
    const sqlInjectionThreats = threats.filter(t => t.threat_type === 'sql_injection');
    if (sqlInjectionThreats.length > 0) {
      recommendations.push('检测到SQL注入尝试，建议加强输入验证和使用参数化查询');
    }

    const xssThreats = threats.filter(t => t.threat_type === 'xss_attempt');
    if (xssThreats.length > 0) {
      recommendations.push('检测到XSS攻击尝试，建议加强输出编码和内容安全策略');
    }

    // 基于审计日志分析生成建议
    const failedAudits = audits.filter(a => !a.success);
    if (failedAudits.length > audits.length * 0.1) {
      recommendations.push('检测到较高的操作失败率，建议检查权限配置和用户培训');
    }

    // 默认建议
    if (recommendations.length === 0) {
      recommendations.push('系统安全状况良好，建议继续保持当前的安全措施');
    }

    return recommendations;
  }
}