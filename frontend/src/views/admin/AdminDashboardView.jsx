import { useEffect, useState } from 'react'
import {
  approveInscripcion,
  getPendingInscripciones,
  rejectInscripcion,
} from '../../services/inscripcionesService'

export default function AdminDashboardView() {
  const [pendingRows, setPendingRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadPending = async () => {
    try {
      setLoading(true)
      const data = await getPendingInscripciones()
      setPendingRows(data)
      setError('')
    } catch {
      setError('No fue posible cargar las solicitudes pendientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleApprove = async (inscripcionId) => {
    try {
      await approveInscripcion(inscripcionId)
      await loadPending()
    } catch (err) {
      setError(err.message || 'No se pudo aprobar la inscripción.')
    }
  }

  const handleReject = async (inscripcionId) => {
    try {
      await rejectInscripcion(inscripcionId)
      await loadPending()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la inscripción.')
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard de Administrador</h2>
        <p className="text-sm text-slate-600">
          Solicitudes pendientes desde dbo.inscripciones para revisión y aprobación.
        </p>
      </div>

      {loading ? <p className="text-sm text-slate-500">Cargando solicitudes...</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {!loading && pendingRows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No hay solicitudes pendientes.
        </div>
      ) : null}

      <div className="space-y-3">
        {pendingRows.map((row) => (
          <article
            key={row.inscripcion_id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{row.name}</h3>
                <p className="text-sm text-slate-600">
                  Capacidad: {row.capacity_limit} · Mesas: {row.table_count} · Segmento:{' '}
                  {row.restaurant_segment}
                </p>
                <p className="text-sm text-slate-600">
                  Cocina: {row.cuisine_type} · WiFi: {row.has_wifi ? 'Sí' : 'No'} · Finde:{' '}
                  {row.opens_weekends ? 'Sí' : 'No'}
                </p>
                <a
                  href={row.google_maps_link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-sm font-medium text-blue-700 hover:underline"
                >
                  Ver Link de Google Maps
                </a>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(row.inscripcion_id)}
                  className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => handleReject(row.inscripcion_id)}
                  className="rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
                >
                  Solicitar cambios / Rechazar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
