import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import type { RestaurantDetail } from '../../types/domain'

type PredictedDish = {
  rank: number
  name: string
  score: number
  estimated_count: number
}

type CoursePredictionResponse = {
  top_3_dishes: PredictedDish[]
}

type ServicePredictionResponse = {
  prediction_result: number
}

type MenuPredictionState = {
  starters: PredictedDish[]
  mains: PredictedDish[]
  desserts: PredictedDish[]
}

const emptyPredictions: MenuPredictionState = {
  starters: [],
  mains: [],
  desserts: [],
}

export default function PredictionDashboard() {
  const { session } = useAuth() as any
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuPredictions, setMenuPredictions] = useState<MenuPredictionState>(emptyPredictions)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState('')
  const [servicePrediction, setServicePrediction] = useState<number | null>(null)
  const [todayMenuExists, setTodayMenuExists] = useState(false)
  const [checkingTodayMenu, setCheckingTodayMenu] = useState(false)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [selectedDate, setSelectedDate] = useState(today)

  // Cargar datos del restaurante
  useEffect(() => {
    if (!session?.restaurant_id) {
      setError('No tienes sesión de restaurante.')
      setLoading(false)
      return
    }

    const loadRestaurant = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/restaurants/${session.restaurant_id}`)
        if (!response.ok) throw new Error('No se pudo cargar tu restaurante.')

        const data = (await response.json()) as RestaurantDetail
        setRestaurant(data)
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar tu restaurante.')
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [session?.restaurant_id])

  // Verificar si existe menú para hoy
  useEffect(() => {
    if (!session?.restaurant_id || !session?.token) return

    const checkTodayMenu = async () => {
      try {
        setCheckingTodayMenu(true)
        const response = await fetch(`/restaurants/${session.restaurant_id}/menu/today`, {
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
        })
        setTodayMenuExists(response.ok)
      } catch (err) {
        setTodayMenuExists(false)
      } finally {
        setCheckingTodayMenu(false)
      }
    }

    checkTodayMenu()
  }, [session?.restaurant_id, session?.token])

  // Cargar predicciones
  useEffect(() => {
    if (!session?.restaurant_id || !restaurant || !session?.token) return

    // Si es hoy y existe menú, no cargar predicciones
    if (selectedDate === today && todayMenuExists) {
      setMenuPredictions(emptyPredictions)
      setServicePrediction(null)
      setPredictionError('')
      return
    }

    const loadPredictions = async () => {
      try {
        setPredictionLoading(true)
        setPredictionError('')

        const coursePayload = {
          restaurant_id: session.restaurant_id,
          service_date: selectedDate,
        }

        const servicePayload = {
          service_date: selectedDate,
          restaurant_id: session.restaurant_id,
          is_stadium_event: false,
          is_azca_event: false,
          capacity_limit: restaurant.capacity_limit ?? 60,
          table_count: restaurant.table_count ?? 15,
          min_service_duration: restaurant.min_service_duration ?? 45,
          terrace_setup_type: restaurant.terrace_setup_type ?? 'outdoor',
          opens_weekends: Boolean(restaurant.opens_weekends),
          has_wifi: Boolean(restaurant.has_wifi),
          restaurant_segment: restaurant.restaurant_segment ?? 'business',
          menu_price: restaurant.menu_price ?? 20,
          dist_office_towers: restaurant.dist_office_towers ?? 500,
          google_rating: restaurant.google_rating ?? 4.2,
          cuisine_type: restaurant.cuisine_type ?? 'mediterranean',
        }

        const [serviceRes, starterRes, mainRes, dessertRes] = await Promise.all([
          fetch('/predict', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify(servicePayload),
          }),
          fetch('/predict/starter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify(coursePayload),
          }),
          fetch('/predict/main', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify(coursePayload),
          }),
          fetch('/predict/dessert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify(coursePayload),
          }),
        ])

        if (!serviceRes.ok || !starterRes.ok || !mainRes.ok || !dessertRes.ok) {
          throw new Error('No se pudieron generar las predicciones')
        }

        const [serviceData, starterData, mainData, dessertData] = (await Promise.all([
          serviceRes.json(),
          starterRes.json(),
          mainRes.json(),
          dessertRes.json(),
        ])) as [ServicePredictionResponse, CoursePredictionResponse, CoursePredictionResponse, CoursePredictionResponse]

        setServicePrediction(serviceData.prediction_result ?? null)
        setMenuPredictions({
          starters: starterData.top_3_dishes ?? [],
          mains: mainData.top_3_dishes ?? [],
          desserts: dessertData.top_3_dishes ?? [],
        })
      } catch (err) {
        setMenuPredictions(emptyPredictions)
        setServicePrediction(null)
        const message = err instanceof Error ? err.message : 'No se pudieron obtener las predicciones.'
        console.error('🔴 Error en loadPredictions:', message)
        setPredictionError(message)
      } finally {
        setPredictionLoading(false)
      }
    }

    loadPredictions()
  }, [session?.restaurant_id, session?.token, selectedDate, restaurant, today, todayMenuExists])

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--text-muted)]">Cargando dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[#E53935]">{error}</p>
      </div>
    )
  }

  const suggestedStarter = menuPredictions.starters[0]?.name || '—'
  const suggestedMain = menuPredictions.mains[0]?.name || '—'
  const suggestedDessert = menuPredictions.desserts[0]?.name || '—'

  return (
    <section className="space-y-2.5">
      <div>
        <h2 className="text-xl font-bold text-[var(--text)]">Menú Sugerido</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Descubre la combinación de platos con más probabilidad de éxito según las condiciones del día.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--text-muted)]">Mi restaurante</p>
            <h3 className="text-lg font-bold text-[var(--text)]">{restaurant?.name}</h3>
            <p className="text-xs text-[var(--text-muted)]">
              {restaurant?.cuisine_type} • {restaurant?.restaurant_segment}
            </p>
          </div>

          <label className="space-y-1">
            <span className="text-xs font-medium text-[var(--text-muted)]">Seleccionar fecha</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              min={today}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>
      </div>

      {/* Menú Completo Sugerido */}
      {checkingTodayMenu || predictionLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">Calculando menú sugerido...</p>
        </div>
      ) : selectedDate === today && todayMenuExists ? (
        <div className="rounded-2xl border-2 border-[#FF9800] bg-[var(--surface)] p-6 text-center">
          <p className="text-sm font-semibold text-[#FF9800]">📋 Menú del día ya publicado</p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Ya has subido el menú de hoy. Las sugerencias de IA aparecen para días futuros.
          </p>
        </div>
      ) : predictionError ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <p className="text-sm text-[#E53935]">{predictionError}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {/* Demanda de Servicios */}
          {servicePrediction !== null && (
            <div className="rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">Demanda esperada</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{servicePrediction}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">servicios estimados</p>
            </div>
          )}

      <div className="rounded-2xl border-2 border-[var(--accent)]/20 bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-soft)]/50 p-0 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border-b-2 border-[var(--accent)]/20 px-6 py-3">
              <p className="text-xs uppercase tracking-[0.15em] font-bold text-[var(--accent)]">📋 Menú del Día</p>
              <h3 className="text-lg font-bold text-[var(--text)] mt-1">Sugerencia de IA</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Basado en condiciones del restaurante y clima</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Entrantes */}
              <div className="bg-[var(--surface-soft)]/40 rounded-xl p-4 border border-[var(--border)]/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🥗</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-[var(--accent)]">Entrada</p>
                    <p className="text-xs text-[var(--text-muted)]">Selección de apertivos</p>
                  </div>
                </div>
                <ul className="space-y-1.5 pl-8">
                  {menuPredictions.starters.length > 0 ? (
                    menuPredictions.starters.map((dish, idx) => (
                      <li key={idx} className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0"></span>
                        {dish.name}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--text-muted)] italic">Sin entrantes disponibles</li>
                  )}
                </ul>
              </div>

              {/* Platos Principales */}
              <div className="bg-[var(--surface-soft)]/40 rounded-xl p-4 border border-[var(--border)]/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🍖</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-[var(--accent)]">Plato Principal</p>
                    <p className="text-xs text-[var(--text-muted)]">Especialidades del chef</p>
                  </div>
                </div>
                <ul className="space-y-1.5 pl-8">
                  {menuPredictions.mains.length > 0 ? (
                    menuPredictions.mains.map((dish, idx) => (
                      <li key={idx} className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0"></span>
                        {dish.name}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--text-muted)] italic">Sin platos principales disponibles</li>
                  )}
                </ul>
              </div>

              {/* Postres */}
              <div className="bg-[var(--surface-soft)]/40 rounded-xl p-4 border border-[var(--border)]/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🍰</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold text-[var(--accent)]">Postre</p>
                    <p className="text-xs text-[var(--text-muted)]">Dulces finales</p>
                  </div>
                </div>
                <ul className="space-y-1.5 pl-8">
                  {menuPredictions.desserts.length > 0 ? (
                    menuPredictions.desserts.map((dish, idx) => (
                      <li key={idx} className="text-xs font-medium text-[var(--text)] flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[var(--accent)] flex-shrink-0"></span>
                        {dish.name}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--text-muted)] italic">Sin postres disponibles</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer con precio */}
            <div className="bg-gradient-to-r from-[var(--accent)]/5 to-[var(--accent)]/10 border-t-2 border-[var(--accent)]/20 px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Precio del menú</p>
                <p className="text-xs font-semibold text-[var(--text)] mt-0.5">Menú completo por persona</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[var(--accent)]">€{(restaurant?.menu_price ?? 20).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)]/30 p-4 text-xs text-[var(--text-muted)]">
        <p className="font-semibold text-[var(--text)]">💡 ¿Cómo funciona?</p>
        <ul className="mt-2 space-y-1 pl-4">
          <li>• El menú sugerido se calcula basándose en condiciones del restaurante y clima del día</li>
          <li>• Selecciona una fecha futura para ver predicciones de demanda</li>
          <li>• Las alternativas te permiten diversificar si prefieres cambiar algunos platos</li>
        </ul>
      </div>
    </section>
  )
}
