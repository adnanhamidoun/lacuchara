import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import AIFeedbackButton from '../../components/ai/AIFeedbackButton'
import AISupervisionSection from '../../components/ai/AISupervisionSection'
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
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/40 p-12 text-center">
        <div className="inline-flex items-center gap-3">
          <svg className="w-5 h-5 animate-spin text-[#E07B54]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
          </svg>
          <p className="text-sm font-semibold text-[var(--text)]">Cargando datos del restaurante...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border-2 border-[#E53935] bg-[var(--surface)] p-8">
        <div className="flex gap-4">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-[#E53935]">No se pudo cargar el restaurante</p>
            <p className="text-xs text-[var(--text-muted)] mt-2">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-[var(--text)]">Predicciones de Menú</h1>
        <p className="text-base text-[var(--text-muted)]">
          Descubre qué platos funcionarán mejor según el día, clima y características de tu restaurante.
        </p>
      </div>

      {/* Restaurant Info & Date Selector */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Tu restaurante</p>
            <h2 className="text-2xl font-bold text-[var(--text)]">{restaurant?.name || 'Cargando...'}</h2>
            {restaurant && (
              <p className="text-sm text-[var(--text-muted)] flex gap-2">
                <span>{restaurant.cuisine_type}</span>
                <span>•</span>
                <span className="capitalize">{restaurant.restaurant_segment}</span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wide">Seleccionar fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              min={today}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--text)] outline-none transition-all focus:border-[#E07B54] focus:ring-1 focus:ring-[#E07B54]/20"
            />
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {checkingTodayMenu || predictionLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/40 p-12 text-center">
          <div className="inline-flex items-center gap-3">
            <svg className="w-5 h-5 animate-spin text-[#E07B54]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v16a8 8 0 01-8-8z"></path>
            </svg>
            <p className="text-sm font-semibold text-[var(--text)]">Calculando predicciones...</p>
          </div>
        </div>
      ) : selectedDate === today && todayMenuExists ? (
        <div className="rounded-2xl border-2 border-[#FF9800] bg-[var(--surface)]/50 p-8 text-center">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm font-semibold text-[#FF9800]">Menú del día ya publicado</p>
          <p className="text-xs text-[var(--text-muted)] mt-3">
            Las predicciones de IA aparecen para días futuros. Selecciona una fecha próxima para ver sugerencias.
          </p>
        </div>
      ) : predictionError ? (
        <div className="rounded-2xl border-2 border-[#E53935] bg-[var(--surface)] p-8">
          <div className="flex gap-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-[#E53935]">Error al calcular predicciones</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{predictionError}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Expected Demand */}
          {servicePrediction !== null && (
            <>
              <div className="rounded-2xl border-2 border-[#E07B54] bg-gradient-to-br from-[#E07B54]/10 to-[#E07B54]/5 p-8 shadow-lg">
                <div className="flex items-end justify-between gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-[#E07B54] uppercase tracking-widest">Demanda estimada</p>
                    <p className="text-[#E07B54]">para el {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-[#E07B54]">{servicePrediction}</p>
                    <p className="text-sm text-[#E07B54]/80 font-semibold mt-1">servicios</p>
                  </div>
                </div>
              </div>

              {/* Feedback for Service Prediction */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                  <span>💬</span> ¿Qué te parece esta predicción de demanda?
                </h3>
                <AIFeedbackButton type="service" />
              </div>
            </>
          )}

          {/* Suggested Menu Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E07B54]/15 to-[#E07B54]/5 border-b border-[var(--border)] px-8 py-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🍽️</span>
                <div>
                  <p className="text-sm font-bold text-[#E07B54] uppercase tracking-widest">Menú sugerido</p>
                  <h3 className="text-xl font-bold text-[var(--text)] mt-0.5">Recomendación de IA</h3>
                </div>
              </div>
              <p className="text-sm text-[var(--text-muted)]">
                Basado en tus características, clima y predicciones de demanda
              </p>
            </div>

            {/* Menu Items */}
            <div className="px-8 py-8 space-y-6">
              {/* Starters */}
              <div className="bg-[var(--surface-soft)]/40 rounded-2xl border border-[var(--border)] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🥗</span>
                  <div>
                    <p className="text-xs font-bold text-[#E07B54] uppercase tracking-widest">Entrada</p>
                    <p className="text-sm text-[var(--text-muted)]">Para comenzar</p>
                  </div>
                </div>
                <ul className="space-y-2 pl-10">
                  {menuPredictions.starters.length > 0 ? (
                    menuPredictions.starters.map((dish, idx) => (
                      <li key={idx} className="text-sm font-medium text-[var(--text)] flex items-center gap-3 before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-[#E07B54]/60">
                        {dish.name}
                        {dish.estimated_count && (
                          <span className="text-xs text-[var(--text-muted)]/70">({dish.estimated_count} est.)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--text-muted)] italic">Sin sugerencias disponibles</li>
                  )}
                </ul>
              </div>

              {/* Mains */}
              <div className="bg-[var(--surface-soft)]/40 rounded-2xl border border-[var(--border)] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🍖</span>
                  <div>
                    <p className="text-xs font-bold text-[#E07B54] uppercase tracking-widest">Plato Principal</p>
                    <p className="text-sm text-[var(--text-muted)]">Especialidades del chef</p>
                  </div>
                </div>
                <ul className="space-y-2 pl-10">
                  {menuPredictions.mains.length > 0 ? (
                    menuPredictions.mains.map((dish, idx) => (
                      <li key={idx} className="text-sm font-medium text-[var(--text)] flex items-center gap-3 before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-[#E07B54]/60">
                        {dish.name}
                        {dish.estimated_count && (
                          <span className="text-xs text-[var(--text-muted)]/70">({dish.estimated_count} est.)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--text-muted)] italic">Sin sugerencias disponibles</li>
                  )}
                </ul>
              </div>

              {/* Desserts */}
              <div className="bg-[var(--surface-soft)]/40 rounded-2xl border border-[var(--border)] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🍰</span>
                  <div>
                    <p className="text-xs font-bold text-[#E07B54] uppercase tracking-widest">Postre</p>
                    <p className="text-sm text-[var(--text-muted)]">Dulces finales</p>
                  </div>
                </div>
                <ul className="space-y-2 pl-10">
                  {menuPredictions.desserts.length > 0 ? (
                    menuPredictions.desserts.map((dish, idx) => (
                      <li key={idx} className="text-sm font-medium text-[var(--text)] flex items-center gap-3 before:content-[''] before:w-2 before:h-2 before:rounded-full before:bg-[#E07B54]/60">
                        {dish.name}
                        {dish.estimated_count && (
                          <span className="text-xs text-[var(--text-muted)]/70">({dish.estimated_count} est.)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-[var(--text-muted)] italic">Sin sugerencias disponibles</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Footer - Menu Price */}
            <div className="bg-gradient-to-r from-[#E07B54]/10 to-[#E07B54]/5 border-t border-[var(--border)] px-8 py-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Precio del menú</p>
                  <p className="text-sm text-[var(--text)] mt-1">Menú completo por persona</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#E07B54]">€{(restaurant?.menu_price ?? 20).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Button - IA Responsable */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <span>👤</span> Tu Feedback Sobre las Predicciones
            </h3>
            <AIFeedbackButton type="menu" />
          </div>

          {/* Control Humano Section - IA Responsable */}
          <div className="space-y-4">
            <AISupervisionSection showDetails={true} />
          </div>

          {/* Help Section */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/40 p-8">
            <div className="flex gap-4">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div className="space-y-3">
                <p className="text-sm font-bold text-[var(--text)]">¿Cómo funciona el sistema de predicciones?</p>
                <ul className="space-y-2 text-sm text-[var(--text-muted)]">
                  <li className="flex gap-3">
                    <span className="text-[#E07B54] font-bold flex-shrink-0">•</span>
                    <span>Las predicciones se generan basándose en características de tu restaurante, clima local y patrones históricos</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#E07B54] font-bold flex-shrink-0">•</span>
                    <span>Selecciona fechas futuras para ver estimaciones de demanda durante la semana</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-[#E07B54] font-bold flex-shrink-0">•</span>
                    <span>Usa estas recomendaciones para optimizar tu oferta y reducir desperdicios de comida</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
