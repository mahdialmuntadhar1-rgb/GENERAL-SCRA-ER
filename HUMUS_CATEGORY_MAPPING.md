# HUMUS Category Mapping - 15 Main Categories

## 📋 New Category Structure (Updated April 3, 2026)

The HUMUS application now uses **15 main categories** instead of 9, aligned with the unified category structure from the screenshot.

---

## 🏷️ Category IDs & Names

| # | Category ID | Display Name | Icon | Supabase Query |
|---|------------|--------------|------|----------------|
| 1 | `dining_cuisine` | Dining & Cuisine | 🍽️ | `category = 'dining_cuisine'` |
| 2 | `cafe_coffee` | Cafe & Coffee | ☕ | `category = 'cafe_coffee'` |
| 3 | `shopping_retail` | Shopping & Retail | 🛍️ | `category = 'shopping_retail'` |
| 4 | `entertainment_events` | Entertainment & Events | 🎬 | `category = 'entertainment_events'` |
| 5 | `accommodation_stays` | Accommodation & Stays | 🏨 | `category = 'accommodation_stays'` |
| 6 | `culture_heritage` | Culture & Heritage | 🏛️ | `category = 'culture_heritage'` |
| 7 | `business_services` | Business & Services | 💼 | `category = 'business_services'` |
| 8 | `health_wellness` | Health & Wellness | ⚕️ | `category = 'health_wellness'` |
| 9 | `doctors` | Doctors | 👨‍⚕️ | `category = 'doctors'` |
| 10 | `hospitals` | Hospitals | 🏥 | `category = 'hospitals'` |
| 11 | `clinics` | Clinics | 🏥 | `category = 'clinics'` |
| 12 | `transport_mobility` | Transport & Mobility | 🚗 | `category = 'transport_mobility'` |
| 13 | `public_essential` | Public & Essential | 🏛️ | `category = 'public_essential'` |
| 14 | `lawyers` | Lawyers | ⚖️ | `category = 'lawyers'` |
| 15 | `education` | Education | 🎓 | `category = 'education'` |

---

## 🔄 Category Migration

### Old Categories → New Categories

```
OLD HUMUS (9 categories)  →  NEW HUMUS (15 categories)
────────────────────────────────────────────────────────
food_drink                →  dining_cuisine + cafe_coffee
shopping                  →  shopping_retail
health                    →  health_wellness + doctors + hospitals + clinics
education                 →  education
technology                →  business_services
automotive                →  transport_mobility
beauty                    →  business_services
entertainment             →  entertainment_events
services                  →  business_services + public_essential
(NEW)                     →  accommodation_stays
(NEW)                     →  culture_heritage
(NEW)                     →  lawyers
```

---

## 💾 Update Your Database

### Step 1: Update Business Records

If you have existing businesses in Supabase, update their category field:

```sql
-- Example: Move restaurants from old 'food_drink' to new 'dining_cuisine'
UPDATE businesses
SET category = 'dining_cuisine'
WHERE category = 'food_drink' AND name LIKE '%Restaurant%';

-- Move technology businesses to 'business_services'
UPDATE businesses
SET category = 'business_services'
WHERE category = 'technology';

-- Move automotive to 'transport_mobility'
UPDATE businesses
SET category = 'transport_mobility'
WHERE category = 'automotive';
```

### Step 2: Update Scraper Mapping

In `src/lib/supabase.ts`, update the `mapCategoryToHumus()` function:

```typescript
export function mapCategoryToHumus(osmCategory: string): string {
  const categoryMap: Record<string, string> = {
    // Dining & Cuisine
    'amenity:restaurant': 'dining_cuisine',
    'amenity:cafe': 'cafe_coffee',
    'amenity:fast_food': 'dining_cuisine',
    'amenity:pizza': 'dining_cuisine',
    'amenity:bakery': 'dining_cuisine',
    'amenity:pub': 'dining_cuisine',
    'amenity:bar': 'dining_cuisine',
    'amenity:coffee': 'cafe_coffee',

    // Shopping & Retail
    'shop:general': 'shopping_retail',
    'shop:supermarket': 'shopping_retail',
    'shop:mall': 'shopping_retail',
    'shop:clothes': 'shopping_retail',
    'shop:shoes': 'shopping_retail',

    // Entertainment & Events
    'amenity:cinema': 'entertainment_events',
    'amenity:theatre': 'entertainment_events',
    'leisure:park': 'entertainment_events',

    // Accommodation & Stays
    'tourism:hotel': 'accommodation_stays',
    'tourism:guest_house': 'accommodation_stays',
    'tourism:apartment': 'accommodation_stays',
    'tourism:hostel': 'accommodation_stays',

    // Culture & Heritage
    'tourism:museum': 'culture_heritage',
    'tourism:monument': 'culture_heritage',
    'tourism:heritage': 'culture_heritage',
    'historic:castle': 'culture_heritage',

    // Business & Services
    'office:company': 'business_services',
    'shop:office': 'business_services',
    'amenity:post_office': 'business_services',
    'amenity:bank': 'business_services',

    // Health & Wellness
    'amenity:clinic': 'clinics',
    'amenity:hospital': 'hospitals',
    'amenity:doctors': 'doctors',
    'healthcare:clinic': 'clinics',

    // Transport & Mobility
    'amenity:car_rental': 'transport_mobility',
    'amenity:taxi': 'transport_mobility',
    'amenity:parking': 'transport_mobility',
    'amenity:fuel': 'transport_mobility',

    // Public & Essential
    'amenity:government': 'public_essential',
    'amenity:police': 'public_essential',
    'amenity:fire_station': 'public_essential',

    // Lawyers
    'office:lawyer': 'lawyers',
    'amenity:lawyer': 'lawyers',

    // Education
    'amenity:school': 'education',
    'amenity:university': 'education',
    'amenity:college': 'education',
  };

  return categoryMap[osmCategory] || 'business_services'; // Default to business_services
}
```

---

## 🎯 How to Use in Queries

### Filtering by Category in HomePage.tsx

```typescript
// When user selects a category, the feed updates automatically:
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('category', selectedCategory) // e.g., 'dining_cuisine'
  .eq('governorate', selectedGovernorate)
  .eq('city', selectedCity);
```

### Getting All Businesses in a Category

```typescript
// Example: Get all restaurants
const { data: restaurants } = await supabase
  .from('businesses')
  .select('*')
  .eq('category', 'dining_cuisine');

// Example: Get all health-related businesses
const { data: health } = await supabase
  .from('businesses')
  .select('*')
  .in('category', ['health_wellness', 'doctors', 'hospitals', 'clinics']);
```

---

## 📊 Category Statistics

```
Total Categories: 15
Main Categories: 15 (no subcategories)
Color Coding:
  - Coral (#FF6B35): dining_cuisine, cafe_coffee, accommodation_stays, clinics, lawyers
  - Deep Blue (#004E89): shopping_retail, culture_heritage, doctors, transport_mobility, education
  - Cyan (#1AC8ED): entertainment_events, business_services, hospitals, public_essential
```

---

## 🔧 Frontend Changes Made

### CategoryGrid.tsx Updates
- ✅ Updated `CATEGORIES` array with 15 new categories
- ✅ Removed subcategory counts (e.g., "253 categories.businesses")
- ✅ Removed "Show More/Less" button
- ✅ All 15 categories display by default with responsive grid
- ✅ Updated icon set to match screenshot

### Other Components
- ✅ FeedComponent.tsx - Uses category from `business.category` field
- ✅ LocationFilter.tsx - Unchanged (still filters by governorate/city)
- ✅ TrendingSection.tsx - Unchanged (displays category with new labels)

---

## ✅ Implementation Checklist

- [ ] Update `mapCategoryToHumus()` in `src/lib/supabase.ts`
- [ ] Migrate existing data in Supabase (or clear and rescrape)
- [ ] Test CategoryGrid displays all 15 categories
- [ ] Test filtering by each category in feed
- [ ] Update scraper to use new category mappings
- [ ] Verify category counts in database
- [ ] Test on mobile/tablet/desktop responsiveness

---

## 🚀 Next Steps

1. **Review the category list** - Does it match your needs?
2. **Update your Supabase records** - Use the migration SQL above
3. **Update the scraper** - Use the new `mapCategoryToHumus()` function
4. **Test the filtering** - Select each category and verify results
5. **Deploy** - Push changes to production

---

## 📝 Notes

- **No subcategories:** The system now uses only main categories for simplicity
- **Flexible mapping:** You can adjust the OSM → HUMUS mapping as needed
- **Future expansion:** If needed, subcategories can be added later as a separate feature
- **Cafe & Coffee:** Separated from Dining & Cuisine for better discoverability
- **Health split:** Doctors, Hospitals, Clinics are now separate main categories

---

**Status:** ✅ Ready to implement
**Last Updated:** April 3, 2026
**Version:** 2.0 (Updated)
