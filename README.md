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
| **Persistence Queue** | Immediate persistence for validated businesses with queue management |
| **Chatbot Interface** | Conversational configuration for scraper settings |

## Prerequisites

- **Python 3.11+** (tested on 3.15 alpha — no compiled deps needed)
- **Node.js 18+** (for web frontend)
- A **Supabase** project ([dashboard.supabase.com](https://supabase.com/dashboard))

## Setup

### 1. Clone & install

```bash
git clone https://github.com/mahdialmuntadhar1-rgb/GENERAL-SCRA-ER.git
cd GENERAL-SCRA-ER

# Python dependencies
pip install -r requirements.txt

# Web frontend dependencies
cd web
npm install
cd ..
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

# Web frontend configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**⚠️ IMPORTANT**: Use your own private Supabase project. Do NOT use credentials from the public "belive" database.

**Legacy Variables Supported**: For backward compatibility, `SUPABASE_URL` and `SUPABASE_KEY` are still supported.

### 4. Run the applications

#### Python Desktop App
```bash
python main.py
```

#### Web Frontend
```bash
cd web
npm run dev
```

The web interface will be available at `http://localhost:3000`.

## Project Structure

```
GENERAL-SCRA-ER/
├── main.py                   # Entry point — launches GUI
├── supabase_schema.sql       # Full Supabase schema (run once)
├── requirements.txt
├── .env.example
├── .gitignore
├── web/                      # React web frontend
│   ├── src/
│   │   ├── pages/
│   │   │   └── Scraper.tsx   # Main scraper interface
│   │   ├── components/
│   │   │   └── ScraperChatbot.tsx # Chatbot interface
│   │   └── services/
│   │       └── persistence.ts # Queue management
│   ├── package.json
│   └── vite.config.ts
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

## New Features

### Persistence Queue
- **Immediate Persistence**: Validated businesses are automatically queued for database storage during scraping
- **Queue Management**: Efficient batching and throttling of database operations
- **Flush Operation**: Ensures all queued items are persisted when scraping completes
- **Error Handling**: Robust error recovery and retry mechanisms

### Chatbot Interface
- **Natural Language Configuration**: Use conversational commands to set scraper parameters
- **Intelligent Parsing**: Automatically extracts governorates, categories, and limits from user input
- **Interactive Suggestions**: Get recommendations for optimal scraper settings
- **Real-time Feedback**: See configuration changes applied instantly

## How It Works

### Scraper flow (Web Interface)
1. **Configure Settings**: Use the chatbot or manual controls to set governorates, categories, and limits
2. **Start Scraping**: Click **▶ Start** - the pipeline runs with persistence queue management
3. **Real-time Persistence**: Validated businesses are immediately queued for database storage
4. **Monitor Progress**: Watch real-time updates and queue statistics
5. **Automatic Flush**: All remaining items are persisted when scraping completes

### Chatbot Configuration
1. **Open Chat**: Click the chatbot button in the scraper interface
2. **Natural Commands**: Type requests like "show me restaurants in Baghdad" or "find 20 cafes with high quality data"
3. **Auto-Apply**: The chatbot parses your request and applies the settings
4. **Verify**: Check the applied configuration in the main interface

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

### Web Frontend Deployment
The React web frontend can be deployed to:
- **Vercel** (recommended)
- **Netlify**
- **Any static hosting platform**

#### Vercel Deployment
```bash
cd web
npm run build
npx vercel --prod
```

### Desktop Application Only
The Python desktop app should NOT be deployed on:
- Vercel (serverless functions)
- Heroku (dynos)
- Any serverless platform

### Production Considerations
- Use environment variables for all configuration
- Implement proper logging for production monitoring
- Consider automated backups of Supabase data
- Monitor Overpass API usage and respect rate limits

## Dependencies

### Python Dependencies
All pure-Python — no C/Rust compiler required:
- `requests` — HTTP client for Supabase REST API
- `python-dotenv` — loads `.env`
- `customtkinter` — modern desktop GUI
- `openpyxl` — Excel file reading
- `phonenumbers` — Iraqi phone number validation

### Web Frontend Dependencies
- `React` — UI framework
- `TypeScript` — Type safety
- `TailwindCSS` — Styling
- `Vite` — Build tool
- `Lucide React` — Icons

## License

MIT
