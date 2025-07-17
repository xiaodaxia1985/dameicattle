-- 数据库优化脚本 - 索引优化和性能调优

-- 创建复合索引以优化常用查询
CREATE INDEX IF NOT EXISTS idx_cattle_base_barn ON cattle(base_id, barn_id);
CREATE INDEX IF NOT EXISTS idx_cattle_health_base ON cattle(health_status, base_id);
CREATE INDEX IF NOT EXISTS idx_cattle_breed_gender ON cattle(breed, gender);

-- 健康记录相关索引
CREATE INDEX IF NOT EXISTS idx_health_records_date_status ON health_records(diagnosis_date, status);
CREATE INDEX IF NOT EXISTS idx_health_records_cattle_date ON health_records(cattle_id, diagnosis_date DESC);

-- 饲喂记录相关索引
CREATE INDEX IF NOT EXISTS idx_feeding_records_date ON feeding_records(feeding_date DESC);
CREATE INDEX IF NOT EXISTS idx_feeding_records_formula_date ON feeding_records(formula_id, feeding_date DESC);

-- 库存相关索引
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type_date ON inventory_transactions(transaction_type, transaction_date DESC);

-- 订单相关索引
CREATE INDEX IF NOT EXISTS idx_purchase_orders_date_status ON purchase_orders(order_date DESC, status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_date_status ON sales_orders(order_date DESC, status);

-- 新闻相关索引
CREATE INDEX IF NOT EXISTS idx_news_articles_publish_time ON news_articles(publish_time DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles(is_featured, publish_time DESC) WHERE status = 'published';

-- 系统日志索引
CREATE INDEX IF NOT EXISTS idx_system_logs_user_action ON system_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource ON system_logs(resource_type, resource_id);

-- 创建部分索引以节省空间
CREATE INDEX IF NOT EXISTS idx_cattle_active ON cattle(id) WHERE health_status != 'dead';
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_equipment_active ON production_equipment(id) WHERE status != 'retired';

-- 创建表达式索引
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_cattle_ear_tag_lower ON cattle(LOWER(ear_tag));

-- 创建GIN索引用于JSONB字段
CREATE INDEX IF NOT EXISTS idx_cattle_photos_gin ON cattle USING GIN(photos);
CREATE INDEX IF NOT EXISTS idx_equipment_specifications_gin ON production_equipment USING GIN(specifications);
CREATE INDEX IF NOT EXISTS idx_feed_formulas_ingredients_gin ON feed_formulas USING GIN(ingredients);

-- 创建全文搜索索引（使用默认配置）
CREATE INDEX IF NOT EXISTS idx_news_articles_fts ON news_articles USING GIN(to_tsvector('simple', title || ' ' || COALESCE(content, '')));

-- 添加约束以确保数据完整性
ALTER TABLE cattle ADD CONSTRAINT chk_cattle_weight CHECK (weight > 0 AND weight < 2000);
ALTER TABLE barns ADD CONSTRAINT chk_barn_capacity CHECK (capacity > 0 AND current_count >= 0 AND current_count <= capacity);
ALTER TABLE inventory ADD CONSTRAINT chk_inventory_stock CHECK (current_stock >= 0 AND reserved_stock >= 0);
ALTER TABLE production_materials ADD CONSTRAINT chk_material_price CHECK (purchase_price >= 0);
ALTER TABLE purchase_orders ADD CONSTRAINT chk_purchase_amount CHECK (total_amount >= 0);
ALTER TABLE sales_orders ADD CONSTRAINT chk_sales_amount CHECK (total_amount >= 0);

-- 创建触发器函数用于自动更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bases_updated_at BEFORE UPDATE ON bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barns_updated_at BEFORE UPDATE ON barns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cattle_updated_at BEFORE UPDATE ON cattle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feed_formulas_updated_at BEFORE UPDATE ON feed_formulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_materials_updated_at BEFORE UPDATE ON production_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_production_equipment_updated_at BEFORE UPDATE ON production_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_categories_updated_at BEFORE UPDATE ON news_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建库存更新触发器函数
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- 更新库存表的当前库存
    IF TG_OP = 'INSERT' THEN
        INSERT INTO inventory (material_id, base_id, current_stock, last_updated)
        VALUES (NEW.material_id, NEW.base_id, 
                CASE WHEN NEW.transaction_type IN ('inbound', 'adjustment') THEN NEW.quantity
                     ELSE -NEW.quantity END, 
                CURRENT_TIMESTAMP)
        ON CONFLICT (material_id, base_id)
        DO UPDATE SET 
            current_stock = inventory.current_stock + 
                CASE WHEN NEW.transaction_type IN ('inbound', 'adjustment') THEN NEW.quantity
                     ELSE -NEW.quantity END,
            last_updated = CURRENT_TIMESTAMP;
        
        -- 检查是否需要创建库存预警
        INSERT INTO inventory_alerts (material_id, base_id, alert_type, alert_level, message)
        SELECT 
            i.material_id, 
            i.base_id, 
            'low_stock', 
            CASE WHEN i.current_stock <= pm.safety_stock * 0.5 THEN 'high'
                 WHEN i.current_stock <= pm.safety_stock THEN 'medium'
                 ELSE 'low' END,
            pm.name || '库存不足，当前库存：' || i.current_stock || pm.unit || '，安全库存：' || pm.safety_stock || pm.unit
        FROM inventory i
        JOIN production_materials pm ON i.material_id = pm.id
        WHERE i.material_id = NEW.material_id 
          AND i.base_id = NEW.base_id 
          AND i.current_stock <= pm.safety_stock
          AND NOT EXISTS (
              SELECT 1 FROM inventory_alerts ia 
              WHERE ia.material_id = i.material_id 
                AND ia.base_id = i.base_id 
                AND ia.alert_type = 'low_stock' 
                AND ia.is_resolved = FALSE
          );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 创建库存变动触发器
CREATE TRIGGER trigger_update_inventory_stock 
    AFTER INSERT ON inventory_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_inventory_stock();

-- 创建牛棚数量更新触发器函数
CREATE OR REPLACE FUNCTION update_barn_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 新增牛只时增加牛棚数量
        UPDATE barns SET current_count = current_count + 1 
        WHERE id = NEW.barn_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- 牛只转移时更新牛棚数量
        IF OLD.barn_id != NEW.barn_id THEN
            UPDATE barns SET current_count = current_count - 1 
            WHERE id = OLD.barn_id;
            UPDATE barns SET current_count = current_count + 1 
            WHERE id = NEW.barn_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- 删除牛只时减少牛棚数量
        UPDATE barns SET current_count = current_count - 1 
        WHERE id = OLD.barn_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 创建牛只数量触发器
CREATE TRIGGER trigger_update_barn_count_insert 
    AFTER INSERT ON cattle 
    FOR EACH ROW EXECUTE FUNCTION update_barn_count();
    
CREATE TRIGGER trigger_update_barn_count_update 
    AFTER UPDATE ON cattle 
    FOR EACH ROW EXECUTE FUNCTION update_barn_count();
    
CREATE TRIGGER trigger_update_barn_count_delete 
    AFTER DELETE ON cattle 
    FOR EACH ROW EXECUTE FUNCTION update_barn_count();

-- 创建新闻统计更新触发器函数
CREATE OR REPLACE FUNCTION update_news_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'news_views' THEN
        -- 更新浏览量
        UPDATE news_articles 
        SET view_count = view_count + 1 
        WHERE id = NEW.article_id;
    ELSIF TG_TABLE_NAME = 'news_likes' THEN
        -- 更新点赞数
        IF TG_OP = 'INSERT' THEN
            UPDATE news_articles 
            SET like_count = like_count + 1 
            WHERE id = NEW.article_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE news_articles 
            SET like_count = like_count - 1 
            WHERE id = OLD.article_id;
        END IF;
    ELSIF TG_TABLE_NAME = 'news_comments' THEN
        -- 更新评论数
        IF TG_OP = 'INSERT' THEN
            UPDATE news_articles 
            SET comment_count = comment_count + 1 
            WHERE id = NEW.article_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE news_articles 
            SET comment_count = comment_count - 1 
            WHERE id = OLD.article_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- 创建新闻统计触发器
CREATE TRIGGER trigger_update_news_view_count 
    AFTER INSERT ON news_views 
    FOR EACH ROW EXECUTE FUNCTION update_news_stats();
    
CREATE TRIGGER trigger_update_news_like_count_insert 
    AFTER INSERT ON news_likes 
    FOR EACH ROW EXECUTE FUNCTION update_news_stats();
    
CREATE TRIGGER trigger_update_news_like_count_delete 
    AFTER DELETE ON news_likes 
    FOR EACH ROW EXECUTE FUNCTION update_news_stats();
    
CREATE TRIGGER trigger_update_news_comment_count_insert 
    AFTER INSERT ON news_comments 
    FOR EACH ROW EXECUTE FUNCTION update_news_stats();
    
CREATE TRIGGER trigger_update_news_comment_count_delete 
    AFTER DELETE ON news_comments 
    FOR EACH ROW EXECUTE FUNCTION update_news_stats();

-- 创建数据清理函数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- 清理90天前的系统日志
    DELETE FROM system_logs WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    
    -- 清理30天前的新闻浏览记录
    DELETE FROM news_views WHERE view_time < CURRENT_DATE - INTERVAL '30 days';
    
    -- 清理已解决的库存预警（7天前）
    DELETE FROM inventory_alerts 
    WHERE is_resolved = TRUE AND resolved_at < CURRENT_DATE - INTERVAL '7 days';
    
    RAISE NOTICE '数据清理完成';
END;
$$ language 'plpgsql';

-- 创建数据统计视图
CREATE OR REPLACE VIEW v_cattle_statistics AS
SELECT 
    b.name as base_name,
    COUNT(*) as total_cattle,
    COUNT(CASE WHEN c.gender = 'male' THEN 1 END) as male_count,
    COUNT(CASE WHEN c.gender = 'female' THEN 1 END) as female_count,
    COUNT(CASE WHEN c.health_status = 'healthy' THEN 1 END) as healthy_count,
    COUNT(CASE WHEN c.health_status = 'sick' THEN 1 END) as sick_count,
    COUNT(CASE WHEN c.health_status = 'treatment' THEN 1 END) as treatment_count,
    AVG(c.weight) as avg_weight,
    MIN(c.weight) as min_weight,
    MAX(c.weight) as max_weight
FROM cattle c
JOIN bases b ON c.base_id = b.id
GROUP BY b.id, b.name;

CREATE OR REPLACE VIEW v_inventory_status AS
SELECT 
    b.name as base_name,
    mc.name as category_name,
    pm.name as material_name,
    pm.unit,
    i.current_stock,
    i.reserved_stock,
    pm.safety_stock,
    CASE 
        WHEN i.current_stock <= pm.safety_stock * 0.5 THEN '严重不足'
        WHEN i.current_stock <= pm.safety_stock THEN '库存不足'
        WHEN i.current_stock <= pm.safety_stock * 2 THEN '正常'
        ELSE '充足'
    END as stock_status,
    i.last_updated
FROM inventory i
JOIN production_materials pm ON i.material_id = pm.id
JOIN material_categories mc ON pm.category_id = mc.id
JOIN bases b ON i.base_id = b.id
ORDER BY b.name, mc.name, pm.name;

CREATE OR REPLACE VIEW v_equipment_maintenance_schedule AS
SELECT 
    b.name as base_name,
    pe.name as equipment_name,
    pe.code as equipment_code,
    emp.maintenance_type,
    emp.frequency_days,
    COALESCE(
        MAX(emr.maintenance_date) + INTERVAL '1 day' * emp.frequency_days,
        pe.installation_date + INTERVAL '1 day' * emp.frequency_days
    ) as next_maintenance_date,
    CASE 
        WHEN COALESCE(
            MAX(emr.maintenance_date) + INTERVAL '1 day' * emp.frequency_days,
            pe.installation_date + INTERVAL '1 day' * emp.frequency_days
        ) < CURRENT_DATE THEN '逾期'
        WHEN COALESCE(
            MAX(emr.maintenance_date) + INTERVAL '1 day' * emp.frequency_days,
            pe.installation_date + INTERVAL '1 day' * emp.frequency_days
        ) <= CURRENT_DATE + INTERVAL '7 days' THEN '即将到期'
        ELSE '正常'
    END as maintenance_status
FROM production_equipment pe
JOIN bases b ON pe.base_id = b.id
JOIN equipment_maintenance_plans emp ON pe.id = emp.equipment_id
LEFT JOIN equipment_maintenance_records emr ON pe.id = emr.equipment_id AND emp.id = emr.plan_id
WHERE pe.status = 'normal' AND emp.is_active = TRUE
GROUP BY b.name, pe.name, pe.code, emp.maintenance_type, emp.frequency_days, pe.installation_date
ORDER BY next_maintenance_date;

-- 分析表以更新统计信息
ANALYZE;

-- 输出优化完成信息
DO $$
BEGIN
    RAISE NOTICE '数据库优化完成！';
    RAISE NOTICE '- 创建了 % 个索引', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public');
    RAISE NOTICE '- 创建了 % 个触发器', (SELECT COUNT(*) FROM pg_trigger WHERE tgrelid IN (SELECT oid FROM pg_class WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')));
    RAISE NOTICE '- 创建了 % 个视图', (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public');
END $$;