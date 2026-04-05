# HUMUS Version 1 - Components Overview & Visual Guide

## 📐 Page Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   HEADER (Sticky)                           │
│  [Logo] [Search Bar]                           [Account]    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   HERO SECTION                              │
│  (Carousel - 60% viewport height)                           │
│  [Background Image with Gradient Overlay]                   │
│  Title: "Discover Everything in Your City"                  │
│  Slogans: English | Arabic | Kurdish                        │
│  [Explore Now Button]                                       │
│  [◄ Slide Indicators ►]                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                LOCATION FILTER (Sticky)                     │
│  [Select Governorate ▾] [Select City ▾] [Search Button]   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CATEGORY GRID (4 cols mobile)                  │
│  🍽️ Food    🛍️ Shopping   ⚕️ Health    🎓 Education       │
│  💻 Tech    🚗 Auto       💅 Beauty    🎬 Entertain        │
│  🔧 Services              [Show All Categories ▼]          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            TRENDING SECTION (Horizontal Scroll)             │
│  🔥 Trending Now              [Get Featured Button]         │
│  ◄ [Card][Card][Card] ►                                     │
│  Each Card:                                                 │
│  ┌────────────────────────────┐                             │
│  │  [Business Image] TRENDING  │                             │
│  │ Business Name              │                             │
│  │ ⭐ 4.8 (120 reviews)       │                             │
│  │ 📍 Address                 │                             │
│  │ [View Profile] [Contact]   │                             │
│  └────────────────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    MAIN FEED (Infinite Scroll)              │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │ Abu Ali Restaurant     📢 Update    │  Post 1            │
│  │ 2 hours ago                         │  (Announcement)    │
│  │ [Business Image]                    │                   │
│  │ "Check out our latest updates..."   │                   │
│  │ ❤️ 234  💬 12  📤 45                │                   │
│  │ [Like] [Comment] [Share]            │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │ Coffee House          📍 Listing     │  Post 2            │
│  │ 5 hours ago                         │  (Business)        │
│  │ [Coffee Image]                      │                   │
│  │ Category: Food & Drink              │                   │
│  │ ⭐ 4.5 (85 reviews)                 │                   │
│  │ 📍 Baghdad, Adhamiyah               │                   │
│  │ ❤️ 189  💬 8   📤 32                │                   │
│  │ [Like] [Comment] [Share]            │                   │
│  │ [📞 Call] [📱 WhatsApp] [👁️ View]   │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  [Load More Businesses Button]                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    FOOTER                                   │
│  HUMUS | About | Contact | Privacy                          │
│  © 2024 HUMUS. All rights reserved.                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Component Hierarchy

```
HomePage (Main Page Component)
├── HeroSection
│   ├── Auto-playing carousel
│   ├── Navigation arrows
│   └── Slide indicators
│
├── LocationFilter
│   ├── Governorate dropdown
│   └── City dropdown
│
├── CategoryGrid
│   ├── 9 category chips
│   └── Show more toggle
│
├── TrendingSection
│   ├── Left/right scroll buttons
│   ├── Business cards (5 visible)
│   └── Get Featured CTA
│
├── FeedComponent
│   ├── Post 1 (Announcement type)
│   ├── Post 2 (Listing type)
│   ├── Post 3 (Announcement type)
│   ├── ... (infinite scroll)
│   └── Load More button
│
└── Footer
```

---

## 🎨 Design System Colors

### Primary Palette
```
Coral Orange       Deep Blue        Cyan Accent
#FF6B35            #004E89          #1AC8ED
[●●●●●●●●●●●●●●●] [●●●●●●●●●●●●●●●] [●●●●●●●●●●●●●●●]
Used for:          Used for:        Used for:
- CTA buttons      - Borders        - Secondary buttons
- Trending badges  - Headers        - Highlights
- Accents          - Primary states - Hover states
```

### Supporting Colors
```
Off-White          Dark Text        Grays
#F7F7F7            #1A1A1A          #E5E7EB - #111827
[●●●●●●●●●●●●●●●] [●●●●●●●●●●●●●●●] [●●●●●●●●●●●●●●●]
Background         Text             Borders, dividers
```

---

## 📱 Responsive Behavior

### Mobile (0-767px)
- **Hero:** 60% viewport height, full width
- **Location Filter:** Stacked vertically (2 dropdowns)
- **Category Grid:** 4 columns
- **Trending:** Full width cards, horizontal scroll
- **Feed:** Single column, full width posts

### Tablet (768-1024px)
- **Hero:** 70% viewport height
- **Location Filter:** 2 columns side by side
- **Category Grid:** 5-6 columns
- **Trending:** Larger cards, visible scroll arrows
- **Feed:** Single column with max-width

### Desktop (1024px+)
- **Hero:** 80% viewport height
- **Location Filter:** Full row, all visible
- **Category Grid:** 9 columns all visible
- **Trending:** All cards visible, scroll buttons appear on hover
- **Feed:** Max-width 672px (centered)

---

## 🔄 Data Flow

```
HomePage
  ├── useHomeStore() ────────> homeStore (Zustand)
  │   ├── selectedGovernorate
  │   ├── selectedCity
  │   ├── selectedCategory
  │   └── sortBy
  │
  ├── useEffect() ────────────> Supabase
  │   └── Query businesses with filters
  │       └── Return businesses[]
  │
  ├── Pass businesses prop ──> HeroSection
  │
  ├── Pass filters ───────────> LocationFilter
  │   └── Updates useHomeStore
  │
  ├── Pass filters ───────────> CategoryGrid
  │   └── Updates useHomeStore
  │
  ├── Pass businesses ───────> TrendingSection
  │   └── Filter isFeatured=true
  │
  ├── Pass businesses ───────> FeedComponent
  │   └── Generate mixed posts
  │       └── Manage like state
  │
  └── Footer ─────────────────> Static
```

---

## 🎯 User Interaction Flows

### 1. Location Discovery
```
1. User lands on HomePage
2. Hero carousel auto-plays
3. User selects governorate from LocationFilter
4. App auto-selects first city
5. Feed updates with new results
```

### 2. Category Browsing
```
1. User sees CategoryGrid
2. Clicks category (e.g., "🍽️ Food")
3. Feed updates to show only Food & Drink
4. Can combine with Location filter
```

### 3. Business Engagement
```
1. User sees Feed post
2. Click ❤️ to like
3. Click 💬 to comment (modal)
4. Click 📤 to share
5. For listings: Click [Call/WhatsApp/View Profile]
```

### 4. Trending Discovery
```
1. TrendingSection shows featured businesses
2. User scrolls horizontally
3. Click [View Profile] to see details
4. Click [Contact] for direct action
```

---

## 📊 Component Props & State

### HomePage
```typescript
Props: None (uses hooks internally)
State:
- businesses: Business[]
- loading: boolean

Hooks:
- useHomeStore() - location/category selection
- useState() - businesses, loading
- useEffect() - fetch businesses
```

### HeroSection
```typescript
Props: {
  businesses: Business[]
}
Local State:
- currentSlide: number
- autoPlay: boolean
```

### LocationFilter
```typescript
Props: None
State:
- governorateOpen: boolean
- cityOpen: boolean

Uses: useHomeStore()
```

### CategoryGrid
```typescript
Props: None
State:
- expanded: boolean

Uses: useHomeStore()
```

### TrendingSection
```typescript
Props: {
  businesses: Business[]
}
State:
- canScrollLeft: boolean
- canScrollRight: boolean

Refs:
- scrollRef (for horizontal scroll)
```

### FeedComponent
```typescript
Props: {
  businesses: Business[]
  loading: boolean
}
State:
- feedPosts: FeedPost[]
- likedPosts: Set<string>

Interface: FeedPost
- id: string
- type: "announcement" | "listing"
- business: Business
- likes: number
- comments: number
- shares: number
```

---

## 🎯 Key Features Explained

### 1. Sticky Header
The header remains visible at the top when scrolling:
```css
header {
  position: sticky;
  top: 0;
  z-index: 50;
}
```

### 2. Auto-playing Hero Carousel
Slides change every 5 seconds:
```typescript
useEffect(() => {
  if (!autoPlay) return;
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLOGANS.length);
  }, 5000);
  return () => clearInterval(timer);
}, [autoPlay]);
```

### 3. Persistent State (Location Selection)
Selected location is saved to browser localStorage:
```typescript
useHomeStore = create(
  persist(
    (set) => ({ /* state */ }),
    { name: "home-store" }  // Saved in localStorage
  )
);
```

### 4. Responsive Carousel
TrendingSection uses ref + scroll position tracking:
```typescript
const scroll = (direction: "left" | "right") => {
  scrollRef.current.scrollBy({
    left: direction === "left" ? -350 : 350,
    behavior: "smooth"
  });
};
```

### 5. Like Button State
Local state manages which posts are liked:
```typescript
const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
const handleLike = (postId: string) => {
  setLikedPosts(prev => {
    const newSet = new Set(prev);
    newSet.has(postId) ? newSet.delete(postId) : newSet.add(postId);
    return newSet;
  });
};
```

---

## 🚀 Performance Optimizations

1. **Memoization:** Components don't re-render unnecessarily
2. **Lazy Loading:** Feed can implement infinite scroll
3. **Image Optimization:** Use Next.js Image or similar
4. **CSS-in-JS:** Tailwind for minimal CSS overhead
5. **State Separation:** Location filter state separate from feed

---

## 🔗 Integration Points

### Existing Code That Works With This:
- ✅ `@/lib/supabase` - Business type definition
- ✅ `@/stores/index.ts` - Zustand base setup
- ✅ Tailwind CSS configuration
- ✅ React Router setup
- ✅ Environment variables for Supabase

### Code That Needs Updates:
- ❌ Add HomeStore (new file)
- ❌ Update App.tsx routes
- ❌ Import humus-design.css globally
- ❌ Connect real Supabase queries

---

## 📋 Testing Checklist

- [ ] Hero carousel auto-plays and manual navigation works
- [ ] Location filter updates feed when changed
- [ ] Category filter works and can be combined with location
- [ ] Trending section scrolls horizontally
- [ ] Feed posts display correctly
- [ ] Like button toggles state
- [ ] Contact buttons open (phone dial, WhatsApp, etc.)
- [ ] Responsive design on mobile/tablet/desktop
- [ ] All colors match design spec
- [ ] No console errors
- [ ] Supabase queries return correct data

---

## 📚 File Reference

| File | Purpose | Type |
|------|---------|------|
| HomePage.tsx | Main page container | Page |
| HeroSection.tsx | Image carousel + slogans | Component |
| LocationFilter.tsx | Governorate/city selector | Component |
| CategoryGrid.tsx | 9-category selector | Component |
| TrendingSection.tsx | Featured businesses carousel | Component |
| FeedComponent.tsx | Infinite scroll feed | Component |
| homeStore.ts | State management | Store |
| humus-design.css | Design system colors | Styles |
| App.tsx.example | Router example | Config |
| HUMUS_V1_IMPLEMENTATION_GUIDE.md | Full setup guide | Docs |

---

**Last Updated:** April 3, 2026
**Design Version:** 1 (Social-First Grid)
**Status:** Ready for Integration
