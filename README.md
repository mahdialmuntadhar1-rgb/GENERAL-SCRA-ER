# SKYHIGH — Iraq Business Discovery (Supabase + Express)

This project now runs a real end-to-end flow:

1. Select city/category/sources in UI
2. Click **Start Collection**
3. Frontend calls `POST /api/run`
4. Backend runs real collectors (`osm`, optional `gemini`)
5. Results are inserted into Supabase
6. Admin dashboard/review queue read live records via backend APIs

## Database setup (Supabase)

Run the migration in Supabase SQL Editor:

- `supabase/migrations/20260330_businesses_schema.sql`

It creates the `businesses` table and required indexes.

## Environment variables

Create a `.env` file (or set env vars in runtime):

- `SUPABASE_URL` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (required, backend/server only)
- `GEMINI_API_KEY` (optional: enables Gemini adapter)

> `SUPABASE_ANON_KEY` is not required for this server-driven architecture.

## Start locally

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`.

## API endpoints

- `POST /api/run`
  - body:
    ```json
    {
      "city": "Baghdad",
      "category": "Restaurant",
      "sources": ["osm", "gemini"]
    }
    ```
- `GET /api/businesses?page=1&pageSize=20&city=Baghdad&search=coffee`
- `GET /api/dashboard-summary`
- `GET /api/health`

## Notes

- OSM/Nominatim is the first real non-Gemini collector.
- Gemini remains optional and should be treated as lower-confidence lead generation.
- No Firebase usage; Supabase is used server-side with service role key.
