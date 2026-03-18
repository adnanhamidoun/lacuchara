import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { formatDistance } from '../services/geolocationService';

/**
 * Componente que muestra la distancia de un restaurante
 * Utilizado en listas de restaurantes
 */
export function RestaurantDistance({ 
  restaurant, 
  userLocation, 
  className = '' 
}) {
  if (!userLocation || !restaurant.latitude || !restaurant.longitude) {
    return null;
  }

  // Si el backend ya calculó la distancia (en endpoint /nearby)
  if (restaurant.distance_km !== undefined) {
    return (
      <div className={`flex items-center gap-1 text-blue-600 font-medium ${className}`}>
        <Navigation className="w-4 h-4" />
        <span>{formatDistance(restaurant.distance_km)}</span>
      </div>
    );
  }

  // Fallback: calcular aquí (en caso de que venga del endpoint básico)
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    restaurant.latitude,
    restaurant.longitude
  );

  return (
    <div className={`flex items-center gap-1 text-blue-600 font-medium ${className}`}>
      <Navigation className="w-4 h-4" />
      <span>{formatDistance(distance)}</span>
    </div>
  );
}

/**
 * Haversine para calcular distancia en km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
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

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

export default RestaurantDistance;
