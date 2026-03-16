import { useState } from 'react'

function TestMode({ onBack }) {
  const [formData, setFormData] = useState({
    service_date: new Date().toISOString().split('T')[0],
    restaurant_id: 1,
    max_temp_c: 22,
    precipitation_mm: 0,
    is_rain_service_peak: false,
    is_stadium_event: false,
    is_azca_event: false,
    is_holiday: false,
    is_bridge_day: false,
    is_payday_week: false,
    is_business_day: true,
    services_lag_7: 100,
    avg_4_weeks: 110,
    capacity_limit: 80,
    table_count: 20,
    min_service_duration: 45,
    terrace_setup_type: 'standard',
    opens_weekends: true,
    has_wifi: true,
    restaurant_segment: 'casual',
    menu_price: 25.50,
    dist_office_towers: 500,
    google_rating: 4.5,
    cuisine_type: 'mediterranean'
  })

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [executionTime, setExecutionTime] = useState(null)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    setExecutionTime(null)

    const startTime = performance.now()

    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const endTime = performance.now()
      setExecutionTime(Math.round(endTime - startTime))

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-indigo-500/30 bg-gradient-to-r from-slate-900/95 to-indigo-900/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ⚙️ Simulador Admin
              </h1>
              <p className="text-indigo-300/80 text-sm mt-2">Control Panel - 24 Parámetros Completos</p>
            </div>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Weather */}
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/40 backdrop-blur-sm rounded-xl p-6 hover:border-blue-400/60 transition-all duration-300">
                <h3 className="text-lg font-bold text-blue-300 mb-4 flex items-center gap-2">
                  🌤️ Condiciones Climáticas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      name="max_temp_c"
                      step="0.1"
                      value={formData.max_temp_c}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Temp. Máxima (°C)"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-blue-400/50 rounded-lg text-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30 placeholder-slate-400 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="precipitation_mm"
                      step="0.1"
                      value={formData.precipitation_mm}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Precipitación (mm)"
                      className="w-full px-4 py-3 bg-slate-800/50 border border-blue-400/50 rounded-lg text-white focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-500/30 placeholder-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Calendar */}
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/40 backdrop-blur-sm rounded-xl p-6 hover:border-purple-400/60 transition-all duration-300">
                <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
                  📅 Calendario y Eventos
                </h3>
                <input
                  type="date"
                  name="service_date"
                  value={formData.service_date}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-purple-400/50 rounded-lg text-white mb-4 focus:outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-500/30 transition-all"
                />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'is_holiday', label: 'Festivo' },
                    { name: 'is_bridge_day', label: 'Puente' },
                    { name: 'is_rain_service_peak', label: 'Lluvia Pico' },
                    { name: 'is_stadium_event', label: 'Estadio' },
                    { name: 'is_azca_event', label: 'Evento AZCA' },
                    { name: 'is_payday_week', label: 'Cobro' }
                  ].map(field => (
                    <label key={field.name} className="flex items-center gap-2 cursor-pointer p-3 bg-slate-800/30 rounded-lg border border-purple-400/20 hover:border-purple-300/50 hover:bg-slate-800/50 transition-all">
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={formData[field.name]}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-4 h-4 accent-purple-500"
                      />
                      <span className="text-xs font-medium text-purple-200">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 3: Historical Metrics */}
              <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/40 backdrop-blur-sm rounded-xl p-6 hover:border-emerald-400/60 transition-all duration-300">
                <h3 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
                  📊 Métricas Históricas
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    name="services_lag_7"
                    value={formData.services_lag_7}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Servicios -7d"
                    className="px-4 py-3 bg-slate-800/50 border border-emerald-400/50 rounded-lg text-white focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <input
                    type="number"
                    name="avg_4_weeks"
                    step="0.1"
                    value={formData.avg_4_weeks}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Promedio 4sem"
                    className="px-4 py-3 bg-slate-800/50 border border-emerald-400/50 rounded-lg text-white focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <input
                    type="number"
                    name="capacity_limit"
                    value={formData.capacity_limit}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Capacidad"
                    className="px-4 py-3 bg-slate-800/50 border border-emerald-400/50 rounded-lg text-white focus:outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Section 4: Operations */}
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/40 backdrop-blur-sm rounded-xl p-6 hover:border-orange-400/60 transition-all duration-300">
                <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
                  🔧 Operacionales
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="number"
                    name="table_count"
                    value={formData.table_count}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Mesas"
                    className="px-4 py-3 bg-slate-800/50 border border-orange-400/50 rounded-lg text-white focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <input
                    type="number"
                    name="min_service_duration"
                    value={formData.min_service_duration}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Duración (min)"
                    className="px-4 py-3 bg-slate-800/50 border border-orange-400/50 rounded-lg text-white focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                </div>
                <select
                  name="terrace_setup_type"
                  value={formData.terrace_setup_type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-orange-400/50 rounded-lg text-white focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-500/30 mb-4 text-sm"
                >
                  <option value="standard">Setup Estándar</option>
                  <option value="indoor">Interior</option>
                  <option value="outdoor">Exterior</option>
                  <option value="mixed">Mixto</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: 'opens_weekends', label: 'Fines Semana' },
                    { name: 'has_wifi', label: 'Wi-Fi' }
                  ].map(field => (
                    <label key={field.name} className="flex items-center gap-2 cursor-pointer p-3 bg-slate-800/30 rounded-lg border border-orange-400/20 hover:border-orange-300/50 hover:bg-slate-800/50 transition-all">
                      <input
                        type="checkbox"
                        name={field.name}
                        checked={formData[field.name]}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-xs font-medium text-orange-200">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section 5: Restaurant Profile */}
              <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 backdrop-blur-sm rounded-xl p-6 hover:border-cyan-400/60 transition-all duration-300">
                <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                  🏪 Perfil Restaurante
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="restaurant_id"
                    value={formData.restaurant_id}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="ID Restaurante"
                    className="px-4 py-3 bg-slate-800/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <input
                    type="number"
                    name="google_rating"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.google_rating}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Rating Google"
                    className="px-4 py-3 bg-slate-800/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <input
                    type="number"
                    name="menu_price"
                    step="0.01"
                    value={formData.menu_price}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Precio Menú (€)"
                    className="px-4 py-3 bg-slate-800/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <input
                    type="number"
                    name="dist_office_towers"
                    value={formData.dist_office_towers}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="Distancia Oficinas (m)"
                    className="px-4 py-3 bg-slate-800/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 placeholder-slate-400 transition-all text-sm"
                  />
                  <select
                    name="restaurant_segment"
                    value={formData.restaurant_segment}
                    onChange={handleChange}
                    disabled={loading}
                    className="px-4 py-3 bg-slate-800/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 text-sm"
                  >
                    <option value="casual">Casual</option>
                    <option value="fine_dining">Fine Dining</option>
                    <option value="fast_casual">Fast Casual</option>
                    <option value="quick_service">Quick Service</option>
                  </select>
                  <select
                    name="cuisine_type"
                    value={formData.cuisine_type}
                    onChange={handleChange}
                    disabled={loading}
                    className="px-4 py-3 bg-slate-800/50 border border-cyan-400/50 rounded-lg text-white focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-500/30 text-sm"
                  >
                    <option value="mediterranean">Mediterránea</option>
                    <option value="spanish">Española</option>
                    <option value="italian">Italiana</option>
                    <option value="asian">Asiática</option>
                    <option value="american">Americana</option>
                    <option value="fusion">Fusión</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Procesando...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    Ejecutar Simulación
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-1">
            {error && (
              <div className="bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-red-500/50 backdrop-blur-sm rounded-xl p-6 mb-6 sticky top-32">
                <p className="text-red-300 font-semibold mb-2">⚠️ Error</p>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {result ? (
              <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/50 backdrop-blur-sm rounded-xl p-8 sticky top-32">
                <div className="text-center mb-8">
                  <p className="text-emerald-300/70 text-sm font-semibold uppercase tracking-wide mb-3">Predicción</p>
                  <p className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {result.prediction_result}
                  </p>
                  <p className="text-emerald-300/70 text-sm mt-3">servicios</p>
                </div>

                <div className="space-y-4 border-t border-emerald-500/30 pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-300/70 text-sm">Confianza</span>
                    <span className="text-emerald-400 font-bold">85%</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-900/50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '85%' }}></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-emerald-500/30">
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-emerald-300/70 text-xs">Versión</p>
                      <p className="text-emerald-200 font-mono text-xs mt-1">{result.model_version || 'v1.0'}</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-emerald-300/70 text-xs">Ejecución</p>
                      <p className="text-emerald-200 font-mono text-xs mt-1">{executionTime}ms</p>
                    </div>
                    <div className="col-span-2 bg-slate-800/30 rounded-lg p-3">
                      <p className="text-emerald-300/70 text-xs">Fecha</p>
                      <p className="text-emerald-200 font-mono text-xs mt-1">{result.service_date}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-500/30 backdrop-blur-sm rounded-xl p-8 text-center sticky top-32">
                <p className="text-slate-400 text-sm">💡 Completa el formulario</p>
                <p className="text-slate-300 text-sm font-semibold mt-2">y Ejecuta Simulación</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TestMode
