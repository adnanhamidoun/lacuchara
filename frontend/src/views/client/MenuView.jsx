import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export default function MenuView() {
  const { restaurantId } = useParams()
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRestaurant = async () => {
      try {
        const response = await fetch(`/restaurants/${restaurantId}`)
        if (!response.ok) {
          throw new Error('No se pudo cargar el restaurante seleccionado.')
        }

        const data = await response.json()
        setRestaurant(data)
        setError('')
      } catch (err) {
        setError(err.message || 'No se pudo cargar el restaurante seleccionado.')
      } finally {
        setLoading(false)
      }
    }

    loadRestaurant()
  }, [restaurantId])

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Vista de Menús</h2>
          <p className="text-sm text-slate-600">
            Componente preparado con datos mock/vacíos para desarrollo posterior.
          </p>
        </div>

        <Link
          to="/cliente/restaurantes"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100"
        >
          Volver al listado
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Restaurante seleccionado</p>
        {loading ? <p className="text-sm text-slate-500">Cargando restaurante...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {!loading && !error ? (
          <h3 className="text-lg font-semibold">{restaurant?.name ?? `Restaurante #${restaurantId}`}</h3>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <h4 className="font-medium">Entrantes</h4>
          <p className="mt-2 text-sm text-slate-500">Sin datos (mock).</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <h4 className="font-medium">Principales</h4>
          <p className="mt-2 text-sm text-slate-500">Sin datos (mock).</p>
        </div>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4">
          <h4 className="font-medium">Postres</h4>
          <p className="mt-2 text-sm text-slate-500">Sin datos (mock).</p>
        </div>
      </div>
    </section>
  )
}
