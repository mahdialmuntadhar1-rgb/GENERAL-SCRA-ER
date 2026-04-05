# belive Repo Follow-up Required (Repository Not Present Here)

`belive` is not checked out in this workspace (`/workspace` contains only `GENERAL-SCRA-ER`).
To complete the cross-repo ownership lock, apply the following in `belive`:

1. Add a root ownership doc that declares:
   - belive is the public-facing app only.
   - It reads only production/public tables.
   - It must never use scraper staging/review/internal tables.
   - `18-AGENTS` and `SKYHIGH` are legacy/reference only.

2. Rename/clarify env vars to public-specific names, for example:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - (optional fallback to old names during transition)

3. Remove references to scraper-dashboard ownership from belive docs/comments.

4. Add a source-of-truth section:
   - Public app source of truth: `belive`
   - Scraper dashboard source of truth: `GENERAL-SCRA-ER`
