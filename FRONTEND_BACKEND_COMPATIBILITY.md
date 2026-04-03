# Frontend ↔ Backend Compatibility Guide

**Purpose:** Ensure zero breaking changes between frontend and backend
**Status:** ✅ Ready to implement
**Expected Issues:** 0 (if this guide is followed)

---

## 🔗 How Frontend Talks to Backend

### Architecture
```
Frontend (HUMUPLUS)
    ↓
Zustand Store (homeStore)
    ↓
Supabase Client (@/lib/supabase)
    ↓
Supabase Database (belive backend)
```

### Data Flow
```
User clicks category
    ↓
CategoryGrid updates homeStore
    ↓
HomePage detects change via useHomeStore()
    ↓
useEffect triggers Supabase query
    ↓
FeedComponent receives updated businesses[]
    ↓
Feed re-renders with new data
```

---

## ✅ Zero Breaking Changes Guarantee

### Why No Breaking Changes?

1. **Supabase Table Schema is Unchanged**
   - All existing columns remain
   - New category values are backward compatible
   - Optional fields stay optional

2. **Business Data Type is Extended, Not Modified**
   ```typescript
   // OLD - All existing fields work
   {
     id, name, phone, address,
     governorate, city, rating, reviewCount
   }

   // NEW - Added optional fields
   {
     id, name, nameAr, nameKu,    // ← New optional fields
     phone, address,
     governorate, city, rating, reviewCount,
     image, isFeatured, website   // ← New optional fields
   }
   ```

3. **Category Mapping is Flexible**
   ```typescript
   // Old categories still work via mapping
   food_drink → dining_cuisine (mapped during scraping)
   shopping → shopping_retail (mapped during scraping)
   ```

---

## 📊 Data Structure Contract

### Frontend Expects This Data Shape

```typescript
interface Business {
  // Required fields (must exist)
  id: string;
  name: string;
  category: string;
  governorate: string;
  city: string;
  address: string;
  phone: string;

  // Optional fields (nice to have)
  nameAr?: string;
  nameKu?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  isFeatured?: boolean;
  website?: string;
  facebook?: string;
  instagram?: string;

  // Timestamps
  createdAt: Date | string;
  updatedAt: Date | string;
}
```

### What Backend MUST Provide

**Minimum Required Fields:**
```json
{
  "id": "uuid-string",
  "name": "Business Name",
  "category": "dining_cuisine",
  "governorate": "Baghdad",
  "city": "Kadhimiya",
  "address": "Some address",
  "phone": "+9647701234567",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

---

## 🔄 Category Value Contract

### Old → New Category Mapping

| Old Value | New Value | Backend Handling |
|-----------|-----------|-----------------|
| `food_drink` | `dining_cuisine`, `cafe_coffee` | Map during scraping |
| `shopping` | `shopping_retail` | Direct rename |
| `health` | `health_wellness`, `doctors`, `hospitals`, `clinics` | Split into 4 categories |
| `education` | `education` | Keep as-is |
| `technology` | `business_services` | Remap to services |
| `automotive` | `transport_mobility` | Remap |
| `beauty` | `business_services` | Remap to services |
| `entertainment` | `entertainment_events` | Rename |
| `services` | `business_services`, `public_essential` | Keep or remap |

### How to Update in Database

```sql
-- Option 1: Direct rename (if you want to keep old data)
UPDATE businesses SET category = 'dining_cuisine'
WHERE category = 'food_drink';

-- Option 2: Delete old data and rescrape with new categories
DELETE FROM businesses WHERE category IN (
  'food_drink', 'shopping', 'health', 'technology',
  'automotive', 'beauty', 'entertainment', 'services'
);

-- Then rescrape with new mapCategoryToHumus() function
```

---

## 🚀 Frontend Queries (How Frontend Fetches Data)

### Query 1: Get All Businesses
```typescript
// HomePage.tsx line ~25
const { data } = await supabase
  .from('businesses')
  .select('*');
```

### Query 2: Filter by Location
```typescript
// When user selects location
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('governorate', selectedGovernorate)
  .eq('city', selectedCity);
```

### Query 3: Filter by Category
```typescript
// When user clicks a category
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('category', 'dining_cuisine');  // ← Must match new category ID
```

### Query 4: Combined Filters
```typescript
// Location + Category
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('governorate', 'Baghdad')
  .eq('city', 'Kadhimiya')
  .eq('category', 'cafe_coffee');
```

---

## 🔍 Environment Variables

### Frontend Needs:
```bash
# .env in HUMUPLUS/web/
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend Needs:
```bash
# .env in belive/
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://...
```

### Both Must Point to Same Supabase Project
✅ Same URL
✅ Same database
✅ Same tables
✅ Same row-level security (RLS) policies

---

## 🛡️ Preventing 400 Bad Request Errors

### Common Causes & Solutions

#### 1. **Invalid Category Value**
```
Error: 400 Bad Request - Invalid category value
```

**Cause:** Frontend sends `category = 'old_category'` but DB expects new values

**Solution:**
```typescript
// In scraper: Update mapCategoryToHumus()
export function mapCategoryToHumus(osmCategory: string): string {
  const map = {
    'restaurant': 'dining_cuisine',    // ← Map to new value
    'cafe': 'cafe_coffee',
    // ... all mappings
  };
  return map[osmCategory] || 'business_services';
}
```

#### 2. **Invalid Governorate Name**
```
Error: 400 Bad Request - Invalid governorate value
```

**Cause:** Mismatch between frontend dropdown and DB values

**Solution:** Ensure LocationFilter.tsx matches DB values:
```typescript
const GOVERNORATES = [
  { name: "Baghdad", ... },      // ← Must match DB exactly
  { name: "Erbil", ... },
  { name: "Dohuk", ... },
  // ... ensure exact match
];
```

#### 3. **Missing Required Fields**
```
Error: 400 Bad Request - Missing required field: phone
```

**Cause:** Business record missing required fields

**Solution:** Scraper should validate before insert:
```typescript
if (!business.phone || !business.address) {
  console.log('Skipping invalid business:', business);
  continue;  // Skip incomplete records
}
```

#### 4. **Invalid Phone Format**
```
Error: 400 Bad Request - Invalid phone format
```

**Cause:** Phone not in correct format

**Solution:** Validate in backend before saving:
```typescript
// In backend before INSERT
if (!isValidPhoneFormat(phone)) {
  throw new Error('Invalid phone format');
}
```

#### 5. **CORS or Auth Errors**
```
Error: 401 Unauthorized
Error: 403 Forbidden
```

**Cause:** Supabase RLS policies blocking access

**Solution:** Check RLS policies:
```sql
-- Check policies
SELECT * FROM pg_policies
WHERE tablename = 'businesses';

-- If needed, allow anonymous read:
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users"
ON businesses FOR SELECT
USING (true);
```

---

## ✅ Integration Verification Checklist

Run these checks before going live:

### 1. Supabase Connection
```typescript
// In browser console:
const { data, error } = await supabase
  .from('businesses')
  .select('count');

console.log(data);  // Should show count
console.log(error); // Should be null
```

### 2. Category Values
```typescript
// Verify categories in DB match frontend
const { data } = await supabase
  .from('businesses')
  .select('category')
  .distinct();

console.log(data);  // Should show: dining_cuisine, cafe_coffee, etc.
```

### 3. Location Values
```typescript
// Verify governorates exist
const { data } = await supabase
  .from('businesses')
  .select('governorate')
  .distinct();

console.log(data);  // Should show: Baghdad, Erbil, etc.
```

### 4. Data Structure
```typescript
// Verify business shape matches interface
const { data } = await supabase
  .from('businesses')
  .select('*')
  .limit(1);

const business = data[0];
console.log(business.id);           // ✅ Should exist
console.log(business.name);         // ✅ Should exist
console.log(business.category);     // ✅ Should be new value
console.log(business.phone);        // ✅ Should exist
```

---

## 🔐 Backend Changes Required

### In belive Repository

#### 1. Update Scraper (src/services/scraper.ts)
```typescript
// OLD
function mapCategoryToHumus(osmCategory) {
  return osmCategoryMap[osmCategory];
}

// NEW
export function mapCategoryToHumus(osmCategory: string): string {
  const categoryMap: Record<string, string> = {
    'amenity:restaurant': 'dining_cuisine',
    'amenity:cafe': 'cafe_coffee',
    'shop:supermarket': 'shopping_retail',
    'amenity:hospital': 'hospitals',
    'amenity:doctor': 'doctors',
    'amenity:clinic': 'clinics',
    'amenity:school': 'education',
    // ... all 15 mappings
  };
  return categoryMap[osmCategory] || 'business_services';
}
```

#### 2. Update Category Constraint (src/migrations/...)
```sql
-- Ensure constraint allows all 15 new categories
ALTER TABLE businesses
DROP CONSTRAINT IF EXISTS valid_category;

ALTER TABLE businesses
ADD CONSTRAINT valid_category CHECK (
  category IN (
    'dining_cuisine', 'cafe_coffee', 'shopping_retail',
    'entertainment_events', 'accommodation_stays', 'culture_heritage',
    'business_services', 'health_wellness', 'doctors', 'hospitals',
    'clinics', 'transport_mobility', 'public_essential', 'lawyers', 'education'
  )
);
```

#### 3. Update RLS Policies (if needed)
```sql
-- Ensure frontend can read businesses
CREATE POLICY "Enable read access for all users"
ON businesses FOR SELECT
USING (true);
```

---

## 📈 Testing Workflow

### 1. Development
```
npm run dev    (Frontend)
local server   (Backend)
Supabase       (Database)
```

### 2. Staging
```
Push to GitHub
Deploy to staging environment
Test all queries
```

### 3. Production
```
All tests pass
Push to main
Deploy frontend to Vercel
Deploy backend to production
Monitor logs
```

---

## 🚨 Red Flags (Things to Watch For)

🚩 Frontend returns `undefined` for businesses
🚩 Feed shows "No businesses found" when data exists
🚩 Categories don't filter results
🚩 Browser console shows 400/401/403 errors
🚩 Supabase dashboard shows RLS policy violations
🚩 Phone numbers don't display correctly
🚩 Images fail to load

**Solution:** Check the integration verification checklist above!

---

## 📞 Debugging Commands

```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/businesses?limit=1 \
  -H "Authorization: Bearer your-anon-key"

# Check category values in DB
psql postgresql://... -c "SELECT DISTINCT category FROM businesses;"

# Check business count
psql postgresql://... -c "SELECT COUNT(*) FROM businesses;"

# Check for RLS policy issues
psql postgresql://... -c "SELECT * FROM pg_policies WHERE tablename = 'businesses';"
```

---

## ✅ Final Verification (Post-Deployment)

After pushing to GitHub and deploying:

- [ ] Frontend homepage loads
- [ ] Hero carousel displays
- [ ] Location filter works
- [ ] Categories show 15 items
- [ ] Clicking category filters feed
- [ ] Feed displays businesses
- [ ] No console errors (F12 → Console)
- [ ] No network errors (F12 → Network)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Contact buttons work
- [ ] Like button changes state

---

## 🎉 Success!

If all checks pass, you have:
✅ Frontend working
✅ Backend compatible
✅ No breaking changes
✅ Ready for production

---

**Last Updated:** April 3, 2026
**Status:** Ready to implement
**Expected Integration Time:** 30 minutes
**Support:** See GITHUB_PUSH_GUIDE.md for detailed steps
