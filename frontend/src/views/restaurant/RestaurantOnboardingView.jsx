import { useState } from 'react'
import { createInscripcion } from '../../services/inscripcionesService'

const initialForm = {
  name: '',
  capacity_limit: '',
  table_count: '',
  min_service: '',
  terrace_setup_type: '',
  opens_weekends: false,
  has_wifi: false,
  restaurant_segment: '',
  menu_price: '',
  dist_office_towers: '',
  cuisine_type: '',
  google_maps_link: '',
}

export default function RestaurantOnboardingView() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    try {
      await createInscripcion({
        ...form,
        capacity_limit: Number(form.capacity_limit),
        table_count: Number(form.table_count),
        menu_price: Number(form.menu_price),
        dist_office_towers: Number(form.dist_office_towers),
      })

      setSuccessMessage('Solicitud enviada a dbo.inscripciones.')
      setForm(initialForm)
    } catch (error) {
      setErrorMessage(error.message || 'No se pudo enviar la inscripción.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Alta de Restaurante</h2>
        <p className="text-sm text-slate-600">
          Onboarding para crear solicitud en la tabla temporal dbo.inscripciones.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2"
      >
        <label className="space-y-1 text-sm">
          <span className="font-medium">Nombre</span>
          <input
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Capacidad</span>
          <input
            required
            type="number"
            min="1"
            name="capacity_limit"
            value={form.capacity_limit}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Número de mesas</span>
          <input
            required
            type="number"
            min="1"
            name="table_count"
            value={form.table_count}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Tiempo mínimo servicio</span>
          <input
            required
            name="min_service"
            value={form.min_service}
            onChange={handleChange}
            placeholder="Ej: 45 min"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Tipo de terraza</span>
          <input
            required
            name="terrace_setup_type"
            value={form.terrace_setup_type}
            onChange={handleChange}
            placeholder="Indoor / Outdoor"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Segmento</span>
          <input
            required
            name="restaurant_segment"
            value={form.restaurant_segment}
            onChange={handleChange}
            placeholder="Casual, Fine Dining..."
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Precio medio menú</span>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            name="menu_price"
            value={form.menu_price}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Distancia a oficinas (m)</span>
          <input
            required
            type="number"
            min="0"
            name="dist_office_towers"
            value={form.dist_office_towers}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Tipo de cocina</span>
          <input
            required
            name="cuisine_type"
            value={form.cuisine_type}
            onChange={handleChange}
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm md:col-span-2">
          <span className="font-medium">Link de Google Maps (obligatorio)</span>
          <input
            required
            type="url"
            name="google_maps_link"
            value={form.google_maps_link}
            onChange={handleChange}
            placeholder="https://maps.google.com/..."
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="opens_weekends"
            checked={form.opens_weekends}
            onChange={handleChange}
          />
          <span>Abre fines de semana</span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="has_wifi"
            checked={form.has_wifi}
            onChange={handleChange}
          />
          <span>Tiene WiFi</span>
        </label>

        <div className="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar inscripción'}
          </button>

          {successMessage ? (
            <p className="text-sm text-emerald-700">{successMessage}</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
        </div>
      </form>
    </section>
  )
}
