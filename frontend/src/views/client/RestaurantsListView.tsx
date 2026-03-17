import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Wifi, Sparkles, Building2, Briefcase, Users, Linkedin, ArrowRight, Crown, Star } from 'lucide-react'
import { isInPriceRange, type PriceRange, useRestaurants } from '../../hooks/useRestaurants'
import type { RestaurantDetail } from '../../types/domain'
import { getCanonicalCuisineCode, getCuisineMeta } from '../../utils/cuisine'

const chipBaseClass =
  'rounded-full border border-[#3A3037]/70 bg-[var(--surface-soft)]/80 px-3 py-1 text-xs font-medium text-[var(--text)] transition-all duration-200'

const chipSelectedClass =
  'border-[#D88B5A] bg-[#D88B5A] text-white shadow-[0_0_12px_rgba(216,139,90,0.35)] dark:border-[#E8C07D] dark:bg-[#E8C07D] dark:text-[#1A1A2E]'

const SEGMENTS = [
  {
    key: 'gourmet',
    label: 'Gourmet',
    description: 'Alta cocina y experiencias exclusivas.',
    icon: Sparkles,
  },
  {
    key: 'traditional',
    label: 'Tradicional',
    description: 'Sabores clásicos y cocina auténtica.',
    icon: Building2,
  },
  {
    key: 'business',
    label: 'Negocios',
    description: 'Espacios elegantes para reuniones.',
    icon: Briefcase,
  },
  {
    key: 'family',
    label: 'Familiar',
    description: 'Ambiente cercano para compartir.',
    icon: Users,
  },
] as const

const INITIAL_VISIBLE_RESTAURANTS = 8
const VISIBLE_RESTAURANTS_STEP = 4

type IndexedRestaurant = {
  restaurant: RestaurantDetail
  searchableText: string
  segmentCode: string
  cuisineCode: string | null
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizeSegment(segment: string | null | undefined): string {
  const normalized = normalizeText(segment)

  if (['gourmet'].includes(normalized)) return 'gourmet'
  if (['tradicional', 'traditional'].includes(normalized)) return 'traditional'
  if (['negocios', 'business', 'corporate'].includes(normalized)) return 'business'
  if (['familiar', 'family'].includes(normalized)) return 'family'

  return normalized
}

function priceRangeLabel(range: PriceRange): string {
  if (range === 'low') return 'Hasta €15'
  if (range === 'mid') return '€15 - €25'
  if (range === 'high') return 'Más de €25'
  return 'Todos los precios'
}

function RatingDisplay({ rating }: { rating: number | null }) {
  const safeRating = typeof rating === 'number' ? Math.max(0, Math.min(5, rating)) : null
  const getStarFill = (index: number) => {
    if (safeRating === null) return 0
    return Math.max(0, Math.min(1, safeRating - index))
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const fill = getStarFill(index)

          return (
            <span key={index} className="relative block h-[14px] w-[14px]">
              <Star size={14} className="absolute inset-0 text-[#D4AF37]/20" />
              {fill > 0 ? (
                <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                  <Star size={14} className="text-[#D4AF37] fill-[#D4AF37]" />
                </span>
              ) : null}
            </span>
          )
        })}
      </div>
      <span className="text-sm font-semibold text-[#F6D37A]">{safeRating !== null ? safeRating.toFixed(1) : 'N/A'}</span>
    </div>
  )
}

const RestaurantCard = memo(function RestaurantCard({ restaurant, index, showOpenToday }: { restaurant: RestaurantDetail; index: number; showOpenToday: boolean }) {
  const price = restaurant.menu_price ?? 18
  const cuisineMeta = getCuisineMeta(restaurant.cuisine_type)
  const segment = restaurant.restaurant_segment ?? 'General'
  const rating = restaurant.google_rating
  const [imageUrl, setImageUrl] = useState<string>('https://placehold.co/400x200?text=Restaurante')

  // Cargar imagen desde Azure Storage
  useEffect(() => {
    const loadImage = async () => {
      try {
        console.log(`[RestaurantCard] Loading image for restaurant ${restaurant.restaurant_id}`)
        const response = await fetch(`/get-restaurant-image/${restaurant.restaurant_id}`)
        console.log(`[RestaurantCard] Response status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`[RestaurantCard] Image URL received: ${data.image_url}`)
          setImageUrl(data.image_url)
        } else {
          console.error(`[RestaurantCard] Failed to load image: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        console.error(`[RestaurantCard] Error loading image:`, error)
      }
    }
    loadImage()
  }, [restaurant.restaurant_id])

  return (
    <article
      className={`restaurant-card group transform-gpu overflow-hidden rounded-3xl border border-[var(--border)]/50 bg-[var(--surface)]/92 shadow-[0_10px_24px_rgba(10,12,20,0.16),-6px_-6px_12px_rgba(216,139,90,0),6px_-6px_12px_rgba(216,139,90,0),-6px_6px_12px_rgba(216,139,90,0),6px_6px_12px_rgba(216,139,90,0),0_14px_28px_rgba(10,12,20,0.22)] transition-[transform,box-shadow,border-color] duration-150 ease-out hover:-translate-y-[2px] hover:border-[#D88B5A]/100 hover:shadow-[0_10px_24px_rgba(10,12,20,0.16),-6px_-6px_12px_rgba(216,139,90,0.6),6px_-6px_12px_rgba(216,139,90,0.6),-6px_6px_12px_rgba(216,139,90,0.6),6px_6px_12px_rgba(216,139,90,0.6),0_14px_28px_rgba(10,12,20,0.22)] ${index < 8 ? 'animate-card-in' : ''}`}
      style={{ animationDelay: `${Math.min(index * 55, 420)}ms` }}
    >
      <div className="relative overflow-hidden">
        <img
          src={imageUrl}
          alt={restaurant.name}
          loading="lazy"
          decoding="async"
          className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {showOpenToday && restaurant.opens_weekends ? (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Abierto hoy
          </span>
        ) : null}

        {restaurant.has_wifi ? (
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Wifi size={12} />
            WiFi
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <h3 className="text-xl font-bold text-[var(--text)]">{restaurant.name}</h3>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--surface-soft)]/70 px-2.5 py-1 text-xs font-medium text-[var(--text)]">
            {cuisineMeta.label}
          </span>
          <span className="rounded-full bg-[#D88B5A]/15 px-2.5 py-1 text-xs font-medium text-[#D88B5A]">
            {segment}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-muted)]">~€{Math.round(price)}/menú</p>
          <RatingDisplay rating={rating} />
        </div>

        <Link
          to={`/cliente/restaurantes/${restaurant.restaurant_id}/menu`}
          className="inline-flex w-full items-center justify-center rounded-lg border-0 bg-gradient-to-r from-[#C9794D] to-[#E09A63] px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(201,121,77,0.25)] transition-all duration-200 hover:brightness-105"
        >
          Ver menú
        </Link>
      </div>
    </article>
  )
})

RestaurantCard.displayName = 'RestaurantCard'

export default function RestaurantsListView() {
  const { restaurants, cuisines, loading, error } = useRestaurants()
  const [search, setSearch] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [wifiOnly, setWifiOnly] = useState(false)
  const [weekendsOnly, setWeekendsOnly] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESTAURANTS)
  const [animatedCount, setAnimatedCount] = useState(0)
  const deferredSearch = useDeferredValue(search)
  const selectedCuisineCode = useMemo(
    () => (selectedCuisine === 'all' ? null : getCanonicalCuisineCode(selectedCuisine)),
    [selectedCuisine],
  )

  const isWeekendToday = useMemo(() => {
    const day = new Date().getDay()
    return day === 0 || day === 6
  }, [])

  const scrollToExplore = () => {
    const exploreSection = document.getElementById('explorar')
    if (exploreSection) {
      exploreSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const indexedRestaurants = useMemo<IndexedRestaurant[]>(() => {
    return restaurants.map((restaurant) => {
      const cuisineMeta = getCuisineMeta(restaurant.cuisine_type)
      return {
        restaurant,
        searchableText: normalizeText(`${restaurant.name} ${restaurant.restaurant_segment ?? ''} ${cuisineMeta.label}`),
        segmentCode: normalizeSegment(restaurant.restaurant_segment),
        cuisineCode: getCanonicalCuisineCode(restaurant.cuisine_type),
      }
    })
  }, [restaurants])

  const filteredRestaurants = useMemo(() => {
    const normalizedSearch = normalizeText(deferredSearch)

    return indexedRestaurants
      .filter(({ restaurant, searchableText, segmentCode, cuisineCode }) => {
        const matchName = searchableText.includes(normalizedSearch)
        const matchCuisine = selectedCuisineCode === null || cuisineCode === selectedCuisineCode
        const matchSegment = selectedSegment === 'all' || segmentCode === selectedSegment
        const matchPrice = isInPriceRange(restaurant.menu_price, priceRange)
        const matchWifi = !wifiOnly || Boolean(restaurant.has_wifi)
        const matchWeekend = !weekendsOnly || Boolean(restaurant.opens_weekends)

        return matchName && matchCuisine && matchSegment && matchPrice && matchWifi && matchWeekend
      })
      .map(({ restaurant }) => restaurant)
  }, [indexedRestaurants, deferredSearch, selectedCuisineCode, selectedSegment, priceRange, wifiOnly, weekendsOnly])

  const visibleRestaurants = useMemo(
    () => filteredRestaurants.slice(0, visibleCount),
    [filteredRestaurants, visibleCount],
  )

  const hasMoreRestaurants = visibleCount < filteredRestaurants.length

  useEffect(() => {
    setVisibleCount((current) => {
      const nextBase = Math.min(INITIAL_VISIBLE_RESTAURANTS, filteredRestaurants.length)
      return current === nextBase ? current : nextBase
    })
  }, [filteredRestaurants.length])

  useEffect(() => {
    const target = filteredRestaurants.length
    const start = animatedCount
    if (target === start) return

    const steps = 10
    const increment = (target - start) / steps
    let currentStep = 0

    const timer = window.setInterval(() => {
      currentStep += 1
      if (currentStep >= steps) {
        setAnimatedCount(target)
        window.clearInterval(timer)
        return
      }

      setAnimatedCount(Math.round(start + increment * currentStep))
    }, 24)

    return () => window.clearInterval(timer)
  }, [filteredRestaurants.length])

  return (
    <section id="inicio" className="space-y-10">
      <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div
          className="relative px-6 py-16 md:px-10 md:py-20"
          style={{
            backgroundImage:
              'linear-gradient(120deg, rgba(26,26,46,0.78), rgba(26,26,46,0.35)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="mx-auto max-w-4xl space-y-6 text-white">
            <h2 className="text-4xl font-bold leading-tight md:text-6xl">
              Descubre la Excelencia Gastronómica
            </h2>
            <p className="max-w-2xl text-base text-white/85 md:text-lg">
              Reserva en los mejores restaurantes gourmet, tradicionales y exclusivos de la ciudad.
            </p>

            <div className="flex w-full flex-col gap-3 rounded-2xl bg-white/95 p-3 shadow-md backdrop-blur md:flex-row">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                <input
                  type="search"
                  placeholder="Buscar por nombre, zona o estilo..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-xl border border-[#D6D9E0] bg-white py-3 pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition-all duration-200 focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20"
                />
              </div>
              <button
                type="button"
                onClick={scrollToExplore}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#E07B54] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95"
              >
                Buscar
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-[var(--text)]">Segmentos Destacados</h3>
          <p className="text-sm text-[var(--text-muted)]">Selecciona un segmento para filtrar la selección de abajo.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {SEGMENTS.map((segment) => {
            const Icon = segment.icon

            return (
              <button
                key={segment.key}
                type="button"
                onClick={() => setSelectedSegment((prev) => (prev === segment.key ? 'all' : segment.key))}
                className={`luxury-panel rounded-2xl border p-4 text-left transition-all duration-200 hover:scale-[1.02] ${
                  selectedSegment === segment.key
                    ? 'border-[#D88B5A] bg-[#D88B5A]/10 shadow-md dark:border-[#E8C07D] dark:bg-[#E8C07D]/15'
                    : 'border-[#3A3037]/70 bg-[var(--surface)]/70 hover:-translate-y-0.5 hover:shadow-md'
                }`}
              >
                <div className="mb-2 inline-flex rounded-xl bg-[var(--surface-soft)] p-2">
                  <Icon size={18} className="text-[var(--accent)]" />
                </div>
                <p className="text-base font-semibold text-[var(--text)]">{segment.label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{segment.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div
        id="explorar"
        className="selection-surface animate-grid-shimmer space-y-4 rounded-3xl p-6"
        style={{
          backgroundImage:
            'radial-gradient(circle at 8% 12%, rgba(216,139,90,0.07), transparent 36%), radial-gradient(circle at 92% 88%, rgba(79,140,255,0.08), transparent 38%), radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: 'auto, auto, 28px 28px',
        }}
      >
        <div className="space-y-1">
          <h3 className="text-2xl font-bold text-[var(--text)] md:text-3xl">Nuestra Selección</h3>
          <p className="text-sm text-[var(--text-muted)]">Filtra por estilo, precio y servicios para encontrar tu mesa ideal.</p>
        </div>

        <div className="border-t border-[var(--border)]/60 pt-4">
          <div className="flex flex-wrap gap-2">
          {['all', ...cuisines.filter((item) => item !== 'all')].map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              onClick={() => setSelectedCuisine(cuisine)}
              className={`${chipBaseClass} ${
                selectedCuisine === cuisine
                  ? `${chipSelectedClass} animate-chip-glow shadow-[0_0_8px_rgba(224,123,84,0.5)]`
                  : 'hover:brightness-95'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {cuisine === 'all' ? 'Todas las cocinas' : getCuisineMeta(cuisine).label}
              </span>
            </button>
          ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
          {(['all', 'low', 'mid', 'high'] as PriceRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setPriceRange(range)}
              className={`${chipBaseClass} ${
                priceRange === range
                  ? `${chipSelectedClass} animate-chip-glow shadow-[0_0_8px_rgba(224,123,84,0.5)]`
                  : 'hover:brightness-95'
              }`}
            >
              {priceRangeLabel(range)}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setWifiOnly((prev) => !prev)}
            className={`${chipBaseClass} ${
              wifiOnly
                ? `${chipSelectedClass} animate-chip-glow shadow-[0_0_8px_rgba(224,123,84,0.5)]`
                : 'hover:brightness-95'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <Wifi size={14} />
              WiFi disponible
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWeekendsOnly((prev) => !prev)}
            className={`${chipBaseClass} ${
              weekendsOnly
                ? `${chipSelectedClass} animate-chip-glow shadow-[0_0_8px_rgba(224,123,84,0.5)]`
                : 'hover:brightness-95'
            }`}
          >
            Abre en fin de semana
          </button>
          </div>
        </div>
      </div>

      {loading ? <p className="text-sm text-[var(--text-muted)]">Cargando restaurantes...</p> : null}
      {error ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{error}</p> : null}

      {!loading && !error && filteredRestaurants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
          No hay restaurantes que cumplan los filtros seleccionados o no hay datos en base de datos.
        </div>
      ) : null}

      <div
        className="luxury-panel relative overflow-hidden rounded-3xl border border-[var(--border)]/70 bg-[var(--surface)]/80 p-5 shadow-[0_14px_30px_rgba(0,0,0,0.24)] md:p-6"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-80 w-80 translate-x-1/3 -translate-y-1/3 rounded-full bg-[#B86A44]/10 blur-[76px]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 -translate-x-1/4 translate-y-1/4 rounded-full bg-[#4F8CFF]/8 blur-[68px] dark:bg-[#7AA2FF]/12" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="inline-flex items-center gap-2 text-xl font-bold text-[var(--text)]">
                  <Crown size={16} className="text-[#E07B54]" />
                  Restaurantes disponibles
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Mostrando {visibleRestaurants.length} de {animatedCount} resultados
                </p>
              </div>
              <Link
                to="/restaurantes"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E07B54] hover:text-[#D88B5A] transition-colors"
              >
                Ver todos
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="h-px w-full bg-gradient-to-r from-[#E07B54] to-transparent" />
          </div>

          <div className="relative">
            <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {visibleRestaurants.map((restaurant, index) => (
                <RestaurantCard key={restaurant.restaurant_id} restaurant={restaurant} index={index} showOpenToday={isWeekendToday} />
              ))}
            </div>

            {hasMoreRestaurants ? (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((current) =>
                      Math.min(current + VISIBLE_RESTAURANTS_STEP, filteredRestaurants.length),
                    )
                  }
                  className="inline-flex items-center justify-center rounded-xl border border-[#D88B5A]/50 bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all duration-200 hover:border-[#D88B5A] hover:shadow-sm"
                >
                  Cargar más restaurantes
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <footer className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="mb-5 h-px w-full bg-gradient-to-r from-transparent via-[#E07B54] to-transparent" />
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <p className="text-xl font-bold text-[var(--text)]">CUISINE AML</p>
            <p className="text-sm text-[var(--text-muted)]">Prestige Restaurant Management</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Soporte</p>
            <Link to="/sobre-nosotros" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Sobre Nosotros</Link>
            <a href="#" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Centro de ayuda</a>
            <a href="#" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Contacto</a>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Legal</p>
            <a href="#" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Términos y condiciones</a>
            <a href="#" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Política de privacidad</a>
            <Link to="/admin/login" className="block text-sm text-[var(--text-muted)] hover:text-[var(--text)]">Portal de Administrador</Link>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text)]">Desarrollado por</p>
            <div className="space-y-1.5">
              <a
                href="https://www.linkedin.com/in/mario-garcia-romero-453348304"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <Linkedin size={14} />
                Mario García
              </a>
              <a
                href="https://www.linkedin.com/in/adnan-hamidoun-el-habti-252079311"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <Linkedin size={14} />
                Adnan Hamidoun
              </a>
              <a
                href="https://www.linkedin.com/in/lucian-ciusa-66a7b92b6"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <Linkedin size={14} />
                Lucian Ciusa
              </a>
            </div>
          </div>
        </div>
      </footer>
    </section>
  )
}
