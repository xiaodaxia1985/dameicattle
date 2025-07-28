-- 修复admin用户权限
UPDATE roles SET permissions = '["*", "system:admin", "bases:all", "user:create", "user:read", "user:update", "user:delete", "user:reset-password", "role:create", "role:read", "role:update", "role:delete", "base:create", "base:read", "base:update", "base:delete", "cattle:create", "cattle:read", "cattle:update", "cattle:delete", "health:create", "health:read", "health:update", "health:delete", "feeding:create", "feeding:read", "feeding:update", "feeding:delete", "material:create", "material:read", "material:update", "material:delete", "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "sales:create", "sales:read", "sales:update", "sales:delete", "news:create", "news:read", "news:update", "news:delete", "operation-log:read", "operation-log:export", "system:logs", "system:manage", "dashboard:read", "reports:read", "reports:export"]'
WHERE name = 'admin';

-- 确保admin用户有正确的base_id
UPDATE users SET base_id = 1 WHERE username = 'admin' AND base_id IS NULL;

-- 检查结果
SELECT 
  u.username, 
  u.role_id, 
  u.base_id,
  r.name as role_name,
  jsonb_array_length(r.permissions) as permission_count,
  r.permissions ? 'role:read' as has_role_read,
  r.permissions ? '*' as has_wildcard
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
WHERE u.username = 'admin';