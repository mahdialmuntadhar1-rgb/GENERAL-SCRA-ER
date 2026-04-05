# HUMUS Version 1 (Social-First Grid) - Implementation Guide

## Overview
This guide explains how to integrate the comprehensive Version 1 frontend redesign into your existing HUMUS application. The redesign maintains all backend integration while completely transforming the UI/UX to be social-media-inspired.

---

## 📁 File Structure

The new components are organized as follows:

```
src/
├── pages/
│   └── HomePage.tsx                  # Main homepage component
│
├── components/
│   └── home/
│       ├── HeroSection.tsx           # Carousel with trilingual slogans
│       ├── LocationFilter.tsx        # Governorate/City selectors
│       ├── CategoryGrid.tsx          # 9-category selector
│       ├── TrendingSection.tsx       # Horizontal carousel (featured)
│       └── FeedComponent.tsx         # Main feed with posts & listings
│
├── stores/
│   └── homeStore.ts                  # Zustand state management
│
└── styles/
    └── humus-design.css              # Design system colors & utilities
```

---

## 🎨 Design System

### Color Palette (Version 1: Social-First Grid)
```
Primary Colors:
- Coral:     #FF6B35  (accent, buttons, trending)
- Deep Blue: #004E89  (borders, headers, primary)
- Cyan:      #1AC8ED  (secondary buttons, highlights)
- Off-White: #F7F7F7  (backgrounds)
- Dark:      #1A1A1A  (text)
```

### Typography
```
Headers:      Poppins Bold 24pt / 18pt
Section:      Poppins SemiBold
Body:         Inter Regular 14pt
Captions:     Inter Light 12pt
```

### Responsive Breakpoints
```
Mobile:   0-767px (full designs as specified)
Tablet:   768-1024px (2 columns, adjusted layouts)
Desktop:  1024px+ (3+ columns)
```

---

## 🚀 Installation & Setup

### Step 1: Install Required Dependencies
```bash
npm install lucide-react zustand
```

These should already be in your project, but verify they're present.

### Step 2: Copy Component Files
Copy all the component files from the structure above into your `src/` directory:
- `src/pages/HomePage.tsx`
- `src/components/home/*.tsx` (all 5 components)
- `src/stores/homeStore.ts`
- `src/styles/humus-design.css`

### Step 3: Import Design System CSS
In your main `src/main.tsx` or wherever you import global styles:

```typescript
import './styles/humus-design.css';
```

---

## 🔗 Router Integration

Update your router configuration to use the new HomePage. Example using React Router:

```typescript
// src/main.tsx or src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import Scraper from '@/pages/Scraper';
import Review from '@/pages/Review';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scraper" element={<Scraper />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 🔌 Supabase Integration

### Current Setup (from HomePage.tsx)
The HomePage currently loads mock data. To connect to real Supabase data:

#### Option 1: Replace Mock Data (Recommended)

In `src/pages/HomePage.tsx`, replace the `loadBusinesses` function:

```typescript
import { supabase } from '@/lib/supabase';

useEffect(() => {
  const loadBusinesses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('businesses')
        .select('*');

      // Filter by governorate
      if (selectedGovernorate) {
        query = query.eq('governorate', selectedGovernorate);
      }

      // Filter by city
      if (selectedCity) {
        query = query.eq('city', selectedCity);
      }

      // Filter by category
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      // Sort
      if (homeStore.sortBy === 'trending') {
        query = query.order('isFeatured', { ascending: false })
                     .order('rating', { ascending: false });
      } else if (homeStore.sortBy === 'recent') {
        query = query.order('updatedAt', { ascending: false });
      } else if (homeStore.sortBy === 'rating') {
        query = query.order('rating', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      setBusinesses(data || []);
    } finally {
      setLoading(false);
    }
  };

  loadBusinesses();
}, [selectedGovernorate, selectedCity, selectedCategory]);
```

#### Option 2: Create a Custom Hook

Create `src/hooks/useBusinesses.ts`:

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/supabase';

export function useBusinesses(
  governorate?: string,
  city?: string,
  category?: string | null
) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('businesses').select('*');

        if (governorate) query = query.eq('governorate', governorate);
        if (city) query = query.eq('city', city);
        if (category) query = query.eq('category', category);

        const { data, error: err } = await query;

        if (err) throw err;
        setBusinesses(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [governorate, city, category]);

  return { businesses, loading, error };
}
```

Then in HomePage.tsx:

```typescript
import { useBusinesses } from '@/hooks/useBusinesses';

export default function HomePage() {
  const { selectedGovernorate, selectedCity, selectedCategory } = useHomeStore();
  const { businesses, loading } = useBusinesses(
    selectedGovernorate,
    selectedCity,
    selectedCategory
  );

  return (
    // ... rest of component
  );
}
```

---

## 📱 Component Guide

### HeroSection.tsx
**Purpose:** Displays a carousel with trilingual slogans and background images

**Features:**
- Auto-playing carousel (5s interval)
- Manual navigation (arrows)
- Dot indicators
- Slogans in English, Arabic, Kurdish
- Call-to-action button

**Props:**
```typescript
interface HeroSectionProps {
  businesses: Business[];  // Used for dynamic content (optional)
}
```

**Customization:**
- Edit `HERO_SLOGANS` array to change messages
- Update background images in the slogans object
- Modify button text in the CTA button

---

### LocationFilter.tsx
**Purpose:** Location selector (Governorate + City)

**Features:**
- 10 Iraqi governorates
- Dynamic city lists per governorate
- Dropdown UI with hover states
- Search button

**State:**
- Uses `useHomeStore()` for persistent selection
- Stores in localStorage via Zustand persist

**Customization:**
- Edit `GOVERNORATES` array to add/remove regions
- Update `CITIES_BY_GOVERNORATE` mapping for cities
- Modify dropdown colors (currently: #004E89, #1AC8ED)

---

### CategoryGrid.tsx
**Purpose:** Category selector with 9 HUMUS business categories

**Features:**
- 9 category chips with emoji icons
- Expandable "Show All" functionality
- Single selection toggle
- Hover animations

**Categories:**
```
🍽️  Food & Drink      (food_drink)
🛍️  Shopping          (shopping)
⚕️  Health           (health)
🎓  Education        (education)
💻  Technology       (technology)
🚗  Automotive       (automotive)
💅  Beauty           (beauty)
🎬  Entertainment    (entertainment)
🔧  Services         (services)
```

**Customization:**
- Edit `CATEGORIES` array to modify
- Change colors by updating `color` field
- Add/remove emoji icons

---

### TrendingSection.tsx
**Purpose:** Horizontal carousel showing featured/trending businesses

**Features:**
- Horizontally scrollable cards
- Left/right navigation arrows
- Individual business cards with:
  - Image with hover zoom
  - Name & category
  - Star rating with review count
  - Address
  - View Profile & Contact buttons
- "Get Featured" CTA button

**Props:**
```typescript
interface TrendingSectionProps {
  businesses: Business[];
}
```

**Business Card Fields Used:**
```
- id, name, category
- image, rating, reviewCount
- address
- isFeatured
```

---

### FeedComponent.tsx
**Purpose:** Main infinite-scroll feed with mixed posts and listings

**Features:**
- Mixed post types (announcements + listings)
- Engagement buttons (Like, Comment, Share)
- Contact buttons (Call, WhatsApp, View Profile)
- Like state management
- Load More button

**Post Types:**
1. **Announcement:** Business name + timestamp + custom content + image
2. **Listing:** Business info + category + rating + location

**Engagement:**
- ❤️ Like (stateful)
- 💬 Comment (placeholder)
- 📤 Share (placeholder)

---

## 🎯 Key Features

### 1. **Responsive Design**
All components use Tailwind's responsive classes:
- `sm:` for small screens (640px+)
- `md:` for medium (768px+)
- `lg:` for large (1024px+)

### 2. **State Management**
Uses Zustand for persistent state:
```typescript
const {
  selectedGovernorate,
  selectedCity,
  selectedCategory
} = useHomeStore();
```

### 3. **Dark/Light Mode Ready**
All colors use CSS variables in `humus-design.css` for easy theming

### 4. **Accessibility**
- Semantic HTML
- ARIA labels on buttons
- Keyboard navigation support
- Color contrast compliant

---

## 🔧 Customization Guide

### Change Primary Colors
Edit `src/styles/humus-design.css`:

```css
:root {
  --humus-coral: #FF6B35;      /* Change this */
  --humus-deep-blue: #004E89;  /* Change this */
  --humus-cyan: #1AC8ED;       /* Change this */
}
```

Then all components automatically update.

### Add More Governorates
Edit `src/components/home/LocationFilter.tsx`:

```typescript
const GOVERNORATES = [
  { name: "Your City", nameAr: "اسم المدينة", nameKu: "Bajarê" },
  // ... add more
];

const CITIES_BY_GOVERNORATE = {
  "Your City": ["City 1", "City 2"],
  // ... add more
};
```

### Modify Business Card Layout
Edit `src/components/home/TrendingSection.tsx` or `src/components/home/FeedComponent.tsx` to change card design.

---

## 🐛 Common Issues & Solutions

### Issue: Components not displaying
**Solution:**
- Verify all imports in HomePage.tsx match your folder structure
- Check that Zustand is installed: `npm install zustand`
- Ensure CSS is imported in main.tsx

### Issue: Styles not applying
**Solution:**
- Confirm `humus-design.css` is imported
- Check Tailwind version (requires 3.0+)
- Verify color hex values match exactly

### Issue: Supabase data not loading
**Solution:**
- Check network requests in browser DevTools
- Verify database table is named `businesses`
- Ensure proper RLS policies are set on Supabase
- Check Supabase URL and key in environment variables

### Issue: Mobile layout issues
**Solution:**
- Test with Chrome DevTools mobile preview
- Ensure viewport meta tag in HTML: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Check responsive breakpoints in components

---

## 📊 Data Requirements

### Minimum Business Fields
```typescript
{
  id: string;
  name: string;
  category: string;  // Must match HUMUS categories
  governorate: string;
  city: string;
  address: string;
  phone: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
  isFeatured?: boolean;
}
```

### Sample Mock Data
The HomePage.tsx includes `generateMockBusinesses()` function with 5 sample records for testing.

---

## 🚢 Deployment

### Pre-deployment Checklist
- [ ] Update HomePage router path to match your routing
- [ ] Connect real Supabase data (not mock data)
- [ ] Test responsive design on mobile devices
- [ ] Verify all links and buttons are functional
- [ ] Update environment variables for Supabase
- [ ] Test location filters work correctly
- [ ] Verify images load from correct URLs

### Build Command
```bash
npm run build
```

### Environment Variables
Ensure `.env` contains:
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_GOOGLE_PLACES_API_KEY=your_key (optional)
```

---

## 📱 Mobile Optimization

The design is mobile-first with:
- Full-width hero section (60% viewport height)
- Single column layout on mobile
- Touch-friendly button sizes (44px minimum)
- Optimized images (400x300px for cards, 1200x800px for hero)
- Horizontal scrolling for carousels on mobile

---

## 🎯 Next Steps

1. **Integrate Real Data:** Connect Supabase using the guide above
2. **Update Business Profile Page:** Create detailed profile view linked from feed
3. **Add Search:** Implement full-text search using Supabase
4. **User Authentication:** Add login/signup pages
5. **Business Dashboard:** Let businesses manage their own posts
6. **Monetization:** Implement premium tiers UI
7. **Analytics:** Track user engagement and business views
8. **Push Notifications:** Notify users of trending businesses
9. **Map Integration:** Add Google Maps for location discovery
10. **Social Features:** Comments, ratings, reviews

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection and RLS policies
3. Test with mock data first (generateMockBusinesses)
4. Check responsive design at different screen sizes
5. Review the component prop types and data structure

---

## 📄 License & Attribution

Design System: HUMUS Version 1 (Social-First Grid)
Built with: React 18, TypeScript, Tailwind CSS, Zustand
Colors: Accessible WCAG AA compliant
Icons: Lucide React (Apache 2.0)

---

**Status:** Ready for integration
**Last Updated:** April 3, 2026
**Compatibility:** React 18+, TypeScript 5+, Tailwind CSS 3+
