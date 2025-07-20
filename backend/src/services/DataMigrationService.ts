import { Transaction, QueryTypes } from 'sequelize';
import { sequelize } from '@/config/database';
import { logger } from '@/utils/logger';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import * as XLSX from 'xlsx';

export interface MigrationTask {
  id: string;
  name: string;
  description: string;
  version: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  created_at: Date;
  started_at?: Date;
  completed_at?: Date;
  error_message?: string;
  rollback_available: boolean;
}

export interface ImportResult {
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  warnings: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
}

export interface ExportResult {
  file_path: string;
  file_size: number;
  record_count: number;
  format: 'csv' | 'xlsx' | 'json';
  created_at: Date;
}

export class DataMigrationService {
  private static migrationHistory: MigrationTask[] = [];
  private static currentVersion = '1.0.0';

  /**
   * 执行数据库迁移
   */
  static async runMigrations(targetVersion?: string): Promise<void> {
    try {
      logger.info('开始执行数据库迁移', { targetVersion });

      const migrationFiles = await this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();

      for (const migrationFile of migrationFiles) {
        if (appliedMigrations.includes(migrationFile.name)) {
          logger.info(`跳过已应用的迁移: ${migrationFile.name}`);
          continue;
        }

        if (targetVersion && migrationFile.version > targetVersion) {
          logger.info(`跳过版本 ${migrationFile.version} 的迁移 (目标版本: ${targetVersion})`);
          continue;
        }

        await this.executeMigration(migrationFile);
      }

      logger.info('数据库迁移完成');
    } catch (error) {
      logger.error('数据库迁移失败:', error);
      throw error;
    }
  }

  /**
   * 回滚迁移
   */
  static async rollbackMigration(migrationId: string): Promise<void> {
    const migration = this.migrationHistory.find(m => m.id === migrationId);
    if (!migration) {
      throw new Error('迁移不存在');
    }

    if (!migration.rollback_available) {
      throw new Error('该迁移不支持回滚');
    }

    if (migration.status !== 'completed') {
      throw new Error('只能回滚已完成的迁移');
    }

    try {
      logger.info(`开始回滚迁移: ${migrationId}`);

      migration.status = 'running';
      
      // 执行回滚逻辑
      await this.executeRollback(migration);

      migration.status = 'rolled_back';
      migration.completed_at = new Date();

      logger.info(`迁移回滚完成: ${migrationId}`);
    } catch (error) {
      migration.status = 'failed';
      migration.error_message = error instanceof Error ? error.message : String(error);
      
      logger.error(`迁移回滚失败: ${migrationId}`, error);
      throw error;
    }
  }

  /**
   * 导入Excel/CSV数据
   */
  static async importData(
    filePath: string, 
    tableName: string, 
    options: {
      format: 'csv' | 'xlsx';
      sheet_name?: string;
      mapping?: Record<string, string>;
      validation?: (row: any) => { valid: boolean; errors: string[] };
      batch_size?: number;
      skip_duplicates?: boolean;
      update_on_duplicate?: boolean;
    }
  ): Promise<ImportResult> {
    const result: ImportResult = {
      total_records: 0,
      successful_imports: 0,
      failed_imports: 0,
      errors: [],
      warnings: []
    };

    const batchSize = options.batch_size || 100;
    let batch: any[] = [];
    let rowIndex = 0;

    try {
      logger.info(`开始导入数据到表 ${tableName}`, { filePath, format: options.format });

      // 验证文件存在
      if (!fs.existsSync(filePath)) {
        throw new Error('导入文件不存在');
      }

      // 根据格式读取数据
      const dataStream = options.format === 'csv' 
        ? this.createCSVStream(filePath)
        : this.createExcelStream(filePath, options.sheet_name);

      // 处理数据流
      for await (const row of dataStream) {
        rowIndex++;
        result.total_records++;

        try {
          // 应用字段映射
          const mappedRow = this.applyFieldMapping(row, options.mapping);

          // 数据验证
          if (options.validation) {
            const validation = options.validation(mappedRow);
            if (!validation.valid) {
              result.errors.push({
                row: rowIndex,
                error: validation.errors.join(', '),
                data: mappedRow
              });
              result.failed_imports++;
              continue;
            }
          }

          batch.push(mappedRow);

          // 批量处理
          if (batch.length >= batchSize) {
            await this.processBatch(tableName, batch, options, result, rowIndex - batch.length + 1);
            batch = [];
          }
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            error: error instanceof Error ? error.message : String(error),
            data: row
          });
          result.failed_imports++;
        }
      }

      // 处理剩余数据
      if (batch.length > 0) {
        await this.processBatch(tableName, batch, options, result, rowIndex - batch.length + 1);
      }

      logger.info(`数据导入完成`, {
        tableName,
        totalRecords: result.total_records,
        successful: result.successful_imports,
        failed: result.failed_imports
      });

      return result;
    } catch (error) {
      logger.error(`数据导入失败: ${tableName}`, error);
      throw error;
    }
  }

  /**
   * 导出数据
   */
  static async exportData(
    tableName: string,
    options: {
      format: 'csv' | 'xlsx' | 'json';
      output_path: string;
      where_clause?: string;
      columns?: string[];
      limit?: number;
      include_headers?: boolean;
    }
  ): Promise<ExportResult> {
    try {
      logger.info(`开始导出表 ${tableName} 数据`, options);

      // 构建查询
      let query = `SELECT `;
      if (options.columns && options.columns.length > 0) {
        query += options.columns.join(', ');
      } else {
        query += '*';
      }
      query += ` FROM ${tableName}`;

      if (options.where_clause) {
        query += ` WHERE ${options.where_clause}`;
      }

      if (options.limit) {
        query += ` LIMIT ${options.limit}`;
      }

      // 执行查询
      const results = await sequelize.query(query, { type: QueryTypes.SELECT });

      // 根据格式导出
      let filePath: string;
      switch (options.format) {
        case 'csv':
          filePath = await this.exportToCSV(results, options.output_path, options.include_headers);
          break;
        case 'xlsx':
          filePath = await this.exportToExcel(results, options.output_path, tableName);
          break;
        case 'json':
          filePath = await this.exportToJSON(results, options.output_path);
          break;
        default:
          throw new Error(`不支持的导出格式: ${options.format}`);
      }

      // 获取文件信息
      const stats = fs.statSync(filePath);

      const result: ExportResult = {
        file_path: filePath,
        file_size: stats.size,
        record_count: results.length,
        format: options.format,
        created_at: new Date()
      };

      logger.info(`数据导出完成`, result);
      return result;
    } catch (error) {
      logger.error(`数据导出失败: ${tableName}`, error);
      throw error;
    }
  }

  /**
   * 数据转换和清理
   */
  static async transformData(
    sourceTable: string,
    targetTable: string,
    transformRules: {
      field_mappings: Record<string, string>;
      data_transformations: Record<string, (value: any) => any>;
      filters?: string;
      validations?: Record<string, (value: any) => boolean>;
    }
  ): Promise<{ processed: number; errors: number }> {
    const transaction = await sequelize.transaction();
    let processed = 0;
    let errors = 0;

    try {
      logger.info(`开始数据转换: ${sourceTable} -> ${targetTable}`);

      // 获取源数据
      let query = `SELECT * FROM ${sourceTable}`;
      if (transformRules.filters) {
        query += ` WHERE ${transformRules.filters}`;
      }

      const sourceData = await sequelize.query(query, { 
        type: QueryTypes.SELECT,
        transaction 
      });

      for (const row of sourceData) {
        try {
          // 应用字段映射
          const mappedRow: any = {};
          for (const [sourceField, targetField] of Object.entries(transformRules.field_mappings)) {
            mappedRow[targetField] = row[sourceField];
          }

          // 应用数据转换
          for (const [field, transformer] of Object.entries(transformRules.data_transformations)) {
            if (mappedRow[field] !== undefined) {
              mappedRow[field] = transformer(mappedRow[field]);
            }
          }

          // 数据验证
          let isValid = true;
          if (transformRules.validations) {
            for (const [field, validator] of Object.entries(transformRules.validations)) {
              if (mappedRow[field] !== undefined && !validator(mappedRow[field])) {
                isValid = false;
                break;
              }
            }
          }

          if (isValid) {
            // 插入到目标表
            const fields = Object.keys(mappedRow).join(', ');
            const values = Object.values(mappedRow).map(v => `'${v}'`).join(', ');
            await sequelize.query(
              `INSERT INTO ${targetTable} (${fields}) VALUES (${values})`,
              { transaction }
            );
            processed++;
          } else {
            errors++;
          }
        } catch (error) {
          logger.error('数据转换行处理失败:', error);
          errors++;
        }
      }

      await transaction.commit();

      logger.info(`数据转换完成`, { processed, errors });
      return { processed, errors };
    } catch (error) {
      await transaction.rollback();
      logger.error(`数据转换失败: ${sourceTable} -> ${targetTable}`, error);
      throw error;
    }
  }

  /**
   * 获取迁移历史
   */
  static getMigrationHistory(): MigrationTask[] {
    return this.migrationHistory.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
  }

  /**
   * 获取当前数据库版本
   */
  static getCurrentVersion(): string {
    return this.currentVersion;
  }

  // 私有辅助方法

  private static async getMigrationFiles(): Promise<Array<{ name: string; version: string; path: string }>> {
    const migrationDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(file => ({
      name: file,
      version: file.split('-')[0],
      path: path.join(migrationDir, file)
    }));
  }

  private static async getAppliedMigrations(): Promise<string[]> {
    try {
      // 检查迁移表是否存在
      const [tables] = await sequelize.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'schema_migrations'
      `);

      if ((tables as any[]).length === 0) {
        // 创建迁移表
        await sequelize.query(`
          CREATE TABLE schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        return [];
      }

      const [results] = await sequelize.query('SELECT version FROM schema_migrations ORDER BY version');
      return (results as any[]).map(row => row.version);
    } catch (error) {
      logger.error('获取已应用迁移失败:', error);
      return [];
    }
  }

  private static async executeMigration(migrationFile: { name: string; version: string; path: string }): Promise<void> {
    const transaction = await sequelize.transaction();
    
    try {
      logger.info(`执行迁移: ${migrationFile.name}`);

      // 读取迁移文件
      const migrationSQL = fs.readFileSync(migrationFile.path, 'utf8');

      // 执行迁移
      await sequelize.query(migrationSQL, { transaction });

      // 记录迁移
      await sequelize.query(
        'INSERT INTO schema_migrations (version) VALUES (?)',
        { replacements: [migrationFile.name], transaction }
      );

      await transaction.commit();

      // 添加到历史记录
      this.migrationHistory.push({
        id: `migration_${Date.now()}`,
        name: migrationFile.name,
        description: `数据库迁移: ${migrationFile.name}`,
        version: migrationFile.version,
        status: 'completed',
        created_at: new Date(),
        started_at: new Date(),
        completed_at: new Date(),
        rollback_available: false
      });

      logger.info(`迁移完成: ${migrationFile.name}`);
    } catch (error) {
      await transaction.rollback();
      logger.error(`迁移失败: ${migrationFile.name}`, error);
      throw error;
    }
  }

  private static async executeRollback(migration: MigrationTask): Promise<void> {
    // 这里可以实现具体的回滚逻辑
    logger.info(`执行回滚: ${migration.name}`);
  }

  private static async *createCSVStream(filePath: string): AsyncGenerator<any> {
    const stream = fs.createReadStream(filePath).pipe(csv());
    
    for await (const row of stream) {
      yield row;
    }
  }

  private static async *createExcelStream(filePath: string, sheetName?: string): AsyncGenerator<any> {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[sheetName || workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    for (const row of data) {
      yield row;
    }
  }

  private static applyFieldMapping(row: any, mapping?: Record<string, string>): any {
    if (!mapping) return row;

    const mappedRow: any = {};
    for (const [sourceField, targetField] of Object.entries(mapping)) {
      if (row[sourceField] !== undefined) {
        mappedRow[targetField] = row[sourceField];
      }
    }
    return mappedRow;
  }

  private static async processBatch(
    tableName: string,
    batch: any[],
    options: any,
    result: ImportResult,
    startRowIndex: number
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      for (let i = 0; i < batch.length; i++) {
        const row = batch[i];
        const rowIndex = startRowIndex + i;

        try {
          // 构建插入语句
          const fields = Object.keys(row).join(', ');
          const placeholders = Object.keys(row).map(() => '?').join(', ');
          const values = Object.values(row);

          let query = `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders})`;
          
          if (options.update_on_duplicate) {
            const updateFields = Object.keys(row)
              .map(field => `${field} = EXCLUDED.${field}`)
              .join(', ');
            query += ` ON CONFLICT DO UPDATE SET ${updateFields}`;
          } else if (options.skip_duplicates) {
            query += ` ON CONFLICT DO NOTHING`;
          }

          await sequelize.query(query, { 
            replacements: values,
            transaction 
          });

          result.successful_imports++;
        } catch (error) {
          result.errors.push({
            row: rowIndex,
            error: error instanceof Error ? error.message : String(error),
            data: row
          });
          result.failed_imports++;
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private static async exportToCSV(data: any[], outputPath: string, includeHeaders = true): Promise<string> {
    const filePath = outputPath.endsWith('.csv') ? outputPath : `${outputPath}.csv`;
    
    let csvContent = '';
    
    if (data.length > 0) {
      if (includeHeaders) {
        csvContent += Object.keys(data[0]).join(',') + '\n';
      }
      
      for (const row of data) {
        csvContent += Object.values(row).map(value => `"${value}"`).join(',') + '\n';
      }
    }
    
    fs.writeFileSync(filePath, csvContent);
    return filePath;
  }

  private static async exportToExcel(data: any[], outputPath: string, sheetName: string): Promise<string> {
    const filePath = outputPath.endsWith('.xlsx') ? outputPath : `${outputPath}.xlsx`;
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    XLSX.writeFile(workbook, filePath);
    return filePath;
  }

  private static async exportToJSON(data: any[], outputPath: string): Promise<string> {
    const filePath = outputPath.endsWith('.json') ? outputPath : `${outputPath}.json`;
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }
}