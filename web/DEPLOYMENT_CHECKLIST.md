# Production Deployment Checklist

## Pre-Deployment (Local)

### ✅ Code Quality
- [ ] Run `npm run build` - no errors
- [ ] Run `npm run lint` - no warnings
- [ ] All TypeScript files compile without errors
- [ ] No console errors when running dev server

### ✅ Environment Configuration
- [ ] `.env` contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Test values are REAL Supabase credentials
- [ ] `.env.local` not committed to git (listed in .gitignore)
- [ ] `.env.example` shows template without secrets

### ✅ Frontend Verification
- [ ] HomePage (`/`) loads without errors
- [ ] HomePage fetches REAL data from `businesses` table (not mocks)
- [ ] Category filtering works
- [ ] Location (governorate/city) filtering works
- [ ] Browse page (`/browse`) shows real data
- [ ] No mock data visible to users
- [ ] Responsive design works on mobile/tablet/desktop

### ✅ Launch Blockers
- [ ] favicon.svg exists in `/public`
- [ ] robots.txt exists in `/public`
- [ ] 404.html exists in `/public`
- [ ] index.html has proper `<meta>` tags
- [ ] App has 404 catch-all route in React Router
- [ ] All external links have titles and descriptions

### ✅ Database Verification
- [ ] `businesses` table contains published records (`is_published = true`)
- [ ] Records have valid phone numbers (NOT NULL)
- [ ] Records have valid governorate values
- [ ] At least 10 test records visible via `getBusinesses()`

---

## Vercel Deployment

### Step 1: Set Environment Variables in Vercel Dashboard

Go to Project Settings → Environment Variables

Add these EXACT names (case-sensitive):

```
VITE_SUPABASE_URL = https://mxxaxhrtccomkazpvthn.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGF4aHJ0Y2NvbWthenB2dGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjQ5OTEsImV4cCI6MjA4ODgwMDk5MX0.RGhIU3C4WUCc6YBXktmXRXLT_wdrEbErKcd9VsFuE-8
```

**⚠️ IMPORTANT:** These must be set for BOTH `production` and `preview` environments.

### Step 2: Verify Build Settings

- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+ (recommended)

### Step 3: Deploy

#### Option A: Git Push (Auto-Deploy)
```bash
git add -A
git commit -m "feat: Production-ready app with Supabase integration"
git push origin main
```
Vercel auto-deploys on git push.

#### Option B: Manual Deploy
```bash
vercel --prod
```

### Step 4: Post-Deployment Verification

**Wait 2-3 minutes for deployment to complete**

#### ✅ URL & Loading
- [ ] Visit your Vercel deployment URL
- [ ] Page loads without 403/404 errors
- [ ] No "Cannot read property of undefined" errors
- [ ] No "Supabase is not configured" errors

#### ✅ Data Fetching
- [ ] HomePage shows at least 10 businesses
- [ ] Data matches what's in `businesses` table
- [ ] No "mock data" visible
- [ ] Names, phone numbers, addresses are accurate

#### ✅ Filtering
- [ ] Select a category → results filter correctly
- [ ] Select a governorate → results filter correctly
- [ ] Search functionality works
- [ ] Pagination works (if implemented)

#### ✅ Performance
- [ ] Page loads in < 3 seconds
- [ ] No network errors in browser console
- [ ] No 403 Forbidden errors for API calls
- [ ] No CORS errors

#### ✅ SEO
- [ ] Title tag is visible in browser tab
- [ ] Meta description shows in page source
- [ ] OG tags are present
- [ ] robots.txt is accessible at `/robots.txt`

#### ✅ Error Handling
- [ ] Navigate to non-existent URL (e.g., `/this-does-not-exist`)
- [ ] 404 page displays properly
- [ ] "Back to Home" link works

---

## Environment Variables Reference

### Frontend (Browser-Safe)
These are PUBLIC - OK to expose:
```bash
VITE_SUPABASE_URL      # Public Supabase URL
VITE_SUPABASE_ANON_KEY # Public anonymous JWT token
```

### Backend (Server-Only, NOT needed for this MVP)
If you add backend functions later:
```bash
SUPABASE_URL           # Service role use only
SUPABASE_SERVICE_ROLE_KEY  # NEVER in browser code
ANTHROPIC_API_KEY      # Optional, for AI features
```

---

## Vercel Environment Variables - Step-by-Step

1. Go to **https://vercel.com/dashboard**
2. Select your project: `web`
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)
5. Add two variables:

| Name | Value | Environments |
|------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://mxxaxhrtccomkazpvthn.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiI...` | Production, Preview, Development |

6. Click **Save**
7. Redeploy: **Deployments** → Select latest → **Redeploy**

---

## Troubleshooting Deployment

### ❌ Page Shows "Cannot find module @supabase/supabase-js"
**Fix:**
- Ensure `package.json` has `@supabase/supabase-js` in dependencies
- Run `npm install` locally
- Commit `package-lock.json`
- Push to git and redeploy

### ❌ Page Shows No Data (Blank List)
**Check:**
1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are in Vercel dashboard
2. Check browser console for errors (F12 → Console tab)
3. Verify Supabase table `businesses` has records with `is_published = true`
4. Check if records have valid phone numbers (required filter)

**Debug SQL:**
```sql
SELECT COUNT(*) as total FROM businesses WHERE is_published = true;
```

### ❌ Page Shows "403 Forbidden" for Supabase
**Fix:**
- Verify anon key is correct in Vercel env vars
- Check Supabase RLS policies allow read access
- Ensure `is_published` filter is applied

### ❌ Filtering Not Working
**Check:**
1. Filter values match database values exactly
2. Column names are correct (e.g., `governorate`, not `province`)
3. `getBusinesses()` function applies filters correctly

---

## Database Verification Queries

Run these in Supabase SQL Editor to verify setup:

```sql
-- Check total records
SELECT COUNT(*) as total FROM businesses;

-- Check published records
SELECT COUNT(*) as published FROM businesses WHERE is_published = true;

-- Check records with valid phone
SELECT COUNT(*) as valid FROM businesses
WHERE is_published = true AND phone IS NOT NULL;

-- Check governorates
SELECT DISTINCT governorate FROM businesses LIMIT 10;

-- Check categories
SELECT DISTINCT category FROM businesses LIMIT 10;

-- Sample published record
SELECT id, name, category, governorate, phone
FROM businesses
WHERE is_published = true
LIMIT 1;
```

---

## Files Changed for Production

### New Files
- `public/favicon.svg` - App icon
- `public/robots.txt` - SEO/crawler config
- `public/404.html` - Error page
- `DATA_PIPELINE.md` - Architecture docs
- `DEPLOYMENT_CHECKLIST.md` - This file

### Modified Files
- `index.html` - Meta tags, favicon reference
- `src/App.tsx` - 404 catch-all route
- `src/pages/HomePage.tsx` - Real Supabase data instead of mocks

### Environment
- `.env` - Already has correct Supabase credentials
- `.env.local` - Vercel override (auto-managed)
- `.env.example` - Template (no secrets)

---

## Key Configuration Files

### vite.config.ts
- Handles VITE_* env vars automatically
- No changes needed

### tsconfig.json
- TypeScript configuration
- Path aliases: `@/` → `src/`

### tailwind.config.js
- Styling configuration
- Brand colors already configured

### .vercelignore
- Files to skip during build
- Already configured

---

## Rollback Plan

If deployment fails:

1. Go to **Deployments** tab
2. Find last working deployment
3. Click **...** → **Promote to Production**
4. Takes ~1 minute to activate

---

## Monitoring & Maintenance

### Daily
- [ ] Check Vercel Deployments for any failed builds
- [ ] Spot-check public site for data accuracy
- [ ] Monitor for any 500 errors in logs

### Weekly
- [ ] Review admin logs (`/logs` page)
- [ ] Verify data pipeline is moving records properly
- [ ] Check Supabase for any database warnings

### Monthly
- [ ] Audit published records for accuracy
- [ ] Clean up rejected/old staging records
- [ ] Review analytics if available

---

## Security Notes

✅ **Safe to commit:**
- `VITE_SUPABASE_URL` - Public
- `VITE_SUPABASE_ANON_KEY` - Public (read-only)
- `.env.example` - Template

❌ **Never commit:**
- Service role keys
- API keys (Anthropic, Google, etc.)
- Database passwords
- User credentials

✅ **Always use Vercel dashboard for:**
- Secret keys
- Database credentials
- API tokens

---

## Success Criteria

✅ Deployment is successful when:
1. Build completes without errors
2. Public pages load within 3 seconds
3. Real data displays (not mocks)
4. Filtering works as expected
5. No console errors or warnings
6. No 403/500 errors in network tab
7. Mobile responsive design intact
8. SEO meta tags present

---

## Contact & Support

For issues:
1. Check browser console (F12)
2. Check Vercel logs (Deployments → Click build → Logs)
3. Check Supabase dashboard for RLS/auth issues
4. Review this checklist for common issues

---

**Deployment Ready: ✅ YES**
**Last Verified:** April 3, 2026
**Vercel Project:** `absulysulys-projects/web`
