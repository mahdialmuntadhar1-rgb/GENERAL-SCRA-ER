# CLAUDE CODE — Iraq Compass Scraper: Resume & Complete

> **DO NOT START FROM SCRATCH.** This project is partially built and deployed. Read this entire prompt before making any changes. Be token-efficient — only modify files that need fixing.

---

## 1. WHAT THIS PROJECT IS

A **standalone multi-source Iraqi data scraper** with a web dashboard. It scrapes business/university data from multiple sources, cleans it, and pushes it to **one shared Supabase project** — but into **different tables for different consumer applications**.

**Think of it as a data collection agent** that feeds multiple frontends.

---

## 2. SHARED SUPABASE PROJECT

**URL**: `https://mxxaxhrtccomkazpvthn.supabase.co`
**Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGF4aHJ0Y2NvbWthenB2dGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ5OTEsImV4cCI6MjA4ODgwMDk5MX0.RGhIU3C4WUCc6YBXktmXRXLT_wdrEbErKcd9VsFuE-8`

### Tables & Which App Reads Them

| Table | Consumer App | Purpose |
|-------|-------------|---------|
| `businesses` | **HUMUS** (Iraqi Business Directory) | Production business listings |
| `business_postcards` | **HUMUS** | Rich business cards with images/content |
| `posts` | **HUMUS** | Social posts from businesses |
| `deals` | **HUMUS** | Business deals/offers |
| `stories` | **HUMUS** | Business stories |
| `events` | **HUMUS** | Events listings |
| `users` | **HUMUS** | User accounts (Firebase Auth) |
| `universities` | **Universities App** | Iraqi university listings |
| `universities_by_governorate` | **Universities App** | Aggregated view |
| `iraqi_businesses` | **NOBODY — DEPRECATED** | Old scraper target, stop using |
| `businesses_import_raw` | Scraper internal | Raw import staging |
| `businesses_staging` | Scraper internal | Normalized staging |
| `businesses_review_queue` | Scraper internal | Conflict resolution |
| `pipeline_stats` | Scraper internal | Pipeline metrics |

**CRITICAL RULE**: The scraper must write to the correct table for each app. Never mix data between tables.

---

## 3. CONSUMER APPS (Read-Only — Don't Touch Their Code)

### App 1: HUMUS — Iraqi Business Directory
- **Repo**: `https://github.com/mahdialmuntadhar1-rgb/HUMUS`
- **Live**: `humuplus.vercel.app`
- **Reads from**: `businesses` table
- **API file**: `services/api.ts` → `supabase.from('businesses')`
- **Category filter**: queries `WHERE category IN (...)` using these exact IDs:

```
food_drink, shopping, events_entertainment, hotels_stays,
culture_heritage, business_services, health_wellness,
transport_mobility, public_essential
```

- **Governorate filter**: queries `WHERE governorate = '...'` using these exact values:

```
Baghdad, Basra, Erbil, Sulaymaniyah, Dohuk, Nineveh, Al Anbar,
Babil, Karbala, Najaf, Al-Qādisiyyah, Wasit, Maysan, Dhi Qar,
Al Muthanna, Diyala, Kirkuk, Salah al-Din
```

- **`businesses` table columns** (from HUMUS `types.ts`):

```typescript
interface Business {
  id: string | number;     // int8, auto-generated
  name: string;            // REQUIRED
  nameAr?: string;         // Arabic name
  nameKu?: string;         // Kurdish name
  category: string;        // REQUIRED — must be one of the 9 HUMUS category IDs
  subcategory?: string;
  phone?: string;          // WE REQUIRE THIS — only push if phone exists
  whatsapp?: string;
  website?: string;
  address?: string;
  city?: string;
  governorate?: string;    // Must match HUMUS governorate values above
  lat?: number;            // NOTE: column is `lat` NOT `latitude`
  lng?: number;            // NOTE: column is `lng` NOT `longitude`
  rating?: number;         // 0-5
  reviewCount?: number;
  isVerified?: boolean;
  isFeatured?: boolean;
  isPremium?: boolean;
  imageUrl?: string;
  coverImage?: string;
  description?: string;
  descriptionAr?: string;
  descriptionKu?: string;
  openHours?: string;
  priceRange?: 1 | 2 | 3 | 4;
  tags?: string[];         // text array
  status?: string;
  distance?: number;
}
```

- **`business_postcards` table columns** (from HUMUS `types.ts`):

```typescript
interface BusinessPostcard {
  id?: string;             // auto from title+city
  title: string;
  city: string;
  neighborhood: string;
  governorate: string;
  category_tag: 'Cafe' | 'Restaurant' | 'Bakery' | 'Hotel' | 'Gym' | 'Salon' | 'Pharmacy' | 'Supermarket';
  phone: string;
  website?: string;
  instagram?: string;
  hero_image: string;
  image_gallery: string[];
  postcard_content: string;
  google_maps_url: string;
  rating: number;
  review_count: number;
  verified: boolean;
  updatedAt?: any;
}
```

### App 2: Universities Platform
- **Reads from**: `universities` table
- Separate data domain — universities, colleges, schools
- Scraper should collect university data separately and push to `universities` table
- University columns: `name, nameAr, type (public/private), governorate, city, address, phone, website, lat, lng, established, students_count, faculties`

---

## 4. THIS PROJECT — SCRAPER DASHBOARD

### Repo & Deployment
- **Repo**: `https://github.com/mahdialmuntadhar1-rgb/GENERAL-SCRA-ER`
- **Branch**: `master` and `main` (both synced)
- **Deployed**: Vercel (auto-deploys from master)
- **Stack**: React 18 + TypeScript + Vite + TailwindCSS + Zustand + Supabase JS

### What's Already Built & Working

**Frontend Pages** (all functional):
- `src/pages/Dashboard.tsx` — Overview with real stats from Zustand stores + step-by-step flow guide
- `src/pages/Scraper.tsx` — Pick governorates (18) + categories (12), runs Overpass API, classifies results
- `src/pages/Review.tsx` — Review staged businesses, select/approve/reject, Smart Push + Direct Push
- `src/pages/AIClean.tsx` — Real normalization engine: phone→+964, Arabic cleanup, dedupe, completeness scoring
- `src/pages/ImportExport.tsx` — CSV/JSON import+export with UTF-8 BOM for Arabic/Kurdish
- `src/pages/Settings.tsx` — API keys config, Supabase connection test, clear cache
- `src/pages/SystemLogs.tsx` — Log viewer
- `src/components/Layout.tsx` — Sidebar + header with working Export CSV button

**Services** (all functional):
- `src/services/normalize.ts` — Phone normalization (+964 with prefix validation), Arabic name cleanup (remove tashkeel/diacritics), website normalization, social media handle extraction, completeness scoring (0-100), dedupe key generation
- `src/services/matcher.ts` — Match classification (strong/medium/weak by phone→website→social→name+city), field-level merge logic (never overwrite good data with empty)
- `src/services/pipeline.ts` — Full pipeline orchestrator with progress callbacks, local-only fallback mode
- `src/services/validation.ts` — Phone validation, business classification (validated vs needs_review based on score)
- `src/services/google-places.ts` — Google Places API integration (exists but NOT integrated into scraper flow yet)

**Config**:
- `src/config/iraq.ts` — All 18 Iraqi governorates with lat/lon + major cities, 12 business categories with OSM tags
- `src/stores/index.ts` — Zustand stores with localStorage persistence: scraperStore, reviewStore, settingsStore
- `src/lib/supabase.ts` — Supabase client + CRUD + upsert functions

**Scraper Categories** (defined in `src/config/iraq.ts`):
```
restaurant, cafe, hotel, shop, healthcare, bank,
gasStation, carRepair, government, education, entertainment, tourism
```

Each has OSM tags (e.g., restaurant → `amenity=restaurant`, `amenity=fast_food`, `cuisine=iraqi`, etc.)

**Current Scraping Flow** (Scraper.tsx):
1. User picks governorates + categories
2. For each governorate → for each city → for each category:
   - Build Overpass QL query from OSM tags
   - Query Overpass API (2 server fallbacks)
   - Parse OSM elements into Business objects
   - Normalize phone, classify (validated/needs_review)
3. Results stored in Zustand scraperStore
4. User clicks "Stage All" → moves to reviewStore
5. AI Clean page normalizes, deduplicates, scores
6. Review page → select → Push to Supabase

---

## 5. WHAT'S BROKEN — FIX THESE

### BUG 1: Wrong Target Table
**File**: `src/lib/supabase.ts`
**Problem**: ALL Supabase operations target `iraqi_businesses` table. Must target `businesses` table (what HUMUS reads).
**Fix**: Replace every `from("iraqi_businesses")` with `from("businesses")`. Update column mapping: `latitude`→`lat`, `longitude`→`lng`. Remove columns that don't exist in `businesses` table (`country`, `source`, `data_quality`, `fsq_id`, `external_id`, `verified`, `created_at`, `updated_at`, `scraped_at`, pipeline v2 fields).

### BUG 2: Category Mismatch
**Problem**: Scraper outputs OSM category keys (`restaurant`, `cafe`, `hotel`...) but HUMUS expects specific IDs (`food_drink`, `shopping`...).
**Fix**: Add this mapping and apply it before pushing:

```typescript
const CATEGORY_MAP: Record<string, string> = {
  restaurant: "food_drink",
  cafe: "food_drink",
  hotel: "hotels_stays",
  shop: "shopping",
  healthcare: "health_wellness",
  bank: "business_services",
  gasStation: "transport_mobility",
  carRepair: "transport_mobility",
  government: "public_essential",
  education: "public_essential",
  entertainment: "events_entertainment",
  tourism: "culture_heritage",
};
```

### BUG 3: No Phone Requirement
**Problem**: Businesses with no phone get pushed to Supabase. This creates junk listings in HUMUS.
**Fix**: In `upsertBusinesses()`, filter out any business where `phone` is null/empty before pushing. Also in the Scraper page, visually mark phoneless entries differently.

### BUG 4: Upsert Conflict Key
**Problem**: Current upsert uses `onConflict: "fsq_id"` but `businesses` table doesn't have an `fsq_id` column.
**Fix**: Upsert by `phone` (add a UNIQUE constraint on phone in the businesses table). For businesses with same phone, update with better data. SQL to add constraint:
```sql
ALTER TABLE businesses ADD CONSTRAINT businesses_phone_unique UNIQUE (phone);
```
Fallback: if phone conflict fails, check by `name + governorate` combo.

### BUG 5: Governorate Name Mismatch
**Problem**: Scraper uses `Duhok`, `Anbar`, `DhiQar`, `Qadisiyyah`, `Muthanna`, `Salahaddin`. HUMUS expects `Dohuk`, `Al Anbar`, `Dhi Qar`, `Al-Qādisiyyah`, `Al Muthanna`, `Salah al-Din`.
**Fix**: Add governorate name mapping in `src/config/iraq.ts` or in the push function.

### BUG 6: Old Junk Data in Supabase
**Problem**: `businesses` table has 717 rows, many with EMPTY phone, "Unknown" names.
**Fix**: Run this SQL in Supabase SQL Editor:
```sql
DELETE FROM businesses WHERE name IS NULL OR name = '' OR name = 'Unknown';
DELETE FROM businesses WHERE phone IS NULL OR phone = '' OR phone = 'EMPTY';
SELECT COUNT(*) AS remaining FROM businesses;
```

---

## 6. WHAT'S MISSING — BUILD THESE

### FEATURE 1: Multi-Source Scraping
Currently only scrapes **Overpass API (OpenStreetMap)**. Most OSM data lacks phone numbers. Add these sources:

1. **Google Places API** — `src/services/google-places.ts` exists but is NOT wired into the scraper flow. Integrate it:
   - For each governorate+category, search Google Places API
   - Extract: name, phone, website, address, rating, lat/lng, opening hours
   - This is the BEST source for phone numbers and ratings
   - Requires API key (user enters in Settings page)

2. **Google Maps Web Scraping** — For categories/areas where API quota is limited:
   - Search `"restaurants in Baghdad Iraq"` on Google Maps
   - Parse the results panel for business cards
   - Extract phone, website, address, rating

3. **Facebook Business Pages** — Many Iraqi businesses only have a Facebook page:
   - Search Facebook for `"restaurant Baghdad"`, `"cafe Erbil"` etc.
   - Extract page name, phone, address, category
   - Use Facebook Graph API if available, or web scraping

4. **Instagram Business Profiles** — Iraqi businesses frequently use Instagram:
   - Search for location-tagged business profiles
   - Extract bio (often has phone), website link, category

5. **AI Enrichment with Claude** — Use Claude API to:
   - Take a business with only a name + city and find its phone/website via web search
   - Verify if a phone number is real (format check + carrier lookup)
   - Translate business names: Arabic ↔ Kurdish ↔ English
   - Generate Arabic/Kurdish descriptions from English name + category
   - Auto-classify into the correct HUMUS category from raw OSM tags
   - Fill missing address details from coordinates (reverse geocoding)
   - The Claude API key is stored in Settings page (user provides it)

6. **Iraqi Yellow Pages** — Web scrape Iraqi online directories
7. **WhatsApp Business Directory** — Search for Iraqi business WhatsApp profiles

Each source should tag records: `tags: ["source:osm"]`, `tags: ["source:google_places"]`, `tags: ["source:ai_enriched"]`

### FEATURE 2: University Scraping Pipeline
Add a separate scraping mode for universities:
- Target table: `universities` (NOT `businesses`)
- Sources: Iraqi Ministry of Education website, Wikipedia, Google
- Categories: public university, private university, college, technical institute
- Push to `universities` table with appropriate columns
- Keep completely separate from business pipeline

### FEATURE 3: Pipeline Selection in UI
Add a dropdown/toggle in the Scraper page:
- **Mode: Businesses** → scrapes businesses → pushes to `businesses` table
- **Mode: Universities** → scrapes universities → pushes to `universities` table
Never mix the two.

### FEATURE 4: Postcard Generation
After pushing to `businesses`, auto-generate `business_postcards` entries for high-quality businesses:
- Business has phone + address + rating ≥ 3
- Generate `postcard_content` using Claude (short description)
- Generate `google_maps_url` from lat/lng
- Set `category_tag` from the mapped category
- Use a placeholder `hero_image` or search for one

### FEATURE 5: Source Priority & Smart Merge
When the same business is found from multiple sources:
- Google Places data wins over OSM data (better phone/rating)
- AI-enriched data fills gaps but never overwrites confirmed data
- Never overwrite a real phone with empty
- Never overwrite a real address with empty
- Track `source` in tags array for audit

---

## 7. FILE STRUCTURE

```
/ (repo root = web app root for Vercel)
├── src/
│   ├── App.tsx                       # Router: /, /scraper, /review, /ai-clean, /import-export, /logs, /settings
│   ├── main.tsx                      # Entry: React + BrowserRouter + QueryClient + Sonner
│   ├── index.css                     # Tailwind + custom styles
│   ├── components/
│   │   └── Layout.tsx                # Sidebar nav + header bar + Export CSV button
│   ├── config/
│   │   └── iraq.ts                   # 18 governorates + 12 categories + OSM tags + Overpass servers
│   ├── lib/
│   │   ├── supabase.ts               # ⚠️ NEEDS REWRITE — Business type + CRUD + upsert
│   │   └── utils.ts                  # cn() helper
│   ├── pages/
│   │   ├── Dashboard.tsx             # Overview stats + flow guide (working)
│   │   ├── Scraper.tsx               # Scraping UI + Overpass logic (working, needs multi-source)
│   │   ├── Review.tsx                # Review queue + push buttons (working, needs table fix)
│   │   ├── AIClean.tsx               # Normalization engine (working)
│   │   ├── ImportExport.tsx          # CSV/JSON with BOM (working)
│   │   ├── Settings.tsx              # API keys + config (working)
│   │   └── SystemLogs.tsx            # Logs (working)
│   ├── services/
│   │   ├── normalize.ts              # Phone/name/address/website/social normalization (working)
│   │   ├── matcher.ts                # Dedup matching + merge engine (working)
│   │   ├── pipeline.ts               # Pipeline orchestrator (working)
│   │   ├── validation.ts             # Business scoring + classification (working)
│   │   └── google-places.ts          # Google Places API (exists, NOT integrated)
│   └── stores/
│       └── index.ts                  # Zustand: scraperStore, reviewStore, settingsStore
├── package.json                      # React 18, Vite, Zustand, Supabase JS, TanStack Query, Sonner, Lucide
├── vite.config.ts
├── vercel.json                       # SPA rewrites
├── tsconfig.json
├── tailwind.config.js
├── supabase_schema.sql               # Original schema (reference only)
├── supabase_schema_v2.sql            # Pipeline schema (not applied yet)
└── cleanup_businesses.sql            # SQL to clean junk data
```

---

## 8. PRIORITY TASK LIST

### Phase 1: Fix Core Issues (Do First)
1. **Rewrite `src/lib/supabase.ts`**: Change table from `iraqi_businesses` → `businesses`, update Business type to match HUMUS columns, add category mapping function, fix upsert to use phone as conflict key, filter out phoneless entries
2. **Update `src/pages/Scraper.tsx`**: Apply category mapping after scraping, map lat/lng columns, apply governorate name mapping
3. **Update `src/pages/Review.tsx`**: Smart Push and Direct Push must target `businesses` table
4. **Run cleanup SQL** on Supabase to remove junk data

### Phase 2: Multi-Source Scraping (Do Second)
5. **Integrate Google Places API** into scraper flow alongside Overpass
6. **Add AI enrichment** using Claude API — verify phones, translate names, fill missing data
7. **Add source priority merge** — Google > AI > OSM

### Phase 3: Multi-App Pipeline (Do Third)
8. **Add university scraping mode** — separate pipeline targeting `universities` table
9. **Add pipeline mode selector** in Scraper UI (Businesses vs Universities)
10. **Add postcard generation** after business push

### Phase 4: Polish
11. **Add more sources**: Facebook, Instagram, Iraqi Yellow Pages
12. **Dashboard enhancements**: show per-source counts, push history, data quality trends

---

## 9. TESTING CHECKLIST

After making changes, verify:
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `npm run build` succeeds
- [ ] Scrape 1 governorate (Erbil) + 1 category (restaurant) → get results
- [ ] Stage All → AI Clean → Run Cleaning → duplicates removed, phones normalized
- [ ] Review → Select All → Direct Push → check `businesses` table in Supabase has new rows
- [ ] HUMUS app at `humuplus.vercel.app` shows the newly pushed businesses under correct category
- [ ] Export CSV → open in Excel → Arabic/Kurdish characters display correctly
- [ ] No data appears in wrong table (no business data in universities, no university data in businesses)

---

## 10. ENV VARIABLES

In `.env` (gitignored) and in Vercel Environment Variables:
```
VITE_SUPABASE_URL=https://mxxaxhrtccomkazpvthn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGF4aHJ0Y2NvbWthenB2dGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ5OTEsImV4cCI6MjA4ODgwMDk5MX0.RGhIU3C4WUCc6YBXktmXRXLT_wdrEbErKcd9VsFuE-8
```

User may also provide in Settings page:
- `GOOGLE_PLACES_API_KEY` — for Google Places scraping
- `ANTHROPIC_API_KEY` — for Claude AI enrichment

---

## REMEMBER
- **Don't rebuild** — the app works, just needs the fixes above
- **Don't mix tables** — businesses go to `businesses`, universities go to `universities`
- **Phone is required** — never push a business without a phone
- **Categories must map** — scraper keys → HUMUS category IDs
- **Arabic support** — UTF-8 BOM on all exports, preserve Arabic/Kurdish text
- **Be token-efficient** — only modify files that need changing
