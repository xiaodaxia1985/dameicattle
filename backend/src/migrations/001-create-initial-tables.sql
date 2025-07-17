-- 肉牛全生命周期管理系统数据库初始化脚本

-- 创建数据库（如果不存在）
-- CREATE DATABASE cattle_management;

-- 使用数据库
-- \c cattle_management;

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 基地表
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    area DECIMAL(10, 2),
    manager_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(id),
    base_id INTEGER REFERENCES bases(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 牛棚表
CREATE TABLE IF NOT EXISTS barns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    base_id INTEGER REFERENCES bases(id),
    capacity INTEGER NOT NULL,
    current_count INTEGER DEFAULT 0,
    barn_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 牛只表
CREATE TABLE IF NOT EXISTS cattle (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    weight DECIMAL(6, 2),
    health_status VARCHAR(20) DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'sick', 'treatment')),
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 牛只生命周期事件表
CREATE TABLE IF NOT EXISTS cattle_events (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER REFERENCES cattle(id),
    event_type VARCHAR(50) NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    operator_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 诊疗记录表
CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER REFERENCES cattle(id),
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    veterinarian_id INTEGER REFERENCES users(id),
    diagnosis_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 疫苗接种记录表
CREATE TABLE IF NOT EXISTS vaccination_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER REFERENCES cattle(id),
    vaccine_name VARCHAR(100) NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE,
    veterinarian_id INTEGER REFERENCES users(id),
    batch_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 饲料配方表
CREATE TABLE IF NOT EXISTS feed_formulas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    cost_per_kg DECIMAL(8, 2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 饲喂记录表
CREATE TABLE IF NOT EXISTS feeding_records (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER REFERENCES feed_formulas(id),
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    amount DECIMAL(8, 2) NOT NULL,
    feeding_date DATE NOT NULL,
    operator_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 物资分类表
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES material_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 生产物资表
CREATE TABLE IF NOT EXISTS production_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES material_categories(id),
    unit VARCHAR(20) NOT NULL,
    specification TEXT,
    supplier_id INTEGER,
    purchase_price DECIMAL(10, 2),
    safety_stock DECIMAL(10, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES production_materials(id),
    base_id INTEGER REFERENCES bases(id),
    current_stock DECIMAL(10, 2) DEFAULT 0,
    reserved_stock DECIMAL(10, 2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(material_id, base_id)
);

-- 库存变动记录表
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES production_materials(id),
    base_id INTEGER REFERENCES bases(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('inbound', 'outbound', 'transfer', 'adjustment')),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    batch_number VARCHAR(50),
    expiry_date DATE,
    operator_id INTEGER REFERENCES users(id),
    remark TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 供应商表
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    supplier_type VARCHAR(50),
    business_license VARCHAR(100),
    tax_number VARCHAR(100),
    bank_account VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    payment_terms VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 采购订单表
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id),
    base_id INTEGER REFERENCES bases(id),
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('cattle', 'material', 'equipment')),
    total_amount DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'delivered', 'completed', 'cancelled')),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    payment_method VARCHAR(50),
    contract_number VARCHAR(100),
    remark TEXT,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    credit_rating INTEGER DEFAULT 0 CHECK (credit_rating >= 0 AND credit_rating <= 5),
    customer_type VARCHAR(50),
    business_license VARCHAR(100),
    tax_number VARCHAR(100),
    bank_account VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    payment_terms VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 销售订单表
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    base_id INTEGER REFERENCES bases(id),
    total_amount DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'completed', 'cancelled')),
    order_date DATE NOT NULL,
    delivery_date DATE,
    actual_delivery_date DATE,
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    payment_method VARCHAR(50),
    contract_number VARCHAR(100),
    logistics_company VARCHAR(100),
    tracking_number VARCHAR(100),
    remark TEXT,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻分类表
CREATE TABLE IF NOT EXISTS news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 新闻文章表
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    category_id INTEGER REFERENCES news_categories(id),
    content TEXT NOT NULL,
    summary TEXT,
    cover_image VARCHAR(500),
    images JSONB,
    tags VARCHAR(500),
    author_id INTEGER REFERENCES users(id),
    author_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    is_top BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    publish_time TIMESTAMP,
    seo_title VARCHAR(200),
    seo_keywords VARCHAR(500),
    seo_description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_base_id ON users(base_id);
CREATE INDEX IF NOT EXISTS idx_cattle_ear_tag ON cattle(ear_tag);
CREATE INDEX IF NOT EXISTS idx_cattle_base_id ON cattle(base_id);
CREATE INDEX IF NOT EXISTS idx_cattle_barn_id ON cattle(barn_id);
CREATE INDEX IF NOT EXISTS idx_cattle_health_status ON cattle(health_status);
CREATE INDEX IF NOT EXISTS idx_health_records_cattle_id ON health_records(cattle_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_base_id ON feeding_records(base_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_barn_id ON feeding_records(barn_id);
CREATE INDEX IF NOT EXISTS idx_inventory_material_base ON inventory(material_id, base_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_category_id ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);

-- 添加外键约束
ALTER TABLE bases ADD CONSTRAINT fk_bases_manager FOREIGN KEY (manager_id) REFERENCES users(id);
ALTER TABLE production_materials ADD CONSTRAINT fk_materials_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id);