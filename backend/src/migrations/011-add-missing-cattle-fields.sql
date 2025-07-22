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

-- Add foreign key constraints
ALTER TABLE cattle ADD CONSTRAINT IF NOT EXISTS fk_cattle_parent_male 
    FOREIGN KEY (parent_male_id) REFERENCES cattle(id);

ALTER TABLE cattle ADD CONSTRAINT IF NOT EXISTS fk_cattle_parent_female 
    FOREIGN KEY (parent_female_id) REFERENCES cattle(id);

ALTER TABLE cattle ADD CONSTRAINT IF NOT EXISTS fk_cattle_supplier 
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id);

-- Add check constraints
ALTER TABLE cattle ADD CONSTRAINT IF NOT EXISTS cattle_source_check 
    CHECK (source IN ('born', 'purchased', 'transferred'));

ALTER TABLE cattle ADD CONSTRAINT IF NOT EXISTS cattle_status_check 
    CHECK (status IN ('active', 'sold', 'dead', 'transferred'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cattle_parent_male ON cattle(parent_male_id);
CREATE INDEX IF NOT EXISTS idx_cattle_parent_female ON cattle(parent_female_id);
CREATE INDEX IF NOT EXISTS idx_cattle_supplier ON cattle(supplier_id);
CREATE INDEX IF NOT EXISTS idx_cattle_source ON cattle(source);
CREATE INDEX IF NOT EXISTS idx_cattle_status ON cattle(status);