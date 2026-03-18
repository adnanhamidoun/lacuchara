import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { RestaurantDetail } from '../../types/domain'
import { RestaurantHero, RestaurantSpecCard, RestaurantOverview, RestaurantMenuPreviewCard, RestaurantMap } from '../../components/restaurant'
import { FadeUpSection } from '../../components/motion'

type TodayMenuResponse = {
  menu_id: number
  restaurant_id: number
  date: string
  starter: string | null
  main: string | null
  dessert: string | null
  includes_drink: boolean
  menu_price?: number | null
}

export default function MenuView() {
  const { restaurantId } = useParams()
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayMenu, setTodayMenu] = useState<TodayMenuResponse | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const restaurantIdNumber = useMemo(() => {
    const parsed = Number(restaurantId)
    return Number.isFinite(parsed) ? parsed : null
  }, [restaurantId])

  useEffect(() => {
    if (!restaurantIdNumber) {
      setError('ID de restaurante inválido.')
      setLoading(false)
      return
    }

    const loadRestaurant = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/restaurants/${restaurantIdNumber}`)
        if (!response.ok) throw new Error('No se pudo cargar el restaurante seleccionado.')

        const data = (await response.json()) as RestaurantDetail
        setRestaurant(data)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar el restaurante seleccionado.')
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [restaurantIdNumber])

  useEffect(() => {
    if (!restaurantIdNumber) return

    const loadTodayMenu = async () => {
      try {
        const response = await fetch(`/restaurants/${restaurantIdNumber}/menu/today`)
        if (!response.ok) {
          setTodayMenu(null)
          return
        }
        const data = (await response.json()) as TodayMenuResponse
        setTodayMenu(data)
      } catch {
        setTodayMenu(null)
      }
    }

    loadTodayMenu()
  }, [restaurantIdNumber])

  const navigate = useNavigate()
  const [imageUrl, setImageUrl] = useState<string>('https://placehold.co/800x400?text=Restaurante')

  // Load restaurant image - same logic as CatalogView
  useEffect(() => {
    if (!restaurantIdNumber) return

    const loadImage = async () => {
      try {
        const response = await fetch(`/get-restaurant-image/${restaurantIdNumber}`)
        
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
  }, [restaurantIdNumber])

  return (
    <section className="space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Detalles del Restaurante</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Información completa y especificaciones</p>
        </div>
        <button
          onClick={() => navigate('/cliente/restaurantes')}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]"
        >
          ← Volver al listado
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <p className="text-[var(--text-muted)]">Cargando información del restaurante...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-[#E53935]/30 bg-[#E53935]/5 p-4">
          <p className="text-sm text-[#E53935]">{error}</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && restaurant && (
        <>
          {/* Hero Section */}
          <FadeUpSection>
            <RestaurantHero
              restaurant={restaurant}
              imageUrl={imageUrl}
              onBack={() => navigate('/cliente/restaurantes')}
            />
          </FadeUpSection>

          {/* Premium 2-Column Layout: Left Column (Overview + Menu) | Right Column (Specs) */}
          {/* Grid uses explicit minmax for perfect alignment: 2fr left, 320px minimum right */}
          <div className="grid gap-8 grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] items-start">
            {/* Left Column: Overview + Menu Preview (2/3 width) */}
            <div className="space-y-6">
              {/* Restaurant Overview & Quick Facts */}
              <FadeUpSection>
                <RestaurantOverview restaurant={restaurant} />
              </FadeUpSection>

              {/* Menu Preview - Integrated into upper section */}
              <FadeUpSection>
                <RestaurantMenuPreviewCard restaurant={restaurant} menuData={todayMenu} />
              </FadeUpSection>
            </div>

            {/* Right Column: Specifications (fixed minimum width) */}
            <div>
              <FadeUpSection>
                <RestaurantMap restaurant={restaurant} />
              </FadeUpSection>
              <FadeUpSection>
                <div className="mt-6">
                  <RestaurantSpecCard restaurant={restaurant} />
                </div>
              </FadeUpSection>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
