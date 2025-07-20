import { Request, Response } from 'express';
import { DataIntegrationService } from '@/services/DataIntegrationService';
import { DataConsistencyService } from '@/services/DataConsistencyService';
import { DataSyncService } from '@/services/DataSyncService';
import { DataMigrationService } from '@/services/DataMigrationService';
import { logger } from '@/utils/logger';
import multer from 'multer';
import path from 'path';

// 配置文件上传
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持 CSV 和 Excel 文件'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

export class DataIntegrationController {
  /**
   * 获取数据流转历史
   */
  static async getDataFlowHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const history = DataIntegrationService.getDataFlowHistory(limit);

      res.json({
        success: true,
        data: history,
        total: history.length
      });
    } catch (error) {
      logger.error('获取数据流转历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取数据流转历史失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取待处理的数据流转事件
   */
  static async getPendingDataFlowEvents(req: Request, res: Response): Promise<void> {
    try {
      const events = DataIntegrationService.getPendingDataFlowEvents();

      res.json({
        success: true,
        data: events,
        total: events.length
      });
    } catch (error) {
      logger.error('获取待处理数据流转事件失败:', error);
      res.status(500).json({
        success: false,
        message: '获取待处理数据流转事件失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 执行数据一致性检查
   */
  static async performConsistencyCheck(req: Request, res: Response): Promise<void> {
    try {
      const report = await DataConsistencyService.performFullConsistencyCheck();

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('数据一致性检查失败:', error);
      res.status(500).json({
        success: false,
        message: '数据一致性检查失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取数据质量评分
   */
  static async getDataQualityScore(req: Request, res: Response): Promise<void> {
    try {
      const scoreData = await DataConsistencyService.getDataQualityScore();

      res.json({
        success: true,
        data: scoreData
      });
    } catch (error) {
      logger.error('获取数据质量评分失败:', error);
      res.status(500).json({
        success: false,
        message: '获取数据质量评分失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 修复数据一致性问题
   */
  static async fixDataInconsistencies(req: Request, res: Response): Promise<void> {
    try {
      const { checkIds } = req.body;

      if (!Array.isArray(checkIds)) {
        res.status(400).json({
          success: false,
          message: '请提供要修复的检查项ID数组'
        });
        return;
      }

      const result = await DataConsistencyService.fixDataInconsistencies(checkIds);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('修复数据一致性问题失败:', error);
      res.status(500).json({
        success: false,
        message: '修复数据一致性问题失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 创建数据备份
   */
  static async createBackup(req: Request, res: Response): Promise<void> {
    try {
      const config = req.body;
      const backup = await DataSyncService.createBackup(config);

      res.json({
        success: true,
        data: backup
      });
    } catch (error) {
      logger.error('创建数据备份失败:', error);
      res.status(500).json({
        success: false,
        message: '创建数据备份失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 恢复数据备份
   */
  static async restoreBackup(req: Request, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;
      const options = req.body;

      await DataSyncService.restoreBackup(backupId, options);

      res.json({
        success: true,
        message: '数据备份恢复成功'
      });
    } catch (error) {
      logger.error('恢复数据备份失败:', error);
      res.status(500).json({
        success: false,
        message: '恢复数据备份失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取同步状态
   */
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await DataSyncService.getSyncStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('获取同步状态失败:', error);
      res.status(500).json({
        success: false,
        message: '获取同步状态失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取备份历史
   */
  static async getBackupHistory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const history = DataSyncService.getBackupHistory(limit);

      res.json({
        success: true,
        data: history,
        total: history.length
      });
    } catch (error) {
      logger.error('获取备份历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取备份历史失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 删除备份
   */
  static async deleteBackup(req: Request, res: Response): Promise<void> {
    try {
      const { backupId } = req.params;
      await DataSyncService.deleteBackup(backupId);

      res.json({
        success: true,
        message: '备份删除成功'
      });
    } catch (error) {
      logger.error('删除备份失败:', error);
      res.status(500).json({
        success: false,
        message: '删除备份失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 执行数据库迁移
   */
  static async runMigrations(req: Request, res: Response): Promise<void> {
    try {
      const { targetVersion } = req.body;
      await DataMigrationService.runMigrations(targetVersion);

      res.json({
        success: true,
        message: '数据库迁移完成'
      });
    } catch (error) {
      logger.error('数据库迁移失败:', error);
      res.status(500).json({
        success: false,
        message: '数据库迁移失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 回滚迁移
   */
  static async rollbackMigration(req: Request, res: Response): Promise<void> {
    try {
      const { migrationId } = req.params;
      await DataMigrationService.rollbackMigration(migrationId);

      res.json({
        success: true,
        message: '迁移回滚成功'
      });
    } catch (error) {
      logger.error('迁移回滚失败:', error);
      res.status(500).json({
        success: false,
        message: '迁移回滚失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 获取迁移历史
   */
  static async getMigrationHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = DataMigrationService.getMigrationHistory();

      res.json({
        success: true,
        data: history,
        current_version: DataMigrationService.getCurrentVersion()
      });
    } catch (error) {
      logger.error('获取迁移历史失败:', error);
      res.status(500).json({
        success: false,
        message: '获取迁移历史失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 导入数据
   */
  static importData = [
    upload.single('file'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          res.status(400).json({
            success: false,
            message: '请上传文件'
          });
          return;
        }

        const { tableName, format, sheetName, batchSize, skipDuplicates, updateOnDuplicate } = req.body;

        if (!tableName) {
          res.status(400).json({
            success: false,
            message: '请指定目标表名'
          });
          return;
        }

        const options = {
          format: format || 'csv',
          sheet_name: sheetName,
          batch_size: parseInt(batchSize) || 100,
          skip_duplicates: skipDuplicates === 'true',
          update_on_duplicate: updateOnDuplicate === 'true'
        };

        const result = await DataMigrationService.importData(req.file.path, tableName, options);

        // 清理上传的文件
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        logger.error('数据导入失败:', error);
        res.status(500).json({
          success: false,
          message: '数据导入失败',
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  ];

  /**
   * 导出数据
   */
  static async exportData(req: Request, res: Response): Promise<void> {
    try {
      const { tableName } = req.params;
      const { format, whereClause, columns, limit, includeHeaders } = req.query;

      const outputPath = `exports/${tableName}_${Date.now()}`;
      
      const options = {
        format: (format as string) || 'csv',
        output_path: outputPath,
        where_clause: whereClause as string,
        columns: columns ? (columns as string).split(',') : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        include_headers: includeHeaders !== 'false'
      };

      const result = await DataMigrationService.exportData(tableName, options);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('数据导出失败:', error);
      res.status(500).json({
        success: false,
        message: '数据导出失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 数据转换
   */
  static async transformData(req: Request, res: Response): Promise<void> {
    try {
      const { sourceTable, targetTable, transformRules } = req.body;

      if (!sourceTable || !targetTable || !transformRules) {
        res.status(400).json({
          success: false,
          message: '请提供源表、目标表和转换规则'
        });
        return;
      }

      const result = await DataMigrationService.transformData(sourceTable, targetTable, transformRules);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('数据转换失败:', error);
      res.status(500).json({
        success: false,
        message: '数据转换失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 手动触发采购订单完成数据流转
   */
  static async triggerPurchaseOrderFlow(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      await DataIntegrationService.handlePurchaseOrderCompletion(parseInt(orderId));

      res.json({
        success: true,
        message: '采购订单数据流转处理完成'
      });
    } catch (error) {
      logger.error('采购订单数据流转处理失败:', error);
      res.status(500).json({
        success: false,
        message: '采购订单数据流转处理失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 手动触发销售订单完成数据流转
   */
  static async triggerSalesOrderFlow(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;
      await DataIntegrationService.handleSalesOrderCompletion(parseInt(orderId));

      res.json({
        success: true,
        message: '销售订单数据流转处理完成'
      });
    } catch (error) {
      logger.error('销售订单数据流转处理失败:', error);
      res.status(500).json({
        success: false,
        message: '销售订单数据流转处理失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 手动触发饲喂记录库存扣减
   */
  static async triggerFeedingRecordFlow(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      await DataIntegrationService.handleFeedingRecordCreation(parseInt(recordId));

      res.json({
        success: true,
        message: '饲喂记录库存扣减处理完成'
      });
    } catch (error) {
      logger.error('饲喂记录库存扣减处理失败:', error);
      res.status(500).json({
        success: false,
        message: '饲喂记录库存扣减处理失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * 手动触发健康记录状态更新
   */
  static async triggerHealthRecordFlow(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      await DataIntegrationService.handleHealthRecordUpdate(parseInt(recordId));

      res.json({
        success: true,
        message: '健康记录状态更新处理完成'
      });
    } catch (error) {
      logger.error('健康记录状态更新处理失败:', error);
      res.status(500).json({
        success: false,
        message: '健康记录状态更新处理失败',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}