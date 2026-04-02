# CLAUDE CODE — Surgical Fix Prompt for شکو ماکو (GENERAL-SCRA-ER)

> **Context**: A full database audit was performed on 2026-04-02. This prompt contains the EXACT issues found with EXACT file paths, line numbers, and fixes. Do not guess — follow precisely.

---

## SUPABASE PROJECT (VERIFIED LIVE)

- **URL**: `https://mxxaxhrtccomkazpvthn.supabase.co`
- **Frontend env vars**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (set in `web/.env` and `web/.env.local`)
- **Server-side env vars**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Vercel secrets via `vercel.json`)

---

## VERIFIED TABLE STATE (queried live 2026-04-02)

### `businesses` table — ACTUAL columns:
```
id, name, address, phone, website, latitude, longitude, maps_link,
foursquare_category, user_category, city, country, fsq_id,
detected_language, original_name, translated_name, created_at,
category, subcategory, type, name_ar, name_ku, facebook, instagram,
directions_link, data_quality, verified, governorate, is_published
```

### `iraqi_businesses` table — EXISTS, has extended columns (normalized_*, dedupe_key, is_active, etc.)
### `businesses_import_raw` — EXISTS, EMPTY
### `businesses_staging` — EXISTS, EMPTY
### `job_queue` — DOES NOT EXIST (404)

---

## FIX 1: Column Name Mismatch in Business Type & CRUD (CRITICAL)

**Problem**: The frontend `Business` type and all CRUD functions use `lat`/`lng`, but the actual `businesses` table has `latitude`/`longitude`. The `upsertBusinesses` function actively converts `latitude→lat` which is BACKWARDS — it should keep `latitude`/`longitude`.

**Files to fix**:

### `web/src/lib/supabase.ts`

**A)** Update the `Business` type — change `lat`/`lng` to `latitude`/`longitude`:
```typescript
// WRONG (current):
lat?: number;            // NOTE: column is `lat` NOT `latitude`
lng?: number;            // NOTE: column is `lng` NOT `longitude`

// CORRECT (fix to):
latitude?: number;
longitude?: number;
```

Also remove any comments claiming the column is `lat` — that's wrong.

**B)** Fix `upsertBusinesses()` (around line 196-233) — the mapping currently does:
```typescript
// WRONG (current) — actively breaks coordinates:
const { latitude, longitude, ...fields } = rest as any;
return {
  ...fields,
  lat: fields.lat ?? latitude,
  lng: fields.lng ?? longitude,
  ...
};
```

Fix to:
```typescript
// CORRECT — keep latitude/longitude as-is:
return {
  ...fields,
  latitude: fields.latitude,
  longitude: fields.longitude,
  ...
};
```

**C)** Fix `upsertBusinessesByPhone()` (around line 236-287) — same latitude/longitude mapping fix.

**D)** Remove these columns from the `Business` type that DO NOT exist in the `businesses` table:
- `rating` — does not exist
- `reviewCount` — does not exist
- `isVerified` — does not exist (column is called `verified`)
- `isFeatured` — does not exist
- `isPremium` — does not exist
- `imageUrl` — does not exist
- `coverImage` — does not exist
- `openHours` — does not exist
- `priceRange` — does not exist
- `tags` — does not exist
- `status` — does not exist
- `distance` — does not exist (computed client-side)
- `whatsapp` — does not exist in `businesses` (exists in `iraqi_businesses`)

Keep these internal-only fields for pipeline use but clearly mark them as NOT pushed to DB.

**E)** Fix `isVerified` → `verified` everywhere. The DB column is `verified` (boolean), not `isVerified`.

### `web/api/stats-fixed.ts` (line 27, 43)
```typescript
// WRONG:
.select('data_quality, isVerified, city, governorate');
if (row.isVerified) verifiedCount++;

// CORRECT:
.select('data_quality, verified, city, governorate');
if (row.verified) verifiedCount++;
```

### `web/api/stats.ts` (line 36)
```typescript
// WRONG:
.eq('isVerified', true);

// CORRECT:
.eq('verified', true);
```

---

## FIX 2: Stats API Imports Broken File (CRITICAL)

**File**: `web/api/index.ts`, line 7

**Problem**: Imports `handleStatsRequest` from `'./stats'` which uses `.group()` — a method that DOES NOT EXIST in the Supabase JS client. The corrected version is in `stats-fixed.ts` but is never imported.

**Fix**: Change the import:
```typescript
// WRONG:
import { handleStatsRequest } from './stats';

// CORRECT:
import { handleStatsRequest } from './stats-fixed';
```

After confirming this works, delete `web/api/stats.ts` (the broken version).

---

## FIX 3: `job_queue` Table Does Not Exist (CRITICAL)

**Problem**: `web/api/scraper.ts` and `web/api/pipeline.ts` both read/write a `job_queue` table that doesn't exist. Every scraper start and pipeline run will 500.

**Fix**: Create the table. There's already a migration file at `web/supabase_job_queue.sql`. Read it and verify it creates `job_queue`. If it's correct, output it as "Run this SQL in Supabase SQL Editor".

If `web/supabase_job_queue.sql` doesn't create the right table, create this SQL:

```sql
CREATE TABLE IF NOT EXISTS job_queue (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'scraper',
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    progress TEXT,
    payload JSONB,
    result JSONB,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all job_queue" ON job_queue FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
```

---

## FIX 4: Phone UNIQUE Constraint Missing

**Problem**: `upsertBusinesses()` uses `onConflict: "phone"` but `businesses` table has no UNIQUE constraint on `phone`. This means upserts silently INSERT duplicates instead of merging.

**Fix**: Run this SQL:
```sql
-- First clean up duplicates (keep latest):
DELETE FROM businesses a USING businesses b
WHERE a.phone = b.phone
  AND a.phone IS NOT NULL AND a.phone != ''
  AND a.created_at < b.created_at;

-- Then add constraint:
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_phone_unique
    ON businesses(phone)
    WHERE phone IS NOT NULL AND phone != '';
```

NOTE: This is a partial unique index — only enforces uniqueness for non-null, non-empty phones.

---

## FIX 5: Python Scraper Has No Database Connection

**Problem**: The Python scraper at repo root (`db/client.py`) reads `SUPABASE_URL` and `SUPABASE_KEY` from a root `.env` file. That file does not exist. The Python scraper cannot connect to anything.

**Fix**: Create `/.env` (repo root, NOT `web/.env`) by copying from `.env.example`:
```
SUPABASE_URL=https://mxxaxhrtccomkazpvthn.supabase.co
SUPABASE_KEY=<the anon key or service role key>
```

But do NOT commit this file. Verify `.gitignore` includes `.env` at the root level.

---

## FIX 6: `is_active` Column Referenced but Missing from `businesses`

**File**: `web/api/pipeline.ts`, line 166
```typescript
// WRONG — businesses table doesn't have is_active:
.eq('is_active', true);
```

**Fix**: Either:
- **(A)** Remove the `.eq('is_active', true)` filter — the `businesses` table uses `is_published` instead, OR
- **(B)** Change to `.eq('is_published', true)` if that's the intent

Check `is_published` column semantics first. If it's a boolean for "visible to end users", use it. Otherwise, just remove the filter.

---

## FIX 7: Pipeline Match Reads Wrong Columns from `businesses`

**File**: `web/api/pipeline.ts`, line 164
```typescript
// WRONG — uses lat/lng which don't exist:
.select('id, name, phone, website, facebook, instagram, city, governorate, category, lat, lng')

// CORRECT:
.select('id, name, phone, website, facebook, instagram, city, governorate, category, latitude, longitude')
```

---

## FIX 8: Duplicate Supabase Client in Vercel API Files

**Problem**: Every API file (`stats.ts`, `stats-fixed.ts`, `scraper.ts`, `pipeline.ts`, `auth.ts`) independently creates its own Supabase client:
```typescript
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);
```

This is 5 separate cold-start initializations. Not a crash bug, but wasteful.

**Fix (optional, low priority)**: Extract to a shared file:
```typescript
// web/api/_supabase.ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
```

Then import from `'./_supabase'` in each API file.

---

## EXECUTION ORDER

1. **FIX 1** (column names) — this is the root cause of broken data display
2. **FIX 2** (stats import) — stats page crashes without this
3. **FIX 7** (pipeline columns) — pipeline match is broken
4. **FIX 6** (is_active) — pipeline match is broken
5. **FIX 3** (job_queue SQL) — output the SQL, user runs manually
6. **FIX 4** (phone unique SQL) — output the SQL, user runs manually
7. **FIX 5** (root .env) — one-line fix
8. **FIX 8** (shared client) — optional cleanup

---

## VERIFICATION

After all code fixes:
```bash
cd web
npx tsc --noEmit    # Must pass with 0 errors
npm run build       # Must succeed
```

Then user runs the SQL from FIX 3 + FIX 4 in Supabase SQL Editor.

Then test:
1. Dashboard loads stats without error
2. Scraper can start a job (job_queue insert works)
3. Push to businesses → data appears with correct latitude/longitude
4. No `lat`/`lng` references remain in code (search: `grep -r "\.lat\b" src/ --include="*.ts" --include="*.tsx"`)

---

## DO NOT

- Do not touch the Python scraper code (`/scraper/`, `/db/`, `/utils/`, `/models/`) — it's a separate pipeline
- Do not modify `web/supabase_schema_v2.sql` — it's reference only
- Do not create new pages or features — this is a bugfix-only pass
- Do not rename tables in Supabase — only fix the code to match what exists
- Do not add columns to the DB — only fix the code to use columns that already exist
