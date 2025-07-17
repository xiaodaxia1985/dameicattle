const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management',
  DB_USER = 'postgres',
  DB_PASSWORD = 'dianxin99',
} = process.env;

async function setupDatabase() {
  console.log('开始设置数据库...');
  console.log(`主机: ${DB_HOST}:${DB_PORT}`);
  console.log(`用户: ${DB_USER}`);
  console.log(`数据库: ${DB_NAME}`);
  console.log('');

  // 连接到 postgres 数据库（默认数据库）
  const client = new Client({
    host: DB_HOST,
    port: parseInt(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: 'postgres', // 连接到默认数据库
  });

  try {
    await client.connect();
    console.log('✓ 数据库连接成功');

    // 检查数据库是否存在
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'`;
    const result = await client.query(checkDbQuery);

    if (result.rows.length === 0) {
      // 创建数据库
      console.log(`创建数据库: ${DB_NAME}`);
      await client.query(`CREATE DATABASE ${DB_NAME}`);
      console.log('✓ 数据库创建成功');
    } else {
      console.log('✓ 数据库已存在');
    }

    await client.end();

    // 连接到新创建的数据库并运行迁移
    const dbClient = new Client({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
    });

    await dbClient.connect();
    console.log('✓ 连接到目标数据库');

    // 运行迁移文件
    const migrationFiles = [
      '001-create-initial-tables.sql',
      '002-seed-data.sql',
      '003-add-missing-tables.sql',
      '004-seed-additional-data.sql',
      '005-optimize-database.sql'
    ];

    console.log('');
    console.log('开始运行数据库迁移...');

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, '../src/migrations', file);
      
      if (fs.existsSync(filePath)) {
        console.log(`执行迁移: ${file}`);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        try {
          await dbClient.query(sql);
          console.log(`✓ ${file} 执行成功`);
        } catch (error) {
          console.error(`✗ ${file} 执行失败:`, error.message);
          throw error;
        }
      } else {
        console.warn(`⚠ 迁移文件不存在: ${file}`);
      }
    }

    // 获取数据库统计信息
    console.log('');
    console.log('数据库统计信息:');
    const statsQuery = `
      SELECT 
        schemaname,
        relname as tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes
      FROM pg_stat_user_tables 
      ORDER BY schemaname, relname;
    `;
    
    const stats = await dbClient.query(statsQuery);
    console.table(stats.rows);

    await dbClient.end();
    
    console.log('');
    console.log('🎉 数据库设置完成!');
    console.log('');
    console.log('默认管理员账户:');
    console.log('用户名: admin');
    console.log('密码: Admin123');
    console.log('');
    console.log('可以使用以下命令连接数据库:');
    console.log(`psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME}`);

  } catch (error) {
    console.error('❌ 数据库设置失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };