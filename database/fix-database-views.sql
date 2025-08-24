-- Fix database view dependencies to allow Sequelize migrations
-- This script should be run to fix existing database issues

-- Drop all views that might have dependencies on user fields
DROP VIEW IF EXISTS v_base_overview CASCADE;
DROP VIEW IF EXISTS v_cattle_statistics CASCADE;
DROP VIEW IF EXISTS v_health_statistics CASCADE;
DROP VIEW IF EXISTS v_inventory_alerts CASCADE;

-- Drop any rules that might depend on the views
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop any rules that might depend on the views
    FOR r IN SELECT schemaname, tablename, rulename FROM pg_rules WHERE schemaname = 'public' LOOP
        BEGIN
            EXECUTE 'DROP RULE IF EXISTS ' || quote_ident(r.rulename) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename) || ' CASCADE';
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors, rule might not exist
            NULL;
        END;
    END LOOP;
END
$$;

-- Recreate views without strict dependencies
-- Cattle statistics view
CREATE VIEW v_cattle_statistics AS
SELECT 
    b.id as base_id,
    b.name as base_name,
    COUNT(c.id) as total_cattle,
    COUNT(CASE WHEN c.health_status = 'healthy' THEN 1 END) as healthy_cattle,
    COUNT(CASE WHEN c.health_status = 'sick' THEN 1 END) as sick_cattle,
    COUNT(CASE WHEN c.health_status = 'treatment' THEN 1 END) as treatment_cattle,
    COUNT(CASE WHEN c.gender = 'male' THEN 1 END) as male_cattle,
    COUNT(CASE WHEN c.gender = 'female' THEN 1 END) as female_cattle,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_cattle,
    AVG(c.weight) as avg_weight
FROM bases b
LEFT JOIN cattle c ON b.id = c.base_id AND c.status = 'active'
GROUP BY b.id, b.name;

-- Base overview view (fixed to avoid column dependency issues)
CREATE VIEW v_base_overview AS
SELECT 
    b.id,
    b.name,
    b.code,
    b.address,
    COALESCE(u.real_name, u.username) as manager_name,
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
GROUP BY b.id, b.name, b.code, b.address, u.real_name, u.username, u.phone, b.created_at, b.updated_at;

-- Health statistics view
CREATE VIEW v_health_statistics AS
SELECT 
    b.id as base_id,
    b.name as base_name,
    COUNT(hr.id) as total_health_records,
    COUNT(CASE WHEN hr.status = 'ongoing' THEN 1 END) as ongoing_treatments,
    COUNT(CASE WHEN hr.status = 'completed' THEN 1 END) as completed_treatments,
    COUNT(CASE WHEN hr.diagnosis_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_records,
    COUNT(DISTINCT hr.cattle_id) as affected_cattle_count
FROM bases b
LEFT JOIN health_records hr ON b.id = hr.base_id
GROUP BY b.id, b.name;

-- Inventory alerts view
CREATE VIEW v_inventory_alerts AS
SELECT 
    i.id,
    b.name as base_name,
    pm.name as material_name,
    pm.code as material_code,
    pm.unit,
    i.current_stock,
    i.min_stock,
    i.max_stock,
    CASE 
        WHEN i.current_stock <= i.min_stock THEN 'low_stock'
        WHEN i.max_stock IS NOT NULL AND i.current_stock >= i.max_stock THEN 'overstock'
        ELSE 'normal'
    END as alert_type,
    i.last_updated
FROM inventories i
JOIN bases b ON i.base_id = b.id
JOIN production_materials pm ON i.material_id = pm.id
WHERE i.current_stock <= i.min_stock 
   OR (i.max_stock IS NOT NULL AND i.current_stock >= i.max_stock);

-- Grant permissions
GRANT SELECT ON v_cattle_statistics TO cattle_user;
GRANT SELECT ON v_base_overview TO cattle_user;
GRANT SELECT ON v_health_statistics TO cattle_user;
GRANT SELECT ON v_inventory_alerts TO cattle_user;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Database views have been fixed and recreated successfully!';
    RAISE NOTICE 'The view dependency issue should now be resolved.';
END
$$;