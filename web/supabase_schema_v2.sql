-- ============================================================
-- IRAQ COMPASS v2 — 3-Layer Pipeline Schema
-- Layer 1: businesses_import_raw   (raw scraped data)
-- Layer 2: businesses_staging      (cleaned + normalized)
-- Layer 3: iraqi_businesses        (production, verified)
-- + businesses_review_queue        (conflicts & uncertain matches)
-- ============================================================

-- ============================================================
-- LAYER 1: RAW IMPORT TABLE
-- Every scrape batch lands here first, untouched
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_import_raw (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source tracking
    batch_id TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'osm',
    source_id TEXT,
    source_confidence INTEGER DEFAULT 50,  -- 0-100
    
    -- Raw business data (as scraped)
    business_name TEXT,
    business_name_en TEXT,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    governorate TEXT,
    country TEXT DEFAULT 'Iraq',
    category TEXT,
    subcategory TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Social
    facebook TEXT,
    instagram TEXT,
    maps_url TEXT,
    
    -- Raw metadata
    raw_data JSONB,
    
    -- Timestamps
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_batch ON businesses_import_raw(batch_id);
CREATE INDEX IF NOT EXISTS idx_raw_source ON businesses_import_raw(source);
CREATE INDEX IF NOT EXISTS idx_raw_created ON businesses_import_raw(created_at DESC);

ALTER TABLE businesses_import_raw ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all raw" ON businesses_import_raw;
CREATE POLICY "Allow all raw" ON businesses_import_raw FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- LAYER 2: STAGING TABLE
-- Cleaned, normalized, with dedupe keys and match status
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_id UUID REFERENCES businesses_import_raw(id),
    batch_id TEXT NOT NULL,
    
    -- Cleaned business data
    business_name TEXT NOT NULL,
    business_name_en TEXT,
    normalized_name TEXT,           -- lowercase, trimmed, diacritics removed
    phone TEXT,
    normalized_phone TEXT,          -- +964XXXXXXXXXX format
    whatsapp TEXT,
    email TEXT,
    website TEXT,
    normalized_website TEXT,        -- lowercase, no trailing slash
    address TEXT,
    normalized_address TEXT,
    city TEXT,
    governorate TEXT,
    country TEXT DEFAULT 'Iraq',
    category TEXT,
    subcategory TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Social
    facebook TEXT,
    normalized_facebook TEXT,       -- just the handle/page
    instagram TEXT,
    normalized_instagram TEXT,      -- just the handle
    maps_url TEXT,
    
    -- Dedup & matching
    dedupe_key TEXT,                -- primary fingerprint
    completeness_score INTEGER DEFAULT 0,  -- 0-100
    source TEXT NOT NULL DEFAULT 'osm',
    source_confidence INTEGER DEFAULT 50,
    
    -- Match results (filled by matching engine)
    match_status TEXT CHECK (match_status IN ('pending', 'new', 'update', 'duplicate', 'review', 'reject')) DEFAULT 'pending',
    matched_business_id UUID,       -- points to iraqi_businesses.id if matched
    match_confidence INTEGER DEFAULT 0,  -- 0-100
    match_reason TEXT,              -- why it matched
    
    -- Raw metadata
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_staging_batch ON businesses_staging(batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_status ON businesses_staging(match_status);
CREATE INDEX IF NOT EXISTS idx_staging_dedupe ON businesses_staging(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_staging_phone ON businesses_staging(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_staging_name ON businesses_staging(normalized_name);
CREATE INDEX IF NOT EXISTS idx_staging_matched ON businesses_staging(matched_business_id);

ALTER TABLE businesses_staging ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all staging" ON businesses_staging;
CREATE POLICY "Allow all staging" ON businesses_staging FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- REVIEW QUEUE
-- Conflicts, uncertain matches, and flagged records
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staging_id UUID REFERENCES businesses_staging(id),
    existing_business_id UUID,      -- the potential match in production
    
    -- The new data
    new_data JSONB NOT NULL,
    -- The existing data (snapshot)
    existing_data JSONB,
    
    -- Match info
    match_type TEXT CHECK (match_type IN ('strong', 'medium', 'weak', 'conflict', 'new_low_quality')),
    match_confidence INTEGER DEFAULT 0,
    match_reason TEXT,
    
    -- Fields that conflict
    conflicting_fields TEXT[],
    
    -- Resolution
    resolution TEXT CHECK (resolution IN ('pending', 'merge', 'insert_new', 'skip', 'reject')) DEFAULT 'pending',
    resolved_by TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_resolution ON businesses_review_queue(resolution);
CREATE INDEX IF NOT EXISTS idx_review_match ON businesses_review_queue(match_type);
CREATE INDEX IF NOT EXISTS idx_review_existing ON businesses_review_queue(existing_business_id);

ALTER TABLE businesses_review_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all review" ON businesses_review_queue;
CREATE POLICY "Allow all review" ON businesses_review_queue FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- LAYER 3: UPDATE PRODUCTION TABLE
-- Add new columns to existing iraqi_businesses
-- ============================================================
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS normalized_name TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS normalized_phone TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS normalized_address TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS normalized_website TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS normalized_facebook TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS normalized_instagram TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS maps_url TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS dedupe_key TEXT;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS completeness_score INTEGER DEFAULT 0;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS source_confidence INTEGER DEFAULT 50;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE iraqi_businesses ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE;

-- Partial unique indexes: prevent obvious duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_phone 
    ON iraqi_businesses(normalized_phone) 
    WHERE normalized_phone IS NOT NULL AND normalized_phone != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_website 
    ON iraqi_businesses(normalized_website) 
    WHERE normalized_website IS NOT NULL AND normalized_website != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_instagram 
    ON iraqi_businesses(normalized_instagram) 
    WHERE normalized_instagram IS NOT NULL AND normalized_instagram != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_facebook 
    ON iraqi_businesses(normalized_facebook) 
    WHERE normalized_facebook IS NOT NULL AND normalized_facebook != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_uniq_dedupe 
    ON iraqi_businesses(dedupe_key) 
    WHERE dedupe_key IS NOT NULL AND dedupe_key != '';

-- Additional indexes for matching
CREATE INDEX IF NOT EXISTS idx_biz_norm_phone ON iraqi_businesses(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_biz_norm_name ON iraqi_businesses(normalized_name);
CREATE INDEX IF NOT EXISTS idx_biz_norm_website ON iraqi_businesses(normalized_website);
CREATE INDEX IF NOT EXISTS idx_biz_dedupe ON iraqi_businesses(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_biz_active ON iraqi_businesses(is_active);

-- ============================================================
-- VIEWS
-- ============================================================

-- Pipeline overview
CREATE OR REPLACE VIEW pipeline_stats AS
SELECT 
    (SELECT COUNT(*) FROM businesses_import_raw) as raw_count,
    (SELECT COUNT(*) FROM businesses_staging WHERE match_status = 'pending') as staging_pending,
    (SELECT COUNT(*) FROM businesses_staging WHERE match_status = 'new') as staging_new,
    (SELECT COUNT(*) FROM businesses_staging WHERE match_status = 'update') as staging_update,
    (SELECT COUNT(*) FROM businesses_staging WHERE match_status = 'duplicate') as staging_duplicate,
    (SELECT COUNT(*) FROM businesses_staging WHERE match_status = 'review') as staging_review,
    (SELECT COUNT(*) FROM businesses_review_queue WHERE resolution = 'pending') as review_pending,
    (SELECT COUNT(*) FROM iraqi_businesses WHERE is_active = true) as production_active,
    (SELECT COUNT(*) FROM iraqi_businesses) as production_total,
    (SELECT AVG(completeness_score) FROM iraqi_businesses WHERE is_active = true) as avg_completeness;

-- Updated business stats
CREATE OR REPLACE VIEW iraqi_businesses_stats AS
SELECT 
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE data_quality = 'real') as real_count,
    COUNT(*) FILTER (WHERE data_quality = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE data_quality = 'osm') as osm_count,
    COUNT(*) FILTER (WHERE data_quality = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE verified = true) as verified_count,
    COUNT(DISTINCT city) as cities_covered,
    COUNT(DISTINCT governorate) as governorates_covered,
    COUNT(*) FILTER (WHERE normalized_phone IS NOT NULL) as with_phone,
    COUNT(*) FILTER (WHERE website IS NOT NULL) as with_website,
    COUNT(*) FILTER (WHERE facebook IS NOT NULL OR instagram IS NOT NULL) as with_social,
    ROUND(AVG(completeness_score)) as avg_completeness
FROM iraqi_businesses
WHERE is_active = true;
