-- 为各个微服务创建基础表结构

-- 基地管理服务表
\c base_db;

CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    area DECIMAL(10,2),
    manager_id INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS barns (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    capacity INTEGER DEFAULT 0,
    current_count INTEGER DEFAULT 0,
    barn_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    UNIQUE(base_id, code)
);

-- 牛只管理服务表
\c cattle_db;

CREATE TABLE IF NOT EXISTS cattle (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    rfid VARCHAR(100),
    breed VARCHAR(50),
    gender VARCHAR(10),
    birth_date DATE,
    weight DECIMAL(8,2),
    base_id INTEGER,
    barn_id INTEGER,
    status VARCHAR(20) DEFAULT 'healthy',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cattle_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    record_data JSONB,
    recorded_by INTEGER,
    recorded_at TIMESTAMP DEFAULT NOW(),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 健康管理服务表
\c health_db;

CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    check_date DATE NOT NULL,
    temperature DECIMAL(4,1),
    weight DECIMAL(8,2),
    health_status VARCHAR(50),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    veterinarian VARCHAR(100),
    next_check_date DATE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccinations (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    vaccine_name VARCHAR(100) NOT NULL,
    vaccination_date DATE NOT NULL,
    next_vaccination_date DATE,
    batch_number VARCHAR(50),
    veterinarian VARCHAR(100),
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 饲养管理服务表
\c feeding_db;

CREATE TABLE IF NOT EXISTS feed_formulas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    ingredients JSONB,
    nutritional_info JSONB,
    cost_per_kg DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feeding_plans (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER,
    barn_id INTEGER,
    formula_id INTEGER NOT NULL,
    daily_amount DECIMAL(8,2),
    feeding_times INTEGER DEFAULT 2,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feeding_records (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    feeding_date DATE NOT NULL,
    feeding_time TIME NOT NULL,
    amount_fed DECIMAL(8,2),
    fed_by INTEGER,
    notes TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 设备管理服务表
\c equipment_db;

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    purchase_date DATE,
    warranty_end_date DATE,
    base_id INTEGER,
    barn_id INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL,
    maintenance_type VARCHAR(50),
    maintenance_date DATE NOT NULL,
    description TEXT,
    cost DECIMAL(10,2),
    technician VARCHAR(100),
    next_maintenance_date DATE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 采购管理服务表
\c procurement_db;

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    total_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_by INTEGER,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(20),
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 销售管理服务表
\c sales_db;

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    total_amount DECIMAL(12,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_by INTEGER,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    cattle_id INTEGER,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(12,2),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 物料管理服务表
\c material_db;

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(20),
    min_stock DECIMAL(10,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0,
    unit_cost DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'transfer'
    quantity DECIMAL(10,2) NOT NULL,
    reference_type VARCHAR(50), -- 'purchase', 'consumption', 'adjustment'
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 创建索引以提高查询性能
\c base_db;
CREATE INDEX IF NOT EXISTS idx_barns_base_id ON barns(base_id);

\c cattle_db;
CREATE INDEX IF NOT EXISTS idx_cattle_base_id ON cattle(base_id);
CREATE INDEX IF NOT EXISTS idx_cattle_barn_id ON cattle(barn_id);
CREATE INDEX IF NOT EXISTS idx_cattle_records_cattle_id ON cattle_records(cattle_id);

\c health_db;
CREATE INDEX IF NOT EXISTS idx_health_records_cattle_id ON health_records(cattle_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_cattle_id ON vaccinations(cattle_id);

\c feeding_db;
CREATE INDEX IF NOT EXISTS idx_feeding_plans_cattle_id ON feeding_plans(cattle_id);
CREATE INDEX IF NOT EXISTS idx_feeding_plans_barn_id ON feeding_plans(barn_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_plan_id ON feeding_records(plan_id);

\c equipment_db;
CREATE INDEX IF NOT EXISTS idx_equipment_base_id ON equipment(base_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_equipment_id ON maintenance_records(equipment_id);

\c procurement_db;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON purchase_order_items(order_id);

\c sales_db;
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);

\c material_db;
CREATE INDEX IF NOT EXISTS idx_stock_movements_material_id ON stock_movements(material_id);