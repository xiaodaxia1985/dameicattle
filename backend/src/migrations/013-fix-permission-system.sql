-- 修复权限系统和基地权限分离
-- 执行时间：2024-12-28

-- 1. 更新现有admin用户的权限（确保有完整权限）
UPDATE roles SET permissions = '["*", "system:admin", "bases:all", "user:create", "user:read", "user:update", "user:delete", "user:reset-password", "role:create", "role:read", "role:update", "role:delete", "base:create", "base:read", "base:update", "base:delete", "cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "material:delete", "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "sales:create", "sales:read", "sales:update", "sales:delete", "news:create", "news:read", "news:update", "news:delete", "operation-log:read", "operation-log:export", "system:logs", "system:manage", "dashboard:read", "reports:read"]'
WHERE name = '超级管理员';

-- 2. 添加测试用户来验证基地权限分离
-- 东区基地管理员（密码：Manager123）
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('manager_east', '$2a$12$8K.V8LGVvRGAT8uBdIhOyOeS6TaP.GL6wqRQjAiTY4OOmIkjHm.Wa', '东区基地管理员', 'manager.east@cattle-management.com', '13800138001', 2, 2, 'active')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  real_name = EXCLUDED.real_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  base_id = EXCLUDED.base_id,
  status = EXCLUDED.status;

-- 西区基地管理员（密码：Manager123）
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('manager_west', '$2a$12$8K.V8LGVvRGAT8uBdIhOyOeS6TaP.GL6wqRQjAiTY4OOmIkjHm.Wa', '西区基地管理员', 'manager.west@cattle-management.com', '13800138002', 2, 3, 'active')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  real_name = EXCLUDED.real_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  base_id = EXCLUDED.base_id,
  status = EXCLUDED.status;

-- 东区兽医（密码：Vet123）
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('vet_east', '$2a$12$9L.W9MGWwSHBU9vCeJiPzPfT7UbQ.HM7xrSRkBjUZ5PPnJljIn.Xb', '东区兽医', 'vet.east@cattle-management.com', '13800138003', 3, 2, 'active')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  real_name = EXCLUDED.real_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  base_id = EXCLUDED.base_id,
  status = EXCLUDED.status;

-- 西区饲养员（密码：Feed123）
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('feeder_west', '$2a$12$aM.X0NHXxTICVawDfKjQ0QgU8VcR.IN8ysSTlCkVa6QQoKmkJo.Yc', '西区饲养员', 'feeder.west@cattle-management.com', '13800138004', 4, 3, 'active')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  real_name = EXCLUDED.real_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  base_id = EXCLUDED.base_id,
  status = EXCLUDED.status;

-- 3. 添加一些测试牛只数据来验证基地权限分离
INSERT INTO cattle (ear_tag, breed, gender, birth_date, weight, health_status, base_id, barn_id) VALUES
-- 总部基地的牛只
('A001001', '西门塔尔牛', 'male', '2023-03-15', 450.5, 'healthy', 1, 1),
('A001002', '安格斯牛', 'female', '2023-02-20', 380.2, 'healthy', 1, 1),
('A002001', '夏洛莱牛', 'male', '2023-04-10', 420.8, 'healthy', 1, 2),
-- 东区基地的牛只
('E001001', '利木赞牛', 'female', '2023-01-25', 390.3, 'healthy', 2, 4),
('E001002', '西门塔尔牛', 'male', '2023-03-05', 465.7, 'healthy', 2, 4),
('E002001', '安格斯牛', 'female', '2023-02-15', 375.9, 'sick', 2, 5),
-- 西区基地的牛只
('W001001', '夏洛莱牛', 'male', '2023-04-01', 435.2, 'healthy', 3, 6),
('W001002', '利木赞牛', 'female', '2023-03-20', 385.6, 'treatment', 3, 6)
ON CONFLICT (ear_tag) DO NOTHING;

-- 4. 添加一些健康记录来测试基地权限
INSERT INTO health_records (cattle_id, symptoms, diagnosis, treatment, veterinarian_id, diagnosis_date, status, base_id) VALUES
-- 为东区基地的牛只添加健康记录（由东区兽医处理）
((SELECT id FROM cattle WHERE ear_tag = 'E002001'), '食欲不振，体温升高', '感冒', '注射青霉素，隔离观察', (SELECT id FROM users WHERE username = 'vet_east'), '2024-12-20', 'ongoing', 2),
-- 为西区基地的牛只添加健康记录
((SELECT id FROM cattle WHERE ear_tag = 'W001002'), '跛行，右前腿肿胀', '外伤感染', '清洗伤口，涂抹消炎药', 1, '2024-12-18', 'ongoing', 3)
ON CONFLICT DO NOTHING;

-- 5. 添加饲喂记录来测试基地权限
INSERT INTO feeding_records (formula_id, base_id, barn_id, amount, feeding_date, operator_id) VALUES
-- 总部基地饲喂记录
(1, 1, 1, 150.5, '2024-12-27', 1),
(1, 1, 2, 180.2, '2024-12-27', 1),
-- 东区基地饲喂记录
(1, 2, 4, 220.8, '2024-12-27', (SELECT id FROM users WHERE username = 'manager_east')),
(2, 2, 5, 195.3, '2024-12-27', (SELECT id FROM users WHERE username = 'manager_east')),
-- 西区基地饲喂记录
(1, 3, 6, 175.6, '2024-12-27', (SELECT id FROM users WHERE username = 'feeder_west'))
ON CONFLICT DO NOTHING;

-- 6. 更新牛棚的当前牛只数量
UPDATE barns SET current_count = (
  SELECT COUNT(*) FROM cattle WHERE barn_id = barns.id
);

-- 7. 创建权限验证函数
CREATE OR REPLACE FUNCTION check_base_permission(user_id INTEGER, target_base_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_base_id INTEGER;
  user_permissions JSONB;
  is_admin BOOLEAN := FALSE;
BEGIN
  -- 获取用户的基地ID和权限
  SELECT u.base_id, r.permissions INTO user_base_id, user_permissions
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = user_id;
  
  -- 检查是否是管理员（有system:admin或bases:all权限）
  IF user_permissions ? 'system:admin' OR user_permissions ? 'bases:all' OR user_permissions ? '*' THEN
    is_admin := TRUE;
  END IF;
  
  -- 管理员可以访问所有基地
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- 普通用户只能访问自己的基地
  RETURN user_base_id = target_base_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 创建基地数据过滤视图
CREATE OR REPLACE VIEW v_user_accessible_bases AS
SELECT 
  u.id as user_id,
  u.username,
  CASE 
    WHEN r.permissions ? 'system:admin' OR r.permissions ? 'bases:all' OR r.permissions ? '*' THEN 
      ARRAY(SELECT id FROM bases)
    ELSE 
      ARRAY[u.base_id]
  END as accessible_base_ids
FROM users u
JOIN roles r ON u.role_id = r.id;

-- 9. 添加数据完整性检查
-- 确保用户的base_id存在
ALTER TABLE users ADD CONSTRAINT fk_users_base_id 
  FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL;

-- 确保健康记录的base_id与牛只的base_id一致
CREATE OR REPLACE FUNCTION check_health_record_base_consistency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.base_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cattle WHERE id = NEW.cattle_id AND base_id != NEW.base_id
  ) THEN
    RAISE EXCEPTION 'Health record base_id must match cattle base_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果触发器不存在则创建
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_health_record_base_consistency_trigger') THEN
    CREATE TRIGGER check_health_record_base_consistency_trigger
      BEFORE INSERT OR UPDATE ON health_records
      FOR EACH ROW EXECUTE FUNCTION check_health_record_base_consistency();
  END IF;
END $$;

-- 10. 创建权限测试查询
-- 这些查询可以用来测试权限系统是否正常工作

-- 查看所有用户及其可访问的基地
COMMENT ON VIEW v_user_accessible_bases IS '显示每个用户可以访问的基地列表，用于权限测试';

-- 创建测试权限的存储过程
CREATE OR REPLACE FUNCTION test_user_permissions(test_user_id INTEGER)
RETURNS TABLE (
  test_name TEXT,
  result BOOLEAN,
  description TEXT
) AS $$
BEGIN
  -- 测试1：检查用户是否可以访问自己的基地
  RETURN QUERY
  SELECT 
    'access_own_base'::TEXT,
    check_base_permission(test_user_id, u.base_id),
    '用户应该能够访问自己的基地'::TEXT
  FROM users u WHERE u.id = test_user_id;
  
  -- 测试2：检查用户是否不能访问其他基地（非管理员）
  RETURN QUERY
  SELECT 
    'access_other_base'::TEXT,
    NOT check_base_permission(test_user_id, b.id),
    '非管理员用户不应该能够访问其他基地'::TEXT
  FROM bases b, users u 
  WHERE u.id = test_user_id 
    AND b.id != u.base_id 
    AND NOT (SELECT r.permissions ? 'system:admin' OR r.permissions ? 'bases:all' OR r.permissions ? '*' 
             FROM roles r WHERE r.id = u.role_id)
  LIMIT 1;
  
END;
$$ LANGUAGE plpgsql;

-- 添加注释说明
COMMENT ON FUNCTION check_base_permission IS '检查用户是否有权限访问指定基地的数据';
COMMENT ON FUNCTION test_user_permissions IS '测试用户权限系统是否正常工作';