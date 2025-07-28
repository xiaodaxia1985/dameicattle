// 修复用户密码
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

async function fixPasswords() {
  try {
    console.log('🔧 修复用户密码...\n');
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 更新所有用户的密码
    await sequelize.query(`
      UPDATE users SET password_hash = '$2a$12$/6QcEqRteccqM6ZsxXK9VeiE/EiL65kp7Psfc8YaiGEvMePX6q/OW' WHERE username = 'admin';
      UPDATE users SET password_hash = '$2a$12$IPOVk.ZevakFsRCqIZ5yWup0fr47RVw6Sr2PxKNCBa.6nkfXmfIWu' WHERE username = 'manager_east';
      UPDATE users SET password_hash = '$2a$12$IPOVk.ZevakFsRCqIZ5yWup0fr47RVw6Sr2PxKNCBa.6nkfXmfIWu' WHERE username = 'manager_west';
      UPDATE users SET password_hash = '$2a$12$M/Gz25bk37Hy1tYMyI3f.uuzEUV60mrCaCvgA6jPFiQEYgG1wkeUu' WHERE username = 'vet_east';
      UPDATE users SET password_hash = '$2a$12$c0mOw29qxMEIhPPHtmpXPeZwBKhXjBVVm0VEKZ73dx8RcF88.pW6q' WHERE username = 'feeder_west';
    `);
    
    console.log('✅ 密码更新成功');
    
    // 验证更新结果
    const [results] = await sequelize.query(`
      SELECT username, real_name, 
             CASE 
               WHEN username = 'admin' THEN 'Admin123'
               WHEN username LIKE 'manager_%' THEN 'Manager123'
               WHEN username LIKE 'vet_%' THEN 'Vet123'
               WHEN username LIKE 'feeder_%' THEN 'Feed123'
               ELSE 'Unknown'
             END as password
      FROM users 
      ORDER BY id
    `);
    
    console.log('\n📊 用户密码信息:');
    console.table(results);
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
  } finally {
    await sequelize.close();
  }
}

fixPasswords();