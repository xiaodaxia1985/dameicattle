-- 创建物资管理相关表

-- 物资分类表
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES material_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    rating INTEGER DEFAULT 0,
    supplier_type VARCHAR(50),
    business_license VARCHAR(100),
    tax_number VARCHAR(100),
    bank_account VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    payment_terms VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生产物资表
CREATE TABLE IF NOT EXISTS production_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER NOT NULL REFERENCES material_categories(id),
    unit VARCHAR(20) NOT NULL,
    specification TEXT,
    supplier_id INTEGER REFERENCES suppliers(id),
    purchase_price DECIMAL(10, 2),
    safety_stock DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES production_materials(id),
    base_id INTEGER NOT NULL REFERENCES bases(id),
    current_stock DECIMAL(10, 2) DEFAULT 0,
    reserved_stock DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, base_id)
);

-- 库存变动记录表
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES production_materials(id),
    base_id INTEGER NOT NULL REFERENCES bases(id),
    transaction_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    batch_number VARCHAR(50),
    expiry_date DATE,
    operator_id INTEGER NOT NULL REFERENCES users(id),
    remark TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存预警表
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES production_materials(id),
    base_id INTEGER NOT NULL REFERENCES bases(id),
    alert_type VARCHAR(20) NOT NULL,
    alert_level VARCHAR(20) DEFAULT 'medium',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_material_categories_parent_id ON material_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_production_materials_category_id ON production_materials(category_id);
CREATE INDEX IF NOT EXISTS idx_production_materials_supplier_id ON production_materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_material_base ON inventory(material_id, base_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_material_id ON inventory_transactions(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_base_id ON inventory_transactions(base_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_material_base ON inventory_alerts(material_id, base_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);