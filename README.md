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

```
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<your_anon_or_service_role_key>
```

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

## Safe Defaults

- Fields that are missing or unclear are stored as `NULL` — never guessed.
- `data_quality` defaults to `"unverified"`.
- `verified` defaults to `false`.

## Dependencies

All pure-Python — no C/Rust compiler required:

- `requests` — HTTP client for Supabase REST API
- `python-dotenv` — loads `.env`
- `customtkinter` — modern desktop GUI
- `openpyxl` — Excel file reading
- `phonenumbers` — Iraqi phone number validation

## Vercel Deployment Note

This repository contains a Python desktop application at the root and a separate Vite frontend in `web/`.

- Deploy to Vercel from **`web/` only**.
- Do **not** deploy the Python desktop app (`main.py`, `gui/`, `scraper/`) to Vercel.

See `web/DEPLOYMENT.md` for exact Vercel settings.

## License

MIT
