# AI Prompt: Complete Data Pipeline & Database Implementation for Production

## Project Context

**Repository:** `github.com/mahdialmuntadhar1-rgb/GENERAL-SCRA-ER`  
**Tech Stack:** Vite + React + TypeScript + Supabase + Vercel  
**Domain:** Iraqi Business Directory (HUMUS)

---

## Current Architecture Overview

### Data Pipeline Flow
```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: INGESTION                                              │
│  ├── CSV Import (POST /api/import/csv)                         │
│  ├── Web Scrapers (Gemini, Web Directory)                      │
│  └── Manual Entry (admin interface)                            │
│                                                                  │
│  ↓ Insert to `businesses_import` (staging table)                │
│                                                                  │
│  STAGE 2: CLEANING & NORMALIZATION                               │
│  ├── Phone normalization (+964 prefix, remove spaces)          │
│  ├── Name/address trimming                                      │
│  ├── Category mapping (OSM → HUMUS categories)               │
│  ├── Governorate standardization                                │
│  └── Confidence score calculation (0.0-1.0)                   │
│                                                                  │
│  ↓ Process via `POST /api/import/process`                       │
│                                                                  │
│  STAGE 3: DEDUPLICATION                                          │
│  ├── Key: normalized phone number (primary)                   │
│  ├── Fallback: business_name + city + website                 │
│  └── Keep highest confidence_score on conflict                 │
│                                                                  │
│  ↓ Upsert to `businesses` (production table)                  │
│                                                                  │
│  STAGE 4: PUBLISHING                                             │
│  ├── Update staging status → 'published'                      │
│  ├── Set published_at timestamp                               │
│  └── Frontend reads from `businesses` with RLS policies       │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Supabase)

#### Production Table: `businesses`
```sql
- id: uuid (PK)
- business_name: text (REQUIRED)
- arabic_name: text
- english_name: text
- category: text (REQUIRED) - HUMUS category IDs
- subcategory: text
- governorate: text (REQUIRED)
- city: text (REQUIRED)
- neighborhood: text
- address: text
- phone_1: text (REQUIRED for HUMUS)
- phone_2: text
- whatsapp: text
- email: text
- website: text
- facebook: text
- instagram: text
- tiktok: text
- telegram: text
- opening_hours: text
- status: enum('active', 'closed', 'suspended') = 'active'
- verification_status: enum('unverified', 'pending', 'verified', 'rejected') = 'unverified'
- confidence_score: float (0.0-1.0)
- source: text (gemini, web_directory, csv_import, manual)
- source_url: text
- created_at: timestamp
- updated_at: timestamp
- published_at: timestamp

Indexes:
- idx_businesses_phone_1 (for dedupe)
- idx_businesses_city_category (for queries)
- idx_businesses_status (for filtering)

RLS:
- Public read: status = 'active'
- Service role: full access
```

#### Staging Table: `businesses_import`
Same schema as businesses PLUS:
```sql
- import_batch_id: text (groups records by import job)
- processing_status: enum('pending', 'processing', 'error', 'published') = 'pending'
- processed_at: timestamp
- error_message: text
```

#### Batch Tracking: `import_batches`
```sql
- id: text (PK, e.g., 'csv-2024-01-15-001')
- source: text (csv, scraper, manual)
- total_records: int
- processed_count: int
- error_count: int
- status: enum('pending', 'processing', 'completed', 'failed')
- started_at: timestamp
- completed_at: timestamp
```

---

## What Needs to Be Completed for Production

### 1. Backend API Endpoints (Vercel Serverless)
**Location:** `web/api/*.ts`

| Endpoint | Status | Action Needed |
|----------|--------|---------------|
| `POST /api/import/csv` | ✅ Exists | Test & validate CSV parsing |
| `POST /api/import/process` | ✅ Exists | Add batch processing logic |
| `GET /api/health` | ✅ Exists | Verify Supabase connectivity check |
| `GET /api/stats` | ⚠️ Partial | Add real aggregated stats from DB |
| `POST /api/scraper/run` | ❌ Missing | Create scraper trigger endpoint |
| `GET /api/batches` | ❌ Missing | List import batches with status |
| `POST /api/batches/:id/retry` | ❌ Missing | Retry failed records in batch |

**Critical Tasks:**
- [ ] Implement `POST /api/scraper/run` - triggers Gemini/web scraper
- [ ] Add progress tracking for long-running imports (WebSocket or polling)
- [ ] Add rate limiting on API routes (Vercel KV or in-memory)
- [ ] Add request validation with Zod schemas

### 2. Database Triggers & Functions
**Run in Supabase SQL Editor:**

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON businesses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.processing_status = 'published' AND OLD.processing_status != 'published' THEN
        NEW.published_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_set_published_at 
    BEFORE UPDATE ON businesses_import 
    FOR EACH ROW 
    EXECUTE FUNCTION set_published_at();
```

### 3. Frontend Data Fetching
**Location:** `web/src/lib/supabase.ts`

Current state: Uses Supabase client directly  
**Needs:**
- [ ] Add React Query hooks for caching (`useBusinesses()`, `useBusiness(id)`)
- [ ] Add optimistic updates for mutations
- [ ] Add infinite scroll pagination for business lists
- [ ] Add real-time subscriptions for live updates (optional)

### 4. Data Quality & Validation Rules

**Required Fields for Publishing:**
- business_name (min 2 chars)
- city (must match HUMUS governorate list)
- category (must be valid HUMUS category ID)
- phone_1 (valid Iraqi phone format)

**Validation Logic to Add:**
```typescript
// Phone validation (Iraqi format)
function isValidIraqiPhone(phone: string): boolean {
  const normalized = phone.replace(/\s/g, '');
  return /^\+?964[0-9]{9,10}$/.test(normalized);
}

// Required fields check
function canPublish(business: Business): boolean {
  return !!(business.business_name && 
            business.city && 
            business.category && 
            business.phone_1);
}
```

### 5. Background Jobs (for Vercel)

Since Vercel is serverless, use these patterns:

**Option A: Vercel Cron (for scheduled scraping)**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/scraper",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Option B: On-demand processing**
- Import CSV → Staging (immediate)
- Process staging → Production (background, poll status)

**Option C: Use Supabase Queue (pgmq extension)**
```sql
-- Enable pg_cron and pgmq in Supabase
SELECT pgmq.create('process_import_batch');
-- Workers process queue via edge functions
```

### 6. Monitoring & Logging

**Add to every API endpoint:**
```typescript
console.log(`[${endpoint}] Started: ${batchId}`);
console.log(`[${endpoint}] Completed: ${count} records`);
console.error(`[${endpoint}] Failed: ${error.message}`);
```

**Supabase Logging:**
- Enable audit log on businesses table
- Track who changed what and when

---

## Recommended Next Steps (Priority Order)

### P0 - Critical (Blocks Launch)
1. ✅ **Vercel deployment fixed** (already done)
2. ⏳ **Test CSV import end-to-end**
   - Upload sample CSV via frontend
   - Verify records appear in staging
   - Click "Process to Production"
   - Verify in HUMUS app
3. ⏳ **Add required field validation**
4. ⏳ **Test scraper endpoints**

### P1 - Important (Week 1)
5. ⏳ **Add batch progress tracking UI**
6. ⏳ **Create stats dashboard** (real numbers from DB)
7. ⏳ **Add error retry functionality**
8. ⏳ **Implement data quality scoring**

### P2 - Nice to Have (Week 2-3)
9. ⏳ **Add scheduled scraping (cron)**
10. ⏳ **Real-time updates via Supabase Realtime**
11. ⏳ **Bulk edit operations**
12. ⏳ **Export filtered results**

---

## Testing Checklist Before Publishing

```bash
# 1. Test CSV import
curl -X POST https://your-app.vercel.app/api/import/csv \
  -H "Content-Type: application/json" \
  -d '{"csvText": "business_name,city,category,phone_1\nTest Co,Baghdad,dining_cuisine,+9647701234567"}'

# 2. Test process endpoint  
curl -X POST https://your-app.vercel.app/api/import/process \
  -H "Content-Type: application/json" \
  -d '{"batchId": "csv-xxx"}'

# 3. Verify in Supabase
SELECT * FROM businesses WHERE business_name = 'Test Co';

# 4. Check frontend displays correctly
# Open HUMUS app, verify business appears with correct data
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `web/src/services/csv.ts` | CSV parsing & validation |
| `web/src/services/normalization.ts` | Data cleaning & normalization |
| `web/src/services/dedupe.ts` | Duplicate detection logic |
| `web/src/services/storage.ts` | Supabase CRUD operations |
| `web/api/index.ts` | API route handler |
| `web/api/pipeline.ts` | Import pipeline logic |
| `web/src/lib/supabase.ts` | Frontend Supabase client |
| `supabase_schema.sql` | Database schema definition |

---

## Success Criteria for "Production Ready"

- [ ] CSV import → Staging → Production flow works end-to-end
- [ ] Scraper can discover and save businesses automatically
- [ ] Duplicate detection prevents double entries
- [ ] Frontend displays real data from Supabase
- [ ] Data validation prevents bad records
- [ ] Error handling shows useful messages to users
- [ ] Performance: Page loads < 2s, API responses < 500ms
- [ ] All environment variables configured in Vercel

---

**Your Task:** Implement the P0 items above, ensure the full data pipeline works end-to-end, and document any additional environment variables or configuration needed.
