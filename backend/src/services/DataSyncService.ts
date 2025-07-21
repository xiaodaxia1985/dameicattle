import { Transaction } from 'sequelize';
import { sequelize } from '@/config/database';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  type: 'full' | 'incremental' | 'differential';
  schedule?: string; // cron expression
  retention_days: number;
  compression: boolean;
  encryption: boolean;
  storage_path: string;
  remote_storage?: {
    type: 'ftp' | 's3' | 'azure' | 'gcs';
    config: any;
  };
}

export interface BackupInfo {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  file_path: string;
  file_size: number;
  created_at: Date;
  status: 'completed' | 'failed' | 'in_progress';
  error_message?: string;
  checksum: string;
}

export interface SyncStatus {
  last_backup: Date | null;
  last_restore: Date | null;
  backup_count: number;
  total_backup_size: number;
  next_scheduled_backup: Date | null;
  status: 'healthy' | 'warning' | 'error';
  message: string;
}

export class DataSyncService {
  private static backupHistory: BackupInfo[] = [];
  private static defaultConfig: BackupConfig = {
    type: 'full',
    retention_days: 30,
    compression: true,
    encryption: false,
    storage_path: path.join(process.cwd(), 'backups')
  };

  /**
   * 创建数据库备份
   */
  static async createBackup(config: Partial<BackupConfig> = {}): Promise<BackupInfo> {
    const backupConfig = { ...this.defaultConfig, ...config };
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `cattle_management_${backupConfig.type}_${timestamp}.sql`;
    const filePath = path.join(backupConfig.storage_path, fileName);

    const backupInfo: BackupInfo = {
      id: backupId,
      type: backupConfig.type,
      file_path: filePath,
      file_size: 0,
      created_at: new Date(),
      status: 'in_progress',
      checksum: ''
    };

    try {
      // 确保备份目录存在
      if (!fs.existsSync(backupConfig.storage_path)) {
        fs.mkdirSync(backupConfig.storage_path, { recursive: true });
      }

      logger.info(`开始创建数据库备份: ${backupId}`);

      // 获取数据库连接信息
      const dbConfig = sequelize.config as any;
      
      // 构建 pg_dump 命令
      const dumpCommand = this.buildPgDumpCommand(dbConfig, filePath, backupConfig);
      
      // 执行备份
      const { stdout, stderr } = await execAsync(dumpCommand);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`备份执行失败: ${stderr}`);
      }

      // 获取文件大小
      const stats = fs.statSync(filePath);
      backupInfo.file_size = stats.size;

      // 计算文件校验和
      backupInfo.checksum = await this.calculateFileChecksum(filePath);

      // 压缩文件（如果启用）
      if (backupConfig.compression) {
        await this.compressBackupFile(filePath);
        const compressedStats = fs.statSync(`${filePath}.gz`);
        backupInfo.file_path = `${filePath}.gz`;
        backupInfo.file_size = compressedStats.size;
      }

      // 加密文件（如果启用）
      if (backupConfig.encryption) {
        await this.encryptBackupFile(backupInfo.file_path);
        backupInfo.file_path = `${backupInfo.file_path}.enc`;
      }

      backupInfo.status = 'completed';
      this.backupHistory.push(backupInfo);

      // 清理过期备份
      await this.cleanupOldBackups(backupConfig.retention_days);

      // 上传到远程存储（如果配置）
      if (backupConfig.remote_storage) {
        await this.uploadToRemoteStorage(backupInfo.file_path, backupConfig.remote_storage);
      }

      logger.info(`数据库备份创建完成: ${backupId}`, {
        filePath: backupInfo.file_path,
        fileSize: backupInfo.file_size,
        type: backupInfo.type
      });

      return backupInfo;
    } catch (error) {
      backupInfo.status = 'failed';
      backupInfo.error_message = error instanceof Error ? error.message : String(error);
      this.backupHistory.push(backupInfo);

      logger.error(`数据库备份创建失败: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * 恢复数据库备份
   */
  static async restoreBackup(backupId: string, options: { 
    confirm: boolean;
    target_database?: string;
    clean_before_restore?: boolean;
  }): Promise<void> {
    if (!options.confirm) {
      throw new Error('必须确认恢复操作');
    }

    const backup = this.backupHistory.find(b => b.id === backupId);
    if (!backup || backup.status !== 'completed') {
      throw new Error('备份不存在或状态不正确');
    }

    if (!fs.existsSync(backup.file_path)) {
      throw new Error('备份文件不存在');
    }

    try {
      logger.info(`开始恢复数据库备份: ${backupId}`);

      let restoreFilePath = backup.file_path;

      // 解密文件（如果需要）
      if (backup.file_path.endsWith('.enc')) {
        restoreFilePath = await this.decryptBackupFile(backup.file_path);
      }

      // 解压文件（如果需要）
      if (restoreFilePath.endsWith('.gz')) {
        restoreFilePath = await this.decompressBackupFile(restoreFilePath);
      }

      // 验证文件完整性
      const currentChecksum = await this.calculateFileChecksum(restoreFilePath);
      if (currentChecksum !== backup.checksum && !backup.file_path.includes('compressed')) {
        throw new Error('备份文件校验和不匹配，文件可能已损坏');
      }

      // 获取数据库连接信息
      const dbConfig = sequelize.config as any;
      const targetDb = options.target_database || dbConfig.database;

      // 如果需要，清理目标数据库
      if (options.clean_before_restore) {
        await this.cleanDatabase(targetDb);
      }

      // 构建 psql 恢复命令
      const restoreCommand = this.buildPsqlRestoreCommand(dbConfig, restoreFilePath, targetDb);

      // 执行恢复
      const { stdout, stderr } = await execAsync(restoreCommand);

      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`恢复执行失败: ${stderr}`);
      }

      // 清理临时文件
      if (restoreFilePath !== backup.file_path) {
        fs.unlinkSync(restoreFilePath);
      }

      logger.info(`数据库备份恢复完成: ${backupId}`);
    } catch (error) {
      logger.error(`数据库备份恢复失败: ${backupId}`, error);
      throw error;
    }
  }

  /**
   * 数据同步（主从复制模拟）
   */
  static async syncData(sourceConfig: any, targetConfig: any, options: {
    tables?: string[];
    incremental?: boolean;
    batch_size?: number;
  } = {}): Promise<void> {
    const batchSize = options.batch_size || 1000;
    const tables = options.tables || await this.getAllTableNames();

    try {
      logger.info('开始数据同步', { tables: tables.length, incremental: options.incremental });

      for (const tableName of tables) {
        await this.syncTable(tableName, sourceConfig, targetConfig, {
          incremental: options.incremental,
          batchSize
        });
      }

      logger.info('数据同步完成');
    } catch (error) {
      logger.error('数据同步失败:', error);
      throw error;
    }
  }

  /**
   * 获取同步状态
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    try {
      const backups = this.backupHistory.filter(b => b.status === 'completed');
      const lastBackup = backups.length > 0 ? backups[backups.length - 1] : null;
      
      const totalSize = backups.reduce((sum, backup) => sum + backup.file_size, 0);

      let status: 'healthy' | 'warning' | 'error' = 'healthy';
      let message = '数据同步状态正常';

      // 检查最后备份时间
      if (!lastBackup) {
        status = 'warning';
        message = '尚未创建任何备份';
      } else {
        const daysSinceLastBackup = (Date.now() - lastBackup.created_at.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceLastBackup > 7) {
          status = 'warning';
          message = `最后备份时间超过 ${Math.floor(daysSinceLastBackup)} 天`;
        } else if (daysSinceLastBackup > 1) {
          status = 'warning';
          message = `最后备份时间超过 ${Math.floor(daysSinceLastBackup)} 天`;
        }
      }

      return {
        last_backup: lastBackup?.created_at || null,
        last_restore: null, // 这里可以从日志中获取
        backup_count: backups.length,
        total_backup_size: totalSize,
        next_scheduled_backup: null, // 这里可以根据定时任务计算
        status,
        message
      };
    } catch (error) {
      logger.error('获取同步状态失败:', error);
      return {
        last_backup: null,
        last_restore: null,
        backup_count: 0,
        total_backup_size: 0,
        next_scheduled_backup: null,
        status: 'error',
        message: `获取状态失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 获取备份历史
   */
  static getBackupHistory(limit: number = 50): BackupInfo[] {
    return this.backupHistory
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, limit);
  }

  /**
   * 删除备份
   */
  static async deleteBackup(backupId: string): Promise<void> {
    const backupIndex = this.backupHistory.findIndex(b => b.id === backupId);
    if (backupIndex === -1) {
      throw new Error('备份不存在');
    }

    const backup = this.backupHistory[backupIndex];

    try {
      // 删除文件
      if (fs.existsSync(backup.file_path)) {
        fs.unlinkSync(backup.file_path);
      }

      // 从历史记录中移除
      this.backupHistory.splice(backupIndex, 1);

      logger.info(`备份已删除: ${backupId}`);
    } catch (error) {
      logger.error(`删除备份失败: ${backupId}`, error);
      throw error;
    }
  }

  // 私有辅助方法

  private static buildPgDumpCommand(dbConfig: any, filePath: string, config: BackupConfig): string {
    const { host, port, database, username, password } = dbConfig;
    
    let command = `PGPASSWORD="${password}" pg_dump`;
    command += ` -h ${host}`;
    command += ` -p ${port}`;
    command += ` -U ${username}`;
    command += ` -d ${database}`;
    command += ` --no-password`;
    command += ` --verbose`;
    
    if (config.type === 'full') {
      command += ` --clean --create`;
    }
    
    command += ` -f "${filePath}"`;
    
    return command;
  }

  private static buildPsqlRestoreCommand(dbConfig: any, filePath: string, targetDb: string): string {
    const { host, port, username, password } = dbConfig;
    
    let command = `PGPASSWORD="${password}" psql`;
    command += ` -h ${host}`;
    command += ` -p ${port}`;
    command += ` -U ${username}`;
    command += ` -d ${targetDb}`;
    command += ` --no-password`;
    command += ` -f "${filePath}"`;
    
    return command;
  }

  private static async calculateFileChecksum(filePath: string): Promise<string> {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    return new Promise((resolve, reject) => {
      stream.on('data', (data: string | Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private static async compressBackupFile(filePath: string): Promise<void> {
    const { stdout, stderr } = await execAsync(`gzip "${filePath}"`);
    if (stderr) {
      throw new Error(`压缩失败: ${stderr}`);
    }
  }

  private static async decompressBackupFile(filePath: string): Promise<string> {
    const outputPath = filePath.replace('.gz', '');
    const { stdout, stderr } = await execAsync(`gunzip -c "${filePath}" > "${outputPath}"`);
    if (stderr) {
      throw new Error(`解压失败: ${stderr}`);
    }
    return outputPath;
  }

  private static async encryptBackupFile(filePath: string): Promise<void> {
    // 这里可以实现文件加密逻辑
    // 例如使用 openssl 或其他加密工具
    logger.info(`文件加密功能待实现: ${filePath}`);
  }

  private static async decryptBackupFile(filePath: string): Promise<string> {
    // 这里可以实现文件解密逻辑
    const outputPath = filePath.replace('.enc', '');
    logger.info(`文件解密功能待实现: ${filePath}`);
    return outputPath;
  }

  private static async cleanupOldBackups(retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const oldBackups = this.backupHistory.filter(backup => 
      backup.created_at < cutoffDate && backup.status === 'completed'
    );

    for (const backup of oldBackups) {
      try {
        if (fs.existsSync(backup.file_path)) {
          fs.unlinkSync(backup.file_path);
        }
        
        const index = this.backupHistory.indexOf(backup);
        if (index > -1) {
          this.backupHistory.splice(index, 1);
        }
        
        logger.info(`清理过期备份: ${backup.id}`);
      } catch (error) {
        logger.error(`清理备份失败: ${backup.id}`, error);
      }
    }
  }

  private static async uploadToRemoteStorage(filePath: string, config: any): Promise<void> {
    // 这里可以实现远程存储上传逻辑
    // 支持 FTP, S3, Azure Blob, Google Cloud Storage 等
    logger.info(`远程存储上传功能待实现: ${filePath}`);
  }

  private static async getAllTableNames(): Promise<string[]> {
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    return (results as any[]).map(row => row.table_name);
  }

  private static async syncTable(
    tableName: string, 
    sourceConfig: any, 
    targetConfig: any, 
    options: { incremental?: boolean; batchSize: number }
  ): Promise<void> {
    // 这里可以实现表级别的数据同步逻辑
    logger.info(`同步表 ${tableName}`, options);
  }

  private static async cleanDatabase(database: string): Promise<void> {
    // 这里可以实现数据库清理逻辑
    logger.info(`清理数据库: ${database}`);
  }
}