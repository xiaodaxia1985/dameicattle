-- 创建测试数据
-- 使用UTF-8编码

-- 1. 创建标准角色（如果不存在）
INSERT INTO roles (name, description, permissions) VALUES
('超级管理员', '系统超级管理员，拥有所有权限', '["*", "system:admin", "bases:all", "user:create", "user:read", "user:update", "user:delete", "user:reset-password", "role:create", "role:read", "role:update", "role:delete", "base:create", "base:read", "base:update", "base:delete", "cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "material:delete", "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "sales:create", "sales:read", "sales:update", "sales:delete", "news:create", "news:read", "news:update", "news:delete", "operation-log:read", "operation-log:export", "system:logs", "system:manage", "dashboard:read", "reports:read", "reports:export"]'),
('基地管理员', '基地管理员，管理所属基地的所有业务', '["cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "inventory:create", "inventory:read", "inventory:update", "purchase:create", "purchase:read", "purchase:update", "sales:create", "sales:read", "sales:update", "dashboard:read", "reports:read"]'),
('兽医', '兽医，负责牛只健康管理', '["cattle:read", "health:create", "health:read", "health:update", "health:delete", "dashboard:read", "reports:read"]'),
('饲养员', '饲养员，负责日常饲养管理', '["cattle:read", "cattle:update", "feeding:create", "feeding:read", "feeding:update", "material:read", "inventory:read", "dashboard:read"]'),
('普通员工', '普通员工，只读权限', '["cattle:read", "health:read", "feeding:read", "material:read", "inventory:read", "dashboard:read", "reports:read"]')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- 2. 创建基地（如果不存在）
INSERT INTO bases (name, code, address, latitude, longitude, area) VALUES
('总部基地', 'BASE001', '山东省济南市历城区工业北路123号', 36.6512, 117.1201, 500.00),
('东区养殖场', 'BASE002', '山东省济南市章丘区明水街道456号', 36.7128, 117.5347, 800.00),
('西区养殖场', 'BASE003', '山东省济南市长清区文昌街道789号', 36.5537, 116.7516, 600.00)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  area = EXCLUDED.area;

-- 3. 更新admin用户角色为超级管理员
UPDATE users SET 
  role_id = (SELECT id FROM roles WHERE name = '超级管理员'),
  base_id = (SELECT id FROM bases WHERE code = 'BASE001')
WHERE username = 'admin';

-- 4. 创建测试用户
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('manager_east', '$2a$12$8K.V8LGVvRGAT8uBdIhOyOeS6TaP.GL6wqRQjAiTY4OOmIkjHm.Wa', '东区基地管理员', 'manager.east@cattle-management.com', '13800138001', (SELECT id FROM roles WHERE name = '基地管理员'), (SELECT id FROM bases WHERE code = 'BASE002'), 'active'),
('manager_west', '$2a$12$8K.V8LGVvRGAT8uBdIhOyOeS6TaP.GL6wqRQjAiTY4OOmIkjHm.Wa', '西区基地管理员', 'manager.west@cattle-management.com', '13800138002', (SELECT id FROM roles WHERE name = '基地管理员'), (SELECT id FROM bases WHERE code = 'BASE003'), 'active'),
('vet_east', '$2a$12$9L.W9MGWwSHBU9vCeJiPzPfT7UbQ.HM7xrSRkBjUZ5PPnJljIn.Xb', '东区兽医', 'vet.east@cattle-management.com', '13800138003', (SELECT id FROM roles WHERE name = '兽医'), (SELECT id FROM bases WHERE code = 'BASE002'), 'active'),
('feeder_west', '$2a$12$aM.X0NHXxTICVawDfKjQ0QgU8VcR.IN8ysSTlCkVa6QQoKmkJo.Yc', '西区饲养员', 'feeder.west@cattle-management.com', '13800138004', (SELECT id FROM roles WHERE name = '饲养员'), (SELECT id FROM bases WHERE code = 'BASE003'), 'active')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  real_name = EXCLUDED.real_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  base_id = EXCLUDED.base_id,
  status = EXCLUDED.status;

-- 5. 显示创建结果
SELECT 'Data creation completed!' as status;

SELECT 
  u.username,
  u.real_name,
  r.name as role_name,
  b.name as base_name,
  jsonb_array_length(r.permissions) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN bases b ON u.base_id = b.id
ORDER BY u.id;