import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export default function RestaurantsListView() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const response = await fetch('/restaurants')
        if (!response.ok) {
          throw new Error('No se pudieron cargar los restaurantes disponibles.')
        }

        const data = await response.json()
        setRestaurants(Array.isArray(data?.restaurants) ? data.restaurants : [])
        setError('')
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los restaurantes disponibles.')
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Restaurantes disponibles</h2>
        <p className="text-sm text-slate-600">
          Selecciona un restaurante para entrar a la vista de menú.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? <p className="text-sm text-slate-500">Cargando restaurantes...</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!loading && !error && restaurants.length === 0 ? (
          <p className="text-sm text-slate-500">No hay restaurantes disponibles.</p>
        ) : null}

        {restaurants.map((restaurant) => (
          <article
            key={restaurant.restaurant_id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h3 className="text-lg font-semibold">{restaurant.name}</h3>
            <p className="mt-1 text-sm text-slate-600">ID restaurante: {restaurant.restaurant_id}</p>

            <Link
              to={`/cliente/restaurantes/${restaurant.restaurant_id}/menu`}
              className="mt-4 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Ver menú
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
