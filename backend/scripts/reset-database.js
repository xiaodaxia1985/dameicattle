const { Client } = require('pg');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management',
  DB_USER = 'postgres',
  DB_PASSWORD = 'dianxin99',
} = process.env;

async function resetDatabase() {
  console.log('重置数据库...');
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
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('✓ 数据库连接成功');

    // 终止所有连接到目标数据库的会话
    console.log('终止现有数据库连接...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid()
    `);

    // 删除数据库（如果存在）
    console.log(`删除数据库: ${DB_NAME}`);
    await client.query(`DROP DATABASE IF EXISTS ${DB_NAME}`);
    console.log('✓ 数据库删除成功');

    // 创建数据库
    console.log(`创建数据库: ${DB_NAME}`);
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log('✓ 数据库创建成功');

    await client.end();
    console.log('');
    console.log('[SUCCESS] 数据库重置完成!');
    console.log('现在可以运行 npm run db:setup 来初始化数据库');

  } catch (error) {
    console.error('❌ 数据库重置失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };