import type {
  Inscripcion,
  InscripcionCreatePayload,
  InscripcionesListResponse,
} from '../types/domain'

interface ApiActionResponse {
  inscripcion_id: number
  status: string
  message: string
  restaurant_id: number | null
}

interface ClearHistoryResponse {
  deleted_count: number
  message: string
}

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return null as T
    return response.json() as Promise<T>
  }

  let errorMessage = defaultMessage
  try {
    const payload = await response.json()
    if (payload?.detail) errorMessage = payload.detail
  } catch {
    // noop
  }

  throw new Error(errorMessage)
}

export async function getPendingInscripciones(): Promise<Inscripcion[]> {
  const response = await fetch('/inscripciones/pending')
  const data = await parseResponse<InscripcionesListResponse>(
    response,
    'No se pudieron cargar las inscripciones pendientes.',
  )
  return Array.isArray(data?.inscripciones) ? data.inscripciones : []
}

export async function getAllInscripciones(status?: string): Promise<Inscripcion[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  const response = await fetch(`/inscripciones${query}`)
  const data = await parseResponse<InscripcionesListResponse>(
    response,
    'No se pudieron cargar las inscripciones.',
  )
  return Array.isArray(data?.inscripciones) ? data.inscripciones : []
}

export async function createInscripcion(payload: InscripcionCreatePayload): Promise<Inscripcion> {
  const response = await fetch('/inscripciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse<Inscripcion>(response, 'No se pudo crear la inscripción.')
}

export async function uploadInscripcionImage(
  file: File,
): Promise<{ success: boolean; image_url: string; message: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/upload-inscripcion-image', {
    method: 'POST',
    body: formData,
  })

  return parseResponse(response, 'No se pudo subir la imagen de la inscripción.')
}

export async function approveInscripcion(inscripcionId: number): Promise<ApiActionResponse> {
  const response = await fetch(`/inscripciones/${inscripcionId}/approve`, {
    method: 'POST',
  })

  return parseResponse<ApiActionResponse>(response, 'No se pudo aprobar la inscripción.')
}

export async function rejectInscripcion(inscripcionId: number): Promise<ApiActionResponse> {
  const response = await fetch(`/inscripciones/${inscripcionId}/reject`, {
    method: 'POST',
  })

  return parseResponse<ApiActionResponse>(response, 'No se pudo actualizar la inscripción.')
}

export async function clearApprovalHistory(): Promise<ClearHistoryResponse> {
  const response = await fetch('/inscripciones/history/approved', {
    method: 'DELETE',
  })

  return parseResponse<ClearHistoryResponse>(response, 'No se pudo limpiar el historial de aprobaciones.')
}
