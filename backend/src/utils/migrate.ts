import fs from 'fs';
import path from 'path';
import { sequelize } from '@/config/database';
import { logger } from '@/utils/logger';

export class DatabaseMigrator {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  async runMigrations(): Promise<void> {
    try {
      logger.info('Starting database migrations...');

      // Ensure database connection
      await sequelize.authenticate();
      logger.info('Database connection established');

      // Get all migration files
      const migrationFiles = fs
        .readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      logger.info(`Found ${migrationFiles.length} migration files`);

      // Execute each migration
      for (const file of migrationFiles) {
        await this.executeMigration(file);
      }

      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  private async executeMigration(filename: string): Promise<void> {
    try {
      logger.info(`Executing migration: ${filename}`);

      const filePath = path.join(this.migrationsPath, filename);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Split SQL by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          await sequelize.query(statement);
        }
      }

      logger.info(`Migration ${filename} completed successfully`);
    } catch (error) {
      logger.error(`Migration ${filename} failed:`, error);
      throw error;
    }
  }

  async createBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = `backup_${timestamp}.sql`;
      const backupPath = path.join(process.cwd(), 'backups', backupFile);

      // Ensure backup directory exists
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Use pg_dump to create backup
      const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
      
      const { exec } = require('child_process');
      const command = `PGPASSWORD=${DB_PASSWORD} pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} > ${backupPath}`;

      await new Promise((resolve, reject) => {
        exec(command, (error: any, stdout: any, stderr: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      logger.info(`Database backup created: ${backupPath}`);
      return backupPath;
    } catch (error) {
      logger.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    try {
      logger.info(`Restoring database from: ${backupPath}`);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupPath}`);
      }

      const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
      
      const { exec } = require('child_process');
      const command = `PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} < ${backupPath}`;

      await new Promise((resolve, reject) => {
        exec(command, (error: any, stdout: any, stderr: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      logger.info('Database restore completed successfully');
    } catch (error) {
      logger.error('Database restore failed:', error);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const migrator = new DatabaseMigrator();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrator.runMigrations()
        .then(() => {
          logger.info('Migration completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Migration failed:', error);
          process.exit(1);
        });
      break;
      
    case 'backup':
      migrator.createBackup()
        .then((backupPath) => {
          logger.info(`Backup created: ${backupPath}`);
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Backup failed:', error);
          process.exit(1);
        });
      break;
      
    case 'restore':
      const backupPath = process.argv[3];
      if (!backupPath) {
        logger.error('Please provide backup file path');
        process.exit(1);
      }
      
      migrator.restoreBackup(backupPath)
        .then(() => {
          logger.info('Restore completed');
          process.exit(0);
        })
        .catch((error) => {
          logger.error('Restore failed:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('Usage:');
      console.log('  npm run migrate        - Run database migrations');
      console.log('  npm run db:backup      - Create database backup');
      console.log('  npm run db:restore <file> - Restore from backup');
      process.exit(1);
  }
}