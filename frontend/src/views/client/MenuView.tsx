import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { RestaurantDetail } from '../../types/domain'

export default function MenuView() {
  const { restaurantId } = useParams()
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text)]">Vista de Menús</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Módulo preparado para integrar lógica real de menús en el siguiente sprint.
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
        <p className="text-sm text-[var(--text-muted)]">Restaurante seleccionado</p>
        {loading ? <p className="text-sm text-[var(--text-muted)]">Cargando restaurante...</p> : null}
        {error ? <p className="text-sm text-[#E53935]">{error}</p> : null}
        {!loading && !error ? <h3 className="text-lg font-bold text-[var(--text)]">{restaurant?.name}</h3> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {['Entrantes', 'Principales', 'Postres'].map((title) => (
          <div key={title} className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-4">
            <h4 className="font-semibold text-[var(--text)]">{title}</h4>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Sin datos (mock) hasta integrar catálogo de menús.</p>
          </div>
        ))}
      </div>
    </section>
  )
}
