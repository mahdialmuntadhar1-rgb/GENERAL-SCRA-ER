# Iraq Business Pipeline (City-First, Central-City Coverage)

This project now enforces a **city-first** business data model with strict central-city coverage controls.
Governorate is retained only as a secondary raw field (`governorate_raw`).

## Database Migration (Supabase SQL)

Run this SQL in Supabase SQL Editor.

```sql
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  normalized_business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  city TEXT NOT NULL,
  district TEXT,
  city_center_zone TEXT,
  coverage_type TEXT NOT NULL DEFAULT 'Uncertain',
  governorate_raw TEXT,
  address_text TEXT,
  address_normalized TEXT,
  google_maps_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone_primary TEXT,
  phone_secondary TEXT,
  whatsapp_number TEXT,
  website_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  telegram_url TEXT,
  email TEXT,
  description TEXT,
  opening_hours TEXT,
  image_url TEXT,
  logo_url TEXT,
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_type TEXT NOT NULL,
  completeness_score INTEGER DEFAULT 0,
  verification_score INTEGER DEFAULT 0,
  publish_readiness_score INTEGER DEFAULT 0,
  duplicate_risk_score INTEGER DEFAULT 0,
  suburb_risk_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending Review',
  verification_notes TEXT,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  changed_by TEXT NOT NULL,
  previous_status TEXT,
  next_status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_category ON businesses(category);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_source_type ON businesses(source_type);
CREATE INDEX IF NOT EXISTS idx_businesses_coverage ON businesses(coverage_type);
CREATE INDEX IF NOT EXISTS idx_businesses_normalized_name ON businesses(normalized_business_name);
```

## Feature Coverage

- City-center allowlist enforcement per city (`src/server/config/cityCenterZones.ts`).
- Import pipeline supporting CSV, XLSX (base64 payload), and JSON.
- Row normalization and validation (phone, URLs, city/category/address text cleanup).
- Duplicate-risk and quality scoring before insert.
- QC statuses + audit history tracking endpoint.
- Export pipeline for verified/export-ready and quality reports.

## API Endpoints

- `POST /api/run` discovery run
- `POST /api/import` import pipeline
- `POST /api/qc/status` QC status update + audit log
- `GET /api/businesses` filters: city/category/status/coverage_type/source_name
- `GET /api/export` formats: csv/xlsx/json with filters
- `GET /api/export/reports` duplicates/incomplete/rejected datasets

## TODOs (Manual Policy Decisions)

1. Expand/approve city-center district allowlists with local domain experts.
2. Add stricter Arabic/Kurdish transliteration matching for dedupe.
3. Add per-source trust weighting in verification score.
4. Add admin screens for import file upload and QC actions.
