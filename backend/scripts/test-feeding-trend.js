const { Pool } = require('pg');
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

async function testFeedingTrendQuery() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 测试饲喂趋势查询...');
    
    // 测试原始的有问题的查询
    const testQuery = `
      SELECT 
        DATE(feeding_date) as date,
        SUM(amount) as total_amount,
        COUNT(DISTINCT feeding_records.id) as record_count
      FROM feeding_records
      LEFT JOIN feed_formulas ON feeding_records.formula_id = feed_formulas.id
      WHERE feeding_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(feeding_date)
      ORDER BY DATE(feeding_date) ASC
      LIMIT 5;
    `;
    
    const result = await client.query(testQuery);
    console.log('✅ 查询成功！返回', result.rows.length, '条记录');
    console.log('📊 示例数据:', result.rows.slice(0, 2));
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testFeedingTrendQuery().catch(console.error);