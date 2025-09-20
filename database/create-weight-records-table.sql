-- =====================================================
-- Create Weight Records Table
-- =====================================================

-- Create weight_records table
CREATE TABLE IF NOT EXISTS weight_records (
    id SERIAL PRIMARY KEY,
    cattle_id INTEGER NOT NULL,
    weight DECIMAL(8, 2) NOT NULL CHECK (weight > 0),
    record_date DATE NOT NULL,
    operator_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_weight_records_cattle FOREIGN KEY (cattle_id) REFERENCES cattle(id) ON DELETE CASCADE,
    CONSTRAINT fk_weight_records_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for weight_records table
CREATE INDEX IF NOT EXISTS idx_weight_records_cattle_id ON weight_records(cattle_id);
CREATE INDEX IF NOT EXISTS idx_weight_records_record_date ON weight_records(record_date);
CREATE INDEX IF NOT EXISTS idx_weight_records_operator_id ON weight_records(operator_id);

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER trigger_weight_records_updated_at 
BEFORE UPDATE ON weight_records 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Display creation completion information
DO $$
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Weight Records Table Creation Complete!';
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'Table Name: weight_records';
    RAISE NOTICE 'Creation Time: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '';
    RAISE NOTICE 'This table is used to store weight records for cattle.';
    RAISE NOTICE 'To execute this script, run: psql -U <username> -d <database_name> -f create-weight-records-table.sql';
    RAISE NOTICE '=======================================================';
END;
$$;