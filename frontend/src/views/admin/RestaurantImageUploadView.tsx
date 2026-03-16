import { useEffect, useState } from 'react'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import { uploadRestaurantImage, getRestaurantImage } from '../../services/authService'
import type { RestaurantDetail } from '../../types/domain'

export default function RestaurantImageUploadView() {
  const { session } = useAuth() as any
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Cargar lista de restaurantes disponibles
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const response = await fetch('/restaurants')
        if (response.ok) {
          const data = await response.json()
          setRestaurants(data.restaurants || [])
          if (data.restaurants && data.restaurants.length > 0) {
            setSelectedRestaurantId(data.restaurants[0].restaurant_id)
          }
        }
      } catch (err) {
        setError('Error cargando lista de restaurantes')
      } finally {
        setLoadingRestaurants(false)
      }
    }

    loadRestaurants()
  }, [])

  // Cargar imagen cuando se selecciona restaurante
  useEffect(() => {
    const loadImage = async () => {
      if (!selectedRestaurantId) return

      try {
        const data = await getRestaurantImage(selectedRestaurantId)
        setPreviewUrl(data.data_uri || '')
      } catch (err) {
        setPreviewUrl('https://placehold.co/400x240?text=Restaurante')
      }
    }

    loadImage()
  }, [selectedRestaurantId])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedRestaurantId) {
      setError('Selecciona un restaurante')
      return
    }

    if (!selectedFile) {
      setError('Selecciona un archivo para subir')
      return
    }

    if (!session?.token) {
      setError('No hay sesión activa')
      return
    }

    setLoading(true)
    setMessage('')
    setError('')

    try {
      await uploadRestaurantImage(selectedRestaurantId, selectedFile, session.token)

      // Recargar imagen
      const imageData = await getRestaurantImage(selectedRestaurantId)
      setPreviewUrl(imageData.data_uri || '')

      setMessage('✅ Imagen subida correctamente')
      setSelectedFile(null)

      // Limpiar input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      if (fileInput) fileInput.value = ''

      // Limpiar mensaje en 3 segundos
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen')
    } finally {
      setLoading(false)
    }
  }

  if (loadingRestaurants) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-[var(--text-muted)]">Cargando restaurantes...</p>
      </div>
    )
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Gestionar Imágenes de Restaurantes</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Sube y gestiona las imágenes principales de los restaurantes
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          
          {/* Selector de restaurante */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--text)]">
              Selecciona restaurante
            </label>
            <select
              value={selectedRestaurantId || ''}
              onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[#E07B54]"
            >
              <option value="">-- Selecciona un restaurante --</option>
              {restaurants.map((rest) => (
                <option key={rest.restaurant_id} value={rest.restaurant_id}>
                  {rest.name} (ID: {rest.restaurant_id})
                </option>
              ))}
            </select>
          </div>

          {/* Selección de archivo */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[var(--text)]">
              Subir nueva imagen
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  setSelectedFile(file)
                  // Preview local
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setPreviewUrl(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
              className="w-full text-sm mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#1A1A2E]/5 file:text-[#1A1A2E] hover:file:bg-[#1A1A2E]/10 cursor-pointer text-[var(--text)]"
            />
            <p className="text-xs text-[var(--text-muted)]">
              máx. 5MB • JPEG, PNG, WebP
            </p>
          </div>

          {/* Mensajes */}
          {message && (
            <p className="rounded-lg bg-[#4CAF50]/15 p-3 text-sm text-[#2E7D32]">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">
              {error}
            </p>
          )}

          {/* Botón enviar */}
          <button
            type="submit"
            disabled={loading || !selectedRestaurantId}
            className="w-full rounded-lg bg-[#E07B54] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Subiendo... (esto puede tomar unos segundos)' : 'Guardar imagen'}
          </button>
        </form>

        {/* Preview */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <p className="mb-3 text-sm font-semibold text-[var(--text)]">
            Vista previa
          </p>
          <img
            src={previewUrl || 'https://placehold.co/400x240?text=Sin+imagen'}
            alt="Preview"
            className="h-60 w-full rounded-xl object-cover"
          />
          {selectedRestaurantId && (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              Restaurante ID: {selectedRestaurantId}
            </p>
          )}
        </div>
      </div>

      {/* Tabla de restaurantes */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
          Todos los restaurantes ({restaurants.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">ID</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--text)]">Acción</th>
              </tr>
            </thead>
            <tbody>
              {restaurants.map((rest) => (
                <tr key={rest.restaurant_id} className="border-b border-[var(--border)] hover:bg-[var(--surface)]/50">
                  <td className="px-3 py-2 text-[var(--text)]">{rest.restaurant_id}</td>
                  <td className="px-3 py-2 text-[var(--text)]">{rest.name}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => setSelectedRestaurantId(rest.restaurant_id)}
                      className="text-xs font-semibold text-[#E07B54] hover:underline"
                    >
                      Editar imagen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
