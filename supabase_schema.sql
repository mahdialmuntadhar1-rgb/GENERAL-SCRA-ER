-- ============================================================================
-- Iraq University Platform — Full Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables.
-- ============================================================================

-- 0. Helper: auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. GOVERNORATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS governorates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    name_ar     TEXT,
    latitude    DECIMAL(10, 8),
    longitude   DECIMAL(11, 8),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_governorates_updated
    BEFORE UPDATE ON governorates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. CITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    name_ar         TEXT,
    governorate_id  UUID REFERENCES governorates(id) ON DELETE CASCADE,
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, governorate_id)
);

CREATE TRIGGER trg_cities_updated
    BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 3. UNIVERSITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS universities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    name_ar         TEXT,
    name_en         TEXT,
    type            TEXT CHECK (type IN ('public', 'private', 'technical', 'religious', 'unknown'))
                    DEFAULT 'unknown',
    city_id         UUID REFERENCES cities(id) ON DELETE SET NULL,
    governorate_id  UUID REFERENCES governorates(id) ON DELETE SET NULL,
    address         TEXT,
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),
    founded_year    INTEGER,
    website         TEXT,
    description     TEXT,
    logo_url        TEXT,
    verified        BOOLEAN DEFAULT FALSE,
    data_quality    TEXT CHECK (data_quality IN ('real', 'partial', 'unverified', 'rejected'))
                    DEFAULT 'unverified',
    source          TEXT DEFAULT 'manual',
    external_id     TEXT,
    raw_data        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, governorate_id)
);

CREATE TRIGGER trg_universities_updated
    BEFORE UPDATE ON universities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 4. UNIVERSITY_CONTACTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS university_contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    contact_type    TEXT CHECK (contact_type IN (
                        'phone', 'mobile', 'fax', 'email',
                        'whatsapp', 'telegram', 'other'))
                    DEFAULT 'phone',
    value           TEXT NOT NULL,
    label           TEXT,              -- e.g. "Admissions", "Dean Office"
    is_primary      BOOLEAN DEFAULT FALSE,
    verified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_university_contacts_updated
    BEFORE UPDATE ON university_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 5. SOCIAL_LINKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    platform        TEXT CHECK (platform IN (
                        'facebook', 'instagram', 'twitter', 'youtube',
                        'linkedin', 'tiktok', 'telegram', 'other'))
                    NOT NULL,
    url             TEXT NOT NULL,
    verified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(university_id, platform)
);

CREATE TRIGGER trg_social_links_updated
    BEFORE UPDATE ON social_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 6. POSTS  (news / announcements scraped or entered manually)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    body            TEXT,
    source_url      TEXT,
    published_at    TIMESTAMPTZ,
    language        TEXT DEFAULT 'ar',
    tags            TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_posts_updated
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 7. OPPORTUNITIES  (scholarships, jobs, events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS opportunities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    opportunity_type TEXT CHECK (opportunity_type IN (
                        'scholarship', 'job', 'internship', 'event',
                        'admission', 'other'))
                    DEFAULT 'other',
    deadline        DATE,
    source_url      TEXT,
    tags            TEXT[],
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_opportunities_updated
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cities_governorate ON cities(governorate_id);
CREATE INDEX IF NOT EXISTS idx_universities_city ON universities(city_id);
CREATE INDEX IF NOT EXISTS idx_universities_gov ON universities(governorate_id);
CREATE INDEX IF NOT EXISTS idx_universities_quality ON universities(data_quality);
CREATE INDEX IF NOT EXISTS idx_contacts_uni ON university_contacts(university_id);
CREATE INDEX IF NOT EXISTS idx_social_uni ON social_links(university_id);
CREATE INDEX IF NOT EXISTS idx_posts_uni ON posts(university_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_uni ON opportunities(university_id);
CREATE INDEX IF NOT EXISTS idx_universities_name_fts
    ON universities USING gin(to_tsvector('simple', name));

-- ============================================================================
-- ROW LEVEL SECURITY  (permissive — allow everything via anon key for now)
-- ============================================================================
ALTER TABLE governorates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities               ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities         ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_contacts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links         ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON governorates         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON cities               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON universities         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON university_contacts  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON social_links         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON posts                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON opportunities        FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VIEWS
-- ============================================================================
CREATE OR REPLACE VIEW universities_verified AS
SELECT u.*, g.name AS governorate_name, c.name AS city_name
FROM universities u
LEFT JOIN governorates g ON g.id = u.governorate_id
LEFT JOIN cities c ON c.id = u.city_id
WHERE u.data_quality != 'rejected';

CREATE OR REPLACE VIEW platform_stats AS
SELECT
    (SELECT COUNT(*) FROM governorates)        AS governorate_count,
    (SELECT COUNT(*) FROM cities)              AS city_count,
    (SELECT COUNT(*) FROM universities)        AS university_count,
    (SELECT COUNT(*) FROM universities WHERE verified) AS verified_count,
    (SELECT COUNT(*) FROM university_contacts) AS contact_count,
    (SELECT COUNT(*) FROM social_links)        AS social_link_count,
    (SELECT COUNT(*) FROM posts)               AS post_count,
    (SELECT COUNT(*) FROM opportunities)       AS opportunity_count;
