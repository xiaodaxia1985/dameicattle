-- Development Database Initialization Script
-- Creates additional development-specific data and configurations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create development-specific schemas
CREATE SCHEMA IF NOT EXISTS dev_tools;
CREATE SCHEMA IF NOT EXISTS test_data;

-- Grant permissions to development user
GRANT ALL PRIVILEGES ON SCHEMA dev_tools TO cattle_user;
GRANT ALL PRIVILEGES ON SCHEMA test_data TO cattle_user;

-- Create development logging table
CREATE TABLE IF NOT EXISTS dev_tools.query_log (
    id SERIAL PRIMARY KEY,
    query_text TEXT NOT NULL,
    execution_time INTERVAL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name TEXT DEFAULT CURRENT_USER,
    database_name TEXT DEFAULT CURRENT_DATABASE()
);

-- Create development configuration table
CREATE TABLE IF NOT EXISTS dev_tools.dev_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert development configuration
INSERT INTO dev_tools.dev_config (key, value, description) VALUES
('environment', 'development', 'Current environment'),
('debug_mode', 'true', 'Enable debug logging'),
('mock_data_enabled', 'true', 'Enable mock data generation'),
('api_rate_limit', '1000', 'API rate limit per minute for development'),
('session_timeout', '3600', 'Session timeout in seconds'),
('file_upload_max_size', '10485760', 'Max file upload size in bytes (10MB)'),
('cors_enabled', 'true', 'Enable CORS for development'),
('swagger_enabled', 'true', 'Enable Swagger documentation')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    updated_at = CURRENT_TIMESTAMP;

-- Create function to generate test data
CREATE OR REPLACE FUNCTION test_data.generate_test_cattle(count INTEGER DEFAULT 10)
RETURNS VOID AS $$
DECLARE
    i INTEGER;
    cattle_breeds TEXT[] := ARRAY['安格斯', '西门塔尔', '夏洛莱', '利木赞', '海福特'];
    cattle_genders TEXT[] := ARRAY['公', '母'];
    cattle_statuses TEXT[] := ARRAY['健康', '治疗中', '隔离'];
BEGIN
    -- Only generate if cattle table exists and is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cattle') THEN
        IF NOT EXISTS (SELECT 1 FROM cattle LIMIT 1) THEN
            FOR i IN 1..count LOOP
                INSERT INTO cattle (
                    ear_tag,
                    name,
                    breed,
                    gender,
                    birth_date,
                    weight,
                    health_status,
                    location,
                    notes,
                    created_at,
                    updated_at
                ) VALUES (
                    'DEV' || LPAD(i::TEXT, 4, '0'),
                    '测试牛' || i,
                    cattle_breeds[1 + (i % array_length(cattle_breeds, 1))],
                    cattle_genders[1 + (i % array_length(cattle_genders, 1))],
                    CURRENT_DATE - INTERVAL '1 year' * random(),
                    300 + (random() * 200)::INTEGER,
                    cattle_statuses[1 + (i % array_length(cattle_statuses, 1))],
                    '开发测试区域' || (1 + (i % 5)),
                    '开发环境测试数据',
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                );
            END LOOP;
            
            RAISE NOTICE 'Generated % test cattle records', count;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean test data
CREATE OR REPLACE FUNCTION test_data.clean_test_data()
RETURNS VOID AS $$
BEGIN
    -- Clean test cattle data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cattle') THEN
        DELETE FROM cattle WHERE ear_tag LIKE 'DEV%';
        RAISE NOTICE 'Cleaned test cattle data';
    END IF;
    
    -- Clean other test data as needed
    -- Add more cleanup logic here for other tables
    
    RAISE NOTICE 'Test data cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- Create development views for easier debugging
CREATE OR REPLACE VIEW dev_tools.system_info AS
SELECT 
    'PostgreSQL Version' as info_type,
    version() as info_value
UNION ALL
SELECT 
    'Current Database',
    current_database()
UNION ALL
SELECT 
    'Current User',
    current_user
UNION ALL
SELECT 
    'Current Timestamp',
    current_timestamp::TEXT
UNION ALL
SELECT 
    'Server Encoding',
    pg_encoding_to_char(encoding) 
FROM pg_database 
WHERE datname = current_database();

-- Create development helper functions
CREATE OR REPLACE FUNCTION dev_tools.reset_sequences()
RETURNS VOID AS $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE %I.%I RESTART WITH 1', 
                      seq_record.schemaname, seq_record.sequencename);
    END LOOP;
    
    RAISE NOTICE 'All sequences reset to 1';
END;
$$ LANGUAGE plpgsql;

-- Create development triggers for logging (if needed)
CREATE OR REPLACE FUNCTION dev_tools.log_query()
RETURNS event_trigger AS $$
BEGIN
    -- This is a placeholder for query logging
    -- Can be enhanced to log specific operations
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on development functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA dev_tools TO cattle_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_data TO cattle_user;

-- Create development indexes for better performance during testing
-- These will be created after the main tables are created

-- Log the initialization
INSERT INTO dev_tools.query_log (query_text, execution_time) 
VALUES ('Development database initialized', INTERVAL '0 seconds');

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Development database initialization complete';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Available development tools:';
    RAISE NOTICE '- test_data.generate_test_cattle(count)';
    RAISE NOTICE '- test_data.clean_test_data()';
    RAISE NOTICE '- dev_tools.reset_sequences()';
    RAISE NOTICE '- dev_tools.system_info (view)';
    RAISE NOTICE '===========================================';
END;
$$;