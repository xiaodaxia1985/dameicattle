-- 完整的权限系统修复
-- 执行时间：2024-12-28

-- 1. 更新所有角色的权限，使用统一的权限命名规范
UPDATE roles SET permissions = '["*", "system:admin", "bases:all", "user:create", "user:read", "user:update", "user:delete", "user:reset-password", "role:create", "role:read", "role:update", "role:delete", "base:create", "base:read", "base:update", "base:delete", "cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "material:delete", "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "sales:create", "sales:read", "sales:update", "sales:delete", "news:create", "news:read", "news:update", "news:delete", "operation-log:read", "operation-log:export", "system:logs", "system:manage", "dashboard:read", "reports:read", "reports:export"]'
WHERE name = '超级管理员';

UPDATE roles SET permissions = '["cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "inventory:create", "inventory:read", "inventory:update", "purchase:create", "purchase:read", "purchase:update", "sales:create", "sales:read", "sales:update", "dashboard:read", "reports:read"]'
WHERE name = '基地管理员';

UPDATE roles SET permissions = '["cattle:read", "health:create", "health:read", "health:update", "health:delete", "dashboard:read", "reports:read"]'
WHERE name = '兽医';

UPDATE roles SET permissions = '["cattle:read", "cattle:update", "feeding:create", "feeding:read", "feeding:update", "material:read", "inventory:read", "dashboard:read"]'
WHERE name = '饲养员';

UPDATE roles SET permissions = '["cattle:read", "health:read", "feeding:read", "material:read", "inventory:read", "dashboard:read", "reports:read"]'
WHERE name = '普通员工';

-- 2. 确保admin用户有正确的权限
-- 如果admin用户不存在，创建一个
INSERT INTO users (username, password_hash, real_name, email, phone, role_id, base_id, status) VALUES
('admin', '$2a$12$tGjpQcVbjVbipdkcrPba4evU0xSDLypGIomSoIc7yBGy0.9Utsa9W', '系统管理员', 'admin@cattle-management.com', '13800138000', 1, 1, 'active')
ON CONFLICT (username) DO UPDATE SET
  role_id = 1,
  base_id = 1,
  status = 'active';

-- 3. 创建一些测试角色来验证权限系统
INSERT INTO roles (name, description, permissions) VALUES
('测试基地管理员', '用于测试基地权限分离的角色', '["cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:read", "inventory:read", "dashboard:read", "reports:read"]')
ON CONFLICT (name) DO UPDATE SET
  permissions = EXCLUDED.permissions;

-- 4. 验证权限系统的查询
-- 这个查询可以用来检查用户权限是否正确设置
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT 
  u.id as user_id,
  u.username,
  u.real_name,
  u.base_id,
  b.name as base_name,
  r.name as role_name,
  r.permissions
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN bases b ON u.base_id = b.id;

-- 5. 创建权限检查函数
CREATE OR REPLACE FUNCTION user_has_permission(user_id INTEGER, required_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  is_admin BOOLEAN := FALSE;
BEGIN
  -- 获取用户权限
  SELECT r.permissions INTO user_permissions
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = user_id;
  
  -- 如果没有找到用户或角色，返回false
  IF user_permissions IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查通配符权限
  IF user_permissions ? '*' THEN
    RETURN TRUE;
  END IF;
  
  -- 检查系统管理员权限
  IF user_permissions ? 'system:admin' AND required_permission LIKE 'system:%' THEN
    RETURN TRUE;
  END IF;
  
  -- 检查基地全权限
  IF user_permissions ? 'bases:all' AND (
    required_permission LIKE 'base:%' OR 
    required_permission LIKE 'cattle:%' OR 
    required_permission LIKE 'health:%' OR 
    required_permission LIKE 'feeding:%' OR
    required_permission LIKE 'material:%' OR
    required_permission LIKE 'inventory:%' OR
    required_permission LIKE 'purchase:%' OR
    required_permission LIKE 'sales:%'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- 检查具体权限
  RETURN user_permissions ? required_permission;
END;
$$ LANGUAGE plpgsql;

-- 6. 创建基地权限检查函数
CREATE OR REPLACE FUNCTION user_can_access_base(user_id INTEGER, target_base_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  user_base_id INTEGER;
  user_permissions JSONB;
BEGIN
  -- 获取用户的基地ID和权限
  SELECT u.base_id, r.permissions INTO user_base_id, user_permissions
  FROM users u
  JOIN roles r ON u.role_id = r.id
  WHERE u.id = user_id;
  
  -- 如果没有找到用户，返回false
  IF user_base_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 检查管理员权限
  IF user_permissions ? '*' OR user_permissions ? 'system:admin' OR user_permissions ? 'bases:all' THEN
    RETURN TRUE;
  END IF;
  
  -- 普通用户只能访问自己的基地
  RETURN user_base_id = target_base_id;
END;
$$ LANGUAGE plpgsql;

-- 7. 创建测试数据来验证权限系统
-- 为不同基地添加一些测试牛只
INSERT INTO cattle (ear_tag, breed, gender, birth_date, weight, health_status, base_id, barn_id) VALUES
-- 总部基地测试数据
('TEST001', '测试品种1', 'male', '2023-06-01', 400.0, 'healthy', 1, 1),
('TEST002', '测试品种2', 'female', '2023-06-15', 350.0, 'healthy', 1, 2),
-- 东区基地测试数据
('TEST003', '测试品种3', 'male', '2023-07-01', 420.0, 'healthy', 2, 4),
('TEST004', '测试品种4', 'female', '2023-07-15', 380.0, 'sick', 2, 5),
-- 西区基地测试数据
('TEST005', '测试品种5', 'male', '2023-08-01', 410.0, 'healthy', 3, 6),
('TEST006', '测试品种6', 'female', '2023-08-15', 370.0, 'treatment', 3, 6)
ON CONFLICT (ear_tag) DO NOTHING;

-- 8. 创建权限测试报告
CREATE OR REPLACE FUNCTION generate_permission_test_report()
RETURNS TABLE (
  test_category TEXT,
  test_name TEXT,
  user_name TEXT,
  expected_result BOOLEAN,
  actual_result BOOLEAN,
  test_passed BOOLEAN
) AS $$
BEGIN
  -- 测试超级管理员权限
  RETURN QUERY
  SELECT 
    '超级管理员权限测试'::TEXT,
    '创建用户权限'::TEXT,
    'admin'::TEXT,
    TRUE,
    user_has_permission(1, 'user:create'),
    user_has_permission(1, 'user:create') = TRUE;
    
  RETURN QUERY
  SELECT 
    '超级管理员权限测试'::TEXT,
    '访问所有基地'::TEXT,
    'admin'::TEXT,
    TRUE,
    user_can_access_base(1, 2),
    user_can_access_base(1, 2) = TRUE;
    
  -- 测试基地管理员权限
  RETURN QUERY
  SELECT 
    '基地管理员权限测试'::TEXT,
    '管理牛只权限'::TEXT,
    'manager_east'::TEXT,
    TRUE,
    user_has_permission((SELECT id FROM users WHERE username = 'manager_east'), 'cattle:create'),
    user_has_permission((SELECT id FROM users WHERE username = 'manager_east'), 'cattle:create') = TRUE;
    
  RETURN QUERY
  SELECT 
    '基地管理员权限测试'::TEXT,
    '只能访问自己基地'::TEXT,
    'manager_east'::TEXT,
    FALSE,
    user_can_access_base((SELECT id FROM users WHERE username = 'manager_east'), 3),
    user_can_access_base((SELECT id FROM users WHERE username = 'manager_east'), 3) = FALSE;
    
  -- 测试兽医权限
  RETURN QUERY
  SELECT 
    '兽医权限测试'::TEXT,
    '健康管理权限'::TEXT,
    'vet_east'::TEXT,
    TRUE,
    user_has_permission((SELECT id FROM users WHERE username = 'vet_east'), 'health:create'),
    user_has_permission((SELECT id FROM users WHERE username = 'vet_east'), 'health:create') = TRUE;
    
  RETURN QUERY
  SELECT 
    '兽医权限测试'::TEXT,
    '无用户管理权限'::TEXT,
    'vet_east'::TEXT,
    FALSE,
    user_has_permission((SELECT id FROM users WHERE username = 'vet_east'), 'user:create'),
    user_has_permission((SELECT id FROM users WHERE username = 'vet_east'), 'user:create') = FALSE;
END;
$$ LANGUAGE plpgsql;

-- 9. 添加注释和文档
COMMENT ON VIEW v_user_permissions IS '用户权限视图，显示所有用户的权限信息';
COMMENT ON FUNCTION user_has_permission IS '检查用户是否具有指定权限';
COMMENT ON FUNCTION user_can_access_base IS '检查用户是否可以访问指定基地的数据';
COMMENT ON FUNCTION generate_permission_test_report IS '生成权限系统测试报告';

-- 10. 输出权限系统状态
SELECT 'Permission system setup completed successfully!' as status;

-- 显示所有用户及其权限
SELECT 
  u.username,
  u.real_name,
  b.name as base_name,
  r.name as role_name,
  jsonb_array_length(r.permissions) as permission_count
FROM users u
LEFT JOIN roles r ON u.role_id = r.id
LEFT JOIN bases b ON u.base_id = b.id
ORDER BY u.id;