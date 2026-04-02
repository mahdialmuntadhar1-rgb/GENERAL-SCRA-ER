-- Create the iraqi_businesses table in Supabase

CREATE TABLE IF NOT EXISTS iraqi_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core business info
    name TEXT NOT NULL,
    name_en TEXT,
    phone TEXT,
    website TEXT,
    email TEXT,
    
    -- Address & Location
    address TEXT,
    city TEXT NOT NULL,
    governorate TEXT NOT NULL,
    country TEXT DEFAULT 'Iraq',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Classification
    category TEXT,
    subcategory TEXT,
    type TEXT,
    
    -- Social media
    facebook TEXT,
    instagram TEXT,
    
    -- External IDs
    fsq_id TEXT UNIQUE,
    external_id TEXT,
    source TEXT DEFAULT 'osm',
    
    -- Quality & Verification
    data_quality TEXT CHECK (data_quality IN ('real', 'partial', 'osm', 'rejected', 'unknown')) DEFAULT 'osm',
    verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    search_tags TEXT[],
    raw_data JSONB,
    
    -- Constraints
    CONSTRAINT valid_phone_format CHECK (phone IS NULL OR phone ~ '^\\+?[0-9\\s\\-\\(\\)]+$'),
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL OR (latitude >= 29.0 AND latitude <= 38.0)) AND
        (longitude IS NULL OR (longitude >= 38.0 AND longitude <= 49.0))
    )
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_city ON iraqi_businesses(city);
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_governorate ON iraqi_businesses(governorate);
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_category ON iraqi_businesses(category);
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_data_quality ON iraqi_businesses(data_quality);
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_fsq_id ON iraqi_businesses(fsq_id);
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_created_at ON iraqi_businesses(created_at DESC);

-- Full text search index for name
CREATE INDEX IF NOT EXISTS idx_iraqi_businesses_name_search ON iraqi_businesses USING gin(to_tsvector('simple', name));

-- Enable Row Level Security
ALTER TABLE iraqi_businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON iraqi_businesses;
CREATE POLICY "Allow all operations" ON iraqi_businesses
    FOR ALL USING (true) WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_iraqi_businesses_updated_at ON iraqi_businesses;
CREATE TRIGGER update_iraqi_businesses_updated_at
    BEFORE UPDATE ON iraqi_businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for clean data only (excludes rejected records)
CREATE OR REPLACE VIEW iraqi_businesses_clean AS
SELECT * FROM iraqi_businesses
WHERE data_quality != 'rejected';

-- Statistics view
CREATE OR REPLACE VIEW iraqi_businesses_stats AS
SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE data_quality = 'real') as real_count,
    COUNT(*) FILTER (WHERE data_quality = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE data_quality = 'osm') as osm_count,
    COUNT(*) FILTER (WHERE data_quality = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE verified = true) as verified_count,
    COUNT(DISTINCT city) as cities_covered,
    COUNT(DISTINCT governorate) as governorates_covered
FROM iraqi_businesses;

-- Comment on table
COMMENT ON TABLE iraqi_businesses IS 'Iraqi business directory data';
