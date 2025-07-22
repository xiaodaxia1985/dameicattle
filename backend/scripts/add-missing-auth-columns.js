const { Client } = require('pg');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management',
  DB_USER = 'postgres',
  DB_PASSWORD = 'dianxin99',
} = process.env;

async function addMissingAuthColumns() {
  console.log('检查并添加缺失的认证安全字段...');
  
  const client = new Client({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    await client.connect();
    console.log('✓ 数据库连接成功');

    // 检查 failed_login_attempts 列是否存在
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'failed_login_attempts';
    `;
    
    const result = await client.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      console.log('添加缺失的认证安全字段...');
      
      // 添加认证安全相关字段
      const addColumnsQuery = `
        ALTER TABLE users 
        ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL,
        ADD COLUMN locked_until TIMESTAMP NULL,
        ADD COLUMN last_login TIMESTAMP NULL,
        ADD COLUMN password_changed_at TIMESTAMP NULL,
        ADD COLUMN password_reset_token VARCHAR(255) NULL,
        ADD COLUMN password_reset_expires TIMESTAMP NULL,
        ADD COLUMN wechat_openid VARCHAR(100) NULL,
        ADD COLUMN wechat_unionid VARCHAR(100) NULL;
      `;
      
      await client.query(addColumnsQuery);
      console.log('✓ 认证安全字段添加成功');
      
      // 添加唯一约束
      try {
        await client.query('ALTER TABLE users ADD CONSTRAINT users_wechat_openid_key UNIQUE (wechat_openid);');
        console.log('✓ wechat_openid 唯一约束添加成功');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('✓ wechat_openid 唯一约束已存在');
        } else {
          throw error;
        }
      }
      
      try {
        await client.query('ALTER TABLE users ADD CONSTRAINT users_wechat_unionid_key UNIQUE (wechat_unionid);');
        console.log('✓ wechat_unionid 唯一约束添加成功');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('✓ wechat_unionid 唯一约束已存在');
        } else {
          throw error;
        }
      }
      
      // 创建索引
      const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;',
        'CREATE INDEX IF NOT EXISTS idx_users_wechat_openid ON users(wechat_openid) WHERE wechat_openid IS NOT NULL;',
        'CREATE INDEX IF NOT EXISTS idx_users_wechat_unionid ON users(wechat_unionid) WHERE wechat_unionid IS NOT NULL;'
      ];
      
      for (const indexQuery of indexes) {
        await client.query(indexQuery);
      }
      console.log('✓ 索引创建成功');
      
    } else {
      console.log('✓ failed_login_attempts 字段已存在');
    }

    // 检查并创建 security_logs 表
    const checkTableQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'security_logs';
    `;
    
    const tableResult = await client.query(checkTableQuery);
    
    if (tableResult.rows.length === 0) {
      console.log('创建 security_logs 表...');
      
      const createTableQuery = `
        CREATE TABLE security_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          username VARCHAR(50),
          event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('login_success', 'login_failed', 'logout', 'password_reset', 'account_locked', 'token_refresh')),
          ip_address VARCHAR(45) NOT NULL,
          user_agent TEXT,
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `;
      
      await client.query(createTableQuery);
      console.log('✓ security_logs 表创建成功');
      
      // 创建索引
      const securityIndexes = [
        'CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);',
        'CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);',
        'CREATE INDEX idx_security_logs_created_at ON security_logs(created_at);',
        'CREATE INDEX idx_security_logs_ip_address ON security_logs(ip_address);'
      ];
      
      for (const indexQuery of securityIndexes) {
        await client.query(indexQuery);
      }
      console.log('✓ security_logs 索引创建成功');
      
    } else {
      console.log('✓ security_logs 表已存在');
    }

    await client.end();
    console.log('');
    console.log('🎉 认证安全功能设置完成!');

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addMissingAuthColumns();
}

module.exports = { addMissingAuthColumns };