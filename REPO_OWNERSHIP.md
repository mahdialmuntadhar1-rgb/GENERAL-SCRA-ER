# Repository & Database Ownership Contract

## Purpose
`GENERAL-SCRA-ER` is the **official internal scraper / staging / review / AI-cleaning / export application**.
It is the **only active scraper frontend/dashboard source of truth**.

## Permanent pipeline ownership (this repo)
1. Import / scrape
2. Staging normalization
3. Human review queue
4. AI cleaning/enrichment
5. Validated/clean approval
6. Publish to production destination table(s)

## Database boundary
### Scraper/internal tables owned by this repo
- `businesses_import_raw`
- `businesses_staging`
- `businesses_review_queue`
- `scrape_batches`
- supporting pipeline metadata tables/views

### Production destination table(s) this repo may publish into
- `iraqi_businesses` (validated records published for public consumption)

> This repo may publish into production destination tables, but it is not the public app runtime.

## Not allowed
- Do not treat this repo as the public consumer app.
- Do not connect this repo using belive public runtime DB credentials.
- Do not reconnect legacy repos as active dashboard backends.

## Legacy/reference-only repos
- `18-AGENTS`
- `SKYHIGH`

These may be read only for historical/code-reference purposes when explicitly requested.

## Source of truth
- **Scraper dashboard/frontend source of truth:** `GENERAL-SCRA-ER`
- **Public app source of truth:** `belive`
- **Public data destination:** production/public table(s) consumed by `belive`
