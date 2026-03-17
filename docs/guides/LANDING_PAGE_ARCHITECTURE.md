# 🏗️ Landing Page Architecture & Component Design

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CUISINE AML                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
           ┌────▼───┐      ┌────▼────┐   ┌────▼──────┐
           │ Landing│      │ Catalog │   │  Other    │
           │   (/)  │      │(/restaur)  │   Pages   │
           └────┬───┘      └──────────┘  └───────────┘
                │
        ┌───────┴──────────────────────────────────┐
        │                                          │
    ┌───▼─────────────┐              ┌────────────▼────┐
    │  Hero Section   │              │  Section Grid   │
    │  + Search       │              │                 │
    ├─────────────────┤              ├─────────────────┤
    │ - Background    │              │ - Segment Cards │
    │ - Headline      │              │ - How-it-works  │
    │ - Search Input  │              │ - Featured Rests│
    │ - CTA Button    │              │ - Value Prop    │
    └─────────────────┘              │ - Stats         │
                                     │ - Dividers      │
                                     └─────────────────┘
```

## Component Hierarchy Tree

```
LandingPageView (root)
│
├── [HeroSection]
│   ├── Background gradient + image
│   ├── Headline (text-7xl)
│   ├── Subtitle (text-2xl)
│   └── SearchBar
│       ├── Input field
│       └── Search button
│
├── SegmentCards (inline)
│   ├── [SegmentCard 1] → Link to /restaurantes
│   ├── [SegmentCard 2] → Link to /restaurantes
│   ├── [SegmentCard 3] → Link to /restaurantes
│   └── [SegmentCard 4] → Link to /restaurantes
│
├── [SectionDivider] ← Gradient line
│
├── [HowItWorksSection]
│   ├── Section title
│   ├── [Step 1]
│   │   ├── Number circle (1)
│   │   ├── Icon (Search)
│   │   ├── Title
│   │   └── Description
│   ├── [Step 2]
│   │   ├── Number circle (2)
│   │   ├── Icon (Filter)
│   │   ├── Title
│   │   └── Description
│   └── [Step 3]
│       ├── Number circle (3)
│       ├── Icon (CheckCircle)
│       ├── Title
│       └── Description
│
├── [SectionDivider]
│
├── [FeaturedRestaurantsSection]
│   ├── Section title
│   ├── [FeaturedRestaurantCard 1]
│   │   ├── Image (with lazy load)
│   │   ├── Rating badge (⭐)
│   │   ├── Segment badge
│   │   ├── Name
│   │   ├── Cuisine
│   │   ├── Price
│   │   └── "Ver menú" CTA
│   ├── [FeaturedRestaurantCard 2]
│   ├── [FeaturedRestaurantCard 3]
│   └── [FeaturedRestaurantCard 4]
│
├── [SectionDivider]
│
├── [ValuePropositionSection]
│   ├── Section title
│   ├── [Value Card 1]
│   │   ├── Icon (Zap)
│   │   ├── Title
│   │   └── Description
│   ├── [Value Card 2]
│   │   ├── Icon (TrendingUp)
│   │   ├── Title
│   │   └── Description
│   ├── [Value Card 3]
│   │   ├── Icon (Shield)
│   │   ├── Title
│   │   └── Description
│   └── [Value Card 4]
│       ├── Icon (Users)
│       ├── Title
│       └── Description
│
├── [SectionDivider]
│
├── [StatsSection] (inline)
│   ├── Stat 1: Restaurants (150+)
│   ├── Stat 2: Cities (1)
│   ├── Stat 3: Cuisines (12+)
│   └── Stat 4: Users (1000+)
│
├── [SectionDivider]
│
├── [CTA Banner] (inline)
│   ├── Headline
│   ├── Description
│   ├── Primary button → /restaurantes
│   └── Secondary button → Search
│
└── [Newsletter] (inline)
    ├── Headline
    ├── Description
    ├── Email input
    └── Subscribe button
```

## Data Flow

```
USER INTERACTION
       ↓
   ┌────────────────────────────────┐
   │ Search Hero Input              │
   │ - User types in search bar     │
   │ - setSearch(value) updates     │
   │ - Click "Buscar" or Enter      │
   └────────┬───────────────────────┘
            ↓
   window.location.href = 
   `/restaurantes?search=${term}`
            ↓
   ┌────────────────────────────────┐
   │ Navigate to CatalogView        │
   │ (Future: read URL params)      │
   └────────────────────────────────┘

USER CLICK FEATURED
       ↓
   ┌────────────────────────────────┐
   │ Featured Restaurant Card       │
   │ - Card rendered with image     │
   │ - Link to /cliente/rest/{id}   │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ MenuView                       │
   │ - Shows restaurant menu        │
   │ - Displays details             │
   └────────────────────────────────┘

DATA LOADING
       ↓
   ┌────────────────────────────────┐
   │ useRestaurants()               │
   │ - GET /restaurants             │
   │ - Returns all restaurants      │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ Select 4 Random                │
   │ - useMemo shuffles & slices    │
   │ - Passed to FeaturedSection    │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ FeaturedRestaurantsSection     │
   │ - Maps over 4 restaurants      │
   │ - Renders cards                │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ FeaturedRestaurantCard         │
   │ - useState for imageUrl        │
   │ - useEffect to load image      │
   │ - GET /get-restaurant-image/id │
   │ - Sets state with URL          │
   └────────┬───────────────────────┘
            ↓
   ┌────────────────────────────────┐
   │ Image Rendered                 │
   │ <img src={imageUrl} />         │
   │ (with fallback placeholder)    │
   └────────────────────────────────┘
```

## Component Dependencies

```
HeroSection
├── No internal dependencies
├── Uses: React, Tailwind CSS
└── Props: search, setSearch, onSearch, onKeyPress

SegmentCard (inline in LandingPageView)
├── Dependency: react-router Link
├── Uses: Lucide icons
└── Props: segment object

FeaturedRestaurantsSection
├── Dependency: useRestaurants hook
├── Internal Component: FeaturedRestaurantCard
│   ├── Dependency: fetch API for images
│   ├── Internal Component: RatingDisplay
│   │   └── Dependency: Lucide Star icon
│   └── Uses: useState, useEffect
└── Props: restaurants array

HowItWorksSection
├── No props required
├── Uses: Lucide icons (Search, Filter, CheckCircle)
└── Static content (hardcoded steps)

ValuePropositionSection
├── No props required
├── Uses: Lucide icons (Zap, TrendingUp, Shield, Users)
└── Static content (hardcoded values)

SectionDivider
├── No props required
├── No dependencies
└── Pure CSS styling
```

## State Management

```
LandingPageView
├── State:
│   ├── search: string
│   │   ├── Set by: <input onChange />
│   │   ├── Used by: handleSearch()
│   │   └── Passed to: HeroSection
│   │
│   └── featuredRestaurants: RestaurantDetail[]
│       ├── Computed by: useMemo
│       ├── Source: restaurants from useRestaurants()
│       └── Passed to: FeaturedRestaurantsSection
│
├── Hooks:
│   ├── useRestaurants() - fetch restaurant data
│   ├── useState() - manage search input
│   └── useMemo() - compute featured selection
│
└── Functions:
    ├── handleSearch() - navigate to catalog
    └── handleKeyPress() - submit on Enter

FeaturedRestaurantCard
├── State:
│   └── imageUrl: string
│       ├── Initial: 'https://placehold.co/...'
│       ├── Updated by: useEffect
│       └── Used by: <img src />
│
├── Hooks:
│   ├── useState() - image URL state
│   └── useEffect() - fetch image on mount
│
└── Functions:
    └── loadImage() - async fetch from API
```

## Performance Optimizations

```
1. useMemo for Featured Selection
   ├── Prevents recalculation on every render
   ├── Dependency: [restaurants]
   └── Only recalculates when restaurants change

2. useDeferredValue (for future Catalog)
   ├── Defers search updates to non-urgent updates
   ├── Keeps UI responsive during typing
   └── Smooth filtering experience

3. React.memo for RestaurantCard
   ├── Prevents re-renders when props unchanged
   ├── Improves performance with large grids
   └── Only relevant when multiple cards rendered

4. Lazy Loading for Images
   ├── Images load on demand
   ├── Fallback placeholder shown immediately
   ├── Reduces initial bundle size
   └── Improves perceived performance

5. CSS Animations instead of JS
   ├── Use: transform, opacity, etc.
   ├── 60fps animations
   ├── Browser hardware acceleration
   └── Better performance on mobile

6. CSS Variables for Theming
   ├── Single source of truth for colors
   ├── Dark mode without JS
   ├── Reduced CSS bundle
   └── Easy maintenance
```

## Integration with Backend

```
/restaurants Endpoint
├── Called by: useRestaurants() hook
├── Returns: RestaurantDetail[]
├── Used by: 
│   ├── LandingPageView (featured selection)
│   └── CatalogView (full list)
└── Data structure:
    ├── restaurant_id: number
    ├── name: string
    ├── cuisine_type: string
    ├── restaurant_segment: string
    ├── google_rating: number | null
    ├── menu_price: number | null
    ├── has_wifi: boolean
    ├── opens_weekends: boolean
    └── ... (other fields)

/get-restaurant-image/{id} Endpoint
├── Called by: FeaturedRestaurantCard useEffect
├── Param: restaurant_id
├── Returns: { image_url: string }
├── Used by: <img src={imageUrl} />
└── Flow:
    ├── useEffect triggers on mount
    ├── Fetch called with restaurant_id
    ├── Response parsed as JSON
    ├── imageUrl state updated
    └── Component re-renders with image

/company/logo Endpoint
├── Called by: MainLayout (header)
├── Returns: Logo URL
├── Used by: <img src={logoUrl} />
└── Caching: Browser cache recommended
```

## Responsive Design Breakpoints

```
Mobile (< 640px)
├── Hero
│   ├── px-6 (12px padding)
│   ├── py-20 (80px vertical)
│   ├── Headline: text-5xl
│   ├── Subtitle: text-lg
│   └── Search: stacked (input over button)
│
├── Segmentos
│   ├── 1 card per row
│   ├── Full width
│   └── grid-cols-1
│
├── How-it-works
│   ├── Vertical stack
│   ├── No connecting lines
│   └── Large icons (24px)
│
├── Featured
│   ├── 1 card per row
│   ├── h-40 images
│   └── Full width
│
└── Value Prop
    ├── 1 card per row
    └── Full width

Tablet (640-1024px)
├── Hero
│   ├── px-12 (24px padding)
│   ├── py-28
│   ├── Headline: text-6xl
│   ├── Search: 1 row (flex-row)
│   └── Better spacing
│
├── Segmentos
│   ├── 2 cards per row
│   └── grid-cols-2
│
├── Featured
│   ├── 2 cards per row
│   ├── h-48 images
│   └── grid-cols-2
│
└── Value Prop
    ├── 2 cards per row
    └── grid-cols-2

Desktop (> 1024px)
├── Hero
│   ├── px-16 or wider
│   ├── py-32 or larger
│   ├── Headline: text-7xl
│   ├── Max-width container
│   └── Optimal reading width
│
├── Segmentos
│   ├── 4 cards per row
│   └── grid-cols-4
│
├── Featured
│   ├── 4 cards per row
│   ├── h-56 images
│   └── grid-cols-4
│
└── Value Prop
    ├── 2x2 grid
    └── Maximum spacing
```

## Theme & CSS Variables

```
Light Mode (default)
:root {
  --text: #1A1A2E              (dark text)
  --text-muted: #6B7280        (lighter text)
  --surface: #FFFFFF           (white bg)
  --surface-soft: #F5F5F5      (light gray bg)
  --border: #D6D9E0            (light borders)
}

Dark Mode (prefers-color-scheme: dark)
:root {
  --text: #F5F5F5              (light text)
  --text-muted: #A0A0A0        (lighter text)
  --surface: #1A1A2E           (dark bg)
  --surface-soft: #16213E      (darker bg)
  --border: #3A3037            (dark borders)
}

Primary Colors
--primary: #E07B54             (coral orange)
--primary-dark: #D88B5A        (darker coral)
--accent: #E8C07D              (gold - dark mode)

Status Colors
--success: #4CAF50             (green)
--error: #E53935               (red)
--warning: #FF9800             (orange)

Usage Examples:
├── Text: text-[var(--text)]
├── Background: bg-[var(--surface)]
├── Border: border border-[var(--border)]
├── Primary Button: bg-[#E07B54]
└── Card: bg-[var(--surface)], border border-[var(--border)]
```

**Status**: ✅ Architecture Complete
**Last Updated**: March 17, 2026
