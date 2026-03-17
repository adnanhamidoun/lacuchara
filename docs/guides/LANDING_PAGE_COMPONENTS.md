# Guía de Componentes - Landing Page Sections

## 📖 Índice

1. [HeroSection](#herosection)
2. [FeaturedRestaurantsSection](#featuredrestaurantssection)
3. [HowItWorksSection](#howitworkssection)
4. [ValuePropositionSection](#valuepropositionsection)
5. [SectionDivider](#sectiondivider)
6. [Ejemplos de Uso](#ejemplos-de-uso)

---

## HeroSection

Componente de hero section con búsqueda integrada.

### Ubicación
```
frontend/src/components/sections/HeroSection.tsx
```

### Props

```typescript
interface HeroSectionProps {
  search: string                                      // Valor actual del search
  setSearch: (value: string) => void                 // Setter para actualizar search
  onSearch: () => void                               // Callback cuando se hace click en buscar
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void  // Handler para tecla enter
}
```

### Ejemplo de Uso

```tsx
import { useState } from 'react'
import HeroSection from '../../components/sections/HeroSection'

export default function MyPage() {
  const [search, setSearch] = useState('')

  const handleSearch = () => {
    console.log('Searching for:', search)
    // Tu lógica aquí
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <HeroSection
      search={search}
      setSearch={setSearch}
      onSearch={handleSearch}
      onKeyPress={handleKeyPress}
    />
  )
}
```

### Características

- Background gradiente + imagen sutil
- Search input con icono
- Botón de búsqueda
- Fully responsive
- Dark mode compatible

### Styling Customizable

Si necesitas cambiar colores o tamaños, edita:
- Headline: `text-5xl md:text-6xl lg:text-7xl`
- Subtitle: `text-xl md:text-2xl`
- Button color: `bg-[#E07B54]`
- Background image: URL en `backgroundImage`

---

## FeaturedRestaurantsSection

Muestra un grid de restaurantes destacados con imágenes.

### Ubicación
```
frontend/src/components/sections/FeaturedRestaurantsSection.tsx
```

### Props

```typescript
interface FeaturedRestaurantsSectionProps {
  restaurants: RestaurantDetail[]  // Array de restaurantes a mostrar
}
```

### Ejemplo de Uso

```tsx
import { useRestaurants } from '../../hooks/useRestaurants'
import FeaturedRestaurantsSection from '../../components/sections/FeaturedRestaurantsSection'

export default function MyPage() {
  const { restaurants } = useRestaurants()

  // Seleccionar 4 random
  const featured = useMemo(() => {
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }, [restaurants])

  return featured.length > 0 ? (
    <FeaturedRestaurantsSection restaurants={featured} />
  ) : null
}
```

### Características

- Cards con imagen dinámicamente cargada (endpoint `/get-restaurant-image/{id}`)
- Badge con rating (estrellas)
- Badge con segmento
- Precio en footer
- Hover effects: scale de imagen + CTA reveal
- Links a `/cliente/restaurantes/{id}/menu`
- Lazy loading de imágenes
- Responsive grid (1-2-4 columnas)

### Componente Interno: RatingDisplay

Muestra 5 estrellas con fill proporcional al rating.

```typescript
function RatingDisplay({ rating }: { rating: number | null }) {
  // Retorna div con estrellas parcialmente llenas
  // Si rating es null, retorna null
}
```

---

## HowItWorksSection

Muestra 3 pasos de cómo funciona la plataforma.

### Ubicación
```
frontend/src/components/sections/HowItWorksSection.tsx
```

### Props

No requiere props (contenido hardcoded).

### Ejemplo de Uso

```tsx
import HowItWorksSection from '../../components/sections/HowItWorksSection'

export default function MyPage() {
  return (
    <section className="space-y-8">
      <HowItWorksSection />
    </section>
  )
}
```

### Contenido Hardcoded

1. **Descubre Restaurantes** (Search icon)
   - "Explora nuestra colección completa filtrada..."

2. **Filtra & Compara** (Filter icon)
   - "Personaliza tu búsqueda según tus preferencias..."

3. **Consulta & Decide** (CheckCircle icon)
   - "Accede al menú completo, precios y detalles..."

### Características

- Número de paso en círculo gradient
- Icono de lucide-react
- Línea conectora entre pasos (desktop only)
- Hover effects en cards
- Responsive (stacked en mobile)

### Personalizar Pasos

Para cambiar los pasos, edita el array `steps` en el componente:

```tsx
const steps = [
  {
    icon: YourIcon,
    title: 'Tu Título',
    description: 'Tu descripción aquí',
  },
  // ...
]
```

---

## ValuePropositionSection

Muestra 4 propuestas de valor de AZCA.

### Ubicación
```
frontend/src/components/sections/ValuePropositionSection.tsx
```

### Props

No requiere props (contenido hardcoded).

### Ejemplo de Uso

```tsx
import ValuePropositionSection from '../../components/sections/ValuePropositionSection'

export default function MyPage() {
  return <ValuePropositionSection />
}
```

### Contenido Hardcoded

1. **Rápido & Intuitivo** (Zap icon)
   - "Encuentra el restaurante perfecto en menos de un minuto..."

2. **Información Actualizada** (TrendingUp icon)
   - "Horarios, menús y precios siempre al día..."

3. **Confiable & Verificado** (Shield icon)
   - "Todos nuestros restaurantes están verificados..."

4. **Comunidad Activa** (Users icon)
   - "Únete a miles de usuarios que descubren..."

### Características

- Grid 2 columnas (responsive)
- Hover effects: scale icon, cambio de colores
- Icons dinámicos con hover scale
- Cards con border y shadow
- Background gradients

### Personalizar Valores

Edita el array `values` en el componente:

```tsx
const values = [
  {
    icon: YourIcon,
    title: 'Tu Valor',
    description: 'Descripción del valor',
  },
  // ...
]
```

---

## SectionDivider

Línea decorativa para separar secciones.

### Ubicación
```
frontend/src/components/sections/SectionDivider.tsx
```

### Props

No requiere props.

### Ejemplo de Uso

```tsx
import SectionDivider from '../../components/sections/SectionDivider'

export default function MyPage() {
  return (
    <>
      <Section1 />
      <SectionDivider />
      <Section2 />
      <SectionDivider />
      <Section3 />
    </>
  )
}
```

### Características

- Línea gradiente horizontal (transparent → color → transparent)
- Color: D88B5A (coral)
- Padding vertical: py-8
- Responsive (mismo ancho en todas las resoluciones)

### Personalizar Color

Edita el className `from-transparent via-[#D88B5A]/30 to-transparent`:

```tsx
// Cambiar color:
via-[#YOUR_COLOR]/30

// Cambiar intensidad:
via-[#D88B5A]/20  // más sutil
via-[#D88B5A]/50  // más prominente
```

---

## Ejemplos de Uso

### Landing Page Completa

```tsx
import { useState, useMemo } from 'react'
import HeroSection from '../../components/sections/HeroSection'
import FeaturedRestaurantsSection from '../../components/sections/FeaturedRestaurantsSection'
import HowItWorksSection from '../../components/sections/HowItWorksSection'
import ValuePropositionSection from '../../components/sections/ValuePropositionSection'
import SectionDivider from '../../components/sections/SectionDivider'
import { useRestaurants } from '../../hooks/useRestaurants'

export default function LandingPageView() {
  const { restaurants } = useRestaurants()
  const [search, setSearch] = useState('')

  const featuredRestaurants = useMemo(() => {
    if (restaurants.length === 0) return []
    const shuffled = [...restaurants].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }, [restaurants])

  const handleSearch = () => {
    window.location.href = `/restaurantes?search=${encodeURIComponent(search)}`
  }

  return (
    <div className="space-y-20">
      {/* Hero */}
      <HeroSection
        search={search}
        setSearch={setSearch}
        onSearch={handleSearch}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      />

      {/* Segmentos */}
      <section className="space-y-8">
        <h2 className="text-5xl font-bold text-center">Explora Nuestros Segmentos</h2>
        {/* Tus segmentos aquí */}
      </section>

      <SectionDivider />

      {/* How It Works */}
      <HowItWorksSection />

      <SectionDivider />

      {/* Featured */}
      {featuredRestaurants.length > 0 && (
        <FeaturedRestaurantsSection restaurants={featuredRestaurants} />
      )}

      <SectionDivider />

      {/* Value Proposition */}
      <ValuePropositionSection />

      <SectionDivider />

      {/* More sections... */}
    </div>
  )
}
```

### Con Búsqueda URL Params (Futuro)

```tsx
import { useSearchParams } from 'react-router-dom'

export default function LandingPageView() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const [search, setSearch] = useState(searchQuery)

  // Cuando se monta, si hay query param, hacer búsqueda automática
  useEffect(() => {
    if (searchQuery) {
      // Hacer algo con la búsqueda
    }
  }, [searchQuery])

  return (
    <HeroSection
      search={search}
      setSearch={setSearch}
      onSearch={() => {
        // Lógica de búsqueda
      }}
      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
    />
  )
}
```

---

## 🎨 Dark Mode Support

Todos los componentes soportan dark mode automáticamente usando:

- `var(--text)` - Texto principal
- `var(--text-muted)` - Texto secundario
- `var(--surface)` - Fondo primario
- `var(--surface-soft)` - Fondo secundario
- `var(--border)` - Bordes

CSS variables se definen en `index.css` y se adaptan con `@media (prefers-color-scheme: dark)`.

---

## ✨ Tips y Trucos

### Animar Entrada de Secciones

```tsx
<section className="animate-in fade-in duration-700">
  <HowItWorksSection />
</section>
```

### Lazy Load Secciones

```tsx
import { useState, useEffect } from 'react'

export default function MyPage() {
  const [showFeatured, setShowFeatured] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatured(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <HeroSection {...} />
      {showFeatured && <FeaturedRestaurantsSection {...} />}
    </>
  )
}
```

### Cambiar Espaciado Entre Secciones

```tsx
<div className="space-y-32">  {/* Más espaciado: 32 = 128px */}
  <HeroSection {...} />
  <SectionDivider />
  <HowItWorksSection />
</div>

<div className="space-y-8">   {/* Menos espaciado: 8 = 32px */}
  <HeroSection {...} />
  <SectionDivider />
  <HowItWorksSection />
</div>
```

### Responsive Customization

```tsx
{/* Desktop: 4 cols, Tablet: 2 cols, Mobile: 1 col */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* Items */}
</div>
```

---

## 🐛 Troubleshooting

### Featured Restaurants no carga imágenes

**Problema**: Las imágenes salen como placeholder

**Solución**: Asegúrate que el endpoint `/get-restaurant-image/{id}` está disponible

```bash
# Test el endpoint
curl http://127.0.0.1:8000/get-restaurant-image/1
```

### Dark Mode no funciona

**Problema**: Los colores no cambian en dark mode

**Solución**: Asegúrate que estés usando `var(--text)` y no colores hardcoded

```tsx
// ❌ INCORRECTO
<div className="text-black">Text</div>

// ✅ CORRECTO
<div className="text-[var(--text)]">Text</div>
```

### Secciones muy separadas

**Problema**: Demasiado espaciado entre secciones

**Solución**: Reduce `space-y-20` a `space-y-10` o `space-y-12`

---

## 📚 Referencias

- [TailwindCSS Spacing](https://tailwindcss.com/docs/padding)
- [Lucide React Icons](https://lucide.dev)
- [React Hooks](https://react.dev/reference/react)
- [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/2/objects.html)

---

**Última actualización**: 2026-03-17
**Status**: ✅ Production Ready
