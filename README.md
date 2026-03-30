# Iraq City-Center Business Acquisition & Verification Pipeline

This project now implements a **modular source-selector architecture** for city-center business discovery in Iraq, with strict quality and central-zone controls.

## Implemented Deliverables

- Provider-based connector architecture with a shared interface:
  - `searchBusinesses(input)`
  - `enrichBusiness(record)`
  - `validateRecord(record)`
  - `mapToCanonicalSchema(record)`
- Source selector UI with provider checkboxes, select-all, toggles, city/category/subcategory/district selectors, priority mode, execution mode, limits, duplicate tolerance, verification strictness.
- Canonical business schema with quality/verification/duplicate/suburb risk scoring.
- Execution modes: sequence/parallel + stop threshold + fallback search behavior.
- Free-tier-first strategy and provider metadata.
- Central-city enforcement via per-city central-zone allowlist.
- Validation and enrichment utilities:
  - phone normalization
  - URL/social validation
  - address/city/district normalization
  - junk placeholder detection
- Merge logic with duplicate keying, field confidence, and evidence aggregation.
- Import/export service hooks for CSV/XLSX/JSON payloads.
- QC workflow statuses:
  - Pending Review
  - Needs Cleaning
  - Needs Verification
  - Verified
  - Rejected
  - Export Ready
  - Outside Central Coverage
- API endpoints:
  - `GET /api/providers`
  - `GET /api/cities/central-zones`
  - `POST /api/run`
  - `POST /api/import`
  - `POST /api/export`

## Canonical Schema

See `src/types.ts` (`CanonicalBusinessRecord`) for the full schema fields, including:
- identity & location
- contact & social
- source attribution
- quality/verification scoring
- QC status and notes

## Provider Configuration

See `src/server/pipeline/config/providers.ts` for metadata and capabilities of:
- Geoapify
- Foursquare
- HERE
- TomTom
- OSM/Nominatim
- SerpApi
- Outscraper
- Apify
- CSV upload
- XLSX upload
- JSON upload

## Central City Enforcement

See `src/server/pipeline/config/centralZones.ts`.
Records outside central allowlist zones are flagged as **Outside Central Coverage**, blocked from auto-publish, and require manual review.

## TODO: API Keys & Provider Setup

1. Configure environment variables and secrets for each provider client:
   - `GEOAPIFY_API_KEY`
   - `FOURSQUARE_API_KEY`
   - `HERE_API_KEY`
   - `TOMTOM_API_KEY`
   - `SERPAPI_API_KEY`
   - `OUTSCRAPER_API_KEY`
   - `APIFY_API_TOKEN`
2. Replace mock connector implementation in `GenericProviderConnector.searchBusinesses` with real provider SDK/API calls.
3. Add source-specific rate limiting and retry policies.
4. Add persistent QC/audit tables in Supabase for:
   - field-level attribution
   - merge history
   - review queue transitions
   - import/export job history
5. Add real CSV/XLSX parsing on backend for file uploads (multipart ingestion).
6. Add XLSX/CSV export generation and downloadable files.

## Local Run

```bash
npm install
npm run dev
```
