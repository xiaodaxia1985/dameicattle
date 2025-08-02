-- 创建各个微服务的数据库
CREATE DATABASE auth_db;
CREATE DATABASE base_db;
CREATE DATABASE cattle_db;
CREATE DATABASE health_db;
CREATE DATABASE feeding_db;
CREATE DATABASE equipment_db;
CREATE DATABASE procurement_db;
CREATE DATABASE sales_db;
CREATE DATABASE material_db;

-- 创建用户并授权（如果需要）
-- CREATE USER microservice_user WITH PASSWORD 'microservice_password';
-- GRANT ALL PRIVILEGES ON DATABASE auth_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE base_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE cattle_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE health_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE feeding_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE equipment_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE procurement_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE sales_db TO microservice_user;
-- GRANT ALL PRIVILEGES ON DATABASE material_db TO microservice_user;