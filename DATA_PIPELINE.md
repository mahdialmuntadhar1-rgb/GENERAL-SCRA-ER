# Iraq Business Directory - Data Pipeline Architecture

## Overview

This document describes how data flows through the application from import to production display.

### Quick Reference

| Stage | Table | Purpose | Access |
|-------|-------|---------|--------|
| **1. Import/Staging** | `businesses_staging` | Raw imported data, not yet validated | Admin: Staging page |
| **2. Review** | `businesses_review` | Data flagged for human review | Admin: Review page |
| **3. Production** | `businesses` | Clean, verified, published data | Public: Browse/Home pages |

---

## Data Flow Stages

### Stage 1: Import → Staging
**Trigger:** User uploads CSV or runs scraper
**Input Table:** `businesses_staging`
**Action:**
- Raw data is inserted into `businesses_staging`
- No validation yet
- Fields: `name`, `phone`, `category`, `governorate`, `city`, etc.

**Admin View:** `/staging` page lists all staged records
**Sample Query:**
```sql
SELECT * FROM businesses_staging
WHERE created_at > now() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

### Stage 2: Normalize & Match → Review
**Trigger:** User clicks "Normalize & Validate" button
**Process:**
1. Normalize phone numbers, addresses, categories
2. Match against existing production data
3. Flag duplicates and incomplete records

**Output Table:** `businesses_review`
**Fields:** Same as `businesses_staging` + `_status` (needs_review|validated|rejected)

**Admin View:** `/review` page shows records needing attention
**Sample Query:**
```sql
SELECT * FROM businesses_review
WHERE status = 'needs_review'
ORDER BY created_at DESC;
```

---

### Stage 3: AI Cleaning (Optional)
**Trigger:** User runs AI enrichment
**Input:** Records from `businesses_review`
**Output:** Enhanced data (descriptions, website validation, etc.)
**Action:** Updates `businesses_review` with enriched fields

---

### Stage 4: Publish → Production
**Trigger:** User clicks "Publish to Production"
**Input Table:** `businesses_review` (validated=true)
**Output Table:** `businesses` (production)
**Filter:** Only records with:
- `status = 'validated'`
- `phone IS NOT NULL` (required)
- `is_published = true`

**Admin View:** `/review` page shows "Publish Selected" action
**Sample Query:**
```sql
INSERT INTO businesses
SELECT * FROM businesses_review
WHERE status = 'validated' AND phone IS NOT NULL
AND id NOT IN (SELECT id FROM businesses);
```

---

## Frontend Data Access

### Public-Facing Pages (use PRODUCTION data)

#### HomePage (`/` or `/home`)
- **Source:** `getBusinesses()` from `lib/supabase.ts`
- **Filters:** category, governorate, city
- **Filter:** `is_published = true` ONLY
- **Data Flow:** `businesses` (production table) → HomePage component
```typescript
const result = await getBusinesses({
  governorate: selectedGovernorate,
  city: selectedCity,
  limit: 100,
});
```

#### Browse Page (`/browse`)
- **Source:** Same as HomePage
- **Additional:** CSV export, search functionality
- **Filter:** `is_published = true`

### Admin-Only Pages (INTERNAL STAGING/REVIEW tables)

#### Staging Page (`/staging`)
- **Source:** `businesses_staging` table
- **Action:** View raw imported data
- **Admin Only:** ✅ Requires authentication

#### Review Page (`/review`)
- **Source:** `businesses_review` table
- **Action:** Validate, reject, or publish records
- **Admin Only:** ✅ Requires authentication

#### AIClean Page (`/ai-clean`)
- **Source:** `businesses_review` table
- **Action:** Enrich data with AI models
- **Admin Only:** ✅ Requires authentication

---

## Environment Variables

Required environment variables (set in `.env` and Vercel dashboard):

```bash
# Frontend (exposed to browser - in .env and index.html)
VITE_SUPABASE_URL=https://mxxaxhrtccomkazpvthn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend (Vercel serverless functions only)
SUPABASE_URL=https://mxxaxhrtccomkazpvthn.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ANTHROPIC_API_KEY=sk-ant-...  (optional, for AI cleaning)
```

**⚠️ Security Note:** Anon keys are PUBLIC and safe in browser. Service role keys are SECRET and must NEVER appear in frontend code.

---

## Database Schema

### businesses (PRODUCTION - read-only by public)
```
id (serial primary key)
name (text, required)
name_ar (text, optional)
name_ku (text, optional)
category (text) - must match category IDs
phone (text, unique, required)
governorate (text)
city (text)
address (text)
website (text)
description (text)
latitude (numeric)
longitude (numeric)
is_published (boolean) ← MUST be true for frontend
verified (boolean)
rating (numeric)
review_count (int)
created_at (timestamp)
updated_at (timestamp)
```

### businesses_staging (INTERNAL - raw imports)
```
Same schema as businesses +
_source (text) - "csv_import" | "google_places" | "osm"
_status (text) - "imported" | "normalized" | "matched"
created_at (timestamp)
```

### businesses_review (INTERNAL - admin validation)
```
Same schema as businesses_staging +
status (text) - "needs_review" | "validated" | "rejected"
review_notes (text)
reviewed_by (text, user ID)
reviewed_at (timestamp)
```

---

## Common Operations

### Import New Data (CSV Upload)
1. User visits `/import-export`
2. Selects CSV file
3. Backend inserts rows into `businesses_staging`
4. User sees records on `/staging` page
5. User clicks "Move to Review"

### Validate & Publish
1. User visits `/review`
2. Sees `businesses_review` records
3. Reviews each record
4. Clicks ✅ "Validate" (sets status='validated')
5. Clicks 📤 "Publish to Production"
6. Backend moves record to `businesses` table
7. Record now visible on `/home` and `/browse` (public)

### Reject Invalid Data
1. User visits `/review`
2. Clicks ❌ "Reject" on a record
3. Sets status='rejected'
4. Record removed from production consideration
5. Can still be viewed for audit purposes

---

## Operational Checklist

### For One-Person Operations

**Daily:**
- Check `/logs` for errors
- Monitor failed imports

**Weekly:**
- Review `/review` page for pending records
- Publish validated records to production
- Verify `/home` displays correct count

**Before Deployment:**
```bash
npm run build          # Verify no TypeScript errors
npm run lint          # Check for warnings
```

**After Deployment:**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- Test `/home` loads with real data
- Test `/browse` filtering works
- Check `/staging` shows no old data

---

## Troubleshooting

### Public App Shows No Data
**Check:**
1. `VITE_SUPABASE_URL` is set in `.env` ✅
2. `VITE_SUPABASE_ANON_KEY` is set ✅
3. `is_published = true` on records in `businesses` table
4. Records have valid phone numbers (NOT NULL)

**Debug:**
```bash
# View records in production table
SELECT id, name, is_published, phone FROM businesses LIMIT 10;
```

### Admin Pages Show No Data
**Check:**
1. User is authenticated ✅
2. `businesses_staging` or `businesses_review` has records

**Debug:**
```bash
SELECT COUNT(*) FROM businesses_staging;
SELECT COUNT(*) FROM businesses_review;
```

### Filtering Not Working
**Check:**
1. `getBusinesses()` in `HomePage.tsx` passes filters correctly
2. Database columns are spelled correctly (e.g., `governorate` not `governorat`)

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client + data types + CRUD functions |
| `src/pages/HomePage.tsx` | Public home page (uses real data) |
| `src/pages/Browse.tsx` | Public browse page (uses real data) |
| `src/pages/Staging.tsx` | Admin: view staged records |
| `src/pages/Review.tsx` | Admin: validate & publish |
| `src/pages/AIClean.tsx` | Admin: enrich with AI |
| `.env` | Frontend environment variables |
| `.env.local` | Local overrides (Vercel) |

---

## Summary

✅ **Public users see:** Only published records from `businesses` table
✅ **Admins manage:** Staging → Review → Production pipeline
✅ **Separation:** Staging/Review tables NEVER exposed to public
✅ **One-person ops:** Simple checkbox workflow, clear status labels
✅ **Production-safe:** Only valid, verified data reaches public

---

**Last Updated:** April 3, 2026
**Version:** 1.0 (Production Ready)
