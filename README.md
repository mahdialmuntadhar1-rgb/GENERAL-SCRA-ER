# Iraq University Platform — GENERAL-SCRA-ER

A Python desktop application for **scraping, validating, and managing** Iraqi university data with **Supabase** as the backend.

## Features

| Feature | Description |
|---|---|
| **Scraper** | Start/Stop OSM scraping with background threads — UI stays responsive |
| **Import** | Load CSV, Excel (.xlsx), or JSON files |
| **Validate** | Phone (E.164), email, URL, coordinate bounds, duplicate detection |
| **Classify** | Records auto-classified as **validated** or **needs review** |
| **Review & Approve** | Inspect staged records, remove bad rows, check duplicates |
| **Push to Supabase** | Insert/upsert approved records via REST API |
| **Browse** | Search & view universities already stored in Supabase |
| **Seed Data** | One-click seeding of all 18 Iraqi governorates |

## Prerequisites

- **Python 3.11+** (tested on 3.15 alpha — no compiled deps needed)
- A **Supabase** project ([dashboard.supabase.com](https://supabase.com/dashboard))

## Setup

### 1. Clone & install

```bash
git clone https://github.com/mahdialmuntadhar1-rgb/GENERAL-SCRA-ER.git
cd GENERAL-SCRA-ER
pip install -r requirements.txt
```

### 2. Create Supabase tables

1. Open your Supabase project → **SQL Editor**.
2. Paste and run the contents of **`supabase_schema.sql`**.
   This creates all 7 tables, indexes, RLS policies, and helper views.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```bash
# Supabase Configuration - Required
SCRAPER_SUPABASE_URL=https://your-project-id.supabase.co
SCRAPER_SUPABASE_KEY=your-anon-or-service-role-key-here

# Optional: Performance tuning
SCRAPER_THREAD_COUNT=4          # Concurrent threads (default: 4)
SCRAPER_BATCH_SIZE=100           # Batch insert size (default: 100)
SCRAPER_REQUEST_DELAY=2         # Seconds between requests (default: 2)
```

**⚠️ IMPORTANT**: Use your own private Supabase project. Do NOT use credentials from the public "belive" database.

**Legacy Variables Supported**: For backward compatibility, `SUPABASE_URL` and `SUPABASE_KEY` are still supported.

### 4. Run the application

```bash
python main.py
```

## Project Structure

```
GENERAL-SCRA-ER/
├── main.py                   # Entry point — launches GUI
├── supabase_schema.sql       # Full Supabase schema (run once)
├── requirements.txt
├── .env.example
├── .gitignore
├── db/
│   ├── client.py             # Lightweight REST client (requests-based)
│   └── crud.py               # CRUD for all 7 tables
├── models/
│   └── schemas.py            # Dataclass validation models
├── utils/
│   ├── validators.py         # Phone, email, URL, dedup
│   ├── text_utils.py         # Text cleaning / Arabic normalisation
│   └── importers.py          # CSV / Excel / JSON loader
├── scraper/
│   └── pipeline.py           # Scrape → normalise → validate → classify
└── gui/
    ├── app.py                # Main CustomTkinter window (5 tabs)
    └── frames/
        ├── import_frame.py   # Import tab
        ├── scraper_frame.py  # Scraper tab (Start/Stop + threading)
        ├── review_frame.py   # Review & Approve tab
        ├── browse_frame.py   # Browse Supabase data tab
        └── settings_frame.py # Settings & seed tab
```

## Supabase Tables

| Table | Purpose |
|---|---|
| `governorates` | 18 Iraqi governorates |
| `cities` | Cities linked to governorates |
| `universities` | Core university records |
| `university_contacts` | Phone, email, fax per university |
| `social_links` | Facebook, Instagram, etc. per university |
| `posts` | News / announcements |
| `opportunities` | Scholarships, jobs, events |

## How It Works

### Scraper flow (Scraper tab)
1. Click **▶ Start Scraping** — the pipeline runs in a background thread.
2. For each governorate, Overpass API is queried for universities/colleges.
3. Each record is normalised, validated (phone, email, coords), and classified:
   - **validated** — score ≥ 2, has a name + useful contact info.
   - **needs_review** — low score or missing key fields.
4. Click **■ Stop** at any time to cancel cleanly.
5. Results can be **staged** for review or **pushed directly** to Supabase.

### Import flow (Import tab)
1. Open a CSV/Excel/JSON file → columns are auto-mapped to schema fields.
2. **Validate & Stage** — phone numbers parsed with `phonenumbers`, emails regex-checked, duplicates flagged.
3. Staged records appear in the **Review & Approve** tab.

### Review & push
1. Inspect staged rows, select/deselect, remove bad data, check duplicates.
2. **Push to Supabase** — records are upserted. Governorates and cities are auto-created if they don't exist. Contacts and social links are inserted alongside each university.

## Performance & Rate Limits

### Overpass API Usage
The scraper uses the public Overpass API for OpenStreetMap data:

- **No API Key Required**: Free to use but subject to fair usage policies
- **Rate Limits**: Approximately 1-2 requests per second recommended
- **Request Timeout**: 60 seconds built-in, with 65-second client timeout
- **Concurrent Requests**: Not recommended - sequential processing is safer

### Recommended Settings

#### Development/Testing
```bash
SCRAPER_REQUEST_DELAY=3      # Conservative delay
SCRAPER_THREAD_COUNT=1      # Single thread for debugging
```

#### Production Use
```bash
SCRAPER_REQUEST_DELAY=2      # Balanced speed/respect
SCRAPER_THREAD_COUNT=2-4    # Moderate concurrency
SCRAPER_BATCH_SIZE=50-100    # Efficient database operations
```

#### Large Scale Scraping
```bash
SCRAPER_REQUEST_DELAY=1      # Faster but monitor for throttling
SCRAPER_THREAD_COUNT=4-8    # Higher concurrency if network allows
SCRAPER_BATCH_SIZE=200       # Larger batches for efficiency
```

### Handling Rate Limiting

If you encounter rate limiting:
1. **Increase `SCRAPER_REQUEST_DELAY`** - Add more time between requests
2. **Reduce `SCRAPER_THREAD_COUNT`** - Fewer concurrent requests
3. **Monitor Response Times** - Slow responses indicate server stress
4. **Use Off-Peak Hours** - Scrape during low-traffic periods

### Performance Tips

- **Database Operations**: Use batch inserts to reduce round trips
- **Memory Management**: Process large datasets in chunks
- **Error Recovery**: The scraper can resume from the last governorate
- **Monitoring**: Watch the GUI log for real-time progress and errors

### Interruption Handling

The scraper gracefully handles interruptions:
- **Manual Stop**: Click "■ Stop" for clean shutdown
- **Network Issues**: Automatic retry with exponential backoff
- **Server Errors**: Logged but processing continues with next governorate
- **Progress Saving**: Current state preserved for resumption

## Troubleshooting

### Common Issues

**"Overpass timeout"**
- Increase timeout in `pipeline.py` (line 68)
- Reduce search radius
- Check network connectivity

**"Rate limited"**
- Increase `SCRAPER_REQUEST_DELAY`
- Reduce `SCRAPER_THREAD_COUNT`
- Wait and retry later

**"Database connection failed"**
- Verify `SCRAPER_SUPABASE_URL` and `SCRAPER_SUPABASE_KEY`
- Check Supabase project status
- Ensure tables exist (run `supabase_schema.sql`)

**"No data returned"**
- Try different search parameters
- Check if OSM has data for that region
- Verify Overpass API is accessible

### Debug Mode

Enable verbose logging by setting:
```bash
SCRAPER_DEBUG=true
```

This provides detailed request/response information for troubleshooting.

## Deployment Notes

### Desktop Application Only
This is a **Python desktop application** and should NOT be deployed on:
- Vercel (serverless functions)
- Heroku (dynos)
- Any serverless platform

### Web Frontend Separation
If you need web access:
1. Deploy only the `web/` directory to Vercel/Netlify
2. Keep the Python desktop app for local use
3. Use the same Supabase backend for both

### Production Considerations
- Use environment variables for all configuration
- Implement proper logging for production monitoring
- Consider automated backups of Supabase data
- Monitor Overpass API usage and respect rate limits

## Dependencies

All pure-Python — no C/Rust compiler required:

- `requests` — HTTP client for Supabase REST API
- `python-dotenv` — loads `.env`
- `customtkinter` — modern desktop GUI
- `openpyxl` — Excel file reading
- `phonenumbers` — Iraqi phone number validation

## License

MIT
