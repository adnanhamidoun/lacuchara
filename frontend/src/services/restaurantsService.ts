import type { RestaurantDetail, RestaurantUpdatePayload } from '../types/domain'

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>
  }

  let errorMessage = defaultMessage
  try {
    const payload = await response.json()
    if (payload?.detail) {
      errorMessage = payload.detail
    }
  } catch {
    // noop
  }

  throw new Error(errorMessage)
}

export async function getRestaurantDetail(restaurantId: number, token?: string): Promise<RestaurantDetail> {
  const response = await fetch(`/restaurants/${restaurantId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  return parseResponse<RestaurantDetail>(response, 'No se pudo cargar el restaurante.')
}

export async function updateRestaurant(
  restaurantId: number,
  payload: RestaurantUpdatePayload,
  token: string,
): Promise<RestaurantDetail> {
  const response = await fetch(`/restaurants/${restaurantId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })

  return parseResponse<RestaurantDetail>(response, 'No se pudo actualizar el restaurante.')
}

export async function deleteRestaurant(restaurantId: number, token: string): Promise<any> {
  const response = await fetch(`/restaurants/${restaurantId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })

  if (!response.ok) {
    throw new Error('No se pudo eliminar el restaurante.')
  }

  return response.json()
}
