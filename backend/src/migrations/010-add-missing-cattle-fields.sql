-- Add missing fields to cattle table

-- Add parent relationship fields
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS parent_male_id INTEGER;
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS parent_female_id INTEGER;

-- Add source and purchase information
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'purchased';
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2);
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS supplier_id INTEGER;

-- Add status field
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add notes field
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cattle_parent_male ON cattle(parent_male_id);
CREATE INDEX IF NOT EXISTS idx_cattle_parent_female ON cattle(parent_female_id);
CREATE INDEX IF NOT EXISTS idx_cattle_supplier ON cattle(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cattle_source ON cattle(source);
CREATE INDEX IF NOT EXISTS idx_cattle_status ON cattle(status);