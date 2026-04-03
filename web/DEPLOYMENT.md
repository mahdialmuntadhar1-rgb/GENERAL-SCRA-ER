# Vercel Deployment (Frontend-Only)

This repository is a **mixed architecture** project, not a single web app.

- Root (`/`) = Python desktop scraper (CustomTkinter) started by `main.py`
- `web/` = React + Vite frontend
- Supabase = database/backend service

If Vercel is pointed at repo root, deployment will fail because Vercel sees Python files and/or runs commands from the wrong directory.

---

## Why your deployment failed

### 1) `vite: command not found`
This happens when build runs at repository root, where there is no `package.json` and no local Vite dependency. Vite exists under `web/package.json`, so build must run with root directory set to `web/`.

### 2) `No python entrypoint found`
When Vercel detects Python from root files (for example `main.py`), it tries Python/serverless expectations (WSGI/ASGI/handler-style entrypoint). This repo’s Python code is a **desktop GUI app**, not a Vercel Python function.

---

## Correct deployment target
Deploy **only** `web/` to Vercel.

### Required Vercel settings
- **Root Directory:** `web`
- **Framework Preset:** `Vite`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` (default is fine)

### Environment variables for frontend
Set in Vercel project settings:
- `VITE_SCRAPER_SUPABASE_URL`
- `VITE_SCRAPER_SUPABASE_ANON_KEY`

Optional server-side API keys (only if using `web/api/*` endpoints):
- `SCRAPER_SUPABASE_URL`
- `SCRAPER_SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_PLACES_API_KEY`

---

## `vercel.json`
Use this inside `web/vercel.json`:

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.ts" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> Note: For frontend-only deployment, this file is enough. Python desktop code is intentionally not deployed.

---

## Ownership guardrails
- `GENERAL-SCRA-ER/web` is internal scraper tooling only.
- `belive` is public app only.
- `18-AGENTS` and `SKYHIGH` are legacy/reference only and not active connection targets.

---

## Recommended architecture

```text
[User Browser]
     |
     v
[Vercel: web/ React+Vite app + optional /api serverless routes]
     |
     v
[Supabase: Postgres + Auth + Storage]

[Local/VM Python Scraper (main.py + gui/ + scraper/)]
     |
     v
[Supabase]
```

- Frontend on Vercel
- Scraper runs locally (or on a Python-capable host), not Vercel
- Supabase remains shared backend datastore

---

## Step-by-step deployment

1. In Vercel, import this GitHub repo.
2. In project setup, set **Root Directory** to `web`.
3. Confirm preset/build output values above.
4. Add `VITE_SCRAPER_SUPABASE_URL` and `VITE_SCRAPER_SUPABASE_ANON_KEY`.
5. Deploy.
6. If routes 404 on refresh, verify `web/vercel.json` rewrites are present.

---

## Scraper hosting options

### Option A (recommended now): keep scraper local
- Run with `python main.py` on your machine/server.
- Pros: no refactor, full GUI, easiest path.
- Cons: requires always-on machine for continuous scraping.

### Option B: convert scraper to FastAPI service
- Extract scraping pipeline into HTTP jobs (start/status/result).
- Host on Railway/Render/Fly.io/VM, keep Vercel only for frontend.
- Pros: centralized, automatable, no GUI dependency.
- Cons: extra backend engineering + ops.
