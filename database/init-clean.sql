-- =====================================================
-- Cattle Management System - Clean Database Initialization Script
-- Version: 1.0.3
-- Created: 2025-08-10
-- Description: Create all necessary tables, indexes, constraints and initial data
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create database user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cattle_user') THEN
        CREATE ROLE cattle_user WITH LOGIN PASSWORD 'cattle_password';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE cattle_management TO cattle_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO cattle_user;

-- =====================================================
-- 1. Basic Data Tables
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'base_admin', 'employee')),
    base_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bases table
CREATE TABLE IF NOT EXISTS bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    latitude DECIMAL(10, 8) CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11, 8) CHECK (longitude >= -180 AND longitude <= 180),
    area DECIMAL(10, 2) CHECK (area >= 0),
    manager_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bases_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add foreign key constraint for users.base_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_base' AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL;
    END IF;
END
$$;

-- Barns table
CREATE TABLE IF NOT EXISTS barns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    base_id INTEGER NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000),
    current_count INTEGER NOT NULL DEFAULT 0 CHECK (current_count >= 0),
    barn_type VARCHAR(50) CHECK (barn_type IN ('fattening', 'breeding', 'isolation', 'treatment', 'other')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    description TEXT,
    facilities JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_barns_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT uk_barns_code_base UNIQUE (code, base_id)
);

-- =====================================================
-- 2. Suppliers and Customers Tables
-- =====================================================

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    contact_person VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    business_license VARCHAR(100),
    tax_number VARCHAR(50),
    bank_account VARCHAR(100),
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. Cattle Related Tables
-- =====================================================

-- Cattle table
CREATE TABLE IF NOT EXISTS cattle (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) NOT NULL UNIQUE,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    weight DECIMAL(8, 2) CHECK (weight >= 0 AND weight <= 9999.99),
    health_status VARCHAR(20) NOT NULL DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'sick', 'treatment')),
    base_id INTEGER NOT NULL,
    barn_id INTEGER,
    photos JSONB DEFAULT '[]',
    parent_male_id INTEGER,
    parent_female_id INTEGER,
    source VARCHAR(20) NOT NULL DEFAULT 'purchased' CHECK (source IN ('born', 'purchased', 'transferred')),
    purchase_price DECIMAL(10, 2) CHECK (purchase_price >= 0),
    purchase_date DATE,
    supplier_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'dead', 'transferred')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cattle_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT fk_cattle_barn FOREIGN KEY (barn_id) REFERENCES barns(id) ON DELETE SET NULL,
    CONSTRAINT fk_cattle_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_cattle_parent_male FOREIGN KEY (parent_male_id) REFERENCES cattle(id) ON DELETE SET NULL,
    CONSTRAINT fk_cattle_parent_female FOREIGN KEY (parent_female_id) REFERENCES cattle(id) ON DELETE SET NULL
);

-- Cattle events table
CREATE TABLE IF NOT EXISTS cattle_events (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'birth', 'born', 'purchase', 'purchased', 'transfer_in', 'transfer_out', 'transferred',
        'weight_record', 'health_check', 'vaccination', 'treatment', 'breeding', 'pregnancy_check',
        'calving', 'weaning', 'sale', 'sold', 'death', 'dead', 'deleted', 'other'
    )),
    event_date DATE NOT NULL,
    description TEXT,
    data JSONB DEFAULT '{}',
    operator_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cattle_events_cattle FOREIGN KEY (cattle_id) REFERENCES cattle(id) ON DELETE CASCADE,
    CONSTRAINT fk_cattle_events_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. Health Management Tables
-- =====================================================

-- Health records table
CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    base_id INTEGER,
    symptoms TEXT,
    diagnosis TEXT,
    treatment TEXT,
    veterinarian_id INTEGER,
    diagnosis_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_records_cattle FOREIGN KEY (cattle_id) REFERENCES cattle(id) ON DELETE CASCADE,
    CONSTRAINT fk_health_records_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE SET NULL,
    CONSTRAINT fk_health_records_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Vaccination records table
CREATE TABLE IF NOT EXISTS vaccination_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    vaccine_name VARCHAR(100) NOT NULL,
    vaccination_date DATE NOT NULL,
    veterinarian_id INTEGER,
    batch_number VARCHAR(50),
    next_vaccination_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vaccination_records_cattle FOREIGN KEY (cattle_id) REFERENCES cattle(id) ON DELETE CASCADE,
    CONSTRAINT fk_vaccination_records_veterinarian FOREIGN KEY (veterinarian_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 5. Feeding Management Tables
-- =====================================================

-- Feed formulas table
CREATE TABLE IF NOT EXISTS feed_formulas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ingredients JSONB NOT NULL DEFAULT '{}',
    cost_per_kg DECIMAL(10, 2),
    ingredients_version INTEGER NOT NULL DEFAULT 2,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feed_formulas_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Feeding records table
CREATE TABLE IF NOT EXISTS feeding_records (
    id SERIAL PRIMARY KEY,
    formula_id INTEGER,
    base_id INTEGER NOT NULL,
    barn_id INTEGER,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    feeding_date DATE NOT NULL,
    operator_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_feeding_records_formula FOREIGN KEY (formula_id) REFERENCES feed_formulas(id) ON DELETE SET NULL,
    CONSTRAINT fk_feeding_records_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT fk_feeding_records_barn FOREIGN KEY (barn_id) REFERENCES barns(id) ON DELETE SET NULL,
    CONSTRAINT fk_feeding_records_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 6. Material Management Tables
-- =====================================================

-- Material categories table
CREATE TABLE IF NOT EXISTS material_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_material_categories_parent FOREIGN KEY (parent_id) REFERENCES material_categories(id) ON DELETE SET NULL
);

-- Production materials table
CREATE TABLE IF NOT EXISTS production_materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    category_id INTEGER,
    unit VARCHAR(20) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_production_materials_category FOREIGN KEY (category_id) REFERENCES material_categories(id) ON DELETE SET NULL
);

-- Inventories table
CREATE TABLE IF NOT EXISTS inventories (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_stock DECIMAL(10, 2),
    unit_price DECIMAL(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventories_material FOREIGN KEY (material_id) REFERENCES production_materials(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventories_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT uk_inventories_material_base UNIQUE (material_id, base_id)
);

-- Inventory transactions table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjust', 'transfer')),
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    reference_type VARCHAR(50),
    reference_id INTEGER,
    operator_id INTEGER,
    notes TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_transactions_inventory FOREIGN KEY (inventory_id) REFERENCES inventories(id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_transactions_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 7. Purchase Management Tables
-- =====================================================

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    base_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'executing', 'completed', 'cancelled')),
    notes TEXT,
    created_by INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_orders_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_orders_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_orders_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_purchase_orders_approver FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('cattle', 'material')),
    item_id INTEGER,
    ear_tag VARCHAR(50),
    breed VARCHAR(100),
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    received_quantity DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_purchase_order_items_order FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- =====================================================
-- 8. Sales Management Tables
-- =====================================================

-- Drop existing sales tables if they exist
DROP TABLE IF EXISTS customer_visit_records CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Customers table (Updated from sales-service migrations)
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    customer_type VARCHAR(20) DEFAULT 'company' CHECK (customer_type IN ('individual', 'company', 'distributor', 'restaurant')),
    business_license VARCHAR(255),
    tax_number VARCHAR(255),
    bank_account VARCHAR(255),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_rating INTEGER DEFAULT 5 CHECK (credit_rating >= 1 AND credit_rating <= 10),
    payment_terms VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    remark TEXT,
    created_by VARCHAR(50) NOT NULL,
    created_by_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales orders table (Updated from sales-service migrations)
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    base_id INTEGER NOT NULL,
    base_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    payment_method VARCHAR(100),
    order_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    actual_delivery_date TIMESTAMP WITH TIME ZONE,
    contract_number VARCHAR(100),
    logistics_company VARCHAR(255),
    tracking_number VARCHAR(100),
    remark TEXT,
    created_by VARCHAR(50) NOT NULL,
    created_by_name VARCHAR(100) NOT NULL,
    approved_by VARCHAR(50),
    approved_by_name VARCHAR(100),
    approved_at TIMESTAMP WITH TIME ZONE,
    delivered_by VARCHAR(50),
    delivered_by_name VARCHAR(100),
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_note TEXT,
    paid_by VARCHAR(50),
    paid_by_name VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    payment_note TEXT,
    completed_by VARCHAR(50),
    completed_by_name VARCHAR(100),
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_note TEXT,
    cancelled_by VARCHAR(50),
    cancelled_by_name VARCHAR(100),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales order items table (Updated from sales-service migrations)
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    cattle_id INTEGER NOT NULL,
    ear_tag VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    weight DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    quality_grade VARCHAR(50),
    health_certificate VARCHAR(255),
    quarantine_certificate VARCHAR(255),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'received')),
    remark TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer visit records table (Added from sales-service migrations)
CREATE TABLE customer_visit_records (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    visit_type VARCHAR(20) DEFAULT 'phone' CHECK (visit_type IN ('phone', 'visit', 'mail', 'video', 'wechat', 'other')),
    visitor_id VARCHAR(50) NOT NULL,
    visitor_name VARCHAR(100) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    result TEXT,
    next_visit_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. News Management Tables
-- =====================================================

-- News categories table
CREATE TABLE IF NOT EXISTS news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- News articles table
CREATE TABLE IF NOT EXISTS news_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    category_id INTEGER,
    author_id INTEGER,
    cover_image VARCHAR(500),
    images JSONB DEFAULT '[]',
    tags VARCHAR(500),
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_news_articles_category FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_news_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 10. System Management Tables
-- =====================================================

-- Operation logs table
CREATE TABLE IF NOT EXISTS operation_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_operation_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System configs table
CREATE TABLE IF NOT EXISTS system_configs (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    config_type VARCHAR(20) DEFAULT 'string' CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id SERIAL PRIMARY KEY,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    file_hash VARCHAR(64),
    upload_type VARCHAR(50),
    related_id INTEGER,
    uploaded_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_file_uploads_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 11. Extended Function Tables
-- =====================================================

-- Patrol records table
CREATE TABLE IF NOT EXISTS patrol_records (
    id SERIAL PRIMARY KEY,
    base_id INTEGER NOT NULL,
    barn_id INTEGER NOT NULL,
    patrol_date DATE NOT NULL,
    patrol_time TIME NOT NULL,
    patrol_type VARCHAR(20) NOT NULL CHECK (patrol_type IN ('before_feeding', 'after_feeding', 'routine')),
    total_cattle_count INTEGER NOT NULL DEFAULT 0,
    standing_cattle_count INTEGER DEFAULT 0,
    lying_cattle_count INTEGER DEFAULT 0,
    lying_rate DECIMAL(5,2) DEFAULT 0,
    abnormal_cattle_count INTEGER DEFAULT 0,
    abnormal_cattle_description TEXT,
    feed_trough_clean BOOLEAN DEFAULT TRUE,
    feed_trough_notes TEXT,
    water_trough_clean BOOLEAN DEFAULT TRUE,
    water_trough_notes TEXT,
    temperature DECIMAL(4,1),
    humidity DECIMAL(5,2),
    environment_notes TEXT,
    iot_device_id VARCHAR(100),
    iot_data_source VARCHAR(50) DEFAULT 'manual' CHECK (iot_data_source IN ('manual', 'iot_sensor', 'api')),
    patrol_person_id INTEGER,
    patrol_person_name VARCHAR(100),
    overall_notes TEXT,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patrol_records_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT fk_patrol_records_barn FOREIGN KEY (barn_id) REFERENCES barns(id) ON DELETE CASCADE,
    CONSTRAINT fk_patrol_records_person FOREIGN KEY (patrol_person_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_patrol_records_unique UNIQUE(base_id, barn_id, patrol_date, patrol_time, patrol_type)
);

-- IoT devices table
CREATE TABLE IF NOT EXISTS iot_devices (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    base_id INTEGER,
    barn_id INTEGER,
    api_endpoint VARCHAR(500),
    api_key VARCHAR(200),
    device_config JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    last_data_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_iot_devices_base FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
    CONSTRAINT fk_iot_devices_barn FOREIGN KEY (barn_id) REFERENCES barns(id) ON DELETE CASCADE
);

-- =====================================================
-- 12. Create Indexes
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_base_id ON users(base_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Bases table indexes
CREATE INDEX IF NOT EXISTS idx_bases_code ON bases(code);
CREATE INDEX IF NOT EXISTS idx_bases_manager_id ON bases(manager_id);

-- Barns table indexes
CREATE INDEX IF NOT EXISTS idx_barns_base_id ON barns(base_id);
CREATE INDEX IF NOT EXISTS idx_barns_code_base ON barns(code, base_id);

-- Cattle table indexes
CREATE INDEX IF NOT EXISTS idx_cattle_ear_tag ON cattle(ear_tag);
CREATE INDEX IF NOT EXISTS idx_cattle_base_id ON cattle(base_id);
CREATE INDEX IF NOT EXISTS idx_cattle_barn_id ON cattle(barn_id);
CREATE INDEX IF NOT EXISTS idx_cattle_health_status ON cattle(health_status);
CREATE INDEX IF NOT EXISTS idx_cattle_status ON cattle(status);
CREATE INDEX IF NOT EXISTS idx_cattle_breed ON cattle(breed);
CREATE INDEX IF NOT EXISTS idx_cattle_supplier_id ON cattle(supplier_id);

-- Cattle events table indexes
CREATE INDEX IF NOT EXISTS idx_cattle_events_cattle_id ON cattle_events(cattle_id);
CREATE INDEX IF NOT EXISTS idx_cattle_events_event_type ON cattle_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cattle_events_event_date ON cattle_events(event_date);
CREATE INDEX IF NOT EXISTS idx_cattle_events_operator_id ON cattle_events(operator_id);

-- Health records table indexes
CREATE INDEX IF NOT EXISTS idx_health_records_cattle_id ON health_records(cattle_id);
CREATE INDEX IF NOT EXISTS idx_health_records_base_id ON health_records(base_id);
CREATE INDEX IF NOT EXISTS idx_health_records_diagnosis_date ON health_records(diagnosis_date);
CREATE INDEX IF NOT EXISTS idx_health_records_status ON health_records(status);
CREATE INDEX IF NOT EXISTS idx_health_records_veterinarian_id ON health_records(veterinarian_id);

-- Vaccination records table indexes
CREATE INDEX IF NOT EXISTS idx_vaccination_records_cattle_id ON vaccination_records(cattle_id);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_vaccination_date ON vaccination_records(vaccination_date);
CREATE INDEX IF NOT EXISTS idx_vaccination_records_vaccine_name ON vaccination_records(vaccine_name);

-- Feeding records table indexes
CREATE INDEX IF NOT EXISTS idx_feeding_records_base_id ON feeding_records(base_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_barn_id ON feeding_records(barn_id);
CREATE INDEX IF NOT EXISTS idx_feeding_records_feeding_date ON feeding_records(feeding_date);
CREATE INDEX IF NOT EXISTS idx_feeding_records_formula_id ON feeding_records(formula_id);

-- Inventories table indexes
CREATE INDEX IF NOT EXISTS idx_inventories_material_id ON inventories(material_id);
CREATE INDEX IF NOT EXISTS idx_inventories_base_id ON inventories(base_id);

-- Inventory transactions table indexes (skip for now due to field name issues)

-- Purchase orders table indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_base_id ON purchase_orders(base_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Sales orders table indexes (Updated for sales-service migrations)
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_number ON sales_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_base_id ON sales_orders(base_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment_status ON sales_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_created_at ON sales_orders(created_at);

-- Sales order items table indexes (Added for sales-service migrations)
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON sales_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_cattle_id ON sales_order_items(cattle_id);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_ear_tag ON sales_order_items(ear_tag);

-- Customers table indexes (Updated for sales-service migrations)
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Customer visit records table indexes (Added for sales-service migrations)
CREATE INDEX IF NOT EXISTS idx_customer_visit_records_customer_id ON customer_visit_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_visit_records_visit_date ON customer_visit_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_customer_visit_records_visitor_id ON customer_visit_records(visitor_id);

-- News articles table indexes
CREATE INDEX IF NOT EXISTS idx_news_articles_category_id ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_author_id ON news_articles(author_id);

-- Operation logs table indexes
CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_module ON operation_logs(module);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- Patrol records table indexes
CREATE INDEX IF NOT EXISTS idx_patrol_records_base_barn ON patrol_records(base_id, barn_id);
CREATE INDEX IF NOT EXISTS idx_patrol_records_date ON patrol_records(patrol_date);
CREATE INDEX IF NOT EXISTS idx_patrol_records_type ON patrol_records(patrol_type);
CREATE INDEX IF NOT EXISTS idx_patrol_records_person ON patrol_records(patrol_person_id);

-- IoT devices table indexes
CREATE INDEX IF NOT EXISTS idx_iot_devices_device_id ON iot_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_base_id ON iot_devices(base_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_barn_id ON iot_devices(barn_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);

-- =====================================================
-- 13. Create Triggers and Functions
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at field
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_bases_updated_at ON bases;
CREATE TRIGGER trigger_bases_updated_at BEFORE UPDATE ON bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_barns_updated_at ON barns;
CREATE TRIGGER trigger_barns_updated_at BEFORE UPDATE ON barns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_suppliers_updated_at ON suppliers;
CREATE TRIGGER trigger_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_customers_updated_at ON customers;
CREATE TRIGGER trigger_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cattle_updated_at ON cattle;
CREATE TRIGGER trigger_cattle_updated_at BEFORE UPDATE ON cattle FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cattle_events_updated_at ON cattle_events;
CREATE TRIGGER trigger_cattle_events_updated_at BEFORE UPDATE ON cattle_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_health_records_updated_at ON health_records;
CREATE TRIGGER trigger_health_records_updated_at BEFORE UPDATE ON health_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_vaccination_records_updated_at ON vaccination_records;
CREATE TRIGGER trigger_vaccination_records_updated_at BEFORE UPDATE ON vaccination_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_feed_formulas_updated_at ON feed_formulas;
CREATE TRIGGER trigger_feed_formulas_updated_at BEFORE UPDATE ON feed_formulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_material_categories_updated_at ON material_categories;
CREATE TRIGGER trigger_material_categories_updated_at BEFORE UPDATE ON material_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_production_materials_updated_at ON production_materials;
CREATE TRIGGER trigger_production_materials_updated_at BEFORE UPDATE ON production_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_inventories_updated_at ON inventories;
CREATE TRIGGER trigger_inventories_updated_at BEFORE UPDATE ON inventories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER trigger_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_purchase_order_items_updated_at ON purchase_order_items;
CREATE TRIGGER trigger_purchase_order_items_updated_at BEFORE UPDATE ON purchase_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_sales_orders_updated_at ON sales_orders;
CREATE TRIGGER trigger_sales_orders_updated_at BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_sales_order_items_updated_at ON sales_order_items;
CREATE TRIGGER trigger_sales_order_items_updated_at BEFORE UPDATE ON sales_order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_news_categories_updated_at ON news_categories;
CREATE TRIGGER trigger_news_categories_updated_at BEFORE UPDATE ON news_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_news_articles_updated_at ON news_articles;
CREATE TRIGGER trigger_news_articles_updated_at BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_system_configs_updated_at ON system_configs;
CREATE TRIGGER trigger_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_patrol_records_updated_at ON patrol_records;
CREATE TRIGGER trigger_patrol_records_updated_at BEFORE UPDATE ON patrol_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_iot_devices_updated_at ON iot_devices;
CREATE TRIGGER trigger_iot_devices_updated_at BEFORE UPDATE ON iot_devices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Barn current count update trigger
CREATE OR REPLACE FUNCTION update_barn_current_count()
RETURNS TRIGGER AS $$
BEGIN
    -- When cattle enters barn
    IF TG_OP = 'INSERT' AND NEW.barn_id IS NOT NULL THEN
        UPDATE barns SET current_count = current_count + 1 WHERE id = NEW.barn_id;
    END IF;
    
    -- When cattle leaves barn
    IF TG_OP = 'DELETE' AND OLD.barn_id IS NOT NULL THEN
        UPDATE barns SET current_count = current_count - 1 WHERE id = OLD.barn_id;
    END IF;
    
    -- When cattle transfers between barns
    IF TG_OP = 'UPDATE' THEN
        IF OLD.barn_id IS NOT NULL AND NEW.barn_id IS NULL THEN
            -- Leave barn
            UPDATE barns SET current_count = current_count - 1 WHERE id = OLD.barn_id;
        ELSIF OLD.barn_id IS NULL AND NEW.barn_id IS NOT NULL THEN
            -- Enter barn
            UPDATE barns SET current_count = current_count + 1 WHERE id = NEW.barn_id;
        ELSIF OLD.barn_id IS NOT NULL AND NEW.barn_id IS NOT NULL AND OLD.barn_id != NEW.barn_id THEN
            -- Transfer between barns
            UPDATE barns SET current_count = current_count - 1 WHERE id = OLD.barn_id;
            UPDATE barns SET current_count = current_count + 1 WHERE id = NEW.barn_id;
        END IF;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cattle_barn_count ON cattle;
CREATE TRIGGER trigger_cattle_barn_count 
    AFTER INSERT OR UPDATE OR DELETE ON cattle 
    FOR EACH ROW EXECUTE FUNCTION update_barn_current_count();

-- =====================================================
-- 14. Insert Initial Data
-- =====================================================

-- Insert system configurations
INSERT INTO system_configs (config_key, config_value, description, config_type, is_public) VALUES
('system_name', 'Cattle Management System', 'System name', 'string', true),
('system_version', '1.0.3', 'System version', 'string', true),
('company_name', 'Cattle Farm Co., Ltd.', 'Company name', 'string', true),
('max_file_size', '10485760', 'Maximum file upload size in bytes', 'number', false),
('session_timeout', '3600', 'Session timeout in seconds', 'number', false),
('password_min_length', '6', 'Minimum password length', 'number', false),
('backup_retention_days', '30', 'Backup retention days', 'number', false)
ON CONFLICT (config_key) DO UPDATE SET 
    config_value = EXCLUDED.config_value,
    updated_at = CURRENT_TIMESTAMP;

-- Insert default admin user
INSERT INTO users (username, real_name, password_hash, role, status, created_at, updated_at) VALUES
('admin', 'System Administrator', '$2b$10$rQZ8kHWKtGKVQZ8kHWKtGOyQZ8kHWKtGKVQZ8kHWKtGKVQZ8kHWKtG', 'super_admin', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 15. Create Views
-- =====================================================

-- Drop existing views first (with CASCADE to handle dependencies)
DROP VIEW IF EXISTS v_cattle_statistics CASCADE;
DROP VIEW IF EXISTS v_base_overview CASCADE;
DROP VIEW IF EXISTS v_health_statistics CASCADE;
DROP VIEW IF EXISTS v_inventory_alerts CASCADE;

-- Also drop any dependent rules or triggers that might reference these views
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
CREATE OR REPLACE VIEW v_base_overview AS
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

-- =====================================================
-- 16. Grant Permissions
-- =====================================================

-- Grant cattle_user permissions on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cattle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cattle_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO cattle_user;

-- Grant view permissions
GRANT SELECT ON v_cattle_statistics TO cattle_user;
GRANT SELECT ON v_base_overview TO cattle_user;
GRANT SELECT ON v_health_statistics TO cattle_user;
GRANT SELECT ON v_inventory_alerts TO cattle_user;

-- =====================================================
-- 17. Completion Information
-- =====================================================

-- Display initialization completion information
DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Cattle Management System Database Initialization Complete!';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Database Version: 1.0.3';
    RAISE NOTICE 'Creation Time: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '';
    RAISE NOTICE 'Created Tables: %', (
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    );
    RAISE NOTICE 'Created Views: %', (
        SELECT COUNT(*) FROM information_schema.views 
        WHERE table_schema = 'public'
    );
    RAISE NOTICE 'Created Indexes: %', (
        SELECT COUNT(*) FROM pg_indexes 
        WHERE schemaname = 'public'
    );
    RAISE NOTICE '';
    RAISE NOTICE 'Default Admin Account:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123 (please change immediately)';
    RAISE NOTICE '';
    RAISE NOTICE 'Database User: cattle_user';
    RAISE NOTICE '=======================================================';
END;
$$;