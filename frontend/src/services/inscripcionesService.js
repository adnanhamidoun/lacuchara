async function parseResponse(response, defaultMessage) {
  if (response.ok) {
    if (response.status === 204) return null
    return response.json()
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

export async function getPendingInscripciones() {
  const response = await fetch('/inscripciones/pending')
  const data = await parseResponse(response, 'No se pudieron cargar las inscripciones pendientes.')
  return Array.isArray(data?.inscripciones) ? data.inscripciones : []
}

export async function createInscripcion(payload) {
  const response = await fetch('/inscripciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(response, 'No se pudo crear la inscripción.')
}

export async function approveInscripcion(inscripcionId) {
  const response = await fetch(`/inscripciones/${inscripcionId}/approve`, {
    method: 'POST',
  })

  return parseResponse(response, 'No se pudo aprobar la inscripción.')
}

export async function rejectInscripcion(inscripcionId) {
  const response = await fetch(`/inscripciones/${inscripcionId}/reject`, {
    method: 'POST',
  })

  return parseResponse(response, 'No se pudo actualizar la inscripción.')
}
