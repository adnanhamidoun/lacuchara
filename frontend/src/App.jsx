import { useState, useEffect } from 'react'
import TestMode from './TestMode'

function App() {
  const [mode, setMode] = useState('user')
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [executionTime, setExecutionTime] = useState(null)
  const [restaurantId, setRestaurantId] = useState('')
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0])
  const [restaurantData, setRestaurantData] = useState(null)
  const [loadingRestaurant, setLoadingRestaurant] = useState(false)
  const [isStadiumEvent, setIsStadiumEvent] = useState(false)
  const [isAzcaEvent, setIsAzcaEvent] = useState(false)
  
  // Campos de predicción (cargados automáticamente desde BD)
  const [capacityLimit, setCapacityLimit] = useState('')
  const [tableCount, setTableCount] = useState('')
  const [minServiceDuration, setMinServiceDuration] = useState('')
  const [terraceSetupType, setTerraceSetupType] = useState('')
  const [opensWeekends, setOpensWeekends] = useState(false)
  const [hasWifi, setHasWifi] = useState(false)
  const [restaurantSegment, setRestaurantSegment] = useState('')
  const [menuPrice, setMenuPrice] = useState('')
  const [distOfficeTowers, setDistOfficeTowers] = useState('')
  const [googleRating, setGoogleRating] = useState('')
  const [cuisineType, setCuisineType] = useState('')

  // Cargar restaurantes al iniciar
  useEffect(() => {
    console.log("🚀 App montado - Cargando restaurantes...")
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    console.log("📍 fetchRestaurants() iniciado")
    try {
      console.log("🌐 Llamando a GET /restaurants...")
      const response = await fetch('/restaurants')
      console.log(`📊 Response status: ${response.status}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      console.log(`✅ Data recibida:`, data)
      console.log(`📦 Restaurantes: ${data.count} encontrados`)
      
      setRestaurants(data.restaurants)
      if (data.restaurants.length > 0) {
        const firstId = data.restaurants[0].restaurant_id.toString()
        setRestaurantId(firstId)
        console.log(`✨ Primer restaurante seleccionado: ${data.restaurants[0].name}`)
        // Cargar detalles del primer restaurante
        fetchRestaurantDetail(firstId)
      }
    } catch (err) {
      console.error("❌ Error al cargar restaurantes:", err)
      setError(err.message)
    }
  }

  const fetchRestaurantDetail = async (id) => {
    console.log(`📍 fetchRestaurantDetail(${id}) iniciado`)
    setLoadingRestaurant(true)
    try {
      console.log(`🌐 Llamando a GET /restaurants/${id}...`)
      const response = await fetch(`/restaurants/${id}`)
      console.log(`📊 Response status: ${response.status}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log(`✅ Detalles del restaurante recibidos:`, data)
      setRestaurantData(data)
      
      // Rellenar los campos de predicción con los datos
      setCapacityLimit(data.capacity_limit || '')
      setTableCount(data.table_count || '')
      setMinServiceDuration(data.min_service_duration || '')
      setTerraceSetupType(data.terrace_setup_type || '')
      setOpensWeekends(data.opens_weekends || false)
      setHasWifi(data.has_wifi || false)
      setRestaurantSegment(data.restaurant_segment || '')
      setMenuPrice(data.menu_price || '')
      setDistOfficeTowers(data.dist_office_towers || '')
      setGoogleRating(data.google_rating || '')
      setCuisineType(data.cuisine_type || '')
      
      setError(null)
    } catch (err) {
      console.error(`❌ Error al cargar detalles del restaurante ${id}:`, err)
      setError(err.message)
    } finally {
      setLoadingRestaurant(false)
    }
  }

  const handleRestaurantChange = (e) => {
    const id = e.target.value
    setRestaurantId(id)
    if (id) {
      fetchRestaurantDetail(id)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!restaurantId) {
      setError("Por favor selecciona un restaurante")
      return
    }
    
    setLoading(true)
    setError(null)
    setResult(null)
    setExecutionTime(null)

    const startTime = performance.now()

    try {
      // Datos de predicción: solo restaurante y fecha
      // Los demás parámetros se calculan automáticamente en el backend:
      // - Parámetros de clima: desde Open-Meteo
      // - Parámetros de calendario: calculados automáticamente
      // - Datos históricos: desde fact_services
      // - Parámetros del restaurante: cargados de la BD
      const predictionData = {
        service_date: serviceDate,
        restaurant_id: parseInt(restaurantId),
        capacity_limit: capacityLimit ? parseInt(capacityLimit) : 80,
        table_count: tableCount ? parseInt(tableCount) : 20,
        min_service_duration: minServiceDuration ? parseInt(minServiceDuration) : 45,
        terrace_setup_type: terraceSetupType || 'standard',
        opens_weekends: opensWeekends,
        has_wifi: hasWifi,
        restaurant_segment: restaurantSegment || 'casual',
        menu_price: menuPrice ? parseFloat(menuPrice) : 25.50,
        dist_office_towers: distOfficeTowers ? parseInt(distOfficeTowers) : 500,
        google_rating: googleRating ? parseFloat(googleRating) : 4.5,
        cuisine_type: cuisineType || 'mediterranean',
        // Eventos que proporciona el usuario
        is_stadium_event: isStadiumEvent,
        is_azca_event: isAzcaEvent,
      }

      console.log("🚀 Enviando predicción (backend completará datos automáticamente):", predictionData)

      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(predictionData)
      })

      const endTime = performance.now()
      setExecutionTime(Math.round(endTime - startTime))

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      const data = await response.json()
      console.log("✅ Predicción exitosa:", data)
      setResult(data)
    } catch (err) {
      console.error("❌ Error en predicción:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'test') {
    return <TestMode onBack={() => setMode('user')} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-purple-500/30 bg-gradient-to-r from-slate-900/95 to-purple-900/95 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent truncate">
                🍽️ AML-Cousine
              </h1>
              <p className="text-purple-300/80 text-xs sm:text-sm mt-1 sm:mt-2 truncate">Demand Forecasting</p>
            </div>
            <button
              onClick={() => setMode('test')}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs sm:text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
            >
              ⚙️ Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Centro vertical */}
      <div className="flex-1 flex items-center justify-center w-full px-4 py-6 sm:py-12">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Formulario - 2 columnas en desktop */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Seleccionar Restaurante */}
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                  <label className="block text-sm sm:text-base font-semibold text-blue-200 mb-3">
                    🏪 Restaurante
                  </label>
                  <select
                    value={restaurantId}
                    onChange={handleRestaurantChange}
                    disabled={loading || restaurants.length === 0}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border border-blue-400/50 rounded-lg text-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30 placeholder-slate-400 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  >
                    <option value="">
                      {restaurants.length === 0 ? 'Cargando restaurantes...' : 'Elige un restaurante'}
                    </option>
                    {restaurants.map((r) => (
                      <option key={r.restaurant_id} value={r.restaurant_id.toString()}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  {loadingRestaurant && <p className="text-blue-300 text-xs sm:text-sm mt-2">⏳ Cargando datos del restaurante...</p>}
                </div>

                {/* Seleccionar Fecha */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                  <label className="block text-sm sm:text-base font-semibold text-purple-200 mb-3">
                    📅 Fecha de Predicción
                  </label>
                  <input
                    type="date"
                    value={serviceDate}
                    onChange={(e) => setServiceDate(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border border-purple-400/50 rounded-lg text-white focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-500/30 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
                  />
                </div>

                {/* Eventos */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 backdrop-blur-sm rounded-xl p-4 sm:p-6">
                  <p className="text-orange-300 text-xs sm:text-sm font-semibold mb-4 uppercase tracking-wide">🎪 Eventos del Día</p>
                  
                  <div className="space-y-3 sm:space-y-4">
                    {/* Evento Estadio */}
                    <label className="flex items-center gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-white/5 transition">
                      <input
                        type="checkbox"
                        checked={isStadiumEvent}
                        onChange={(e) => setIsStadiumEvent(e.target.checked)}
                        disabled={loading}
                        className="w-5 h-5 rounded border-2 border-orange-400/50 bg-slate-800/50 cursor-pointer accent-orange-500 transition"
                      />
                      <div className="flex-1">
                        <div className="text-orange-200 text-xs sm:text-sm font-semibold">Evento Estadio ⚽</div>
                        <div className="text-orange-300/70 text-xs">¿Hay evento de fútbol?</div>
                      </div>
                      <span className="text-orange-300 text-xs sm:text-sm font-medium bg-orange-500/20 px-2 sm:px-3 py-1 rounded">
                        {isStadiumEvent ? 'Sí' : 'No'}
                      </span>
                    </label>

                    {/* Evento AZCA */}
                    <label className="flex items-center gap-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-white/5 transition">
                      <input
                        type="checkbox"
                        checked={isAzcaEvent}
                        onChange={(e) => setIsAzcaEvent(e.target.checked)}
                        disabled={loading}
                        className="w-5 h-5 rounded border-2 border-orange-400/50 bg-slate-800/50 cursor-pointer accent-orange-500 transition"
                      />
                      <div className="flex-1">
                        <div className="text-orange-200 text-xs sm:text-sm font-semibold">Evento AZCA 🏢</div>
                        <div className="text-orange-300/70 text-xs">¿Hay evento en AZCA?</div>
                      </div>
                      <span className="text-orange-300 text-xs sm:text-sm font-medium bg-orange-500/20 px-2 sm:px-3 py-1 rounded">
                        {isAzcaEvent ? 'Sí' : 'No'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Botón Enviar */}
                <button
                  type="submit"
                  disabled={loading || !restaurantId || restaurants.length === 0}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-sm sm:text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span className="hidden sm:inline">Procesando...</span>
                      <span className="sm:hidden">Cargando...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Predecir</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Panel de Resultados - 1 columna */}
            <div className="lg:col-span-1">
              {error && (
                <div className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-6">
                  <p className="text-red-300 font-semibold mb-2 text-sm sm:text-base">⚠️ Error</p>
                  <p className="text-red-200 text-xs sm:text-sm">{error}</p>
                </div>
              )}

              {result ? (
                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/50 backdrop-blur-sm rounded-xl p-4 sm:p-8">
                  <div className="text-center mb-6 sm:mb-8">
                    <p className="text-emerald-300/70 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-2 sm:mb-3">
                      Predicción
                    </p>
                    <p className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                      {result.prediction_result}
                    </p>
                    <p className="text-emerald-300/70 text-xs sm:text-sm mt-2 sm:mt-3">servicios esperados</p>
                  </div>

                  <div className="space-y-3 sm:space-y-4 border-t border-emerald-500/30 pt-4 sm:pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-300/70 text-xs sm:text-sm">Confianza</span>
                      <span className="text-emerald-400 font-bold text-xs sm:text-sm">85%</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-900/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '85%' }}></div>
                    </div>

                    <div className="space-y-2 sm:space-y-3 border-t border-emerald-500/30 pt-3 sm:pt-4 text-xs sm:text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-emerald-300/70">Versión</span>
                        <span className="text-emerald-200 font-mono text-right">{result.model_version || 'v1.0'}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-emerald-300/70">Tiempo</span>
                        <span className="text-emerald-200 font-mono">{executionTime}ms</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-emerald-300/70">Log</span>
                        <span className="text-emerald-200 font-mono text-right truncate">#{result.log_id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-500/30 backdrop-blur-sm rounded-xl p-4 sm:p-8 text-center">
                  <p className="text-slate-400 text-xs sm:text-sm">💡 Completa el formulario</p>
                  <p className="text-slate-400 text-xs sm:text-sm">y presiona Predecir</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
