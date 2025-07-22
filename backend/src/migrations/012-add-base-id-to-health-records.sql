-- Add base_id field to health_records table for better data organization

ALTER TABLE health_records ADD COLUMN IF NOT EXISTS base_id INTEGER;

-- Add foreign key constraint
ALTER TABLE health_records ADD CONSTRAINT fk_health_records_base 
    FOREIGN KEY (base_id) REFERENCES bases(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_health_records_base ON health_records(base_id);

-- Update existing records to set base_id based on cattle's base_id
UPDATE health_records 
SET base_id = (
    SELECT c.base_id 
    FROM cattle c 
    WHERE c.id = health_records.cattle_id
)
WHERE base_id IS NULL;