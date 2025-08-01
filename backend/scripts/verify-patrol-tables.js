const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function verifyTables() {
  const client = await pool.connect();
  try {
    console.log('🔍 验证巡检记录表结构...');
    
    // 检查表结构
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'patrol_records' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 patrol_records 表结构:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // 检查索引
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'patrol_records'
    `);
    
    console.log('\n📊 patrol_records 索引:');
    indexResult.rows.forEach(row => {
      console.log(`  - ${row.indexname}`);
    });
    
    // 检查约束
    const constraintResult = await client.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_name = 'patrol_records'
    `);
    
    console.log('\n📊 patrol_records 约束:');
    constraintResult.rows.forEach(row => {
      console.log(`  - ${row.constraint_name}: ${row.constraint_type}`);
    });
    
    console.log('\n✅ 表验证完成！');
    
  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyTables().catch(console.error);