import { useState } from 'react'
import { useAdminDashboard } from '../../hooks/useAdminDashboard'
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
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
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
                {row.cuisine_type ? `${getCuisineMeta(row.cuisine_type).emoji} ${getCuisineMeta(row.cuisine_type).label}` : '-'}
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

export default function AdminDashboardView() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [historyActionMessage, setHistoryActionMessage] = useState('')
  const [historyActionLoading, setHistoryActionLoading] = useState(false)
  const {
    loading,
    error,
    pendingRows,
    approvalHistory,
    kpis,
    onApprove,
    onReject,
    onClearApprovalHistory,
    setError,
  } = useAdminDashboard()

  const handleApprove = async (inscripcionId: number) => {
    try {
      await onApprove(inscripcionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aprobar la inscripción.')
    }
  }

  const handleReject = async (inscripcionId: number) => {
    try {
      await onReject(inscripcionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo rechazar la inscripción.')
    }
  }

  const handleClearHistory = async () => {
    if (!window.confirm('¿Seguro que quieres limpiar el historial de aprobaciones? Esta acción no se puede deshacer.')) {
      return
    }

    setHistoryActionLoading(true)
    setHistoryActionMessage('')
    try {
      const result = await onClearApprovalHistory()
      setHistoryActionMessage(`${result.message} Registros eliminados: ${result.deleted_count}.`)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo limpiar el historial de aprobaciones.')
    } finally {
      setHistoryActionLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text)]">Dashboard de Administrador</h2>
        <p className="text-sm text-[var(--text-muted)]">Revisa solicitudes y controla el flujo de aprobaciones.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="Total restaurantes activos" value={kpis.totalActivos} color="text-[var(--text)]" />
        <KpiCard label="Solicitudes pendientes" value={kpis.pendientes} color="text-[#E07B54]" />
        <KpiCard label="Aprobadas esta semana" value={kpis.nuevasSemana} color="text-[#4CAF50]" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'pending'
              ? 'bg-[#E07B54] text-white'
              : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]'
          }`}
        >
          Pendientes
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-[#E07B54] text-white'
              : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-soft)]'
          }`}
        >
          Historial de aprobaciones
        </button>
      </div>

      {loading ? <p className="text-sm text-[var(--text-muted)]">Cargando dashboard...</p> : null}
      {error ? <p className="rounded-lg bg-[#E53935]/10 p-3 text-sm text-[#E53935]">{error}</p> : null}
      {historyActionMessage ? (
        <p className="rounded-lg bg-[#4CAF50]/15 p-3 text-sm text-[#2E7D32]">{historyActionMessage}</p>
      ) : null}

      {!loading && activeTab === 'pending' && pendingRows.length === 0 ? <EmptyState /> : null}

      {!loading && activeTab === 'pending' && pendingRows.length > 0 ? (
        <PendingTable rows={pendingRows} onApprove={handleApprove} onReject={handleReject} />
      ) : null}

      {!loading && activeTab === 'history' ? (
        <ApprovalHistory rows={approvalHistory} onClear={handleClearHistory} loading={historyActionLoading} />
      ) : null}
    </section>
  )
}
