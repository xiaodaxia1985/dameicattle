const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

// 数据库连接配置
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 开始执行巡圈管理数据库迁移...');
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', '..', 'database', 'migrations', 'create_patrol_records_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 直接执行整个SQL文件，让PostgreSQL处理语句顺序
    console.log('📝 执行完整的SQL迁移文件...');
    
    // 清理SQL内容，移除空行和纯注释行
    const cleanedSql = sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        return trimmed.length > 0 && !trimmed.startsWith('--');
      })
      .join('\n');
    
    const sqlStatements = [cleanedSql];
    
    console.log(`📝 准备执行完整的SQL迁移文件`);
    console.log(`📊 将作为单个事务执行所有语句`);
    
    // 开始事务
    await client.query('BEGIN');
    
    // 执行每个SQL语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`⚡ 执行语句 ${i + 1}/${sqlStatements.length}...`);
      
      try {
        console.log(`📝 执行的SQL语句: ${statement.substring(0, 100)}...`);
        await client.query(statement);
        console.log(`✅ 语句 ${i + 1} 执行成功`);
      } catch (error) {
        // 如果是表已存在的错误，跳过
        if (error.code === '42P07') {
          console.log(`⚠️  语句 ${i + 1} 跳过（表已存在）`);
          continue;
        }
        throw error;
      }
    }
    
    // 提交事务
    await client.query('COMMIT');
    console.log('🎉 巡圈管理数据库迁移完成！');
    
    // 验证表是否创建成功
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('patrol_records', 'patrol_templates', 'iot_devices')
    `);
    
    console.log('📊 创建的表：');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    console.error('❌ 迁移失败:', error.message);
    console.error('详细错误:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 执行迁移
runMigration().catch(error => {
  console.error('❌ 迁移脚本执行失败:', error);
  process.exit(1);
});