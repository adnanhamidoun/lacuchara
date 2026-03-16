import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { RestaurantDetail } from '../../types/domain'

type PredictionResult = {
  prediction_result: number
  service_date: string
  model_version: string
  execution_timestamp: string
  log_id: number
}

type DishPrediction = {
  rank: number
  name: string
  score: number
  estimated_count: number
}

type MenuPrediction = {
  top_3_dishes: DishPrediction[]
  service_date: string
  restaurant_id: number
  model_version: string
  execution_timestamp: string
}

export default function MenuView() {
  const { restaurantId } = useParams()
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10))

  // --- Service count prediction ---
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState('')

  // --- Menu item predictions ---
  const [starters, setStarters] = useState<DishPrediction[] | null>(null)
  const [mainCourses, setMainCourses] = useState<DishPrediction[] | null>(null)
  const [desserts, setDesserts] = useState<DishPrediction[] | null>(null)

  const [startersLoading, setStartersLoading] = useState(false)
  const [mainLoading, setMainLoading] = useState(false)
  const [dessertsLoading, setDessertsLoading] = useState(false)

  const [startersError, setStartersError] = useState('')
  const [mainError, setMainError] = useState('')
  const [dessertsError, setDessertsError] = useState('')

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/restaurants/${restaurantId}`)
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
  }, [restaurantId])

  useEffect(() => {
    const fetchServicesPrediction = async () => {
      if (!restaurant) return

      setPredictionLoading(true)
      setPredictionError('')

      try {
        const response = await fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service_date: serviceDate,
            restaurant_id: Number(restaurantId),
            max_temp_c: 20,
            precipitation_mm: 0,
            is_rain_service_peak: false,
            is_stadium_event: false,
            is_azca_event: false,
            is_holiday: false,
            is_bridge_day: false,
            is_payday_week: false,
            is_business_day: true,
            services_lag_7: 0,
            avg_4_weeks: 0,
            capacity_limit: restaurant.capacity_limit ?? 0,
            table_count: restaurant.table_count ?? 0,
            min_service_duration: restaurant.min_service_duration ?? 0,
            terrace_setup_type: restaurant.terrace_setup_type ?? 'yearround',
            opens_weekends: restaurant.opens_weekends ?? false,
            has_wifi: restaurant.has_wifi ?? false,
            restaurant_segment: restaurant.restaurant_segment ?? 'family',
            menu_price: restaurant.menu_price ?? 0,
            dist_office_towers: restaurant.dist_office_towers ?? 0,
            google_rating: restaurant.google_rating ?? 0,
            cuisine_type: restaurant.cuisine_type ?? 'mediterranean',
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.detail || `HTTP ${response.status}`)
        }

        const data = (await response.json()) as PredictionResult
        setPrediction(data)
      } catch (err) {
        setPredictionError(err instanceof Error ? err.message : 'Error al obtener la predicción.')
      } finally {
        setPredictionLoading(false)
      }
    }

    fetchServicesPrediction()
  }, [restaurant, restaurantId, serviceDate])

  useEffect(() => {
    const fetchMenuPrediction = async (
      url: string,
      setResult: (value: DishPrediction[] | null) => void,
      setLoading: (value: boolean) => void,
      setError: (value: string) => void,
    ) => {
      if (!restaurant) return

      setLoading(true)
      setError('')

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurant_id: Number(restaurantId),
            service_date: serviceDate,
          }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.detail || `HTTP ${response.status}`)
        }

        const data = (await response.json()) as MenuPrediction
        setResult(data.top_3_dishes)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al obtener la predicción.')
        setResult(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMenuPrediction('/predict/starter', setStarters, setStartersLoading, setStartersError)
    fetchMenuPrediction('/predict/main', setMainCourses, setMainLoading, setMainError)
    fetchMenuPrediction('/predict/dessert', setDesserts, setDessertsLoading, setDessertsError)
  }, [restaurant, restaurantId, serviceDate])

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">Menú Predicho por IA</h2>
          <p className="text-sm text-[var(--text-muted)]">Predicción automática para entrante, principal y postre según el modelo y la fecha elegida.</p>
        </div>

        <Link
          to="/cliente/restaurantes"
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]"
        >
          Volver al listado
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Restaurante seleccionado</p>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Cargando restaurante...</p>
          ) : error ? (
            <p className="text-sm text-[#E53935]">{error}</p>
          ) : (
            <>
              <h3 className="text-lg font-bold text-[var(--text)]">{restaurant?.name}</h3>
              <p className="text-sm text-[var(--text-muted)]">Precio medio menú: €{restaurant?.menu_price?.toFixed(2) ?? '—'}</p>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">Fecha de predicción</p>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm text-[var(--text)]"
            />
          </div>
          <div className="mt-4">
            {predictionLoading ? (
              <p className="text-sm text-[var(--text-muted)]">Calculando demanda de servicios...</p>
            ) : predictionError ? (
              <p className="text-sm text-[#E53935]">{predictionError}</p>
            ) : prediction ? (
              <>
                <p className="text-sm text-[var(--text-muted)]">Servicios estimados</p>
                <p className="text-3xl font-bold text-[var(--text)]">{prediction.prediction_result}</p>
                <p className="text-xs text-[var(--text-muted)]">Modelo: {prediction.model_version}</p>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Seleccione fecha para calcular la predicción.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--text-muted)]">Datos de la predicción</p>
          {prediction ? (
            <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
              <div className="flex justify-between">
                <span>Fecha:</span>
                <span>{prediction.service_date}</span>
              </div>
              <div className="flex justify-between">
                <span>ID log:</span>
                <span>{prediction.log_id}</span>
              </div>
              <div className="flex justify-between">
                <span>Timestamp:</span>
                <span>{new Date(prediction.execution_timestamp).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No hay datos aún.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: 'Entrantes',
            dishes: starters,
            loading: startersLoading,
            error: startersError,
          },
          {
            title: 'Principales',
            dishes: mainCourses,
            loading: mainLoading,
            error: mainError,
          },
          {
            title: 'Postres',
            dishes: desserts,
            loading: dessertsLoading,
            error: dessertsError,
          },
        ].map(({ title, dishes, loading, error }) => (
          <div key={title} className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
            <h4 className="font-semibold text-[var(--text)]">{title}</h4>

            {loading ? (
              <p className="mt-2 text-sm text-[var(--text-muted)]">Generando predicción...</p>
            ) : error ? (
              <p className="mt-2 text-sm text-[#E53935]">{error}</p>
            ) : dishes && dishes.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                {dishes.map((dish) => (
                  <li key={dish.rank} className="flex items-center justify-between">
                    <span className="font-medium text-[var(--text)]">{dish.rank}. {dish.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{(dish.score * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-muted)]">No hay datos de predicción disponibles.</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
