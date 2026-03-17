# 🎨 Premium Filters - Complete JSX Structure

## Visual Layout Breakdown

### Full Page Structure

```tsx
<div className="space-y-6">
  {/* 1. SEARCH BAR */}
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
    <input placeholder="Buscar..." />
  </div>

  {/* 2. ACTIVE FILTERS SUMMARY - Only when filters active */}
  {activeFilterCount > 0 && (
    <div className="rounded-2xl border border-[#D88B5A]/20 bg-[#E07B54]/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="badge">3</span>
          <p>3 filtros activos</p>
        </div>
        <button onClick={handleClearFilters}>Limpiar todo</button>
      </div>
      <div className="text-xs">21 restaurantes encontrados</div>
    </div>
  )}

  {/* 3. PREMIUM FILTER PANEL */}
  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
    {/* Toolbar */}
    <div className="flex items-center justify-between p-4 border-b border-[var(--border)]/50">
      <h2>Filtros</h2>
      <p>21 restaurantes</p>
      <button>Limpiar filtros</button>
    </div>

    {/* Content - 2 Column Grid */}
    <div className="p-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Segmentos Group */}
          <div className="space-y-3">
            <h4 className="font-semibold">Segmentos</h4>
            <p className="text-xs text-muted">Tipo de experiencia culinaria</p>
            <div className="flex flex-wrap gap-2">
              <Chip label="Gourmet" isActive={...} />
              <Chip label="Tradicional" isActive={...} />
              <Chip label="Negocios" isActive={...} />
              <Chip label="Familiar" isActive={...} />
            </div>
          </div>

          {/* Cocina Group */}
          <div className="space-y-3">
            <h4 className="font-semibold">Cocina</h4>
            <p className="text-xs text-muted">Tipo de gastronomía</p>
            <div className="flex flex-wrap gap-2">
              <Chip label="Todas" isActive={...} />
              <Chip label="Italiana" isActive={...} />
              <Chip label="Española" isActive={...} />
              {/* ... more cuisines */}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Precio Group */}
          <div className="space-y-3">
            <h4 className="font-semibold">Precio</h4>
            <p className="text-xs text-muted">Rango de precios</p>
            <div className="flex flex-wrap gap-2">
              <Chip label="Todos" isActive={...} />
              <Chip label="Hasta €15" isActive={...} />
              <Chip label="€15 - €25" isActive={...} />
              <Chip label="Más de €25" isActive={...} />
            </div>
          </div>

          {/* Extras Group */}
          <div className="space-y-3">
            <h4 className="font-semibold">Extras</h4>
            <p className="text-xs text-muted">Comodidades y servicios</p>
            <div className="flex flex-wrap gap-2">
              <Chip label="WiFi disponible" icon={<Wifi />} isActive={...} />
              <Chip label="Abierto fin de semana" isActive={...} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {/* 4. SORT CONTROL */}
  <div className="flex items-center justify-between">
    <p>21 restaurantes</p>
    <SortControl options={...} />
  </div>

  {/* 5. RESULTS GRID */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Restaurant cards */}
  </div>
</div>
```

---

## Component Examples

### FilterChip - Individual Filter Button

**Inactive State:**
```tsx
<button
  className="
    inline-flex items-center gap-2 rounded-full font-medium
    transition-all duration-200 border
    px-4 py-2 text-sm
    border-[#3A3037]/50 
    bg-[var(--surface-soft)]/60 
    text-[var(--text)]
    hover:border-[#D88B5A]/30 
    hover:bg-[var(--surface-soft)]
  "
>
  Gourmet
</button>
```

**Active State:**
```tsx
<button
  className="
    inline-flex items-center gap-2 rounded-full font-medium
    transition-all duration-200 border
    px-4 py-2 text-sm
    border-[#D88B5A]
    bg-gradient-to-r from-[#E07B54] to-[#D88B5A]
    text-white
    shadow-[0_0_16px_rgba(224,123,84,0.35)]
    hover:shadow-[0_0_20px_rgba(224,123,84,0.45)]
  "
>
  Gourmet
  <Sparkles size={14} />
</button>
```

### FilterGroup - Grouped Chips with Title

```tsx
<div className="space-y-3">
  {/* Title Section */}
  <div className="space-y-1">
    <h4 className="text-sm font-semibold text-[var(--text)] tracking-wide">
      Segmentos
    </h4>
    <p className="text-xs text-[var(--text-muted)]">
      Tipo de experiencia culinaria
    </p>
  </div>

  {/* Chips Container */}
  <div className="flex flex-wrap gap-2">
    <FilterChip {...} />
    <FilterChip {...} />
    <FilterChip {...} />
  </div>
</div>
```

### SortControl - Compact Dropdown + Toggle

```tsx
<div className="inline-flex items-center gap-1 rounded-full border border-[#3A3037]/50 bg-[var(--surface-soft)]/60 p-1">
  {/* Dropdown Button */}
  <div className="relative group">
    <button className="inline-flex items-center gap-2 rounded-full px-4 py-2">
      Nombre
    </button>
    {/* Hidden dropdown menu shown on hover */}
    <div className="hidden group-hover:block absolute">
      <button>Nombre</button>
      <button>Calificación</button>
      <button>Precio</button>
    </div>
  </div>

  {/* Divider */}
  <div className="h-6 w-px bg-[var(--border)]/50" />

  {/* Order Toggle */}
  <button className="flex items-center justify-center w-10 h-10">
    <ChevronUp size={16} />
  </button>
</div>
```

### ActiveFiltersSummary - Status Widget

```tsx
<div className="rounded-2xl border border-[#D88B5A]/20 bg-[#E07B54]/5 p-4">
  {/* Summary Row */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="
        inline-flex h-6 w-6 items-center justify-center 
        rounded-full bg-[#E07B54] text-xs font-bold text-white
      ">
        3
      </span>
      <p className="text-sm font-semibold">
        3 filtros activos
      </p>
    </div>
    <button className="text-xs font-semibold text-[#E07B54]">
      Limpiar todo
    </button>
  </div>

  {/* Result Count */}
  <div className="text-xs text-[var(--text-muted)]">
    <span className="font-semibold">21</span> restaurantes encontrados
  </div>

  {/* Tags (Optional) */}
  <div className="flex flex-wrap gap-2 mt-2">
    <div className="
      inline-flex items-center gap-2 rounded-full 
      bg-[#E07B54]/20 px-3 py-1 text-xs font-medium text-[#E07B54]
    ">
      Gourmet
      <X size={14} />
    </div>
  </div>
</div>
```

### CatalogFilters - Panel Container

```tsx
<div className="
  rounded-2xl border transition-all duration-300
  border-[var(--border)] bg-[var(--surface)]
  backdrop-blur-sm
  
  /* When filters active */
  border-[#D88B5A]/30 shadow-lg
">
  {/* Toolbar */}
  <div className="flex items-center justify-between p-4 border-b">
    <span>Filtros</span>
    <span>21 restaurantes</span>
    <button>Limpiar filtros</button>
  </div>

  {/* Content */}
  <div className="border-t border-[var(--border)]/50 px-4 py-6">
    {/* Filter groups go here */}
  </div>
</div>
```

### FilterToolbar - Top Bar

```tsx
<div className="
  flex flex-col sm:flex-row items-start sm:items-center 
  justify-between gap-4 p-4 
  border-b border-[var(--border)]/50
">
  {/* Left */}
  <div className="text-sm font-semibold">
    Filtros
  </div>

  {/* Center */}
  <div className="text-xs text-[var(--text-muted)] flex-1 text-center">
    21 restaurantes
  </div>

  {/* Right */}
  <button className="text-xs font-semibold text-[#E07B54]">
    Limpiar filtros
  </button>
</div>
```

---

## Color Reference

### Active States
```css
/* Gradient background */
background: linear-gradient(to right, #E07B54, #D88B5A)

/* Border */
border-color: #D88B5A

/* Text */
color: white

/* Glow */
box-shadow: 0 0 16px rgba(224, 123, 84, 0.35)

/* Hover glow */
box-shadow: 0 0 20px rgba(224, 123, 84, 0.45)
```

### Inactive States
```css
/* Border */
border-color: rgba(58, 48, 55, 0.5)

/* Background */
background: rgba(var(--surface-soft) / 0.6)

/* Text */
color: var(--text)

/* Hover */
border-color: rgba(216, 139, 90, 0.3)
background: var(--surface-soft)
```

### Panel
```css
/* Border */
border-color: var(--border)

/* Background */
background: var(--surface)

/* When active */
border-color: rgba(216, 139, 90, 0.3)
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
```

---

## Responsive Tailwind Classes

### Mobile First
```css
/* Default (mobile) */
grid-cols-1     /* Single column */
gap-4           /* Standard gap */
p-4             /* Standard padding */

/* md: (≥768px) */
md:grid-cols-2  /* 2 columns on tablet */

/* lg: (≥1024px) */
lg:grid-cols-2  /* 2-column filter grid */
lg:grid-cols-3  /* 3-column restaurant grid */
```

### Filter Layout
```
Mobile: 1 column (stacked vertically)
↓
Tablet: 1 column (still stacked)
↓
Desktop (lg+): 2 columns (side by side)
```

---

## Interactive Flow

### 1. User Clicks Chip
```
Click "Gourmet"
→ FilterChip onClick fires
→ setSelectedSegment('gourmet')
→ Component re-renders with isActive={true}
→ Chip shows gradient + glow
→ activeFilterCount updates
→ Summary appears (if activeFilterCount > 0)
→ Result count updates
```

### 2. Multiple Filters Active
```
Click "Gourmet" → count = 1
Click "Italiana" → count = 2
Check "WiFi" → count = 3
→ Summary shows "3 filtros activos"
→ "Limpiar filtros" button appears
→ Result count: "21 restaurantes"
```

### 3. Clear All
```
Click "Limpiar filtros"
→ handleClearFilters() fires
→ All state variables reset to 'all'/false
→ activeFilterCount = 0
→ Summary disappears
→ Panel returns to normal styling
→ All restaurants shown
```

### 4. Sort
```
Click "Nombre" dropdown
→ Shows options
Click "Calificación"
→ setSortBy('rating')
→ Restaurants sorted by rating (desc)
Click toggle button ↑
→ Restaurants sorted by rating (asc)
```

---

## CSS Class Composition

### Building a Filter Chip

**Base classes:**
```
rounded-full border transition-all duration-200
inline-flex items-center gap-2
px-4 py-2 text-sm font-medium
```

**Inactive variant:**
```
border-[#3A3037]/50 
bg-[var(--surface-soft)]/60 
text-[var(--text)] 
hover:border-[#D88B5A]/30 
hover:bg-[var(--surface-soft)]
```

**Active variant:**
```
border-[#D88B5A]
bg-gradient-to-r from-[#E07B54] to-[#D88B5A]
text-white
shadow-[0_0_16px_rgba(224,123,84,0.35)]
hover:shadow-[0_0_20px_rgba(224,123,84,0.45)]
```

**Complete:**
```tsx
className={`
  rounded-full border transition-all duration-200
  inline-flex items-center gap-2
  px-4 py-2 text-sm font-medium
  ${isActive 
    ? 'border-[#D88B5A] bg-gradient-to-r from-[#E07B54] to-[#D88B5A] text-white shadow-[0_0_16px_rgba(224,123,84,0.35)] hover:shadow-[0_0_20px_rgba(224,123,84,0.45)]'
    : 'border-[#3A3037]/50 bg-[var(--surface-soft)]/60 text-[var(--text)] hover:border-[#D88B5A]/30 hover:bg-[var(--surface-soft)]'
  }
`}
```

---

## Spacing System

### Filter Groups
```
space-y-6      Between filter groups (1.5rem)
space-y-3      Within group (title + chips) (0.75rem)
gap-2          Between chips (0.5rem)
```

### Panel Layout
```
p-4            Top toolbar padding
border-b       Divider
px-4 py-6      Main content padding
gap-8          Between columns (2rem)
```

### Page Level
```
space-y-6      Between major sections (1.5rem)
```

---

## Typography Hierarchy

### Titles
```
h4              text-sm font-semibold tracking-wide
                Color: var(--text)
```

### Descriptions
```
p               text-xs
                Color: var(--text-muted)
```

### Labels
```
button          text-sm font-medium
                Color: varies by state
```

### Metadata
```
small           text-xs
                Color: var(--text-muted)
```

---

## Animation Classes

### Transitions
```
transition-all duration-200     Standard interactions
transition-colors duration-200  Color only changes
transition-all duration-300     Panel state changes
```

### Examples
- Chip hover: scale, color, shadow
- Panel: border, shadow when active
- Button: color on hover

---

## Accessibility Features

### Semantic HTML
```tsx
<button type="button">     // Proper button type
<h4>Segmentos</h4>        // Proper heading
<div role="group">         // If needed
```

### Focus States
All buttons have proper focus outlines (Tailwind default)

### High Contrast
Active state has white text on colored background

### Dark Mode
All colors use CSS variables for automatic adaptation

### Keyboard Navigation
- Tab through all buttons
- Enter/Space to activate
- Logical tab order

---

## Performance Notes

### Memo Usage
```tsx
const FilterChip = React.memo(function FilterChip(...) { ... })
```

### useMemo for Calculations
```tsx
const activeFilterCount = useMemo(() => { ... }, [deps])
```

### Deferred Updates
```tsx
const deferredSearch = useDeferredValue(search)
```

---

**Complete, production-ready JSX structure! 🎉**
