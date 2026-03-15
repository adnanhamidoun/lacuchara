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
    body: JSON.stringify({ role: 'admin', email, password }),
  })
  return parseResponse<AuthSession>(response, 'No se pudo iniciar sesión.')
}

export async function getCurrentSession(token: string): Promise<AuthSession> {
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