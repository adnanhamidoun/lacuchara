# 🎬 Framer Motion Animation Guide

## Overview

Complete scroll-based animation system for your CUISINE AML website using **Framer Motion** with premium, subtle reveals that maintain the luxury hospitality aesthetic.

### Key Features

✅ **Scroll-Triggered Reveals** - Animations activate when content enters viewport
✅ **Accessibility First** - Respects `prefers-reduced-motion` preference
✅ **Performance Optimized** - Uses `opacity` and `transform` only (GPU accelerated)
✅ **Reusable Components** - Motion wrappers for common animation patterns
✅ **Dark/Light Mode Support** - Works perfectly with existing theme
✅ **Premium Feel** - Subtle, smooth, never flashy

---

## Installation & Setup

### 1. Framer Motion is Already Installed ✅

```bash
npm install framer-motion  # Already done
```

### 2. Animation Utilities Location

**File**: `src/utils/animations.js`

Contains all animation variants and configuration:
- `fadeUpVariants` - Fade + slide up
- `fadeInVariants` - Pure fade
- `scaleInVariants` - Scale + fade
- `slideInLeftVariants` - Slide from left
- `slideInRightVariants` - Slide from right
- `staggerItemVariants` - For staggered children
- `scrollViewportSettings` - Viewport config

### 3. Motion Wrapper Components

**File**: `src/components/motion/index.jsx`

Reusable components for common patterns:
- `<FadeUpSection>` - Text blocks
- `<FadeInSection>` - Backgrounds
- `<ScaleInCard>` - Feature cards
- `<SlideInLeft>` - Text in two-column layouts
- `<SlideInRight>` - Images in two-column layouts
- `<StaggerContainer>` - Parent for cascade animations
- `<StaggerItem>` - Child items

---

## Quick Start Examples

### Example 1: Simple Fade-Up Section

```jsx
import { FadeUpSection } from '@/components/motion'

export function MySection() {
  return (
    <FadeUpSection className="mb-12">
      <h2 className="text-4xl font-bold">Your Heading</h2>
      <p>Your content animates up when entering viewport</p>
    </FadeUpSection>
  )
}
```

**Result**: Content fades in and slides up from below on scroll

### Example 2: Staggered Card Grid

```jsx
import { StaggerContainer, StaggerItem, ScaleInCard } from '@/components/motion'

export function CardGrid({ cards }) {
  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <StaggerItem key={card.id}>
          <ScaleInCard className="bg-white rounded-lg p-6">
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </ScaleInCard>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
```

**Result**: Each card reveals one after another with slight delay

### Example 3: Two-Column Layout with Opposite Animations

```jsx
import { SlideInLeft, SlideInRight } from '@/components/motion'

export function FeatureSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <SlideInLeft className="flex flex-col justify-center">
        <h2 className="text-3xl font-bold">Feature Title</h2>
        <p>Text slides in from left while image slides from right</p>
      </SlideInLeft>
      
      <SlideInRight className="flex items-center">
        <img src="image.jpg" alt="Feature" className="rounded-lg" />
      </SlideInRight>
    </div>
  )
}
```

**Result**: Text and image enter from opposite sides simultaneously

---

## Integration Guide for Each Page

### 🏠 Homepage (LandingPageView)

Apply animations to key sections:

**Hero Section**
```jsx
// src/components/sections/HeroSection.jsx
import { FadeUpSection } from '@/components/motion'

export default function HeroSection({ search, setSearch, onSearch }) {
  return (
    <FadeUpSection>
      <h1 className="text-5xl md:text-6xl font-bold">
        Descubre los Mejores Restaurantes
      </h1>
      {/* Search bar and other content */}
    </FadeUpSection>
  )
}
```

**Featured Restaurants**
```jsx
// src/components/sections/FeaturedRestaurantsSection.jsx
import { StaggerContainer, StaggerItem, ScaleInCard } from '@/components/motion'

export default function FeaturedRestaurantsSection({ restaurants }) {
  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {restaurants.map((restaurant) => (
        <StaggerItem key={restaurant.id}>
          <ScaleInCard className="rounded-xl overflow-hidden">
            {/* Restaurant card content */}
          </ScaleInCard>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
```

**Value Propositions**
```jsx
// src/components/sections/ValuePropositionSection.jsx
import { StaggerContainer, StaggerItem } from '@/components/motion'

export default function ValuePropositionSection() {
  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {values.map((value) => (
        <StaggerItem key={value.id}>
          <div className="p-6 border rounded-lg">
            {/* Value card */}
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
}
```

---

### 📖 About Page (Sobre Nosotros)

**Text and Image Layout**
```jsx
// src/views/AboutView.jsx
import { SlideInLeft, SlideInRight, FadeUpSection } from '@/components/motion'

export default function AboutView() {
  return (
    <>
      {/* Hero section */}
      <FadeUpSection className="text-center mb-20">
        <h1 className="text-5xl font-bold">Sobre CUISINE AML</h1>
      </FadeUpSection>

      {/* Two-column feature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <SlideInLeft>
          <h2 className="text-3xl font-bold mb-4">Nuestra Historia</h2>
          <p>Lorem ipsum...</p>
        </SlideInLeft>
        
        <SlideInRight>
          <img src="history-image.jpg" alt="Our Story" />
        </SlideInRight>
      </div>

      {/* Another feature block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <SlideInRight>
          <img src="mission-image.jpg" alt="Our Mission" />
        </SlideInRight>
        
        <SlideInLeft>
          <h2 className="text-3xl font-bold mb-4">Nuestra Misión</h2>
          <p>Lorem ipsum...</p>
        </SlideInLeft>
      </div>
    </>
  )
}
```

---

### 🍽️ Catalog/Restaurant Cards

**Restaurant Grid with Animations**
```jsx
// src/views/CatalogView.jsx
import { StaggerContainer, StaggerItem, ScaleInCard } from '@/components/motion'

export default function CatalogView() {
  const [results, setResults] = useState([])

  return (
    <>
      {/* Filters section */}
      
      {/* Restaurant grid */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((restaurant) => (
          <StaggerItem key={restaurant.id}>
            <ScaleInCard>
              <RestaurantCard restaurant={restaurant} />
            </ScaleInCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </>
  )
}
```

---

## Animation Specifications

### Fade Up (Default)
```javascript
{
  initial: { opacity: 0, y: 24 },      // Start: invisible, 24px below
  whileInView: { opacity: 1, y: 0 },   // End: visible, normal position
  transition: { duration: 0.6, ease: 'easeOut' }
}
```
**Use for**: Text, headers, section content

### Scale In
```javascript
{
  initial: { opacity: 0, scale: 0.98, y: 30 },
  whileInView: { opacity: 1, scale: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
}
```
**Use for**: Cards, features, interactive elements

### Slide from Left/Right
```javascript
slideInLeft: { initial: { opacity: 0, x: -24 }, ... }
slideInRight: { initial: { opacity: 0, x: 24 }, ... }
```
**Use for**: Two-column layouts, image-text combinations

### Stagger Configuration
```javascript
staggerChildren: 0.12      // 120ms delay between children
delayChildren: 0.1         // 100ms delay before first child
```
**Use for**: Multiple items (grids, lists, cards)

---

## Advanced: Custom Animations

### Create a Custom Variant

```jsx
import { motion } from 'framer-motion'

const customVariant = {
  initial: { opacity: 0, rotateX: -10, y: 20 },
  whileInView: { 
    opacity: 1, 
    rotateX: 0, 
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' }
  }
}

export function CustomAnimatedComponent() {
  return (
    <motion.div
      variants={customVariant}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, amount: 0.2 }}
    >
      Your content
    </motion.div>
  )
}
```

---

## Accessibility & Performance

### ✅ Respects Reduced Motion

Users with `prefers-reduced-motion: reduce` enabled will see:
- Content appears instantly or with minimal fade
- No sliding or scaling movements
- Automatic detection - no code needed!

**Testing Reduced Motion** (Chrome DevTools):
1. Open DevTools → More Tools → Rendering
2. Check "Emulate CSS media feature prefers-reduced-motion"
3. Select "prefers-reduced-motion: reduce"

### ✅ Performance Optimized

All animations use GPU-accelerated properties only:
- ✅ `opacity` - Fast
- ✅ `transform` (translate, scale, rotate) - Fast
- ❌ `width`, `height`, `top`, `left` - Slow (avoided)

**Result**: 60 FPS on mobile devices

---

## Troubleshooting

### Animation Not Playing?

**Check**:
1. Component wrapped in motion wrapper?
   ```jsx
   <FadeUpSection>...</FadeUpSection>  // ✅
   <div>...</div>                       // ❌
   ```

2. Viewport settings correct?
   ```jsx
   viewport={{ once: true, amount: 0.2 }}
   // once: true   = animate only once
   // amount: 0.2  = trigger when 20% visible
   ```

3. Element visible on screen? (Check Inspector)

### Animation Too Fast/Slow?

Adjust duration in variant:
```jsx
transition: {
  duration: 0.4    // Faster (was 0.6)
  ease: 'easeOut'
}
```

### Element Already Visible?

If element is in viewport on page load, animation won't trigger:
```jsx
// Solution: Use initial: 'initial' explicitly
<motion.div initial="initial" whileInView="whileInView" />
```

---

## Implementation Checklist

- [ ] Framer Motion installed
- [ ] `src/utils/animations.js` created
- [ ] `src/components/motion/index.jsx` created
- [ ] Hero section wrapped with animations
- [ ] Featured restaurants card grid animated
- [ ] Value propositions staggered
- [ ] "Cómo Funciona" section cards animated
- [ ] Catalog grid animated
- [ ] About page sections animated
- [ ] Test with `prefers-reduced-motion` enabled
- [ ] Test on mobile (verify 60 FPS)
- [ ] Cross-browser testing
- [ ] Build passes (`npm run build`)

---

## File Locations

```
src/
├── utils/
│   └── animations.js              ← Animation variants
├── components/
│   ├── motion/
│   │   └── index.jsx              ← Motion wrappers
│   ├── sections/
│   │   ├── HeroSection.jsx        ← Updated with animations
│   │   ├── FeaturedRestaurantsSection.jsx
│   │   ├── ValuePropositionSection.jsx
│   │   ├── HowItWorksSection.jsx
│   │   └── ... others
│   └── examples/
│       ├── AnimatedHowItWorksExample.jsx
│       └── ... examples
└── views/
    ├── CatalogView.jsx            ← Restaurant grid
    ├── AboutView.jsx              ← About page
    └── ...
```

---

## Performance Metrics

**Expected Build Size Impact**:
- Framer Motion: +~25 kB (gzipped)
- Animation variants: +2 kB
- Motion components: +1 kB
- **Total**: +28 kB (minimal impact)

**Expected Performance**:
- ✅ Initial Load: < 2s
- ✅ Time to Interactive: < 3s
- ✅ Largest Contentful Paint: < 2.5s
- ✅ Frame Rate: 60 FPS (most animations)

---

## Next Steps

1. **Apply to Homepage** - Start with HeroSection
2. **Test on Mobile** - Verify responsiveness
3. **Gather Feedback** - Get user reactions
4. **Optimize** - Adjust timings based on feedback
5. **Scale** - Apply to all major sections

---

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [whileInView Examples](https://www.framer.com/motion/animation/#frame-based)
- [Easing Functions](https://easings.net/)
- [Web Vitals](https://web.dev/vitals/)

