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
      if (typeof payload.detail === 'string') {
        errorMessage = payload.detail
      } else if (Array.isArray(payload.detail)) {
        errorMessage = payload.detail
          .map((item: any) => item?.msg || JSON.stringify(item))
          .join(' | ')
      }
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

  if (response.ok) {
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true }
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return { success: true }
    }

    try {
      return await response.json()
    } catch {
      return { success: true }
    }
  }

  let errorMessage = 'No se pudo eliminar el restaurante.'
  try {
    const payload = await response.json()
    if (payload?.detail) {
      if (typeof payload.detail === 'string') {
        errorMessage = payload.detail
      } else if (Array.isArray(payload.detail)) {
        errorMessage = payload.detail
          .map((item: any) => item?.msg || JSON.stringify(item))
          .join(' | ')
      }
    }
  } catch {
    // noop
  }

  throw new Error(errorMessage)
}
