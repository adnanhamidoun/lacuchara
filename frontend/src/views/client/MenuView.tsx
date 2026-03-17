import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { RestaurantDetail } from '../../types/domain'

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

function parseMenuCourse(rawValue: string | null | undefined): string[] {
  if (!rawValue) return []
  return rawValue
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">Restaurante</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Información del restaurante seleccionado.
          </p>
        </div>

        <Link
          to="/cliente/restaurantes"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]"
        >
          Volver al listado
        </Link>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <p className="text-sm text-[var(--text-muted)]">Información</p>
        {loading ? <p className="text-sm text-[var(--text-muted)]">Cargando restaurante...</p> : null}
        {error ? <p className="text-sm text-[#E53935]">{error}</p> : null}
        {!loading && !error ? (
          <div className="mt-2 space-y-2">
            <h3 className="text-lg font-bold text-[var(--text)]">{restaurant?.name}</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {restaurant?.cuisine_type} • {restaurant?.restaurant_segment}
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Rating: {restaurant?.google_rating?.toFixed(1)} ⭐
            </p>
            <p className="text-sm text-[var(--text)]">
              Precio medio menú: €{(restaurant?.menu_price ?? 20).toFixed(2)}
            </p>
          </div>
        ) : null}
      </div>

      {todayMenu ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold text-[var(--text)]">Menú del día (hoy)</h4>
            <span className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--text-muted)]">
              {(todayMenu.includes_drink ? 'Incluye bebida' : 'No incluye bebida')}
            </span>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/40 p-4">
            {[
              { title: 'Entrantes', items: parseMenuCourse(todayMenu.starter) },
              { title: 'Principales', items: parseMenuCourse(todayMenu.main) },
              { title: 'Postres', items: parseMenuCourse(todayMenu.dessert) },
            ].map((section) => (
              <div key={section.title} className="mb-4 last:mb-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{section.title}</p>
                {section.items.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--text)]">
                    {section.items.map((item, index) => (
                      <li key={`${section.title}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Sin información.</p>
                )}
              </div>
            ))}
            <div className="mt-4 border-t border-[var(--border)] pt-3 text-sm font-semibold text-[var(--text)]">
              Precio del menú: €{(todayMenu.menu_price ?? restaurant?.menu_price ?? 20).toFixed(2)}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
