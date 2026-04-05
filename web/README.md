# Unified Iraq Business Directory Scraper

A React-based web dashboard for scraping, validating, and managing Iraqi business data with Supabase as the backend.

## Ownership & database boundary

- This `web/` app belongs to **GENERAL-SCRA-ER**, the only active scraper dashboard frontend.
- It connects to scraper/internal tables for staging/review/cleaning flows and then publishes validated data to production destination tables.
- It is **not** the public-facing `belive` app and must not use `belive` runtime DB configuration.
- `18-AGENTS` and `SKYHIGH` are legacy/reference-only repos.

### Source of truth
- Scraper UI/frontend source of truth: `GENERAL-SCRA-ER/web`
- Public app source of truth: `belive`


## Features

- **Dashboard**: Overview of collected data with charts and statistics
- **Scraper**: Start/Stop scraping with background processing, configurable by governorate and category
- **Review**: Inspect staged businesses, classify as validated/needs-review, push to Supabase
- **Browse**: Search, filter, and export businesses from Supabase
- **Settings**: Configure API keys, test connections, seed data

## Tech Stack

- React 18 + TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- Zustand (state management)
- TanStack Query (data fetching)
- Supabase (backend)
- Recharts (charts)

## Setup

1. Install dependencies:
```bash
cd web
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Add your Supabase credentials to `.env.local`:
```
VITE_SCRAPER_SUPABASE_URL=https://your-scraper-project.supabase.co
VITE_SCRAPER_SUPABASE_ANON_KEY=your-scraper-anon-key
```

4. Run the Supabase schema in your Supabase SQL Editor:
- Open `supabase_schema.sql`
- Copy and run in Supabase SQL Editor

5. Start the development server:
```bash
npm run dev
```

## Data Pipeline

### Table ownership
- Internal scraper tables: `businesses_import_raw`, `businesses_staging`, `businesses_review_queue`, `scrape_batches`
- Production destination table: `iraqi_businesses` (published validated records consumed by public app)

1. **Scrape**: Select governorates and categories, click "Start Scraping"
2. **Validate**: Each business is scored and classified:
   - Validated: Has name + phone/website/address + coordinates
   - Needs Review: Missing key fields
3. **Stage**: Review businesses, select/deselect, remove bad data
4. **Push**: Selected businesses are upserted to Supabase
5. **Export**: Browse and export to CSV

## Architecture

- `src/config/iraq.ts`: 18 governorates + 12 business categories with OSM tags
- `src/lib/supabase.ts`: Supabase client + CRUD operations
- `src/services/validation.ts`: Phone normalization, email/URL validation
- `src/stores/`: Zustand stores for scraper state, review queue, settings
- `src/pages/`: Dashboard, Scraper, Review, Browse, Settings pages
