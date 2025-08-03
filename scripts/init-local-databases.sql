-- 肉牛管理系统微服务数据库初始化脚本
-- 在本地PostgreSQL中创建所需的数据库

-- 创建各个微服务的数据库
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS base_db;
CREATE DATABASE IF NOT EXISTS cattle_db;
CREATE DATABASE IF NOT EXISTS health_db;
CREATE DATABASE IF NOT EXISTS feeding_db;
CREATE DATABASE IF NOT EXISTS equipment_db;
CREATE DATABASE IF NOT EXISTS procurement_db;
CREATE DATABASE IF NOT EXISTS sales_db;
CREATE DATABASE IF NOT EXISTS material_db;
CREATE DATABASE IF NOT EXISTS news_db;

-- 创建用户（如果需要）
-- CREATE USER cattle_user WITH PASSWORD 'dianxin99';

-- 授权（如果需要）
-- GRANT ALL PRIVILEGES ON DATABASE auth_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE base_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE cattle_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE health_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE feeding_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE equipment_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE procurement_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE sales_db TO cattle_user;
-- GRANT ALL PRIVILEGES ON DATABASE material_db TO cattle_user;

-- 显示创建的数据库
\l