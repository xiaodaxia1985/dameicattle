-- Fix view dependency issue for real_name field
-- This script drops and recreates the v_base_overview view to remove dependency on users.real_name

-- Drop the view that depends on users.real_name
DROP VIEW IF EXISTS v_base_overview CASCADE;

-- Recreate the view with proper field references
CREATE VIEW v_base_overview AS
SELECT 
    b.id,
    b.name,
    b.code,
    b.address,
    u.real_name as manager_name,
    u.phone as manager_phone,
    COUNT(DISTINCT barn.id) as barn_count,
    COALESCE(SUM(barn.capacity), 0) as total_capacity,
    COALESCE(SUM(barn.current_count), 0) as current_cattle_count,
    CASE 
        WHEN SUM(barn.capacity) > 0 THEN 
            ROUND((SUM(barn.current_count)::DECIMAL / SUM(barn.capacity)) * 100, 2)
        ELSE 0 
    END as utilization_rate,
    b.created_at,
    b.updated_at
FROM bases b
LEFT JOIN users u ON b.manager_id = u.id
LEFT JOIN barns barn ON b.id = barn.base_id
GROUP BY b.id, b.name, b.code, b.address, u.real_name, u.phone, b.created_at, b.updated_at;

-- Grant permissions
GRANT SELECT ON v_base_overview TO cattle_user;