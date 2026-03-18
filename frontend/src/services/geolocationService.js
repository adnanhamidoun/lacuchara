/**
 * Servicio de Geolocalización
 * 
 * Maneja:
 * - Solicitud de permisos de geolocalización
 * - Obtención de coordenadas del usuario
 * - Cálculo de distancias (alternativo)
 * - Persisten de preferencias de ubicación
 */

/**
 * Solicita permiso de geolocalización al usuario
 * @returns {Promise<PermissionStatus>} 'granted', 'denied', 'prompt'
 */
export async function requestGeolocationPermission() {
  try {
    if (!navigator.permissions || !navigator.permissions.query) {
      console.warn("Permissions API no disponible en este navegador");
      return 'prompt';
    }

    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state; // 'granted', 'denied', 'prompt'
  } catch (error) {
    console.error("Error consultando permisos de geolocalización:", error);
    return 'prompt';
  }
}

/**
 * Obtiene las coordenadas del usuario
 * @param {Object} options - Opciones para Geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getUserLocation(options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // Cache para 5 minutos
      ...options
    };

    if (!navigator.geolocation) {
      reject(new Error("Geolocation no disponible en este navegador"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      defaultOptions
    );
  });
}

/**
 * Calcula distancia en km entre dos puntos usando Haversine
 * (Backup en caso de que el backend falle)
 * 
 * @param {number} lat1 - Latitud del punto 1
 * @param {number} lon1 - Longitud del punto 1
 * @param {number} lat2 - Latitud del punto 2 (restaurante)
 * @param {number} lon2 - Longitud del punto 2 (restaurante)
 * @returns {number} Distancia en km
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convierte grados a radianes
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Guarda las coordenadas del usuario en localStorage
 * @param {Object} location - {latitude, longitude}
 */
export function saveUserLocationLocal(location) {
  try {
    localStorage.setItem('userLocation', JSON.stringify({
      ...location,
      timestamp: new Date().getTime()
    }));
  } catch (error) {
    console.warn("Error guardando ubicación en localStorage:", error);
  }
}

/**
 * Carga las coordenadas del usuario desde localStorage
 * @param {number} maxAgeMinutes - Edad máxima del cache en minutos
 * @returns {Object|null} {latitude, longitude} o null si expiró
 */
export function loadUserLocationLocal(maxAgeMinutes = 30) {
  try {
    const stored = localStorage.getItem('userLocation');
    if (!stored) return null;

    const location = JSON.parse(stored);
    const ageMinutes = (new Date().getTime() - location.timestamp) / (1000 * 60);

    if (ageMinutes > maxAgeMinutes) {
      localStorage.removeItem('userLocation');
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude
    };
  } catch (error) {
    console.warn("Error cargando ubicación desde localStorage:", error);
    return null;
  }
}

/**
 * Obtiene ubicación: primero intenta cache local, luego Geolocation API
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export async function getLocationWithFallback() {
  // Intentar cargar del cache local
  const cached = loadUserLocationLocal(30);
  if (cached) {
    console.log("📍 Usando ubicación del cache:", cached);
    return cached;
  }

  // Si no hay cache, solicitar ubicación actual
  try {
    const location = await getUserLocation();
    saveUserLocationLocal(location);
    console.log("📍 Ubicación obtenida del dispositivo:", location);
    return location;
  } catch (error) {
    console.error("❌ Error obteniendo ubicación:", error);
    throw error;
  }
}

/**
 * Traduce errores de geolocalización a mensajes amigables
 * @param {GeolocationPositionError} error
 * @returns {string}
 */
export function getGeolocationErrorMessage(error) {
  const messages = {
    1: "Permiso de geolocalización denegado. Por favor, habilita la ubicación en la configuración de tu navegador.",
    2: "No se pudo obtener la ubicación. Intenta de nuevo en un lugar con mejor señal GPS.",
    3: "Tiempo agotado al obtener la ubicación. Intenta de nuevo.",
  };

  return messages[error.code] || "Error desconocido al obtener la ubicación.";
}

/**
 * Formatea distancia para mostrar en UI
 * @param {number} km - Distancia en km
 * @returns {string} Texto formateado (ej: "1.2 km" o "50 m")
 */
export function formatDistance(km) {
  if (km >= 1) {
    return `${km.toFixed(1)} km`;
  }
  return `${(km * 1000).toFixed(0)} m`;
}
