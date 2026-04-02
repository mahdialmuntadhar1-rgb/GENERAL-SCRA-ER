# Unified Iraq Business Directory Scraper

A React-based web dashboard for scraping, validating, and managing Iraqi business data with Supabase as the backend.

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
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the Supabase schema in your Supabase SQL Editor:
- Open `supabase_schema.sql`
- Copy and run in Supabase SQL Editor

5. Start the development server:
```bash
npm run dev
```

## Data Pipeline

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
