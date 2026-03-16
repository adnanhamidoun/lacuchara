import type { AuthSession, RestaurantDetail } from '../types/domain'

const SESSION_KEY = 'aml-session'

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (response.ok) return response.json() as Promise<T>

  let errorMessage = defaultMessage
  try {
    const payload = await response.json()
    if (payload?.detail) errorMessage = payload.detail
  } catch {
    // noop
  }
  throw new Error(errorMessage)
}

export function getStoredSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthSession
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export function storeSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY)
    return
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  return parseResponse<AuthSession>(response, 'Credenciales inválidas.')
}export async function getCurrentSession(token: string): Promise<AuthSession> {
  const response = await fetch('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return parseResponse<AuthSession>(response, 'No se pudo recuperar la sesión.')
}

export async function updateRestaurantImage(
  restaurantId: number,
  imageUrl: string,
  token: string,
): Promise<RestaurantDetail> {
  const response = await fetch(`/restaurants/${restaurantId}/image`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ image_url: imageUrl }),
  })
  return parseResponse<RestaurantDetail>(response, 'No se pudo actualizar la imagen del restaurante.')
}

export async function uploadRestaurantImage(
  restaurantId: number,
  file: File,
  token: string,
): Promise<{ image_base64: string; content_type: string }> {
  const formData = new FormData()
  formData.append('image_file', file)
  const response = await fetch(`/restaurants/${restaurantId}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  return parseResponse(response, 'No se pudo subir la imagen.')
}

export async function getRestaurantImage(
  restaurantId: number,
): Promise<{ data_uri: string; image_url?: string }> {
  const response = await fetch(`/restaurants/${restaurantId}/image`)
  if (!response.ok) throw new Error('Sin imagen')
  const data = await response.json()
  return { data_uri: data.data_uri, image_url: data.data_uri }
}