# Production Deployment Guide

## 🚀 Deployment Checklist

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Set Up Environment Variables

#### Frontend (.env)
Create `web/.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Backend (Vercel Dashboard)
In your Vercel project settings, add these Environment Variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Same as VITE_SUPABASE_URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (NOT anon key) | ✅ |
| `ANTHROPIC_API_KEY` | For AI cleaning features | Optional |
| `GOOGLE_PLACES_API_KEY` | For Google Places enrichment | Optional |

**Important:** API keys are now stored server-side for security!

### 3. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

### 4. Configure Supabase

Ensure your Supabase project has these tables:
- `businesses` - Main production table
- `businesses_import_raw` - Raw import staging
- `businesses_staging` - Normalized staging
- `businesses_review_queue` - Review queue

Run the schema file: `supabase_schema_v2.sql`

### 5. Verify Deployment

Check these endpoints after deployment:

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Stats
curl https://your-app.vercel.app/api/stats

# Check scraper servers
curl https://your-app.vercel.app/api/scraper/servers
```

## 📁 New Files Added

### API Layer (`api/`)
- `api/index.ts` - Main API router
- `api/scraper.ts` - Scraper job management
- `api/pipeline.ts` - Pipeline operations
- `api/stats.ts` - Statistics aggregation
- `api/health.ts` - Health checks
- `api/auth.ts` - Authentication

### Frontend Updates
- `src/services/api.ts` - Frontend API client
- `src/components/ErrorBoundary.tsx` - Error handling
- `src/lib/supabase.ts` - Updated getStats to use API
- `src/main.tsx` - Added ErrorBoundary wrapper

### Configuration
- `vercel.json` - API routes, CORS, environment variables
- `package.json` - Added `@vercel/node` dependency
- `.env.example` - Updated documentation

## 🔒 Security Improvements

1. **API Keys Hidden**: Anthropic & Google Places keys moved server-side
2. **Service Role Key**: Backend uses service role for admin operations
3. **CORS Headers**: Configured for API endpoints
4. **Error Boundaries**: Production-safe error handling

## 📊 New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | System health check |
| `/api/stats` | GET | Business statistics |
| `/api/stats/quality` | GET | Quality breakdown |
| `/api/stats/categories` | GET | Category distribution |
| `/api/scraper/start` | POST | Start scraper job |
| `/api/scraper/status` | GET | Check scraper status |
| `/api/scraper/servers` | GET | Available Overpass servers |
| `/api/pipeline/run` | POST | Run full pipeline |
| `/api/pipeline/status` | GET | Check pipeline status |
| `/api/pipeline/normalize` | POST | Normalize batch |
| `/api/pipeline/match` | POST | Match staging |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/session` | GET | Get current session |

## ⚡ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Vercel API     │────▶│   Supabase      │
│   (Browser)     │◄────│  (Serverless)   │◄────│   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  External APIs  │
                        │  - Overpass     │
                        │  - Google Places│
                        │  - Anthropic    │
                        └─────────────────┘
```

## 🔄 Job Queue System

Long-running operations (scraper, pipeline) now use a fire-and-forget pattern:

1. Client calls `/api/scraper/start` with jobId
2. Server immediately returns 202 Accepted
3. Server runs job in background
4. Client polls `/api/scraper/status?jobId=xxx` for progress

This prevents Vercel function timeouts (max 60s).

## 🛠️ Next Steps

1. **Authentication UI**: Add login/register pages
2. **Redis Queue**: For production-scale job queueing
3. **Monitoring**: Add Sentry for error tracking
4. **Rate Limiting**: Implement API rate limits
5. **WebSockets**: Real-time job progress updates

## 📝 Environment Variables Reference

### Frontend (Browser)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key

### Backend (Vercel Functions)
- `SUPABASE_URL` - Same as above
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for backend operations
- `ANTHROPIC_API_KEY` - Claude AI access
- `GOOGLE_PLACES_API_KEY` - Places API access

## 🐛 Troubleshooting

### API 404 Errors
Make sure `vercel.json` has the rewrites configured correctly.

### CORS Errors
API endpoints include CORS headers by default. Check browser console for details.

### Job Queue Lost on Deploy
The in-memory job store resets on deployment. For production, use Redis or a database-backed queue.

### Environment Variables Not Working
- Frontend vars need `VITE_` prefix
- Backend vars are set in Vercel Dashboard
- Redeploy after changing env vars

## ✅ Production Ready Features

- ✅ API layer with hidden keys
- ✅ Error boundaries
- ✅ Health checks
- ✅ Real-time stats
- ✅ Job queue system
- ✅ CORS configured
- ✅ TypeScript throughout
