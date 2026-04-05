# HUMUS Redesign — 5 Homepage Concepts
## Iraq Business Directory (Social-First Directory)

---

## DESIGN PRINCIPLE
- **Location-first discovery** (city selector → everything shows up below)
- **Business-only posting** (not general social media)
- **Monetization layer** (free basic, premium featured/trending)
- **Mobile-optimized**
- **Bright, compelling colors** (not dark)

---

# VERSION 1: SOCIAL-FIRST GRID
**Vibe:** Instagram meets local directory. Modern, energetic, scroll-driven.

## Color Palette
- **Primary:** `#FF6B35` (Coral-orange)
- **Secondary:** `#004E89` (Deep blue)
- **Accent:** `#1AC8ED` (Cyan)
- **Background:** `#F7F7F7` (Off-white)
- **Text:** `#1A1A1A` (Dark)

## Layout Structure (Mobile)
```
[Header: Logo + Search (minimal)]
[Location Bar: Horizontal scroll - Governorate → City]
[Category Chip Grid: 4 cols, horizontal scroll]
━━━━━━━━━━━━━━━━━━━━━━━━━━
[TRENDING SECTION (Carousel)]
  Card: Business image + ⭐ rating + "TRENDING" badge
  Swipeable, show 1.5 cards
━━━━━━━━━━━━━━━━━━━━━━━━━━
[FEED (Infinite scroll)]
  Post 1: Business name | "Today at 2:30pm"
          [Image]
          Post content (max 2 lines)
          ❤️ 234 | 💬 12 | 📤 45
  Post 2: Business listing card
          Name | Category | ⭐ 4.8 (120 reviews)
          Address
          [Book/Call/WhatsApp buttons]
  Post 3: Business announcement
  ...
```

## Color Application
- Hero area: `#FF6B35` background, white text
- Cards: White, `#004E89` borders (2px)
- Buttons: `#1AC8ED` background
- Trending badge: `#FF6B35`

## Typography
- Header: "Poppins Bold" 24pt
- Section headers: "Poppins SemiBold" 18pt
- Body: "Inter Regular" 14pt
- Captions: "Inter Light" 12pt

## Sample Data Structure
```json
{
  "governorate": "Baghdad",
  "city": "Kadhimiya",
  "trending": [
    {
      "businessId": 1,
      "name": "Abu Ali Restaurant",
      "image": "url",
      "rating": 4.8,
      "reviews": 120,
      "isFeatured": true
    }
  ],
  "feed": [
    {
      "postId": 101,
      "type": "announcement",
      "businessName": "Coffee House",
      "timestamp": "Today 2:30pm",
      "content": "New summer menu launched! 🌞",
      "image": "url",
      "likes": 234,
      "comments": 12,
      "shares": 45
    },
    {
      "postId": 102,
      "type": "listing",
      "businessName": "Clinic Dr. Fatima",
      "category": "Healthcare",
      "address": "Baghdad, Adhamiyah",
      "rating": 4.9,
      "reviews": 89,
      "phone": "+964771234567",
      "whatsapp": "yes"
    }
  ]
}
```

## Monetization Hooks
- **Free:** Posts appear in feed (chronological)
- **Premium:** "Featured" badge, appears in Trending section, highlighted border
- **Call-to-action:** "Get featured" button under trending carousel

---

# VERSION 2: HERO-DOMINANT DISCOVERY
**Vibe:** Premium, image-first, discovery-focused. Like Airbnb meets directory.

## Color Palette
- **Primary:** `#2D3436` (Dark charcoal)
- **Secondary:** `#00B383` (Emerald green)
- **Accent:** `#FFD93D` (Golden yellow)
- **Background:** `#FFFFFF` (White)
- **Text:** `#2D3436` (Dark)

## Layout Structure
```
[HERO (Full width carousel, 60% of viewport height)]
  Image carousel with dots
  Overlay text: "Discover [City Name]"
  Filter chips floating: [Filter by: All | Posts | Businesses]
━━━━━━━━━━━━━━━━━━━━━━━━━━
[Location Selection Bar (sticky)]
  Dropdown: "Select Governorate" → "Select City"
  Both dropdowns on same row, responsive
━━━━━━━━━━━━━━━━━━━━━━━━━━
[3-COLUMN SECTION]
  Col 1: Trending (vertical stack of cards)
         Title: "🔥 Trending Now"
         3-4 cards, image + name + stat
  Col 2: Recent Posts (feed)
         Title: "Recent Activity"
         Post cards, full width
  Col 3: Top Rated (vertical stack)
         Title: "⭐ Top Rated"
         3-4 business cards with stars
(On mobile: Stack to 1 column, 60% hero height)
```

## Color Application
- Hero overlay: Dark with opacity (60% `#2D3436`)
- Buttons: `#00B383` background
- Accent elements: `#FFD93D` borders/icons
- Card headers: Emerald green text

## Typography
- Hero text: "Montserrat Bold" 32pt white
- Section headers: "Montserrat SemiBold" 20pt
- Body: "Lato Regular" 14pt
- Stats: "Lato Bold" 16pt

## Sample Data Structure
```json
{
  "hero": {
    "carouselImages": [
      {
        "url": "city-image-1.jpg",
        "city": "Baghdad",
        "tagline": "Experience Iraq's Capital"
      }
    ],
    "filterOptions": ["All", "Posts", "Businesses"]
  },
  "trending": [
    {
      "rank": 1,
      "businessName": "Restaurant Name",
      "image": "url",
      "metric": "📍 345 visits today"
    }
  ],
  "recentPosts": [...],
  "topRated": [...]
}
```

## Monetization Hooks
- **Free:** Appear in Recent Posts feed
- **Premium:** Appear in Trending section (top 5), featured in Hero rotation
- **Enterprise:** Get entire carousel slide in hero

---

# VERSION 3: CITY-FIRST GRID DISCOVERY
**Vibe:** Playful, colorful, category-driven. Each section has distinct color.

## Color Palette
- **Primary:** `#6C5CE7` (Purple)
- **Secondary:** `#00B894` (Teal)
- **Accent 1:** `#FDCB6E` (Yellow)
- **Accent 2:** `#E17055` (Red)
- **Background:** `#F9F9F9` (Light gray)
- **Text:** `#2D3436` (Dark)

## Layout Structure
```
[Header with Location Filter]
  "I'm looking for..." + Dropdown (City)
  Shows: "in [City Name]"

[2-COLUMN LAYOUT (alternating per section)]

Section A: "🔥 What's Trending"
  Left: Large image (60% width)
  Right: Business card stack (40% width)
         Name | Category | ⭐ Rating
         Brief desc
         Button: "View Profile"

Section B: "📱 New Posts From Businesses"
  Left: Post grid (2x2 cards)
        Post image + quote text
  Right: Comments/engagement stats

Section C: "🏪 All Categories" (4-column grid)
  Icon in colored circle + category name
  Tap expands to show 5 businesses in that category

Section D: "💎 Premium Spotlight"
  Full width, Accent color background
  3 featured businesses side by side
  Larger cards, with "Premium" badge
```

## Color Application
- Section dividers: Each section has different accent color
- Category icons: Colored circles (`#6C5CE7`, `#00B894`, `#FDCB6E`, `#E17055`)
- Premium section: `#6C5CE7` background, white text
- Buttons: `#00B894`

## Typography
- Section titles: "Quicksand Bold" 22pt
- Category names: "Quicksand SemiBold" 14pt
- Body: "Open Sans Regular" 13pt
- Callouts: "Open Sans Bold" 16pt

## Sample Data
```json
{
  "trending": {
    "business": {...},
    "posts": [...]
  },
  "allCategories": [
    {
      "name": "Restaurants",
      "icon": "🍽️",
      "color": "#E17055",
      "count": 234
    },
    ...
  ],
  "premiumSpotlight": [...]
}
```

## Monetization Hooks
- **Free:** Appear in regular category grid
- **Premium:** Featured in "Premium Spotlight" section (always visible)
- **Trending:** Auto-rotating top position in trending section

---

# VERSION 4: MINIMAL CLEAN (ZEN)
**Vibe:** Apple-like simplicity. Whitespace, single-column, distraction-free.

## Color Palette
- **Primary:** `#1D1D1D` (Black)
- **Secondary:** `#F5F5F5` (Off-white)
- **Accent:** `#0084FF` (Facebook blue)
- **Highlight:** `#FF4458` (Red, minimal use)
- **Background:** `#FFFFFF` (Pure white)
- **Text:** `#1D1D1D` (Dark)

## Layout Structure
```
[Floating Header (sticky)]
  Logo (left) | Location: [Baghdad ▾] (center) | Account (right)
  Minimal borders, single divider line

[Hero Statement (text-only, centered)]
  "Find everything happening in your city"
  Sub: "Restaurants • Shops • Services • Updates"

[Single Column Content (centered, max 600px width)]

Card 1: "What's Trending Today"
  Minimal card, light border
  Icon + Business name + stat
  Repeats 3 times

Card 2: "Recent Updates"
  Business name
  Post text
  Meta: time + reactions
  Repeats infinitely (scroll)

Card 3: "Featured"
  Same layout, but slight background color
  Marked with small "Featured" label
```

## Color Application
- Borders: Single 1px line, `#F0F0F0`
- Accents: Minimal use of `#0084FF` on buttons
- Emphasis: `#FF4458` for urgent (limited time offers)
- Everything else: Black text on white

## Typography
- Logo: "SF Pro Display Bold" 20pt
- Card titles: "SF Pro Display SemiBold" 16pt
- Body: "SF Pro Display Regular" 14pt
- Meta: "SF Pro Display Light" 12pt

## Sample Data
```json
{
  "heroText": "Find everything happening in your city",
  "trending": [
    {
      "businessName": "Abu Ali",
      "stat": "45 people here now",
      "time": "2 mins ago"
    }
  ],
  "recentUpdates": [...]
}
```

## Monetization
- **Free:** Basic post listing
- **Premium:** "Featured" section (separate from trending)
- **Subtle:** No aggressive promotion, only small labels

---

# VERSION 5: DARK MODERN (GLASSMORPHISM)
**Vibe:** TikTok meets luxury. Dark mode, rounded, semi-transparent layers.

## Color Palette
- **Primary:** `#0F1419` (Very dark blue-black)
- **Secondary:** `#1A202C` (Dark blue-gray)
- **Accent 1:** `#FF006E` (Hot pink)
- **Accent 2:** `#00D9FF` (Cyan)
- **Accent 3:** `#A78BFA` (Purple)
- **Background:** `#0F1419`
- **Glass:** `rgba(255, 255, 255, 0.1)` (Semi-transparent)
- **Text:** `#FFFFFF` (White)

## Layout Structure
```
[Header (glassmorphic card)]
  Location selector with glass effect
  "Baghdad" | City picker with glass background

[Full-screen vertical scroll (TikTok-like)]

Slide 1: Business Post (Full screen)
  Background: Business hero image (dark filter)
  Overlay: Glassmorphic card (bottom 40%)
           Business name + category
           Post content
           Reactions row: ❤️ | 💬 | 📤

Slide 2: Announcement Post
  Similar layout, text-focused

Slide 3: Featured Business Spotlight
  Card with gradient border (`#FF006E` → `#00D9FF`)
  "This week's spotlight" label

Side buttons (sticky on right):
  Icon buttons floating:
  🔍 (Search)
  💬 (Messages)
  ⭐ (Favorites)
  👤 (Profile)
```

## Color Application
- All cards: Glassmorphic effect with `rgba(255,255,255,0.1)`
- Featured cards: Gradient border (`#FF006E` → `#00D9FF`)
- Accent text: `#00D9FF`
- Highlight: `#FF006E`
- Hover states: Glass effect becomes more opaque

## Typography
- Business names: "Space Grotesk Bold" 24pt
- Post content: "Space Grotesk Regular" 16pt
- Category: "Space Grotesk SemiBold" 12pt (all caps)
- Meta: "Space Grotesk Light" 11pt

## Sample Data
```json
{
  "slides": [
    {
      "type": "post",
      "heroImage": "url",
      "businessName": "Café Erbil",
      "category": "Coffee Shop",
      "content": "New espresso machine just arrived! ☕",
      "image": null,
      "reactions": {
        "likes": 234,
        "comments": 12,
        "shares": 45
      }
    },
    {
      "type": "featured",
      "gradientBorder": true,
      "label": "This Week's Spotlight",
      ...
    }
  ]
}
```

## Monetization
- **Free:** Normal posts in scroll
- **Premium:** Gradient border + "Spotlight" label
- **Top-tier:** Appear multiple times in feed, gradient becomes more vibrant

---

## IMPLEMENTATION NOTES (FOR ALL 5)

### Mobile Responsive Breakpoints
- **0-767px:** Full designs as shown (mobile)
- **768-1024px:** Adjust column counts (2 col instead of 4)
- **1024px+:** 3-column layouts

### Sample Data Requirements
Each needs:
- 3-5 businesses with full details (name, category, phone, rating, address)
- 5-10 posts (mix of announcements + updates)
- 2-3 featured/trending items
- Images (1200x800px minimum for hero, 400x400px for cards)

### Interaction Patterns
- **Location filter:** Updates entire page
- **Category tap:** Shows business grid for that category
- **Post engagement:** ❤️ toggles, 💬 opens comment modal, 📤 shares
- **Business card:** Tap opens full profile (separate page)

### Free vs Premium Logic
```
IF business.isPremium:
  - Show "Featured" badge
  - Place in dedicated section
  - Higher visibility in feed
  - Appears in trending (if high engagement)

IF business.isFeatured:
  - Appears in hero carousel
  - Dedicated "Premium Spotlight" section
  - Gradient border / special styling
```

---

## NEXT STEPS
1. Pick your favorite 2 from these 5
2. Combine best elements from both
3. Build in AI Studio / Figma
4. Test mobile responsiveness
5. Iterate based on user feedback

