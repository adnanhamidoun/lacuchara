# 🎨 Visual Design Documentation

## Landing Page Wireframe & Color Palette

### Hero Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Background: Gradient overlay + subtle image             │
│                                                             │
│    "Descubre la Excelencia Gastronómica"                  │
│     (Headline: text-7xl, text-[var(--text)])              │
│                                                             │
│    "Explora los mejores restaurantes gourmet,             │
│     tradicionales y exclusivos."                            │
│     (Subtitle: text-2xl, text-[var(--text-muted)])        │
│                                                             │
│    ┌──────────────────────────────────────────────────┐   │
│    │ 🔍 Buscar por nombre, cocina o zona...          │   │
│    │                                    [Buscar →]    │   │
│    └──────────────────────────────────────────────────┘   │
│                                                             │
│    Background: rgba(26,26,46,0.78) + url(unsplash)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Colors Used:
- Overlay: rgba(224, 123, 84, 0.15) to rgba(216, 139, 90, 0.08)
- Text: var(--text) (light/dark mode)
- Buttons: #E07B54
- Hover: brightness-95
```

### Segmentos Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Explora Nuestros Segmentos                             │
│    (Headline: text-5xl)                                    │
│                                                             │
│    Desde alta cocina hasta ambientes familiares,          │
│    encuentra exactamente lo que buscas.                    │
│    (Subtitle: text-lg, text-[var(--text-muted)])         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  ✨ Gourmet     │  │ 🏢 Tradicional   │              │
│  │                  │  │                  │              │
│  │ Alta cocina y   │  │ Sabores clásicos │              │
│  │ experiencias... │  │ y cocina...      │              │
│  │                  │  │                  │              │
│  │  Explorar →     │  │  Explorar →      │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │ 💼 Negocios    │  │ 👨‍👩‍👧‍👦 Familiar    │              │
│  │                  │  │                  │              │
│  │ Espacios        │  │ Ambiente cercano │              │
│  │ elegantes...    │  │ para compartir.. │              │
│  │                  │  │                  │              │
│  │  Explorar →     │  │  Explorar →      │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Card Styling:
- Border: border-[#3A3037]/70
- Background: gradient from-[var(--surface)] to-[var(--surface-soft)]
- Padding: p-6
- Rounded: rounded-2xl
- Hover: border-[#D88B5A]/50, shadow-lg, -translate-y-1
- Icon bg: bg-gradient-to-br from-[#E07B54]/20 to-[#D88B5A]/20
```

### How It Works Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Cómo Funciona                                           │
│    Desde la búsqueda hasta la reserva, todo en pocos...   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──┐  "1"         ┌──┐  "2"         ┌──┐  "3"           │
│  │  │ Step #1      │  │ Step #2      │  │ Step #3       │
│  │1 │────────→     │2 │────────→     │3 │               │
│  │  │              │  │              │  │               │
│  └──┘              └──┘              └──┘               │
│   🔍               🔍                 ✓                 │
│                                                             │
│  Descubre       Filtra &            Consulta &            │
│  Restaurantes   Compara             Decide               │
│                                                             │
│  Explora nuestra Personaliza tu      Accede al menú      │
│  colección...   búsqueda según...   completo...         │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ 🔍 Search   │  │ 🎯 Filter    │  │ ✓ Check      │   │
│  │              │  │              │  │              │   │
│  │ Description │  │ Description  │  │ Description │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Step Card Styling:
- Number: h-16 w-16 rounded-full bg-gradient-to-br from-[#E07B54]/20
- Inner: flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]
- Card: rounded-2xl border border-[#3A3037]/70 p-6
- Hover: bg-[var(--surface)], border-[#D88B5A]/30, shadow-md
```

### Featured Restaurants

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Restaurantes Destacados                                │
│    Una selección de nuestros mejores restaurantes...      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │              │  │              │  │              │    │
│  │  [IMAGE]     │  │  [IMAGE]     │  │  [IMAGE]     │    │
│  │              │  │              │  │              │    │
│  │  ⭐ 4.8    │  │  ⭐ 4.6    │  │  ⭐ 4.9    │    │
│  │              │  │              │  │              │    │
│  │ Rest. Name   │  │ Rest. Name   │  │ Rest. Name   │    │
│  │ Cuisine      │  │ Cuisine      │  │ Cuisine      │    │
│  │              │  │              │  │              │    │
│  │ Gourmet      │  │ Tradicional  │  │ Negocios     │    │
│  │              │  │              │  │              │    │
│  │ €25 Ver menú │  │ €18 Ver menú │  │ €22 Ver menú │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────┐                                          │
│  │              │                                          │
│  │  [IMAGE]     │                                          │
│  │              │                                          │
│  │  ⭐ 4.7    │                                          │
│  │              │                                          │
│  │ Rest. Name   │                                          │
│  │ Cuisine      │                                          │
│  │              │                                          │
│  │ Familiar     │                                          │
│  │              │                                          │
│  │ €15 Ver menú │                                          │
│  └──────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Restaurant Card Styling:
- Image: h-56 w-full object-cover, hover:scale-105
- Badge rating: bg-white/90, rounded-full, px-3 py-1.5
- Badge segment: bg-[#E07B54]/90, rounded-full, px-3 py-1
- Hover: border-[#E07B54]/50, shadow-lg, -translate-y-1
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
```

### Value Proposition

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Pensado para Comer en Azca                             │
│                                                             │
│    Una plataforma diseñada específicamente para            │
│    conectarte con los mejores restaurantes...             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  ⚡ Rápido &   │  │  📈 Información  │              │
│  │  Intuitivo      │  │  Actualizada    │              │
│  │                  │  │                 │              │
│  │  Encuentra el   │  │  Horarios,      │              │
│  │  restaurante... │  │  menús y...     │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  🛡️ Confiable  │  │  👥 Comunidad   │              │
│  │  & Verificado   │  │  Activa         │              │
│  │                  │  │                 │              │
│  │  Todos nuestros │  │  Únete a miles  │              │
│  │  restaurantes...│  │  de usuarios... │              │
│  └──────────────────┘  └──────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Value Card Styling:
- Icon bg: bg-gradient-to-br from-[#E07B54]/20 to-[#D88B5A]/10
- Card bg: bg-[var(--surface)]/50
- Hover: bg-[var(--surface)], border-[#D88B5A]/30, shadow-lg
- Grid: grid-cols-1 md:grid-cols-2 gap-6
```

### Statistics Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Por Números                                             │
│    Una plataforma confiable para descubrir...             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │             │  │             │  │             │       │
│  │    150+     │  │      1      │  │     12+     │       │
│  │             │  │             │  │             │       │
│  │Restaurantes │  │  Ciudades   │  │   Cocinas   │       │
│  │             │  │             │  │             │       │
│  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                             │
│  ┌─────────────┐                                           │
│  │             │                                           │
│  │   1000+     │                                           │
│  │             │                                           │
│  │Usuarios Act │                                           │
│  │             │                                           │
│  └─────────────┘                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Stats Card Styling:
- Text: text-3xl md:text-4xl font-bold text-[#E07B54]
- Label: text-xs md:text-sm text-[var(--text-muted)]
- Grid: grid-cols-2 md:grid-cols-4 gap-4
```

### CTA Banner

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Explorar Catálogo Completo                             │
│                                                             │
│    Accede a nuestra colección completa de                 │
│    restaurantes, filtros avanzados y recomendaciones...  │
│                                                             │
│    ┌──────────────────────────┐  ┌──────────────────┐   │
│    │ Ver Todos los Restaur... │  │ 🔍 Buscar      │   │
│    └──────────────────────────┘  └──────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Banner Styling:
- Background: gradient-to-r from-[#E07B54]/10 via-[#D88B5A]/5
- Rounded: rounded-3xl
- Padding: p-8 md:p-16
- Border: border border-[#D88B5A]/30
- Primary Button: bg-[#E07B54], text-white, shadow-lg
- Secondary Button: border-2 border-[#E07B54], text-[#E07B54]
```

### Newsletter Section

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Mantente Actualizado                                    │
│                                                             │
│    Recibe notificaciones sobre nuevos restaurantes,       │
│    ofertas especiales y menús destacados.                 │
│                                                             │
│    ┌──────────────────────────────┐  ┌──────────────┐   │
│    │ tu@correo.com               │  │ Suscribirse │   │
│    └──────────────────────────────┘  └──────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Newsletter Styling:
- Background: bg-[var(--surface)]
- Border: border border-[var(--border)]
- Rounded: rounded-3xl
- Padding: p-8 md:p-12
- Input: rounded-xl, border border-[var(--border)]
- Button: rounded-xl, bg-[#E07B54]
```

---

## Catalog Page Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ← Volver a inicio                                         │
│                                                             │
│  Catálogo Completo                                         │
│  Explora todos nuestros restaurantes disponibles          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ 🔍 Buscar por nombre, zona o estilo...            │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  FILTROS                                                    │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Segmentos: [Gourmet] [Tradicional] [Negocios]... │     │
│  ├──────────────────────────────────────────────────┤     │
│  │ Cocina: [Todas] [Italiana] [Española] [Asiática]...│   │
│  ├──────────────────────────────────────────────────┤     │
│  │ Precio: [Todos] [Hasta €15] [€15-€25] [+€25]     │     │
│  ├──────────────────────────────────────────────────┤     │
│  │ [WiFi] [Fin de semana]                           │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ORDENAR POR                                                │
│  [Nombre] [Calificación ↓] [Precio]                       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Mostrando 42 restaurantes                                 │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Rest. #1          │ Rest. #2          │ Rest. #3      │
│  │ [Image]           │ [Image]           │ [Image]       │
│  │ ⭐ Rating        │ ⭐ Rating        │ ⭐ Rating      │
│  │ Segment           │ Segment           │ Segment       │
│  │ Cuisine           │ Cuisine           │ Cuisine       │
│  │ €Price Ver menú   │ €Price Ver menú   │ €Price Ver...│
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │ Rest. #4          │ Rest. #5          │ Rest. #6      │
│  │ [Image]           │ [Image]           │ [Image]       │
│  │ ...               │ ...               │ ...           │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Filter Styling:
- Chips: rounded-full, border border-[#3A3037]/70
- Selected: border-[#D88B5A], bg-[#D88B5A], text-white
- Container: rounded-2xl border border-[var(--border)], p-4

Restaurant Card Styling:
- Image: h-48, hover:scale-105
- Badge: rounded-full, px-2.5 py-1, text-xs
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
```

---

## Color Palette Reference

### Primary Colors

```
Primary Orange:        #E07B54  (Main CTA, accents)
Primary Orange Dark:   #D88B5A  (Hover states, borders)
Gold/Accent:           #E8C07D  (Dark mode accent)
```

### Semantic Colors

```
Background Dark:       #1A1A2E  (Dark mode default)
Background Light:      #FFFFFF  (Light mode default)
Surface Dark:          #16213E  (Dark mode surface)
Surface Light:         #F5F5F5  (Light mode surface)
Border Dark:           #3A3037  (Dark mode borders)
Border Light:          #D6D9E0  (Light mode borders)
```

### CSS Variables (Theme)

```css
:root {
  --text: #1A1A2E;
  --text-muted: #6B7280;
  --surface: #FFFFFF;
  --surface-soft: #F5F5F5;
  --border: #D6D9E0;
  --primary: #E07B54;
  --success: #4CAF50;
  --error: #E53935;
}

@media (prefers-color-scheme: dark) {
  :root {
    --text: #F5F5F5;
    --text-muted: #A0A0A0;
    --surface: #1A1A2E;
    --surface-soft: #16213E;
    --border: #3A3037;
    --primary: #E07B54;
    --success: #4CAF50;
    --error: #E53935;
  }
}
```

---

## Typography Scale

```
H1 (Hero):      text-5xl md:text-6xl lg:text-7xl font-bold
H2 (Section):   text-4xl md:text-5xl font-bold
H3 (Subsect):   text-2xl font-bold
H4 (Card):      text-xl font-bold
H5 (Label):     text-lg font-bold
Body:           text-base md:text-lg
Small:          text-sm
Tiny:           text-xs

Font Family:    Default (system) or custom
Weight Bold:    font-bold (700)
Weight Semibold: font-semibold (600)
Weight Medium:  font-medium (500)
```

---

## Spacing Scale

```
2xs:  0.5rem   (8px)   - Tight spacing
xs:   1rem     (16px)  - Compact
sm:   1.5rem   (24px)  - Small
md:   2rem     (32px)  - Medium (standard gap)
lg:   2.5rem   (40px)  - Large
xl:   3rem     (48px)  - Extra large
2xl:  3.5rem   (56px)  - Huge
3xl:  4rem     (64px)  - Extra huge (section spacing)
```

---

## Component Spacing

```
Section padding vertical:     py-20 (80px) - Hero/Footer
Section padding horizontal:   px-6 md:px-12 (base 24px, lg 48px)

Card padding:                 p-4 (16px) - Compact
                             p-6 (24px) - Standard

Gap between cards:            gap-4 (16px) - Mobile
                             gap-6 (24px) - Desktop

Border radius:
  Buttons/inputs:            rounded-lg, rounded-xl
  Cards/panels:              rounded-2xl
  Large sections:            rounded-3xl
```

---

## Shadow System

```
No shadow:        shadow-none (elements with borders)
Subtle:          shadow-sm (hover states)
Standard:        shadow-md (cards, lifted states)
Strong:          shadow-lg (overlays, modals)
Extra:           shadow-xl (major elevation)

Implementation:
- Cards: shadow-sm default, shadow-lg on hover
- Buttons: shadow-md default, shadow-lg on hover
- Elevation: Use -translate-y-1 on hover (not just shadow)
```

---

**Visual Design Status**: ✅ Complete
**Color Scheme**: ✅ Approved
**Responsive**: ✅ Mobile-first, 3-breakpoint design
**Accessibility**: ✅ WCAG 2.1 AA (color contrast, touch targets)

Last Updated: 2026-03-17
