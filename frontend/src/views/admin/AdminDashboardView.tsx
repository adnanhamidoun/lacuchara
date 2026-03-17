import { Building2, Check, Clock, Trash2, Users, UtensilsCrossed, Camera, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  approveInscripcion,
  clearApprovalHistory,
  getAllInscripciones,
  rejectInscripcion,
} from '../../services/inscripcionesService'
import { deleteRestaurant } from '../../services/restaurantsService'
import { useAuth } from '../../components/auth/AuthContext.jsx'
import type { Inscripcion } from '../../types/domain'
import { getCuisineMeta } from '../../utils/cuisine'

function formatDate(iso: string | null): string {
  if (!iso) return '-'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`mt-2 text-4xl font-bold ${color}`}>{value}</p>
    </article>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
      <div className="text-5xl">🍽️</div>
      <p className="mt-3 text-base font-semibold text-[var(--text)]">Todo al día</p>
      <p className="text-sm text-[var(--text-muted)]">No hay solicitudes pendientes por revisar.</p>
    </div>
  )
}

function PendingTable({
  rows,
  onApprove,
  onReject,
}: {
  rows: Inscripcion[]
  onApprove: (inscripcionId: number) => Promise<void>
  onReject: (inscripcionId: number) => Promise<void>
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-[var(--surface-soft)] text-left text-[var(--text)]">
          <tr>
            <th className="px-4 py-3 font-semibold">Nombre</th>
            <th className="px-4 py-3 font-semibold">Segmento</th>
            <th className="px-4 py-3 font-semibold">Tipo cocina</th>
            <th className="px-4 py-3 font-semibold">Valoración</th>
            <th className="px-4 py-3 font-semibold">Reseñas</th>
            <th className="px-4 py-3 font-semibold">Fecha solicitud</th>
            <th className="px-4 py-3 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.inscripcion_id} className="border-t border-[var(--border)]">
              <td className="px-4 py-3 font-medium text-[var(--text)]">{row.name}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{row.restaurant_segment ?? '-'}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">
                {row.cuisine_type ? getCuisineMeta(row.cuisine_type).label : '-'}
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">
                {typeof row.google_rating === 'number' ? row.google_rating.toFixed(1) : '-'}

              </td>
              <td className="px-4 py-3">
                {row.google_maps_link ? (
                  <a
                    href={row.google_maps_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-[#E07B54] underline-offset-2 hover:underline"
                  >
                    Ver reseñas
                  </a>
                ) : (
                  <span className="text-[var(--text-muted)]">-</span>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(row.fecha_solicitud)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onApprove(row.inscripcion_id)}
                    className="rounded-lg bg-[#4CAF50] px-3 py-1.5 font-semibold text-white transition-all duration-200 hover:brightness-95"
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(row.inscripcion_id)}
                    className="rounded-lg bg-[#E53935] px-3 py-1.5 font-semibold text-white transition-all duration-200 hover:brightness-95"
                  >
                    Rechazar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ApprovalHistory({
  rows,
  onClear,
  loading,
}: {
  rows: Inscripcion[]
  onClear: () => void
  loading: boolean
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[var(--text)]">Historial de aprobaciones</h3>
        <button
          type="button"
          onClick={onClear}
          disabled={loading || rows.length === 0}
          className="rounded-lg border border-[#E53935]/40 px-3 py-1.5 text-xs font-semibold text-[#E53935] transition-all duration-200 hover:bg-[#E53935]/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Limpiando...' : 'Limpiar historial'}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--text-muted)]">Todavía no hay aprobaciones registradas.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => (
            <li
              key={row.inscripcion_id}
              className="flex flex-col justify-between gap-1 rounded-lg border border-[var(--border)] p-3 text-sm md:flex-row md:items-center"
            >
              <span className="font-semibold text-[var(--text)]">{row.name}</span>
              <span className="text-[var(--text-muted)]">Aprobado · {formatDate(row.fecha_solicitud)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RestaurantsList({
  restaurants,
  onDelete,
  onEditImage,
}: {
  restaurants: any[]
  onDelete: (id: number) => Promise<void>
  onEditImage: (id: number, url: string) => void
}) {
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({})
  const { session } = useAuth()

  useEffect(() => {
    console.log('[RestaurantsList] Received restaurants:', restaurants)
    restaurants.forEach((rest) => {
      const loadImage = async () => {
        try {
          console.log(`[RestaurantsList] Loading image for restaurant ${rest.restaurant_id}: ${rest.name}`)
          const response = await fetch(`/get-restaurant-image/${rest.restaurant_id}`)
          console.log(`[RestaurantsList] Response status: ${response.status}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log(`[RestaurantsList] Image URL: ${data.image_url}`)
            setImageUrls((prev) => ({
              ...prev,
              [rest.restaurant_id]: data.image_url,
            }))
          } else {
            console.error(`[RestaurantsList] Failed: ${response.status}`)
          }
        } catch (error) {
          console.error(`[RestaurantsList] Error:`, error)
        }
      }

      loadImage()
    })
  }, [restaurants])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {restaurants.map((rest) => {
        console.log(`[RestaurantsList Card] Rendering ${rest.name}:`, {
          cuisine_type: rest.cuisine_type,
          capacity_limit: rest.capacity_limit,
          restaurant_segment: rest.restaurant_segment,
        })
        const imageUrl = imageUrls[rest.restaurant_id] || ''
        const initials = rest.name
          .split(' ')
          .map((word: string) => word[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)

        return (
          <div key={rest.restaurant_id} className="flex gap-4 rounded-xl border border-[var(--border)] p-4 shadow-sm items-start relative group">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-[#E07B54] shadow-md bg-gradient-to-br from-[#E07B54] to-[#D88B5A] flex-shrink-0 relative flex items-center justify-center">
              {imageUrl ? (
                <img src={imageUrl} alt={rest.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">{initials}</span>
              )}
              <button
                onClick={() => onEditImage(rest.restaurant_id, imageUrl)}
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                title="Cambiar imagen"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="truncate font-semibold text-[var(--text)]" title={rest.name}>
                {rest.name}
              </h3>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <UtensilsCrossed className="h-3 w-3" />
                <span className="truncate">{rest.cuisine_type || 'Generico'}</span>
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Users className="h-3 w-3" />
                <span>Capacidad: {rest.capacity_limit || 'N/A'}</span>
              </div>
            </div>
            <button
              onClick={() => onDelete(rest.restaurant_id)}
              className="ml-auto flex items-center justify-center h-8 w-8 rounded-full bg-rose-100 text-rose-600 hover:bg-rose-200 flex-shrink-0"
              title="Eliminar Restaurante"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminDashboardView() {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState<'pending' | 'activos' | 'history'>('activos')
  const [pending, setPending] = useState<Inscripcion[]>([])
  const [history, setHistory] = useState<Inscripcion[]>([])
  const [activos, setActivos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [historyActionLoading, setHistoryActionLoading] = useState(false)
  const [historyActionMessage, setHistoryActionMessage] = useState('')
  const [editingRestaurantId, setEditingRestaurantId] = useState<number | null>(null)
  const [editingImage, setEditingImage] = useState<File | null>(null)
  const [editingImageUrl, setEditingImageUrl] = useState<string>('')

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await getAllInscripciones()
      const allInscripciones = Array.isArray(data) ? data : []
      
      setPending(allInscripciones.filter((i: Inscripcion) => i.estado_inscripcion?.toLowerCase() === 'pendiente'))
      setHistory(allInscripciones.filter((i: Inscripcion) => i.estado_inscripcion?.toLowerCase() !== 'pendiente'))
      
      const restResponse = await fetch('http://localhost:8000/restaurants/details')
      if (restResponse.ok) {
        const rData = await restResponse.json()
        console.log('[AdminDashboard] Fetched restaurant details:', rData.restaurants)
        setActivos(rData.restaurants || [])
      }

      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (id: number) => {
    try {
      await approveInscripcion(id)
      setPending((prev) => prev.filter((i) => i.inscripcion_id !== id))
      setHistory((prev) => [...prev, { ...(pending.find((i) => i.inscripcion_id === id) as Inscripcion), estado_inscripcion: 'aprobada' }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar la inscripción.')
    }
  }

  const handleReject = async (id: number) => {
    try {
      await rejectInscripcion(id)
      setPending((prev) => prev.filter((i) => i.inscripcion_id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo rechazar la inscripción.')
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('¿ELIMINAR el historial completamente?')) return

    setHistoryActionLoading(true)
    setHistoryActionMessage('')
    try {
      const result = await clearApprovalHistory()
      setHistoryActionMessage(`${result.message} Registros eliminados: ${result.deleted_count}.`)
      setError('')

      // Update history state
      setHistory((prev) => prev.filter((h) => h.estado_inscripcion?.toLowerCase() === 'pendiente'))
    } catch (err) {
      setHistoryActionMessage('No se pudo limpiar el historial.')
    } finally {
      setHistoryActionLoading(false)
    }
  }

  const handleDeleteRestaurant = async (restaurantId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este restaurante?')) return

    try {
      if (!session) throw new Error('No autorizado')
      await deleteRestaurant(restaurantId, (session as any).token)
      // Remove it from current state
      setActivos((prev) => prev.filter((r) => r.restaurant_id !== restaurantId))
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el restaurante.')
    }
  }

  const handleUpdateRestaurantImage = async (restaurantId: number) => {
    if (!editingImage) {
      alert('Selecciona una imagen primero')
      return
    }

    if (!session) return

    try {
      const formData = new FormData()
      formData.append('image_file', editingImage)

      const response = await fetch(`/restaurants/${restaurantId}/image`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${(session as any).token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al subir la imagen')
      }

      const data = await response.json()
      // Actualizar la imagen en la lista
      setActivos((prev) =>
        prev.map((r) =>
          r.restaurant_id === restaurantId
            ? { ...r, image_data: data.image_base64 }
            : r
        )
      )
      // Cerrar modal
      setEditingRestaurantId(null)
      setEditingImage(null)
      setEditingImageUrl('')
    } catch (err: any) {
      alert(err.message || 'Error al actualizar la imagen')
    }
  }

  const { total, pendientes, rechazadas, aprobadas } = {
    total: activos.length,
    pendientes: pending.length,
    rechazadas: history.filter((h) => h.estado_inscripcion?.toLowerCase() === 'rechazada').length,
    aprobadas: history.filter((h) => h.estado_inscripcion?.toLowerCase() === 'aprobada').length,
  }

  const kpis = {
    totalActivos: activos.length || 0,
    pendientes: pending.length,
    nuevasSemana: history.filter(
      (h) =>
        h.estado_inscripcion?.toLowerCase() === 'aprobada' &&
        new Date(h.fecha_solicitud || '').getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header Premium con Avatar del Admin */}
      <div className="mb-12 flex items-start gap-6">
        {/* Avatar Premium del Admin en lugar del Logo */}
        {session && (
          <div className="relative h-20 w-20 flex-shrink-0">
            {/* Avatar con efecto real y corona */}
            <div className="h-full w-full overflow-hidden rounded-2xl border-3 border-[#E07B54] shadow-lg bg-gradient-to-br from-[#E07B54] via-[#D88B5A] to-[#D96D3D] flex items-center justify-center relative group">
              {/* Patrón oro/textura */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,.1) 2px, rgba(255,255,255,.1) 4px)'
              }} />
              
              {/* Rey emoji */}
              <div className="text-5xl">🤴</div>
            </div>
            
            {/* Status indicator - Online */}
            <div className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-3 border-white bg-green-500 shadow-lg" />
            
            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-[var(--surface)] text-[var(--text)] text-xs font-semibold px-2 py-1 rounded whitespace-nowrap border border-[var(--border)] shadow-lg">
                Admin Royal
              </div>
            </div>
          </div>
        )}

        {/* Información del Dashboard */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[var(--text)]">Dashboard Administrativo</h1>
          <p className="mt-2 text-[var(--text-muted)]">Control central de restaurantes y menús</p>
          {session && (
            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E07B54]/20 px-3 py-1 text-xs font-semibold text-[#E07B54]">
                👑 {session.role === 'admin' ? 'Administrador Royal' : 'Propietario'}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{session.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Restaurantes Activos"
          value={kpis.totalActivos}
          color="text-[#4CAF50]"
        />
        <KpiCard
          label="Solicitudes Pendientes"
          value={kpis.pendientes}
          color="text-[#E07B54]"
        />
        <KpiCard
          label="Aprobadas esta semana"
          value={kpis.nuevasSemana}
          color="text-[#2196F3]"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'pending'
              ? 'bg-[#E07B54] text-white shadow-md'
              : 'border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]'
          }`}
        >
          Solicitudes Pendientes
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'history'
              ? 'bg-[#E07B54] text-white shadow-md'
              : 'border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]'
          }`}
        >
          Historial de Operaciones
        </button>
        <button
          onClick={() => setActiveTab('activos')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === 'activos'
              ? 'bg-[#E07B54] text-white shadow-md'
              : 'border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)]'
          }`}
        >
          Restaurantes Activos ({activos.length})
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[var(--text-muted)]">Cargando datos...</div>
        ) : error ? (
          <div className="py-12 text-center text-[#E53935]">{error}</div>
        ) : activeTab === 'activos' ? (
          activos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
              <Building2 className="mb-4 h-12 w-12 opacity-20" />
              <p>No hay restaurantes registrados activos.</p>
            </div>
          ) : (
            <RestaurantsList
              restaurants={activos}
              onDelete={handleDeleteRestaurant}
              onEditImage={(id, currentUrl) => {
                setEditingRestaurantId(id)
                setEditingImage(null)
                setEditingImageUrl(currentUrl)
              }}
            />
          )
        ) : activeTab === 'pending' ? (
          pending.length === 0 ? (
            <EmptyState />
          ) : (
            <PendingTable rows={pending} onApprove={handleApprove} onReject={handleReject} />
          )
        ) : activeTab === 'history' ? (
          <ApprovalHistory rows={history} onClear={handleClearHistory} loading={historyActionLoading} />
        ) : null}
      </div>

      {/* Modal para editar imagen */}
      {editingRestaurantId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">Cambiar imagen del restaurante</h2>

            {editingImageUrl && (
              <div className="mb-4">
                <img
                  src={editingImageUrl}
                  alt="Preview"
                  className="h-48 w-full rounded-lg object-cover border border-[var(--border)]"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="text-sm font-semibold text-[var(--text)] block mb-2">Seleccionar imagen</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setEditingImage(file)
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setEditingImageUrl(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E07B54] file:text-white hover:file:brightness-95 cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingRestaurantId(null)
                  setEditingImage(null)
                  setEditingImageUrl('')
                }}
                className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition-all hover:bg-[var(--surface-soft)]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateRestaurantImage(editingRestaurantId)}
                disabled={!editingImage}
                className="flex-1 rounded-lg bg-[#E07B54] px-4 py-2 text-sm font-semibold text-white transition-all hover:brightness-95 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
