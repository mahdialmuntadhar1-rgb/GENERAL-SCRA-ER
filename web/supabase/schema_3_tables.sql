-- ============================================================
-- 3-Table Schema for Scraper Workflow
-- businesses_staging: Raw data awaiting review/AI cleaning
-- businesses_complete: Validated businesses with phone numbers
-- businesses_incomplete: Real businesses missing phone numbers
-- ============================================================

-- Drop existing tables if needed (be careful in production!)
-- DROP TABLE IF EXISTS businesses_review_queue;
-- DROP TABLE IF EXISTS businesses_staging;
-- DROP TABLE IF EXISTS businesses_incomplete;
-- DROP TABLE IF EXISTS businesses_complete;

-- ============================================================
-- TABLE 1: STAGING
-- Raw scraped data awaiting review and AI cleaning
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source tracking
  batch_id TEXT,
  source TEXT NOT NULL DEFAULT 'osm',
  source_id TEXT,
  source_confidence INTEGER DEFAULT 50,
  
  -- Raw data (as scraped)
  business_name TEXT,
  business_name_en TEXT,
  business_name_ar TEXT,
  category TEXT,
  subcategory TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  governorate TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact (may be null for incomplete records)
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  
  -- Social media
  facebook TEXT,
  instagram TEXT,
  maps_url TEXT,
  
  -- Enrichment data
  scraped_photo_url TEXT,
  opening_hours JSONB,
  rating DECIMAL(2, 1),
  review_count INTEGER,
  
  -- Processing status
  _status TEXT DEFAULT 'needs_review', -- 'needs_review', 'validated', 'rejected'
  _phone_valid BOOLEAN DEFAULT FALSE,
  _enrichment_data JSONB,
  
  -- Normalized fields (for matching)
  normalized_phone TEXT,
  normalized_website TEXT,
  normalized_name TEXT,
  dedupe_key TEXT,
  completeness_score INTEGER DEFAULT 0,
  
  -- Match results
  match_status TEXT DEFAULT 'pending', -- 'pending', 'new', 'update', 'duplicate', 'review', 'reject'
  match_confidence INTEGER,
  match_reason TEXT,
  matched_business_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  
  -- Raw data backup
  raw_data JSONB
);

-- Indexes for staging table
CREATE INDEX IF NOT EXISTS idx_staging_batch ON businesses_staging(batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_status ON businesses_staging(_status);
CREATE INDEX IF NOT EXISTS idx_staging_match_status ON businesses_staging(match_status);
CREATE INDEX IF NOT EXISTS idx_staging_city ON businesses_staging(city);
CREATE INDEX IF NOT EXISTS idx_staging_category ON businesses_staging(category);
CREATE INDEX IF NOT EXISTS idx_staging_phone ON businesses_staging(normalized_phone) WHERE normalized_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staging_dedupe ON businesses_staging(dedupe_key) WHERE dedupe_key IS NOT NULL;

-- ============================================================
-- TABLE 2: COMPLETE BUSINESSES
-- Validated businesses with phone numbers (ready for production)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_complete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core business info
  business_name TEXT NOT NULL,
  business_name_en TEXT,
  business_name_ar TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Location
  address TEXT,
  city TEXT NOT NULL,
  governorate TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact (REQUIRED for complete table)
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  
  -- Social media
  facebook TEXT,
  instagram TEXT,
  maps_url TEXT,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  images JSONB,
  
  -- Business details
  description TEXT,
  description_ar TEXT,
  opening_hours JSONB,
  rating DECIMAL(2, 1),
  review_count INTEGER,
  highlights JSONB,
  
  -- Verification & quality
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verification_method TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  completeness_score INTEGER DEFAULT 0,
  
  -- Source tracking
  source TEXT DEFAULT 'scraper',
  source_id TEXT,
  source_confidence INTEGER DEFAULT 50,
  staging_id UUID REFERENCES businesses_staging(id),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ,
  
  -- Unique constraint for deduplication
  CONSTRAINT unique_complete_phone_city UNIQUE (normalized_phone, city)
);

-- Indexes for complete table
CREATE INDEX IF NOT EXISTS idx_complete_city ON businesses_complete(city);
CREATE INDEX IF NOT EXISTS idx_complete_category ON businesses_complete(category);
CREATE INDEX IF NOT EXISTS idx_complete_phone ON businesses_complete(phone);
CREATE INDEX IF NOT EXISTS idx_complete_verified ON businesses_complete(is_verified);
CREATE INDEX IF NOT EXISTS idx_complete_active ON businesses_complete(is_active);
CREATE INDEX IF NOT EXISTS idx_complete_coords ON businesses_complete(latitude, longitude);

-- ============================================================
-- TABLE 3: INCOMPLETE BUSINESSES
-- Real businesses but missing phone numbers (need enrichment)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_incomplete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core business info
  business_name TEXT NOT NULL,
  business_name_en TEXT,
  business_name_ar TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  
  -- Location
  address TEXT,
  city TEXT NOT NULL,
  governorate TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact (phone is NULL for incomplete)
  phone TEXT, -- This will be NULL or empty
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  
  -- Social media (may have these even without phone)
  facebook TEXT,
  instagram TEXT,
  maps_url TEXT,
  
  -- Media
  scraped_photo_url TEXT,
  images JSONB,
  
  -- Business details
  description TEXT,
  opening_hours JSONB,
  rating DECIMAL(2, 1),
  review_count INTEGER,
  
  -- Missing contact flags
  missing_phone BOOLEAN DEFAULT TRUE,
  missing_email BOOLEAN DEFAULT TRUE,
  missing_website BOOLEAN DEFAULT TRUE,
  
  -- Enrichment attempts
  phone_search_attempts INTEGER DEFAULT 0,
  last_enrichment_attempt TIMESTAMPTZ,
  enrichment_notes TEXT,
  
  -- Source tracking
  source TEXT DEFAULT 'osm',
  source_id TEXT,
  source_confidence INTEGER DEFAULT 50,
  staging_id UUID REFERENCES businesses_staging(id),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  can_enrich BOOLEAN DEFAULT TRUE, -- Flag if we should keep trying to find contact info
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Raw data backup
  raw_data JSONB
);

-- Indexes for incomplete table
CREATE INDEX IF NOT EXISTS idx_incomplete_city ON businesses_incomplete(city);
CREATE INDEX IF NOT EXISTS idx_incomplete_category ON businesses_incomplete(category);
CREATE INDEX IF NOT EXISTS idx_incomplete_missing_phone ON businesses_incomplete(missing_phone) WHERE missing_phone = TRUE;
CREATE INDEX IF NOT EXISTS idx_incomplete_can_enrich ON businesses_incomplete(can_enrich) WHERE can_enrich = TRUE;
CREATE INDEX IF NOT EXISTS idx_incomplete_coords ON businesses_incomplete(latitude, longitude);

-- ============================================================
-- REVIEW QUEUE (for human review of uncertain matches)
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staging_id UUID REFERENCES businesses_staging(id),
  existing_business_id UUID,
  
  -- Match details
  match_type TEXT,
  match_confidence INTEGER,
  match_reason TEXT,
  conflicting_fields JSONB,
  
  -- Data snapshots
  new_data JSONB,
  existing_data JSONB,
  
  -- Review status
  review_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'merged'
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Resolution
  resolution_action TEXT, -- 'insert', 'update', 'skip'
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_queue_status ON businesses_review_queue(review_status);
CREATE INDEX IF NOT EXISTS idx_review_queue_staging ON businesses_review_queue(staging_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_staging_updated_at
  BEFORE UPDATE ON businesses_staging
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_complete_updated_at
  BEFORE UPDATE ON businesses_complete
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_incomplete_updated_at
  BEFORE UPDATE ON businesses_incomplete
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_review_queue_updated_at
  BEFORE UPDATE ON businesses_review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to promote from staging to complete
CREATE OR REPLACE FUNCTION promote_staging_to_complete(staging_id UUID)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  staging_record RECORD;
BEGIN
  -- Get staging record
  SELECT * INTO staging_record FROM businesses_staging WHERE id = staging_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staging record not found';
  END IF;
  
  -- Insert into complete table
  INSERT INTO businesses_complete (
    business_name, business_name_en, business_name_ar,
    category, subcategory,
    address, city, governorate, latitude, longitude,
    phone, whatsapp, email, website,
    facebook, instagram, maps_url,
    scraped_photo_url, opening_hours, rating, review_count,
    is_verified, verification_status, completeness_score,
    source, source_id, source_confidence, staging_id
  ) VALUES (
    staging_record.business_name, staging_record.business_name_en, staging_record.business_name_ar,
    staging_record.category, staging_record.subcategory,
    staging_record.address, staging_record.city, staging_record.governorate, 
    staging_record.latitude, staging_record.longitude,
    staging_record.phone, staging_record.whatsapp, staging_record.email, staging_record.website,
    staging_record.facebook, staging_record.instagram, staging_record.maps_url,
    staging_record.scraped_photo_url, staging_record.opening_hours, 
    staging_record.rating, staging_record.review_count,
    TRUE, 'approved', staging_record.completeness_score,
    staging_record.source, staging_record.source_id, staging_record.source_confidence, staging_id
  )
  RETURNING id INTO new_id;
  
  -- Update staging record
  UPDATE businesses_staging 
  SET _status = 'validated', match_status = 'applied', processed_at = now()
  WHERE id = staging_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to move from staging to incomplete
CREATE OR REPLACE FUNCTION move_staging_to_incomplete(staging_id UUID)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
  staging_record RECORD;
BEGIN
  SELECT * INTO staging_record FROM businesses_staging WHERE id = staging_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staging record not found';
  END IF;
  
  -- Insert into incomplete table
  INSERT INTO businesses_incomplete (
    business_name, business_name_en, business_name_ar,
    category, subcategory,
    address, city, governorate, latitude, longitude,
    phone, whatsapp, email, website,
    facebook, instagram, maps_url,
    scraped_photo_url, images, description, opening_hours,
    rating, review_count,
    missing_phone, missing_email, missing_website,
    source, source_id, source_confidence, staging_id
  ) VALUES (
    staging_record.business_name, staging_record.business_name_en, staging_record.business_name_ar,
    staging_record.category, staging_record.subcategory,
    staging_record.address, staging_record.city, staging_record.governorate,
    staging_record.latitude, staging_record.longitude,
    staging_record.phone, staging_record.whatsapp, staging_record.email, staging_record.website,
    staging_record.facebook, staging_record.instagram, staging_record.maps_url,
    staging_record.scraped_photo_url, staging_record._enrichment_data->'images', 
    staging_record._enrichment_data->>'description', staging_record.opening_hours,
    staging_record.rating, staging_record.review_count,
    COALESCE(staging_record.phone IS NULL OR staging_record.phone = '', TRUE),
    COALESCE(staging_record.email IS NULL OR staging_record.email = '', TRUE),
    COALESCE(staging_record.website IS NULL OR staging_record.website = '', TRUE),
    staging_record.source, staging_record.source_id, staging_record.source_confidence, staging_id
  )
  RETURNING id INTO new_id;
  
  -- Update staging
  UPDATE businesses_staging 
  SET _status = 'incomplete', match_status = 'incomplete', processed_at = now()
  WHERE id = staging_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS
ALTER TABLE businesses_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses_complete ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses_incomplete ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses_review_queue ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Allow all access to authenticated users" ON businesses_staging
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users" ON businesses_complete
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users" ON businesses_incomplete
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to authenticated users" ON businesses_review_queue
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policies for anon users (read-only)
CREATE POLICY "Allow read-only access to anon users" ON businesses_complete
  FOR SELECT TO anon USING (is_active = TRUE);

COMMENT ON TABLE businesses_staging IS 'Raw scraped data awaiting review and AI cleaning';
COMMENT ON TABLE businesses_complete IS 'Validated businesses with complete contact info (phone required)';
COMMENT ON TABLE businesses_incomplete IS 'Real businesses missing phone numbers - needs enrichment';
COMMENT ON TABLE businesses_review_queue IS 'Queue for human review of uncertain matches';
