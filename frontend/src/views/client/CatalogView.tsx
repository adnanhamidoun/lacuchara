import { memo, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Wifi, Sparkles, Building2, Briefcase, Users, ArrowLeft, Crown, Star, ChevronUp, ChevronDown, Navigation } from 'lucide-react'
import { useUserLocation } from '../../context/LocationContext'
import { isInPriceRange, type PriceRange, useRestaurants } from '../../hooks/useRestaurants'
import type { RestaurantDetail } from '../../types/domain'
import { getCanonicalCuisineCode, getCuisineMeta } from '../../utils/cuisine'
import {
  FilterChip,
  FilterGroup,
  SortControl,
  ActiveFiltersSummary,
  CatalogFilters,
  FilterToolbar,
} from '../../components/filters'

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

type SortOption = 'name' | 'rating' | 'price'

type DishRankingOrder = 'avg' | 'votes' | 'trend'

type DishRankingRow = {
  dish_id: number | null
  dish_name: string
  restaurant_id: number  // ✅ Nuevo
  restaurant_name: string  // ✅ Nuevo
  avg_rating: number | null
  votes: number
  trend_7d: number | null
}

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

  if (safeRating === null) return null

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
      <span className="text-xs font-medium text-[var(--text-muted)]">{safeRating.toFixed(1)}</span>
    </div>
  )
}

const RestaurantCard = memo(function RestaurantCard({
  restaurant,
  index,
  showOpenToday,
  userLocation,
}: {
  restaurant: RestaurantDetail & { distance_km?: number }
  index: number
  showOpenToday: boolean
  userLocation?: { latitude: number; longitude: number }
}) {
  const cuisineMeta = getCuisineMeta(restaurant.cuisine_type)
  const [imageUrl, setImageUrl] = useState<string>('https://placehold.co/400x300?text=Restaurante')

  // Cargar imagen desde el endpoint (igual que en RestaurantsListView)
  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(`/get-restaurant-image/${restaurant.restaurant_id}`)
        
        if (response.ok) {
          const data = await response.json()
          setImageUrl(data.image_url)
        } else {
          console.error(`Failed to load image: ${response.status}`)
        }
      } catch (error) {
        console.error(`Error loading image:`, error)
      }
    }
    loadImage()
  }, [restaurant.restaurant_id])

  return (
    <Link
      to={`/cliente/restaurantes/${restaurant.restaurant_id}/menu`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)] transition-all duration-300 hover:border-[#E07B54]/50 hover:shadow-lg"
      style={{
        animation: `slideInUp 0.4s ease-out ${index * 50}ms backwards`,
      }}
    >
      <div className="relative h-48 w-full overflow-hidden bg-[var(--surface-soft)]">
        <img
          src={imageUrl}
          alt={restaurant.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#1A1A2E] backdrop-blur">
          <RatingDisplay rating={restaurant.google_rating} />
        </div>

        {showOpenToday && restaurant.opens_weekends ? (
          <div className="absolute left-3 top-3 rounded-full bg-[#4CAF50]/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            Abierto hoy
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h4 className="line-clamp-2 text-base font-bold text-[var(--text)] group-hover:text-[#E07B54]">{restaurant.name}</h4>
          <p className="text-xs text-[var(--text-muted)]">{cuisineMeta.label}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {restaurant.restaurant_segment ? (
            <span className="inline-block rounded-full bg-[#E07B54]/10 px-2.5 py-0.5 text-xs font-medium text-[#E07B54]">
              {restaurant.restaurant_segment}
            </span>
          ) : null}
        </div>

        <div className="mt-auto space-y-2 border-t border-[var(--border)]/50 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              {restaurant.has_wifi && <span className="inline-flex items-center gap-1">
                <Wifi size={12} />
                WiFi
              </span>}
            </span>
            <span className="text-xs font-semibold text-[#E07B54]">
              {restaurant.menu_price ? `€${restaurant.menu_price}` : '-'}
            </span>
          </div>
          {userLocation && restaurant.distance_km !== undefined && (
            <div className="flex items-center gap-1 text-blue-600 font-medium text-sm">
              <Navigation size={14} />
              <span>{restaurant.distance_km >= 1 ? `${restaurant.distance_km.toFixed(1)} km` : `${(restaurant.distance_km * 1000).toFixed(0)} m`}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
})

export default function CatalogView() {
  const { userLocation } = useUserLocation()
  const { restaurants: restaurantsFromHook, loading: hookLoading, error: hookError, cuisines } = useRestaurants()
  const [restaurants, setRestaurants] = useState(restaurantsFromHook)
  const [loading, setLoading] = useState(hookLoading)
  const [error, setError] = useState(hookError)
  const [search, setSearch] = useState('')

  // Si hay ubicación, cargar restaurantes cercanos con distancias
  useEffect(() => {
    if (!userLocation) {
      setRestaurants(restaurantsFromHook)
      setLoading(hookLoading)
      setError(hookError)
      return
    }

    const loadNearby = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          user_latitude: userLocation.latitude.toString(),
          user_longitude: userLocation.longitude.toString(),
        })
        const response = await fetch(`/restaurants/nearby?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch nearby restaurants')
        }
        const data = await response.json()
        setRestaurants(data.restaurants || [])
        setError(null)
      } catch (err) {
        console.error('Error loading nearby restaurants:', err)
        setRestaurants(restaurantsFromHook)
        setError(null) // No mostrar error, usar fallback
      } finally {
        setLoading(false)
      }
    }

    loadNearby()
  }, [userLocation, restaurantsFromHook, hookLoading, hookError])
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [priceRange, setPriceRange] = useState<PriceRange>('all')
  const [wifiOnly, setWifiOnly] = useState(false)
  const [weekendsOnly, setWeekendsOnly] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showDishRanking, setShowDishRanking] = useState(false)
  const [dishRankingOrder, setDishRankingOrder] = useState<DishRankingOrder>('avg')
  const [dishRankingViewType, setDishRankingViewType] = useState<'rating' | 'votes'>('rating')
  const [dishRankingVisibleCount, setDishRankingVisibleCount] = useState(5)
  const [dishRankingRows, setDishRankingRows] = useState<DishRankingRow[] | null>(null)
  const [dishRankingLoading, setDishRankingLoading] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const selectedCuisineCode = useMemo(
    () => (selectedCuisine === 'all' ? null : getCanonicalCuisineCode(selectedCuisine)),
    [selectedCuisine],
  )

  const isWeekendToday = useMemo(() => {
    const day = new Date().getDay()
    return day === 0 || day === 6
  }, [])

  useEffect(() => {
    if (!showDishRanking) return

    let cancelled = false
    setDishRankingLoading(true)

    const run = async () => {
      try {
        const response = await fetch(
          `/rankings/dishes?order_by=${encodeURIComponent(dishRankingOrder)}&limit=25&min_votes=1`,
        )
        if (!response.ok) throw new Error('dish ranking failed')
        const payload = (await response.json()) as { dishes?: DishRankingRow[] }
        if (!cancelled) setDishRankingRows(payload.dishes ?? [])
      } catch {
        if (!cancelled) setDishRankingRows([])
      } finally {
        if (!cancelled) setDishRankingLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [showDishRanking, dishRankingOrder])

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
      .sort((a, b) => {
        let compareValue = 0

        if (sortBy === 'name') {
          compareValue = (a.name || '').localeCompare(b.name || '')
        } else if (sortBy === 'rating') {
          compareValue = (b.google_rating ?? 0) - (a.google_rating ?? 0)
        } else if (sortBy === 'price') {
          compareValue = (a.menu_price ?? 0) - (b.menu_price ?? 0)
        }

        return sortOrder === 'asc' ? compareValue : -compareValue
      })
  }, [indexedRestaurants, deferredSearch, selectedCuisineCode, selectedSegment, priceRange, wifiOnly, weekendsOnly, sortBy, sortOrder])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedSegment !== 'all') count++
    if (selectedCuisine !== 'all') count++
    if (priceRange !== 'all') count++
    if (wifiOnly) count++
    if (weekendsOnly) count++
    return count
  }, [selectedSegment, selectedCuisine, priceRange, wifiOnly, weekendsOnly])

  // Reset all filters
  const handleClearFilters = () => {
    setSelectedSegment('all')
    setSelectedCuisine('all')
    setPriceRange('all')
    setWifiOnly(false)
    setWeekendsOnly(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E07B54] hover:text-[#D88B5A] transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a inicio
          </Link>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-[var(--text)]">Catálogo Completo</h1>
          <p className="text-sm text-[var(--text-muted)]">Explora todos nuestros restaurantes disponibles</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            type="search"
            placeholder="Buscar por nombre, zona o estilo..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-3 pl-10 pr-4 text-sm text-[var(--text)] outline-none transition-all duration-200 focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <ActiveFiltersSummary
          activeCount={activeFilterCount}
          onClearAll={handleClearFilters}
          resultCount={filteredRestaurants.length}
        />
      )}

      {/* Premium Filter Panel */}
      <CatalogFilters hasActiveFilters={activeFilterCount > 0}>
        {/* Toolbar */}
        <FilterToolbar
          leftContent="Filtros"
          centerContent={
            filteredRestaurants.length > 0
              ? `${filteredRestaurants.length} restaurante${filteredRestaurants.length !== 1 ? 's' : ''}`
              : ''
          }
          rightContent={
            activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[#E07B54] hover:text-[#D88B5A] transition-colors px-3 py-1.5"
              >
                Limpiar filtros
              </button>
            ) : null
          }
        />

        {/* Main Filter Content */}
        <div className="border-t border-[var(--border)]/50 px-4 py-6">
          {/* 2-Column Grid on Desktop */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column: Segmento, Cocina */}
            <div className="space-y-6">
              {/* Segmentos */}
              <FilterGroup title="Segmentos" description="Tipo de experiencia culinaria">
                {SEGMENTS.map((segment) => (
                  <FilterChip
                    key={segment.key}
                    label={segment.label}
                    isActive={selectedSegment === segment.key}
                    onClick={() =>
                      setSelectedSegment((prev) => (prev === segment.key ? 'all' : segment.key))
                    }
                    icon={<segment.icon size={14} />}
                  />
                ))}
              </FilterGroup>

              {/* Cocina */}
              <FilterGroup title="Cocina" description="Tipo de gastronomía">
                <FilterChip
                  label="Todas"
                  isActive={selectedCuisine === 'all'}
                  onClick={() => setSelectedCuisine('all')}
                />
                {cuisines.filter((item) => item !== 'all').map((cuisine) => (
                  <FilterChip
                    key={cuisine}
                    label={getCuisineMeta(cuisine).label}
                    isActive={selectedCuisine === cuisine}
                    onClick={() => setSelectedCuisine(cuisine)}
                  />
                ))}
              </FilterGroup>
            </div>

            {/* Right Column: Precio, Extras */}
            <div className="space-y-6">
              {/* Precio */}
              <FilterGroup title="Precio" description="Rango de precios">
                {(['all', 'low', 'mid', 'high'] as PriceRange[]).map((range) => (
                  <FilterChip
                    key={range}
                    label={priceRangeLabel(range)}
                    isActive={priceRange === range}
                    onClick={() => setPriceRange(range)}
                  />
                ))}
              </FilterGroup>

              {/* Extras */}
              <FilterGroup title="Extras" description="Comodidades y servicios">
                <FilterChip
                  label="WiFi disponible"
                  isActive={wifiOnly}
                  onClick={() => setWifiOnly((prev) => !prev)}
                  icon={<Wifi size={14} />}
                />
                <FilterChip
                  label="Abierto fin de semana"
                  isActive={weekendsOnly}
                  onClick={() => setWeekendsOnly((prev) => !prev)}
                />
              </FilterGroup>
            </div>
          </div>
        </div>
      </CatalogFilters>

      {/* Sort Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-[var(--text-muted)]">
          Mostrando <span className="font-semibold text-[var(--text)]">{filteredRestaurants.length}</span> restaurante
          {filteredRestaurants.length !== 1 ? 's' : ''}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowDishRanking((prev) => !prev)
              if (!dishRankingRows) setDishRankingRows(null)
            }}
            className={`inline-flex items-center gap-2 rounded-full border border-[#3A3037]/50 bg-[var(--surface-soft)]/60 px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--surface-soft)] ${
              showDishRanking ? 'bg-[#E07B54]/10 text-[#E07B54] border-[#E07B54]/40' : ''
            }`}
            title="Ver ranking de platos por valoraciones"
          >
            <Crown size={16} className={showDishRanking ? 'text-[#E07B54]' : 'text-[var(--text-muted)]'} />
            Ranking platos
          </button>

          <SortControl
            options={[
              { value: 'name', label: 'Nombre' },
              { value: 'rating', label: 'Calificación' },
              { value: 'price', label: 'Precio' },
            ]}
            currentSort={sortBy}
            sortOrder={sortOrder}
            onSort={(value) => {
              if (sortBy === value) {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
              } else {
                setSortBy(value as SortOption)
                setSortOrder('asc')
              }
            }}
            onToggleOrder={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          />
        </div>
      </div>

      {showDishRanking ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[var(--text)]">
                {dishRankingViewType === 'rating' ? 'Ranking de platos' : 'Votos de platos'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {dishRankingViewType === 'rating' ? 'Por valoración (últimos 14 días).' : 'Platos más votados (últimos 14 días).'}
              </p>
            </div>

            <div className="inline-flex items-center gap-1 rounded-full border border-[#3A3037]/50 bg-[var(--surface-soft)]/60 p-1">
              <button
                type="button"
                onClick={() => {
                  setDishRankingViewType('rating')
                  setDishRankingVisibleCount(5)
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  dishRankingViewType === 'rating'
                    ? 'bg-[#E07B54]/10 text-[#E07B54]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                ⭐ Ranking
              </button>
              <button
                type="button"
                onClick={() => {
                  setDishRankingViewType('votes')
                  setDishRankingVisibleCount(5)
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  dishRankingViewType === 'votes'
                    ? 'bg-[#E07B54]/10 text-[#E07B54]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                🗳️ Votos
              </button>
            </div>
          </div>

          <div className="mt-4">
            {dishRankingLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Cargando...</p>
            ) : dishRankingRows && dishRankingRows.length > 0 ? (
              <>
                {dishRankingViewType === 'rating' ? (
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]">
                    <div className="grid grid-cols-12 gap-2 border-b border-[var(--border)]/50 px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Plato</div>
                      <div className="col-span-4">Restaurante</div>
                      <div className="col-span-3 text-right">Media</div>
                    </div>

                    {dishRankingRows
                      .sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0))
                      .slice(0, dishRankingVisibleCount)
                      .map((row, index) => (
                        <div
                          key={`${row.restaurant_id}-${row.dish_name}`}
                          className="grid grid-cols-12 gap-2 border-b border-[var(--border)]/30 px-4 py-3 text-sm text-[var(--text)] last:border-b-0"
                        >
                          <div className="col-span-1 font-semibold text-[var(--text-muted)]">{index + 1}</div>
                          <div className="col-span-4 font-semibold">{row.dish_name}</div>
                          <div className="col-span-4 text-sm text-[var(--text-muted)]">{row.restaurant_name}</div>
                          <div className="col-span-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span
                                  key={i}
                                  className={`text-sm ${(row.avg_rating ?? 0) > i ? 'text-[#D4AF37]' : 'text-[#D4AF37]/20'}`}
                                >
                                  ★
                                </span>
                              ))}
                              <span className="ml-1 text-xs text-[var(--text-muted)]">{row.avg_rating?.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]">
                    <div className="grid grid-cols-12 gap-2 border-b border-[var(--border)]/50 px-4 py-2 text-xs font-semibold text-[var(--text-muted)]">
                      <div className="col-span-1">#</div>
                      <div className="col-span-11 text-right">Plato – Votos</div>
                    </div>

                    {dishRankingRows
                      .sort((a, b) => b.votes - a.votes)
                      .slice(0, dishRankingVisibleCount)
                      .map((row, index) => (
                        <div
                          key={`${row.restaurant_id}-${row.dish_name}`}
                          className="grid grid-cols-12 gap-2 border-b border-[var(--border)]/30 px-4 py-3 text-sm text-[var(--text)] last:border-b-0"
                        >
                          <div className="col-span-1 font-semibold text-[var(--text-muted)]">{index + 1}</div>
                          <div className="col-span-11 flex items-center justify-between">
                            <span className="font-semibold">{row.dish_name}</span>
                            <span className="text-[var(--text-muted)]">{row.votes}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {dishRankingRows.length > dishRankingVisibleCount && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setDishRankingVisibleCount((prev) => prev + 5)}
                      className="inline-flex items-center rounded-lg border border-[#E07B54]/50 bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all hover:border-[#E07B54] hover:bg-[var(--surface-soft)]/80"
                    >
                      ↓ Cargar más platos
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
                No hay datos disponibles.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Results */}
      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Cargando restaurantes...</p>
      ) : error ? (
        <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{error}</p>
      ) : filteredRestaurants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-muted)]">
          No hay restaurantes que cumplan los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map((restaurant, index) => (
              <RestaurantCard key={restaurant.restaurant_id} restaurant={restaurant} index={index} showOpenToday={isWeekendToday} userLocation={userLocation} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
