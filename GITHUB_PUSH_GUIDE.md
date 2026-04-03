# GitHub Push Guide - Connect HUMUPLUS Frontend to Backend

**Date:** April 3, 2026
**Frontend Repo:** mahdialmuntadhar1-rgb/HUMUPLUS
**Backend Repo:** mahdialmuntadhar1-rgb/belive
**Task:** Push new Version 1 UI to GitHub & ensure frontend-backend compatibility

---

## 📋 Pre-Push Checklist

Before pushing, verify:

- [ ] You have write access to both repos
- [ ] GitHub credentials are configured (SSH or HTTPS)
- [ ] Both repos are cloned locally
- [ ] No uncommitted changes that would cause conflicts

---

## 🔍 Step 1: Verify Backend API Structure

First, check your backend (belive repo) to understand the API endpoints:

### What to Look For:
```bash
cd belive

# Find API routes/endpoints
find . -name "*.ts" -o -name "*.js" | grep -E "(route|api|controller)" | head -20

# Look for Supabase configuration
grep -r "supabase" . --include="*.ts" --include="*.js" | head -10

# Check environment variables
cat .env.example
```

### Expected Backend Structure:
```
belive/
├── src/
│   ├── api/
│   │   ├── businesses/
│   │   │   ├── GET /api/businesses
│   │   │   ├── GET /api/businesses/:id
│   │   │   ├── POST /api/businesses (create)
│   │   │   ├── PUT /api/businesses/:id (update)
│   │   │   └── DELETE /api/businesses/:id
│   │   ├── categories/
│   │   ├── locations/
│   │   └── auth/
│   ├── middleware/
│   ├── services/
│   │   └── supabase.ts
│   └── server.ts
├── package.json
├── .env.example
└── README.md
```

### Critical Backend Endpoints to Verify:
```
GET    /api/businesses                    (list all)
GET    /api/businesses?governorate=X      (filter by governorate)
GET    /api/businesses?city=X             (filter by city)
GET    /api/businesses?category=X         (filter by category)
GET    /api/businesses/:id                (get single business)
POST   /api/businesses                    (create new business)
PUT    /api/businesses/:id                (update business)
DELETE /api/businesses/:id                (delete business)
```

---

## 🎯 Step 2: Verify Frontend Structure

Check current HUMUPLUS structure:

```bash
cd HUMUPLUS

# List structure
tree src -L 2

# Check current environment setup
cat .env.example

# Check package.json dependencies
grep -E '"dependencies|devDependencies' package.json -A 20
```

---

## ✅ Step 3: Compatibility Check (Frontend ↔ Backend)

### Frontend Expects Backend to Provide:

#### 1. **Business Data Structure**
```typescript
// Frontend expects this shape from API
interface Business {
  id: string;
  name: string;
  nameAr?: string;
  nameKu?: string;
  category: string;          // Must match: dining_cuisine, cafe_coffee, etc.
  governorate: string;       // Must match: Baghdad, Erbil, etc.
  city: string;              // Must match: Kadhimiya, etc.
  address: string;
  phone: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  isFeatured?: boolean;
  website?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

#### 2. **API Endpoints Frontend Needs**
```javascript
// In HomePage.tsx, the app will call:
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('governorate', selectedGovernorate)
  .eq('city', selectedCity)
  .eq('category', selectedCategory);
```

✅ **This uses Supabase directly** (not via REST API)

#### 3. **Environment Variables Frontend Needs**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🚀 Step 4: Prepare Frontend Code for Push

### Copy All New Files to HUMUPLUS Repository

From: `/sessions/compassionate-dazzling-dirac/mnt/GENERAL-SCRA-ER/`

To: `mahdialmuntadhar1-rgb/HUMUPLUS/`

```bash
# Navigate to HUMUPLUS repo
cd HUMUPLUS/web

# Copy component files
mkdir -p src/pages
mkdir -p src/components/home
mkdir -p src/stores
mkdir -p src/styles

# Copy the files
cp /path/to/HomePage.tsx src/pages/
cp /path/to/components/home/*.tsx src/components/home/
cp /path/to/homeStore.ts src/stores/
cp /path/to/humus-design.css src/styles/
```

### File Mapping:
```
GENERAL-SCRA-ER/web/src/
├── pages/
│   └── HomePage.tsx                → HUMUPLUS/web/src/pages/HomePage.tsx
│
├── components/home/
│   ├── HeroSection.tsx             → HUMUPLUS/web/src/components/home/HeroSection.tsx
│   ├── LocationFilter.tsx          → HUMUPLUS/web/src/components/home/LocationFilter.tsx
│   ├── CategoryGrid.tsx            → HUMUPLUS/web/src/components/home/CategoryGrid.tsx
│   ├── TrendingSection.tsx         → HUMUPLUS/web/src/components/home/TrendingSection.tsx
│   └── FeedComponent.tsx           → HUMUPLUS/web/src/components/home/FeedComponent.tsx
│
├── stores/
│   └── homeStore.ts                → HUMUPLUS/web/src/stores/homeStore.ts
│
└── styles/
    └── humus-design.css            → HUMUPLUS/web/src/styles/humus-design.css
```

---

## 📝 Step 5: Update HUMUPLUS App.tsx

Your `App.tsx` needs to include the new HomePage:

```typescript
// HUMUPLUS/web/src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import Scraper from '@/pages/Scraper';        // Your existing page
import Review from '@/pages/Review';          // Your existing page

function App() {
  return (
    <Router>
      <Routes>
        {/* NEW: Version 1 Homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Existing pages */}
        <Route path="/scraper" element={<Scraper />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## 🎨 Step 6: Update Main.tsx for Design System

Your `main.tsx` needs to import the design CSS:

```typescript
// HUMUPLUS/web/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/humus-design.css'  // ADD THIS LINE

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

## 📦 Step 7: Install Dependencies

Make sure you have all required packages:

```bash
cd HUMUPLUS/web

# Check what's already installed
npm list lucide-react zustand

# Install if missing
npm install lucide-react zustand

# Verify
npm list lucide-react zustand
```

Expected output:
```
├── lucide-react@0.x.x
└── zustand@x.x.x
```

---

## 🧪 Step 8: Test Locally Before Pushing

### 1. Start the dev server
```bash
cd HUMUPLUS/web
npm run dev
```

### 2. Test the homepage
- Navigate to: `http://localhost:5173/`
- Verify:
  - ✅ Hero carousel displays and auto-plays
  - ✅ Location filter shows governorates
  - ✅ Category grid shows all 15 categories
  - ✅ Trending section displays (if data available)
  - ✅ Feed shows posts
  - ✅ No console errors

### 3. Test in browser DevTools
```javascript
// In browser console, test the store:
console.log(window.__ZUSTAND__) // Should exist
```

---

## 🔗 Step 9: Push to GitHub

### Setup Git (if needed)

```bash
cd HUMUPLUS

# Configure git locally
git config user.name "Your Name"
git config user.email "mahdialmuntadhar1@gmail.com"

# Or use GitHub CLI:
gh auth login
```

### Push Changes

```bash
cd HUMUPLUS

# Check status
git status

# Add new files
git add -A

# Create commit message
git commit -m "feat: Add Version 1 Social-First Grid Homepage redesign

- Add 5 new React components (Hero, LocationFilter, Category, Trending, Feed)
- Add Zustand state management with localStorage persistence
- Add complete design system CSS (15 categories, unified colors)
- Integrated with existing Supabase backend (no breaking changes)
- Fully responsive mobile-first design
- Add comprehensive documentation"

# Push to main or create new branch
git push origin main

# Or create a feature branch first (safer):
git checkout -b feature/v1-homepage-redesign
git push origin feature/v1-homepage-redesign
```

---

## 📋 Verification Checklist - Post Push

After pushing to GitHub, verify:

- [ ] Files appear in GitHub repo
- [ ] No merge conflicts
- [ ] CI/CD pipeline runs (if configured)
- [ ] All files have correct paths
- [ ] Dependencies are in package.json
- [ ] No TypeScript errors in GitHub Actions
- [ ] Branch is protected or PR is created

---

## 🔄 Backend Integration Steps

### 1. Update Backend Environment Variables
In `belive/.env`:
```
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
```

### 2. Verify Supabase Table Schema
The `businesses` table must have these columns:

```sql
-- Check table structure
\d businesses

-- Expected columns:
-- id (uuid, primary key)
-- name (text)
-- nameAr (text, nullable)
-- nameKu (text, nullable)
-- category (text) -- NEW: must support 15 new categories
-- governorate (text)
-- city (text)
-- address (text)
-- phone (text)
-- rating (numeric, nullable)
-- reviewCount (integer, nullable)
-- image (text, nullable)
-- isFeatured (boolean, nullable)
-- website (text, nullable)
-- createdAt (timestamp)
-- updatedAt (timestamp)
```

### 3. Update Category Constraint (if exists)
```sql
-- Check current constraint
\d+ businesses

-- If category has a constraint, update it to include new categories:
ALTER TABLE businesses
DROP CONSTRAINT businesses_category_check;

ALTER TABLE businesses
ADD CONSTRAINT businesses_category_check
CHECK (category IN (
  'dining_cuisine', 'cafe_coffee', 'shopping_retail',
  'entertainment_events', 'accommodation_stays', 'culture_heritage',
  'business_services', 'health_wellness', 'doctors', 'hospitals',
  'clinics', 'transport_mobility', 'public_essential', 'lawyers', 'education'
));
```

---

## 🚨 Compatibility Verification

### Frontend → Backend Communication

```
Frontend (HUMUPLUS)
├── HomePage.tsx
│   └── Calls: supabase.from('businesses').select('*')
│   └── Filters: governorate, city, category
│   └── Expects: Business[] with new category IDs
│
Backend (belive)
├── Supabase Database
│   ├── Table: businesses
│   ├── Columns: All Business interface fields
│   └── Constraints: category IN (15 new IDs)
│
└── REST API (optional)
    ├── GET /api/businesses
    ├── GET /api/businesses?governorate=X&city=Y&category=Z
    └── Data shape: matches Business interface
```

### No Breaking Changes Because:
✅ All new fields are optional (`?`)
✅ Existing fields remain unchanged
✅ Category is just renamed values (not new field)
✅ Supabase integration is direct (no REST API required)
✅ HomeStore is new, doesn't break existing stores

---

## 📞 Troubleshooting

### Issue: "Cannot find module '@/components/home'"
**Solution:** Check tsconfig.json has path alias:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Issue: "lucide-react not found"
**Solution:**
```bash
npm install lucide-react zustand
```

### Issue: Styles not applying
**Solution:** Verify main.tsx imports:
```typescript
import './styles/humus-design.css'
```

### Issue: Supabase connection fails
**Solution:** Check environment variables:
```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

---

## 📊 Git Commit Messages

Use conventional commits:

```bash
# Feature
git commit -m "feat: Add Version 1 homepage redesign with 15 categories"

# Bug fix
git commit -m "fix: Update category mapping for Supabase queries"

# Documentation
git commit -m "docs: Add GitHub push guide and integration instructions"

# Styling
git commit -m "style: Update design system colors and responsive layout"

# Testing
git commit -m "test: Add category filter tests"

# Refactor
git commit -m "refactor: Extract category grid to separate component"
```

---

## ✅ Final Checklist

- [ ] All 9 files copied to correct directories
- [ ] App.tsx updated with HomePage route
- [ ] main.tsx imports humus-design.css
- [ ] package.json has lucide-react and zustand
- [ ] .gitignore is configured
- [ ] No console errors or warnings
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Changes committed and pushed to GitHub
- [ ] Backend environment variables updated
- [ ] Supabase category constraints updated
- [ ] Ready for production deployment

---

## 🚀 Next Steps After Push

1. **Verify on GitHub:**
   - Check repo shows new files
   - Verify branch is up to date

2. **Update Backend:**
   - Push any scraper changes to belive repo
   - Update category mapping in scraper

3. **Test Integration:**
   - Deploy HUMUPLUS frontend
   - Test with belive backend
   - Verify category filtering works

4. **Monitor:**
   - Check browser console for errors
   - Monitor Supabase queries
   - Track user engagement

---

**Status:** Ready to push
**Last Updated:** April 3, 2026
**Files to Push:** 9 components + CSS + store
**Estimated Time:** 10-15 minutes
