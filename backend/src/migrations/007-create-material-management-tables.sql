-- 创建物资管理相关表

-- 物资分类表
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '分类编码',
    description TEXT COMMENT '分类描述',
    parent_id INTEGER REFERENCES material_categories(id) COMMENT '父分类ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '供应商名称',
    contact_person VARCHAR(100) COMMENT '联系人',
    phone VARCHAR(20) COMMENT '联系电话',
    email VARCHAR(100) COMMENT '邮箱',
    address TEXT COMMENT '地址',
    rating INTEGER DEFAULT 0 COMMENT '供应商评级',
    supplier_type VARCHAR(50) COMMENT '供应商类型',
    business_license VARCHAR(100) COMMENT '营业执照号',
    tax_number VARCHAR(100) COMMENT '税号',
    bank_account VARCHAR(100) COMMENT '银行账户',
    credit_limit DECIMAL(12, 2) DEFAULT 0 COMMENT '信用额度',
    payment_terms VARCHAR(100) COMMENT '付款条件',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生产物资表
CREATE TABLE IF NOT EXISTS production_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '物资名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '物资编码',
    category_id INTEGER NOT NULL REFERENCES material_categories(id) COMMENT '分类ID',
    unit VARCHAR(20) NOT NULL COMMENT '单位',
    specification TEXT COMMENT '规格说明',
    supplier_id INTEGER REFERENCES suppliers(id) COMMENT '供应商ID',
    purchase_price DECIMAL(10, 2) COMMENT '采购价格',
    safety_stock DECIMAL(10, 2) DEFAULT 0 COMMENT '安全库存',
    status VARCHAR(20) DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES production_materials(id) COMMENT '物资ID',
    base_id INTEGER NOT NULL REFERENCES bases(id) COMMENT '基地ID',
    current_stock DECIMAL(10, 2) DEFAULT 0 COMMENT '当前库存',
    reserved_stock DECIMAL(10, 2) DEFAULT 0 COMMENT '预留库存',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '最后更新时间',
    UNIQUE(material_id, base_id)
);

-- 库存变动记录表
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES production_materials(id) COMMENT '物资ID',
    base_id INTEGER NOT NULL REFERENCES bases(id) COMMENT '基地ID',
    transaction_type VARCHAR(20) NOT NULL COMMENT '交易类型：入库、出库、调拨、盘点',
    quantity DECIMAL(10, 2) NOT NULL COMMENT '数量',
    unit_price DECIMAL(10, 2) COMMENT '单价',
    reference_type VARCHAR(50) COMMENT '关联单据类型',
    reference_id INTEGER COMMENT '关联单据ID',
    batch_number VARCHAR(50) COMMENT '批次号',
    expiry_date DATE COMMENT '过期日期',
    operator_id INTEGER NOT NULL REFERENCES users(id) COMMENT '操作员ID',
    remark TEXT COMMENT '备注',
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间'
);

-- 库存预警表
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES production_materials(id) COMMENT '物资ID',
    base_id INTEGER NOT NULL REFERENCES bases(id) COMMENT '基地ID',
    alert_type VARCHAR(20) NOT NULL COMMENT '预警类型：低库存、过期、质量问题',
    alert_level VARCHAR(20) DEFAULT 'medium' COMMENT '预警级别：low, medium, high',
    message TEXT NOT NULL COMMENT '预警消息',
    is_resolved BOOLEAN DEFAULT FALSE COMMENT '是否已解决',
    resolved_at TIMESTAMP COMMENT '解决时间',
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