// 创建管理员用户和基础数据
const { Sequelize, DataTypes } = require('sequelize');
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

async function createAdminUser() {
  try {
    console.log('🚀 开始创建管理员用户和基础数据...\n');
    
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 1. 创建或更新超级管理员角色
    const [superAdminRole] = await sequelize.query(`
      INSERT INTO roles (name, description, permissions, created_at) VALUES
      ('超级管理员', '系统超级管理员，拥有所有权限', '["*", "system:admin", "bases:all", "user:create", "user:read", "user:update", "user:delete", "user:reset-password", "role:create", "role:read", "role:update", "role:delete", "base:create", "base:read", "base:update", "base:delete", "cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "material:delete", "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "sales:create", "sales:read", "sales:update", "sales:delete", "news:create", "news:read", "news:update", "news:delete", "operation-log:read", "operation-log:export", "system:logs", "system:manage", "dashboard:read", "reports:read", "reports:export"]', CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        permissions = EXCLUDED.permissions
      RETURNING id
    `);
    console.log('✅ 超级管理员角色创建/更新成功');
    
    // 2. 创建基地管理员角色
    await sequelize.query(`
      INSERT INTO roles (name, description, permissions, created_at) VALUES
      ('基地管理员', '基地管理员，管理所属基地的所有业务', '["cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "inventory:create", "inventory:read", "inventory:update", "purchase:create", "purchase:read", "purchase:update", "sales:create", "sales:read", "sales:update", "dashboard:read", "reports:read"]', CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        permissions = EXCLUDED.permissions
    `);
    console.log('✅ 基地管理员角色创建/更新成功');
    
    // 3. 创建其他角色
    await sequelize.query(`
      INSERT INTO roles (name, description, permissions, created_at) VALUES
      ('兽医', '兽医，负责牛只健康管理', '["cattle:read", "health:create", "health:read", "health:update", "health:delete", "dashboard:read", "reports:read"]', CURRENT_TIMESTAMP),
      ('饲养员', '饲养员，负责日常饲养管理', '["cattle:read", "cattle:update", "feeding:create", "feeding:read", "feeding:update", "material:read", "inventory:read", "dashboard:read"]', CURRENT_TIMESTAMP),
      ('普通员工', '普通员工，只读权限', '["cattle:read", "health:read", "feeding:read", "material:read", "inventory:read", "dashboard:read", "reports:read"]', CURRENT_TIMESTAMP)
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        permissions = EXCLUDED.permissions
    `);
    console.log('✅ 其他角色创建/更新成功');
    
    // 4. 创建基地
    await sequelize.query(`
      INSERT INTO bases (name, code, address, latitude, longitude, area, created_at, updated_at) VALUES
      ('总部基地', 'BASE001', '山东省济南市历城区工业北路123号', 36.6512, 117.1201, 500.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('东区养殖场', 'BASE002', '山东省济南市章丘区明水街道456号', 36.7128, 117.5347, 800.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('西区养殖场', 'BASE003', '山东省济南市长清区文昌街道789号', 36.5537, 116.7516, 600.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        area = EXCLUDED.area,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 基地创建/更新成功');
    
    // 5. 更新admin用户
    await sequelize.query(`
      UPDATE users SET 
        role_id = (SELECT id FROM roles WHERE name = '超级管理员'),
        base_id = (SELECT id FROM bases WHERE code = 'BASE001'),
        real_name = '系统管理员'
      WHERE username = 'admin'
    `);
    console.log('✅ Admin用户更新成功');
    
    // 6. 创建测试用户
    await sequelize.query(`
      INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status, created_at, updated_at) VALUES
      ('manager_east', '$2a$12$8K.V8LGVvRGAT8uBdIhOyOeS6TaP.GL6wqRQjAiTY4OOmIkjHm.Wa', '东区基地管理员', 'manager.east@cattle-management.com', '13800138001', (SELECT id FROM roles WHERE name = '基地管理员'), (SELECT id FROM bases WHERE code = 'BASE002'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('manager_west', '$2a$12$8K.V8LGVvRGAT8uBdIhOyOeS6TaP.GL6wqRQjAiTY4OOmIkjHm.Wa', '西区基地管理员', 'manager.west@cattle-management.com', '13800138002', (SELECT id FROM roles WHERE name = '基地管理员'), (SELECT id FROM bases WHERE code = 'BASE003'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('vet_east', '$2a$12$9L.W9MGWwSHBU9vCeJiPzPfT7UbQ.HM7xrSRkBjUZ5PPnJljIn.Xb', '东区兽医', 'vet.east@cattle-management.com', '13800138003', (SELECT id FROM roles WHERE name = '兽医'), (SELECT id FROM bases WHERE code = 'BASE002'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
      ('feeder_west', '$2a$12$aM.X0NHXxTICVawDfKjQ0QgU8VcR.IN8ysSTlCkVa6QQoKmkJo.Yc', '西区饲养员', 'feeder.west@cattle-management.com', '13800138004', (SELECT id FROM roles WHERE name = '饲养员'), (SELECT id FROM bases WHERE code = 'BASE003'), 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (username) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        real_name = EXCLUDED.real_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        role_id = EXCLUDED.role_id,
        base_id = EXCLUDED.base_id,
        status = EXCLUDED.status,
        updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ 测试用户创建/更新成功');
    
    // 7. 显示结果
    const [results] = await sequelize.query(`
      SELECT 
        u.username,
        u.real_name,
        r.name as role_name,
        b.name as base_name,
        jsonb_array_length(r.permissions) as permission_count
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN bases b ON u.base_id = b.id
      ORDER BY u.id
    `);
    
    console.log('\n📊 用户列表:');
    console.table(results);
    
    console.log('\n🎉 管理员用户和基础数据创建完成！');
    console.log('\n📝 测试账户信息:');
    console.log('- admin / Admin123 (超级管理员)');
    console.log('- manager_east / Manager123 (东区基地管理员)');
    console.log('- manager_west / Manager123 (西区基地管理员)');
    console.log('- vet_east / Vet123 (东区兽医)');
    console.log('- feeder_west / Feed123 (西区饲养员)');
    
  } catch (error) {
    console.error('❌ 创建过程中出现错误:', error.message);
  } finally {
    await sequelize.close();
  }
}

createAdminUser();