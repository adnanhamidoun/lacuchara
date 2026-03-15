import { useEffect, useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import { updateRestaurantImage } from '../../services/authService.ts'
import type { RestaurantDetail } from '../../types/domain'

export default function RestaurantPanelView() {
  const { session } = useAuth()
  const [imageUrl, setImageUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRestaurant = async () => {
      if (!session?.restaurant_id) return
      try {
        const response = await fetch(`/restaurants/${session.restaurant_id}`)
        if (!response.ok) throw new Error('No se pudo cargar el restaurante.')
        const data = (await response.json()) as RestaurantDetail
        setImageUrl(data.image_url ?? '')
        setPreviewUrl(data.image_url ?? '')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la imagen actual.')
      }
    }

    loadRestaurant()
  }, [session?.restaurant_id])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session?.restaurant_id || !session.token) return

    setLoading(true)
    setMessage('')
    setError('')

    try {
      const updated = await updateRestaurantImage(session.restaurant_id, imageUrl, session.token)
      setPreviewUrl(updated.image_url ?? '')
      setMessage('Imagen actualizada correctamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la imagen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Panel del restaurante</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Gestiona la imagen que aparece en la página principal para {session?.restaurant_name ?? 'tu restaurante'}.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--text)]">URL de imagen</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://images.example.com/restaurante.jpg"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
            />
          </div>

          {message ? <p className="rounded-lg bg-[#4CAF50]/15 p-3 text-sm text-[#2E7D32]">{message}</p> : null}
          {error ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#E07B54] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Guardar imagen'}
          </button>
        </form>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[var(--text)]">Vista previa</p>
          <img
            src={previewUrl || 'https://placehold.co/400x240?text=Restaurante'}
            alt={session?.restaurant_name ?? 'Restaurante'}
            className="h-60 w-full rounded-xl object-cover"
          />
        </div>
      </div>
    </section>
  )
}