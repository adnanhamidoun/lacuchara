import { useEffect, useState } from 'react'
import {
  approveInscripcion,
  clearApprovalHistory,
  getAllInscripciones,
  getPendingInscripciones,
  rejectInscripcion,
} from '../services/inscripcionesService.ts'
import type { Inscripcion } from '../types/domain'

interface DashboardKpi {
  totalActivos: number
  pendientes: number
  nuevasSemana: number
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function isWithinCurrentWeek(isoDate: string | null): boolean {
  if (!isoDate) return false
  const parsed = new Date(isoDate).getTime()
  if (Number.isNaN(parsed)) return false
  return Date.now() - parsed <= ONE_WEEK_MS
}

export function useAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingRows, setPendingRows] = useState<Inscripcion[]>([])
  const [approvalHistory, setApprovalHistory] = useState<Inscripcion[]>([])
  const [kpis, setKpis] = useState<DashboardKpi>({
    totalActivos: 0,
    pendientes: 0,
    nuevasSemana: 0,
  })

  const loadDashboard = async () => {
    try {
      setLoading(true)

      const [restaurantsResponse, pending, approved] = await Promise.all([
        fetch('/restaurants'),
        getPendingInscripciones(),
        getAllInscripciones('Aprobada'),
      ])

      if (!restaurantsResponse.ok) {
        throw new Error('No se pudo cargar el total de restaurantes activos.')
      }

      const restaurantsPayload = await restaurantsResponse.json()
      const totalActivos = Number(restaurantsPayload?.count ?? 0)
      const nuevasSemana = approved.filter((item) =>
        isWithinCurrentWeek(item.fecha_solicitud),
      ).length

      setPendingRows(pending)
      setApprovalHistory(
        approved.sort((a, b) => {
          const left = new Date(a.fecha_solicitud ?? '').getTime()
          const right = new Date(b.fecha_solicitud ?? '').getTime()
          return right - left
        }),
      )

      setKpis({
        totalActivos,
        pendientes: pending.length,
        nuevasSemana,
      })

      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const onApprove = async (inscripcionId: number) => {
    await approveInscripcion(inscripcionId)
    await loadDashboard()
  }

  const onReject = async (inscripcionId: number) => {
    await rejectInscripcion(inscripcionId)
    await loadDashboard()
  }

  const onClearApprovalHistory = async () => {
    const result = await clearApprovalHistory()
    await loadDashboard()
    return result
  }

  return {
    loading,
    error,
    pendingRows,
    approvalHistory,
    kpis,
    onApprove,
    onReject,
    onClearApprovalHistory,
    reload: loadDashboard,
    setError,
  }
}
