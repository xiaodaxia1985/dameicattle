// 调试权限系统
const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '.env.development' });

const sequelize = new Sequelize({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'postgres',
  logging: false
});

async function debugPermissions() {
  try {
    console.log('🔍 调试权限系统...\n');
    
    // 1. 检查数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    // 2. 检查admin用户数据
    const [adminResults] = await sequelize.query(`
      SELECT 
        u.id, u.username, u.role_id, u.base_id,
        r.name as role_name, r.permissions
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      WHERE u.username = 'admin'
    `);
    
    console.log('👤 Admin用户信息:');
    console.log(JSON.stringify(adminResults[0], null, 2));
    console.log('');
    
    // 3. 检查所有角色
    const [roleResults] = await sequelize.query(`
      SELECT id, name, permissions, 
             jsonb_array_length(permissions) as permission_count
      FROM roles 
      ORDER BY id
    `);
    
    console.log('🎭 所有角色信息:');
    roleResults.forEach(role => {
      console.log(`- ${role.name} (ID: ${role.id}): ${role.permission_count} 个权限`);
      if (role.name === '超级管理员') {
        console.log('  权限列表:', JSON.stringify(role.permissions, null, 2));
      }
    });
    console.log('');
    
    // 4. 检查权限格式
    const [permissionCheck] = await sequelize.query(`
      SELECT 
        name,
        permissions,
        permissions ? 'role:read' as has_role_read,
        permissions ? '*' as has_wildcard
      FROM roles 
      WHERE name = '超级管理员'
    `);
    
    console.log('🔍 权限检查:');
    console.log(JSON.stringify(permissionCheck[0], null, 2));
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.message);
  } finally {
    await sequelize.close();
  }
}

debugPermissions();