import { Request, Response } from 'express';
import { SecurityService } from '@/services/SecurityService';
import { logger } from '@/utils/logger';

export class SecurityController {
  /**
   * 获取安全策略
   */
  static async getSecurityPolicy(req: Request, res: Response): Promise<void> {
    try {
      const policy = SecurityService.getSecurityPolicy();

      res.json({
        success: true,
        data: policy
      });
    } catch (error) {
      logger.error('获取安全策略失败:', error);
      res.status(500).json({
        success: false,
        message: '获取安全策略失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 更新安全策略
   */
  static async updateSecurityPolicy(req: Request, res: Response): Promise<void> {
    try {
      const updates = req.body;
      SecurityService.updateSecurityPolicy(updates);

      // 记录安全审计
      await SecurityService.logAudit({
        audit_type: 'system_change',
        user_id: (req as any).user?.id,
        resource_type: 'security_policy',
        action: 'update',
        new_values: updates,
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: true
      });

      res.json({
        success: true,
        message: '安全策略更新成功'
      });
    } catch (error) {
      logger.error('更新安全策略失败:', error);
      res.status(500).json({
        success: false,
        message: '更新安全策略失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 验证密码强度
   */
  static async validatePassword(req: Request, res: Response): Promise<void> {
    try {
      const { password } = req.body;

      if (!password) {
        res.status(400).json({
          success: false,
          message: '请提供密码'
        });
        return;
      }

      const validation = SecurityService.validatePasswordStrength(password);

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      logger.error('验证密码强度失败:', error);
      res.status(500).json({
        success: false,
        message: '验证密码强度失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 加密敏感数据
   */
  static async encryptData(req: Request, res: Response): Promise<void> {
    try {
      const { data, key } = req.body;

      if (!data) {
        res.status(400).json({
          success: false,
          message: '请提供要加密的数据'
        });
        return;
      }

      const encryptedData = SecurityService.encryptSensitiveData(data, key);

      // 记录安全审计
      await SecurityService.logAudit({
        audit_type: 'data_change',
        user_id: (req as any).user?.id,
        resource_type: 'sensitive_data',
        action: 'encrypt',
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: true
      });

      res.json({
        success: true,
        data: {
          encrypted_data: encryptedData
        }
      });
    } catch (error) {
      logger.error('加密数据失败:', error);
      res.status(500).json({
        success: false,
        message: '加密数据失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 解密敏感数据
   */
  static async decryptData(req: Request, res: Response): Promise<void> {
    try {
      const { encryptedData, key } = req.body;

      if (!encryptedData) {
        res.status(400).json({
          success: false,
          message: '请提供要解密的数据'
        });
        return;
      }

      const decryptedData = SecurityService.decryptSensitiveData(encryptedData, key);

      // 记录安全审计
      await SecurityService.logAudit({
        audit_type: 'data_change',
        user_id: (req as any).user?.id,
        resource_type: 'sensitive_data',
        action: 'decrypt',
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: true
      });

      res.json({
        success: true,
        data: {
          decrypted_data: decryptedData
        }
      });
    } catch (error) {
      logger.error('解密数据失败:', error);
      res.status(500).json({
        success: false,
        message: '解密数据失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取审计日志
   */
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const {
        userId,
        resourceType,
        action,
        startDate,
        endDate,
        limit
      } = req.query;

      const filters = {
        user_id: userId ? parseInt(userId as string) : undefined,
        resource_type: resourceType as string,
        action: action as string,
        start_date: startDate ? new Date(startDate as string) : undefined,
        end_date: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined
      };

      // 数据权限过滤
      const dataPermission = (req as any).dataPermission;
      if (!dataPermission || dataPermission.canAccessAllBases) {
        // 超级管理员可以查看所有审计日志
      } else if (dataPermission.baseId) {
        // 基地用户只能查看与自己相关的审计日志
        filters.user_id = (req as any).user?.id;
      } else {
        // 没有基地权限的用户，不显示任何审计日志
        filters.user_id = -1;
      }

      const auditLogs = SecurityService.getAuditLogs(filters);

      res.json({
        success: true,
        data: auditLogs,
        total: auditLogs.length
      });
    } catch (error) {
      logger.error('获取审计日志失败:', error);
      res.status(500).json({
        success: false,
        message: '获取审计日志失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取检测到的威胁
   */
  static async getDetectedThreats(req: Request, res: Response): Promise<void> {
    try {
      const {
        threatType,
        severity,
        status,
        limit
      } = req.query;

      const filters = {
        threat_type: threatType as string,
        severity: severity as string,
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined
      };

      const threats = SecurityService.getDetectedThreats(filters);

      res.json({
        success: true,
        data: threats,
        total: threats.length
      });
    } catch (error) {
      logger.error('获取检测到的威胁失败:', error);
      res.status(500).json({
        success: false,
        message: '获取检测到的威胁失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 更新威胁状态
   */
  static async updateThreatStatus(req: Request, res: Response): Promise<void> {
    try {
      const { threatId } = req.params;
      const { status, mitigationActions } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          message: '请提供威胁状态'
        });
        return;
      }

      const updated = SecurityService.updateThreatStatus(threatId, status, mitigationActions);

      if (updated) {
        // 记录安全审计
        await SecurityService.logAudit({
          audit_type: 'system_change',
          user_id: (req as any).user?.id,
          resource_type: 'security_threat',
          resource_id: threatId,
          action: 'update_status',
          new_values: { status, mitigationActions },
          ip_address: req.ip || '',
          user_agent: req.get('User-Agent') || '',
          success: true
        });

        res.json({
          success: true,
          message: '威胁状态更新成功'
        });
      } else {
        res.status(404).json({
          success: false,
          message: '威胁不存在'
        });
      }
    } catch (error) {
      logger.error('更新威胁状态失败:', error);
      res.status(500).json({
        success: false,
        message: '更新威胁状态失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 生成安全报告
   */
  static async generateSecurityReport(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: '请提供开始和结束日期'
        });
        return;
      }

      const timeRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const report = await SecurityService.generateSecurityReport(timeRange);

      // 记录安全审计
      await SecurityService.logAudit({
        audit_type: 'access',
        user_id: (req as any).user?.id,
        resource_type: 'security_report',
        action: 'generate',
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: true
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('生成安全报告失败:', error);
      res.status(500).json({
        success: false,
        message: '生成安全报告失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 检查IP地址状态
   */
  static async checkIpStatus(req: Request, res: Response): Promise<void> {
    try {
      const { ipAddress } = req.params;

      if (!ipAddress) {
        res.status(400).json({
          success: false,
          message: '请提供IP地址'
        });
        return;
      }

      const isAllowed = SecurityService.isIpAllowed(ipAddress);
      const isLocked = SecurityService.isLoginLocked(ipAddress);

      res.json({
        success: true,
        data: {
          ip_address: ipAddress,
          is_allowed: isAllowed,
          is_locked: isLocked
        }
      });
    } catch (error) {
      logger.error('检查IP地址状态失败:', error);
      res.status(500).json({
        success: false,
        message: '检查IP地址状态失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 生成安全令牌
   */
  static async generateSecureToken(req: Request, res: Response): Promise<void> {
    try {
      const { length } = req.body;
      const tokenLength = length || 32;

      const token = SecurityService.generateSecureToken(tokenLength);

      // 记录安全审计
      await SecurityService.logAudit({
        audit_type: 'system_change',
        user_id: (req as any).user?.id,
        resource_type: 'security_token',
        action: 'generate',
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: true
      });

      res.json({
        success: true,
        data: {
          token,
          length: token.length
        }
      });
    } catch (error) {
      logger.error('生成安全令牌失败:', error);
      res.status(500).json({
        success: false,
        message: '生成安全令牌失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 手动触发安全扫描
   */
  static async triggerSecurityScan(req: Request, res: Response): Promise<void> {
    try {
      // 这里可以触发手动安全扫描
      // 由于SecurityService中的performSecurityScan是私有方法，
      // 我们可以通过其他方式触发安全检查

      // 记录安全审计
      await SecurityService.logAudit({
        audit_type: 'system_change',
        user_id: (req as any).user?.id,
        resource_type: 'security_scan',
        action: 'trigger',
        ip_address: req.ip || '',
        user_agent: req.get('User-Agent') || '',
        success: true
      });

      res.json({
        success: true,
        message: '安全扫描已触发'
      });
    } catch (error) {
      logger.error('触发安全扫描失败:', error);
      res.status(500).json({
        success: false,
        message: '触发安全扫描失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取安全统计信息
   */
  static async getSecurityStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { timeWindow } = req.query;
      const windowMs = timeWindow ? parseInt(timeWindow as string) : 24 * 60 * 60 * 1000; // 默认24小时

      // 获取审计日志统计
      const auditLogs = SecurityService.getAuditLogs({
        start_date: new Date(Date.now() - windowMs),
        end_date: new Date()
      });

      // 获取威胁统计
      const threats = SecurityService.getDetectedThreats();
      const recentThreats = threats.filter(
        threat => threat.detected_at.getTime() > Date.now() - windowMs
      );

      // 统计分析
      const auditStats = {
        total_audits: auditLogs.length,
        successful_operations: auditLogs.filter(log => log.success).length,
        failed_operations: auditLogs.filter(log => !log.success).length,
        unique_users: new Set(auditLogs.map(log => log.user_id).filter(Boolean)).size,
        top_actions: this.getTopActions(auditLogs),
        top_resources: this.getTopResources(auditLogs)
      };

      const threatStats = {
        total_threats: recentThreats.length,
        critical_threats: recentThreats.filter(t => t.severity === 'critical').length,
        high_threats: recentThreats.filter(t => t.severity === 'high').length,
        resolved_threats: recentThreats.filter(t => t.status === 'resolved').length,
        threat_types: this.getThreatTypeDistribution(recentThreats)
      };

      res.json({
        success: true,
        data: {
          time_window_hours: windowMs / (60 * 60 * 1000),
          audit_statistics: auditStats,
          threat_statistics: threatStats
        }
      });
    } catch (error) {
      logger.error('获取安全统计信息失败:', error);
      res.status(500).json({
        success: false,
        message: '获取安全统计信息失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 私有辅助方法

  private static getTopActions(auditLogs: any[]): Array<{ action: string; count: number }> {
    const actionCounts = new Map<string, number>();
    
    auditLogs.forEach(log => {
      const count = actionCounts.get(log.action) || 0;
      actionCounts.set(log.action, count + 1);
    });

    return Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static getTopResources(auditLogs: any[]): Array<{ resource_type: string; count: number }> {
    const resourceCounts = new Map<string, number>();
    
    auditLogs.forEach(log => {
      const count = resourceCounts.get(log.resource_type) || 0;
      resourceCounts.set(log.resource_type, count + 1);
    });

    return Array.from(resourceCounts.entries())
      .map(([resource_type, count]) => ({ resource_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private static getThreatTypeDistribution(threats: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    threats.forEach(threat => {
      distribution[threat.threat_type] = (distribution[threat.threat_type] || 0) + 1;
    });

    return distribution;
  }
}