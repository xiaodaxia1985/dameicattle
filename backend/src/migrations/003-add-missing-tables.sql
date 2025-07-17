-- 添加缺失的数据表

-- 采购订单明细表
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('cattle', 'material', 'equipment')),
    item_id INTEGER,
    item_name VARCHAR(200) NOT NULL,
    specification TEXT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    received_quantity DECIMAL(10, 2) DEFAULT 0,
    quality_status VARCHAR(20) DEFAULT 'pending' CHECK (quality_status IN ('pending', 'passed', 'failed')),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 销售订单明细表
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE,
    cattle_id INTEGER REFERENCES cattle(id),
    ear_tag VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    weight DECIMAL(6, 2),
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    quality_grade VARCHAR(20),
    health_certificate VARCHAR(100),
    quarantine_certificate VARCHAR(100),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'prepared', 'shipped', 'delivered')),
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备分类表
CREATE TABLE IF NOT EXISTS equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生产设备表
CREATE TABLE IF NOT EXISTS production_equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES equipment_categories(id),
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(12, 2),
    warranty_period INTEGER,
    installation_date DATE,
    status VARCHAR(20) DEFAULT 'normal' CHECK (status IN ('normal', 'maintenance', 'broken', 'retired')),
    location TEXT,
    specifications JSONB,
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备维护计划表
CREATE TABLE IF NOT EXISTS equipment_maintenance_plans (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES production_equipment(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL,
    frequency_days INTEGER NOT NULL,
    description TEXT,
    checklist JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备维护记录表
CREATE TABLE IF NOT EXISTS equipment_maintenance_records (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES production_equipment(id),
    plan_id INTEGER REFERENCES equipment_maintenance_plans(id),
    maintenance_date DATE NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    duration_hours DECIMAL(4, 2),
    cost DECIMAL(10, 2),
    parts_replaced JSONB,
    issues_found TEXT,
    actions_taken TEXT,
    next_maintenance_date DATE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备故障记录表
CREATE TABLE IF NOT EXISTS equipment_failures (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES production_equipment(id),
    failure_date TIMESTAMP NOT NULL,
    reported_by INTEGER REFERENCES users(id),
    failure_type VARCHAR(50),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    impact_description TEXT,
    repair_start_time TIMESTAMP,
    repair_end_time TIMESTAMP,
    repair_cost DECIMAL(10, 2),
    repaired_by INTEGER REFERENCES users(id),
    repair_description TEXT,
    parts_replaced JSONB,
    status VARCHAR(20) DEFAULT 'reported' CHECK (status IN ('reported', 'in_repair', 'resolved', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存预警表
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES production_materials(id),
    base_id INTEGER REFERENCES bases(id),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low_stock', 'expired', 'quality_issue')),
    alert_level VARCHAR(20) DEFAULT 'medium' CHECK (alert_level IN ('low', 'medium', 'high')),
    message TEXT,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻评论表
CREATE TABLE IF NOT EXISTS news_comments (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES news_comments(id),
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(100),
    user_phone VARCHAR(20),
    content TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deleted')),
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻浏览记录表
CREATE TABLE IF NOT EXISTS news_views (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer VARCHAR(500),
    view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻点赞记录表
CREATE TABLE IF NOT EXISTS news_likes (
    id SERIAL PRIMARY KEY,
    article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(article_id, ip_address)
);

-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_data JSONB,
    response_status INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建新增表的索引
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_cattle_id ON sales_order_items(cattle_id);
CREATE INDEX IF NOT EXISTS idx_equipment_base_id ON production_equipment(base_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category_id ON production_equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON production_equipment(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_equipment_id ON equipment_maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_failures_equipment_id ON equipment_failures(equipment_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_material_base ON inventory_alerts(material_id, base_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_article_id ON news_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_news_views_article_id ON news_views(article_id);
CREATE INDEX IF NOT EXISTS idx_news_views_ip_time ON news_views(ip_address, view_time);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);