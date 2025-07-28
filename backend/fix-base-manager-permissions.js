// 修复基地管理员权限
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

async function fixBaseManagerPermissions() {
  try {
    console.log('🔧 修复基地管理员权限...\n');
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 更新基地管理员权限，添加用户查看权限
    const baseManagerPermissions = [
      "user:read", // 添加用户查看权限
      "cattle:create", "cattle:read", "cattle:update", "cattle:delete",
      "health:create", "health:read", "health:update", "health:delete",
      "feeding:create", "feeding:read", "feeding:update", "feeding:delete",
      "material:create", "material:read", "material:update",
      "inventory:create", "inventory:read", "inventory:update",
      "purchase:create", "purchase:read", "purchase:update",
      "sales:create", "sales:read", "sales:update",
      "dashboard:read", "reports:read"
    ];
    
    await sequelize.query(`
      UPDATE roles 
      SET permissions = :permissions 
      WHERE name = '基地管理员'
    `, {
      replacements: {
        permissions: JSON.stringify(baseManagerPermissions)
      }
    });
    
    console.log('✅ 基地管理员权限更新成功');
    
    // 验证更新结果
    const [results] = await sequelize.query(`
      SELECT name, jsonb_array_length(permissions) as permission_count,
             permissions ? 'user:read' as has_user_read
      FROM roles 
      WHERE name IN ('超级管理员', '基地管理员', '兽医', '饲养员')
      ORDER BY 
        CASE name 
          WHEN '超级管理员' THEN 1
          WHEN '基地管理员' THEN 2
          WHEN '兽医' THEN 3
          WHEN '饲养员' THEN 4
        END
    `);
    
    console.log('\n📊 角色权限统计:');
    console.table(results);
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixBaseManagerPermissions();