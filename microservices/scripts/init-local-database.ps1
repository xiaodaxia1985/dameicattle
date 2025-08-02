# Initialize local PostgreSQL database

Write-Host "Initializing local PostgreSQL database..." -ForegroundColor Green

# Database connection parameters
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_USER = "postgres"
$DB_PASSWORD = "dianxin99"

# Set password environment variable
$env:PGPASSWORD = $DB_PASSWORD

Write-Host "Creating databases..." -ForegroundColor Yellow

# Create databases
$databases = @(
    "auth_db",
    "base_db", 
    "cattle_db",
    "health_db",
    "feeding_db",
    "equipment_db",
    "procurement_db",
    "sales_db",
    "material_db"
)

foreach ($db in $databases) {
    Write-Host "Creating database $db..." -NoNewline
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $db;" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host " ✅ Created" -ForegroundColor Green
    } else {
        Write-Host " ⚠️ Already exists or error" -ForegroundColor Yellow
    }
}

Write-Host "Creating auth user table and seeding data..." -ForegroundColor Yellow

# Create auth tables and seed data
$authSql = @"
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role, "isActive", "createdAt", "updatedAt") 
VALUES (
  'admin',
  'admin@cattle-management.com',
  '\$2a\$12\$PtRlhVprejN61LqMTgh.IeqXuP2VbNXMDzezW/sKKmmb9eWiZ7OpG',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;

-- Insert test manager user (password: manager123)
INSERT INTO users (username, email, password, role, "isActive", "createdAt", "updatedAt") 
VALUES (
  'manager',
  'manager@cattle-management.com',
  '\$2a\$12\$D88YULXCEukiN/l5NvrkGOEjjMFPIoIqGHKqSuZj9NNnnUU9vseiW',
  'manager',
  true,
  NOW(),
  NOW()
) ON CONFLICT (username) DO NOTHING;
"@

$authSql | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d auth_db

Write-Host "Creating basic table structures..." -ForegroundColor Yellow

# Create basic tables for each service
$tableSql = @"
-- Base service tables
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

-- Cattle service tables
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

-- Health service tables
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

-- Feeding service tables
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

-- Equipment service tables
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

-- Procurement service tables
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

-- Sales service tables
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

-- Material service tables
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
"@

$tableSql | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres

Write-Host "Database initialization completed!" -ForegroundColor Green
Write-Host "Default admin user: admin / admin123" -ForegroundColor Cyan
Write-Host "Default manager user: manager / manager123" -ForegroundColor Cyan