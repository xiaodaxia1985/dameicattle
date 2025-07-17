const { Client } = require('pg');
require('dotenv').config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management',
  DB_USER = 'postgres',
  DB_PASSWORD = 'dianxin99',
} = process.env;

async function verifyDatabase() {
  console.log('验证数据库结构和数据...');
  console.log('');

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

    // 验证表结构
    console.log('\n📋 数据表验证:');
    const tablesQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tables = await client.query(tablesQuery);
    console.table(tables.rows);

    // 验证种子数据
    console.log('\n📊 种子数据验证:');
    
    const dataChecks = [
      { table: 'roles', description: '角色数据' },
      { table: 'bases', description: '基地数据' },
      { table: 'users', description: '用户数据' },
      { table: 'barns', description: '牛棚数据' },
      { table: 'material_categories', description: '物资分类' },
      { table: 'suppliers', description: '供应商数据' },
      { table: 'customers', description: '客户数据' },
      { table: 'news_categories', description: '新闻分类' },
      { table: 'feed_formulas', description: '饲料配方' },
      { table: 'production_materials', description: '生产物资' },
      { table: 'inventory', description: '库存数据' },
      { table: 'equipment_categories', description: '设备分类' },
      { table: 'production_equipment', description: '生产设备' },
      { table: 'news_articles', description: '新闻文章' }
    ];

    for (const check of dataChecks) {
      const countQuery = `SELECT COUNT(*) as count FROM ${check.table}`;
      const result = await client.query(countQuery);
      const count = result.rows[0].count;
      console.log(`✓ ${check.description}: ${count} 条记录`);
    }

    // 验证索引
    console.log('\n🔍 索引验证:');
    const indexQuery = `
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `;
    
    const indexes = await client.query(indexQuery);
    console.log(`总共创建了 ${indexes.rows.length} 个索引`);

    // 验证触发器
    console.log('\n⚡ 触发器验证:');
    const triggerQuery = `
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `;
    
    const triggers = await client.query(triggerQuery);
    console.log(`总共创建了 ${triggers.rows.length} 个触发器`);

    // 验证视图
    console.log('\n👁️ 视图验证:');
    const viewQuery = `
      SELECT table_name as view_name
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const views = await client.query(viewQuery);
    console.log(`总共创建了 ${views.rows.length} 个视图:`);
    views.rows.forEach(view => {
      console.log(`  - ${view.view_name}`);
    });

    // 验证函数
    console.log('\n🔧 函数验证:');
    const functionQuery = `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
      ORDER BY routine_name;
    `;
    
    const functions = await client.query(functionQuery);
    console.log(`总共创建了 ${functions.rows.length} 个函数:`);
    functions.rows.forEach(func => {
      console.log(`  - ${func.routine_name}`);
    });

    // 测试管理员登录
    console.log('\n👤 管理员账户验证:');
    const adminQuery = `
      SELECT u.username, u.real_name, r.name as role_name, b.name as base_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN bases b ON u.base_id = b.id
      WHERE u.username = 'admin';
    `;
    
    const admin = await client.query(adminQuery);
    if (admin.rows.length > 0) {
      const adminInfo = admin.rows[0];
      console.log(`✓ 管理员账户: ${adminInfo.username} (${adminInfo.real_name})`);
      console.log(`  角色: ${adminInfo.role_name}`);
      console.log(`  基地: ${adminInfo.base_name || '无'}`);
    } else {
      console.log('❌ 管理员账户未找到');
    }

    // 数据库大小统计
    console.log('\n💾 数据库大小:');
    const sizeQuery = `
      SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) as database_size;
    `;
    
    const size = await client.query(sizeQuery);
    console.log(`数据库大小: ${size.rows[0].database_size}`);

    await client.end();
    
    console.log('\n🎉 数据库验证完成!');
    console.log('\n数据库已成功初始化，包含:');
    console.log('- 完整的表结构');
    console.log('- 示例种子数据');
    console.log('- 性能优化索引');
    console.log('- 自动化触发器');
    console.log('- 统计分析视图');
    console.log('- 数据管理函数');

  } catch (error) {
    console.error('❌ 数据库验证失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  verifyDatabase();
}

module.exports = { verifyDatabase };