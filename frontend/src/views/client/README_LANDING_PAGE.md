# Landing Page - Implementation Guide

## Overview

This directory contains the premium landing page for CUISINE AML and the section components it uses.

Status: Production ready
Build: 1.06s | Errors: 0 | Bundle: Optimized

---

## Project Structure

```text
frontend/src/
  views/client/
    LandingPageView.tsx

  components/sections/
    HeroSection.tsx
    FeaturedRestaurantsSection.tsx
    HowItWorksSection.tsx
    ValuePropositionSection.tsx
    SectionDivider.tsx
```

---

## Quick Start

### Development

```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173/

### Production build

```bash
cd frontend
npm run build
```

Output: dist/ folder ready for deployment.

---

## Components

### LandingPageView.tsx
Main composition component for all sections.

Features:
- Renders all section components
- Selects 4 featured restaurants
- Handles search behavior
- Manages local page state

### HeroSection.tsx
Hero section with search input.

Props:
- search: string
- setSearch: (value: string) => void
- onSearch: () => void
- onKeyPress: keyboard handler for Enter

### FeaturedRestaurantsSection.tsx
Grid of 4 featured restaurants.

Features:
- Dynamic image loading from /get-restaurant-image/{id}
- Rating display
- Segment badges
- Price information
- Links to menu pages
- Responsive grid

### HowItWorksSection.tsx
Three-step explanation block.

Steps:
1. Discover restaurants
2. Filter and compare
3. Review and decide

### ValuePropositionSection.tsx
Four value cards describing platform benefits.

### SectionDivider.tsx
Decorative divider between sections.

---

## Design System

### Colors
- Primary: #E07B54
- Secondary: #D88B5A
- Gold accent: #E8C07D
- CSS variables: var(--text), var(--surface), var(--border), etc.

### Typography
- H1: text-5xl md:text-6xl lg:text-7xl
- H2: text-4xl md:text-5xl
- H3: text-xl
- Body: text-base
- Small: text-sm

### Spacing
- Section padding: py-20
- Divider spacing: py-8
- Card padding: p-4 to p-6
- Layout gaps: gap-6 to gap-8

---

## User Flow

1. User lands on /
2. User can search from hero section
3. User can browse featured restaurants
4. User can open catalog or menu pages
5. User continues to restaurant exploration

---

## Backend Integration

Endpoints used:

1. GET /restaurants
   - Returns restaurant list
   - Used by useRestaurants() hook

2. GET /get-restaurant-image/{id}
   - Returns image URL
   - Used in FeaturedRestaurantsSection

3. GET /company/logo
   - Returns company logo URL
   - Used by the header

---

## Responsive Breakpoints

### Mobile (<640px)
- Single-column layouts
- Hero text reduced size
- Stacked search controls

### Tablet (640-1024px)
- Two-column layouts
- Medium spacing

### Desktop (>1024px)
- Three/four-column layouts
- Larger spacing and typography

---

## Testing Checklist

- Landing page loads with no errors
- Hero section and search render correctly
- Sections scroll correctly
- Images load correctly
- Navigation links work
- Dark mode toggles correctly
- Mobile layout is responsive
- No console errors

Browser targets:
- Chrome
- Firefox
- Safari
- Edge
- Mobile browsers

---

## Deployment

```bash
cd frontend
npm run build
```

Output:
- dist/index.html
- dist/assets/index-*.css
- dist/assets/index-*.js

Deployment options:
- Azure App Service
- Vercel
- Docker

---

## Performance Metrics

- Build time: 1.06s
- CSS bundle: 55.44 kB (9.69 kB gzipped)
- JS bundle: 355.87 kB (101.13 kB gzipped)
- Modules transformed: 1759
- Errors: 0

---

## Accessibility

- WCAG 2.1 AA contrast targets
- Touch targets >= 44px
- Semantic HTML structure
- Keyboard navigation support
- Reduced motion support

---

## Additional Documentation

- LANDING_PAGE_RESTRUCTURING.md
- LANDING_PAGE_COMPONENTS.md
- UX_FLOW_AND_JOURNEYS.md
- VISUAL_DESIGN_SPECS.md
- DEPLOYMENT_LAUNCH_GUIDE.md
- EXECUTIVE_SUMMARY.md

---

## Troubleshooting

Images not loading:
1. Verify /get-restaurant-image/{id}
2. Verify CORS settings
3. Check browser network panel

Dark mode not working:
1. Verify CSS variables in index.css
2. Avoid hardcoded colors
3. Clear browser cache

Build failing:
1. Run npm install
2. Verify Node.js >= 16
3. Run npm cache clean --force

---

## Future Enhancements

- URL query params for filters/search
- Analytics integration
- Newsletter backend integration
- Favorites feature
- A/B testing
- AI recommendations
- Mobile app

---

## Success Metrics

Target KPIs:
- Landing to catalog CTR: 35-45%
- Catalog to menu CTR: 90%+
- Overall conversion: 10-15%
- Newsletter signup: 15%
- Session duration: >2 minutes

---

## Release Status

Ready for deployment.

Version: 1.0.0
Last updated: March 23, 2026
Author: Senior React + TypeScript Developer
