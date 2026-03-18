/**
 * Servicio API para restaurantes
 * Maneja todas las llamadas HTTP relacionadas con restaurantes
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Obtiene la lista básica de restaurantes
 * @returns {Promise<Array>} Lista de restaurantes
 */
export async function fetchRestaurants() {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.restaurants || [];
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    throw error;
  }
}

/**
 * Obtiene restaurantes cercanos ordenados por distancia
 * @param {number} userLatitude - Latitud del usuario
 * @param {number} userLongitude - Longitud del usuario
 * @returns {Promise<Array>} Restaurantes con distancia calculada
 */
export async function fetchRestaurantsNearby(userLatitude, userLongitude) {
  try {
    const params = new URLSearchParams({
      user_latitude: userLatitude,
      user_longitude: userLongitude,
    });

    const response = await fetch(
      `${API_BASE_URL}/restaurants/nearby?${params}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.restaurants || [];
  } catch (error) {
    console.error("Error fetching nearby restaurants:", error);
    throw error;
  }
}

/**
 * Obtiene detalles completos de un restaurante
 * @param {number} restaurantId - ID del restaurante
 * @returns {Promise<Object>} Detalles del restaurante
 */
export async function fetchRestaurantDetail(restaurantId) {
  try {
    const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching restaurant ${restaurantId}:`, error);
    throw error;
  }
}

export default {
  fetchRestaurants,
  fetchRestaurantsNearby,
  fetchRestaurantDetail,
};
