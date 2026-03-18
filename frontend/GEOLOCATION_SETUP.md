# Implementación de Geolocalización - Frontend 🌍

## Resumen

Se ha implementado un sistema completo de geolocalización que permite:
- ✅ Solicitar permisos al usuario
- ✅ Obtener ubicación actual
- ✅ Mostrar distancia a cada restaurante
- ✅ Ordenar restaurantes por proximidad
- ✅ Cachear ubicación localmente

---

## Componentes Creados

### 1. **GeolocationPrompt.jsx** - Modal Inicial
Aparece cuando el usuario entra a la app.

```jsx
import { GeolocationPrompt } from '@/components/GeolocationPrompt';

export function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [showGeoPrompt, setShowGeoPrompt] = useState(true);

  return (
    <>
      {showGeoPrompt && (
        <GeolocationPrompt
          onLocationReceived={(location) => {
            setUserLocation(location);
            console.log('📍 Ubicación recibida:', location);
          }}
          onDismiss={() => setShowGeoPrompt(false)}
        />
      )}
      
      {/* Rest of app */}
    </>
  );
}
```

### 2. **RestaurantDistance.jsx** - Badge de Distancia
Muestra la distancia en tarjetas de restaurantes.

```jsx
import RestaurantDistance from '@/components/RestaurantDistance';

export function RestaurantCard({ restaurant, userLocation }) {
  return (
    <div className="restaurant-card">
      <h3>{restaurant.name}</h3>
      <RestaurantDistance 
        restaurant={restaurant}
        userLocation={userLocation}
        className="text-lg"
      />
    </div>
  );
}
```

### 3. **geolocationService.js** - Utilidades
Funciones para:
- Solicitar permisos
- Obtener ubicación
- Calcular distancias (Haversine)
- Cachear en localStorage

```javascript
import { 
  getLocationWithFallback,
  formatDistance,
  calculateHaversineDistance 
} from '@/services/geolocationService';

// Obtener ubicación
const location = await getLocationWithFallback();

// Formatear distancia
formatDistance(1.5); // "1.5 km"
formatDistance(0.5); // "500 m"
```

### 4. **restaurantService.js** - APIs
Endpoints:
- `fetchRestaurants()` - Lista básica sin distancia
- `fetchRestaurantsNearby(lat, lon)` - Con distancias ordenadas
- `fetchRestaurantDetail(id)` - Detalles completos

```javascript
import { fetchRestaurantsNearby } from '@/services/restaurantService';

// Obtener restaurantes cercanos
const nearby = await fetchRestaurantsNearby(
  userLocation.latitude,
  userLocation.longitude
);

// Ya vienen con:
// {
//   restaurant_id: 1,
//   name: "Azca Prime Grill",
//   distance_km: 0.35,
//   latitude: 40.447514,
//   longitude: -3.693008,
//   image_url: "...",
//   google_rating: 4.7
// }
```

---

## Flujo de Integración Recomendado

### Paso 1: Actualizar App.jsx

```jsx
import { useState, useEffect } from 'react';
import { GeolocationPrompt } from './components/GeolocationPrompt';
import { fetchRestaurantsNearby } from './services/restaurantService';

export function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [showGeoPrompt, setShowGeoPrompt] = useState(true);
  const [restaurantsNearby, setRestaurantsNearby] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar restaurantes cercanos cuando se obtiene ubicación
  useEffect(() => {
    if (!userLocation) return;

    const loadNearby = async () => {
      setLoading(true);
      try {
        const data = await fetchRestaurantsNearby(
          userLocation.latitude,
          userLocation.longitude
        );
        setRestaurantsNearby(data);
      } catch (error) {
        console.error('Error cargando restaurantes cercanos:', error);
      }
      setLoading(false);
    };

    loadNearby();
  }, [userLocation]);

  return (
    <div>
      {showGeoPrompt && (
        <GeolocationPrompt
          onLocationReceived={(loc) => {
            setUserLocation(loc);
            console.log('✅ Ubicación confirmada');
          }}
          onDismiss={() => setShowGeoPrompt(false)}
        />
      )}

      {userLocation && (
        <div className="p-4 bg-blue-50 rounded">
          <p className="text-sm text-blue-900">
            📍 Tu ubicación: {userLocation.latitude.toFixed(4)}, 
            {userLocation.longitude.toFixed(4)}
          </p>
        </div>
      )}

      {restaurantsNearby.length > 0 && (
        <RestaurantList restaurants={restaurantsNearby} />
      )}
    </div>
  );
}
```

### Paso 2: Actualizar RestaurantCard

```jsx
import RestaurantDistance from '@/components/RestaurantDistance';

export function RestaurantCard({ restaurant, userLocation }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-3">
      {/* Imagen */}
      <img 
        src={restaurant.image_url} 
        alt={restaurant.name}
        className="w-full h-40 object-cover rounded"
      />

      {/* Header con distancia */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{restaurant.name}</h3>
          <p className="text-sm text-gray-600">{restaurant.cuisine_type}</p>
        </div>
        {userLocation && (
          <RestaurantDistance
            restaurant={restaurant}
            userLocation={userLocation}
            className="text-right text-blue-600 font-semibold"
          />
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center">
        <span className="text-yellow-500">★</span>
        <span className="ml-1 font-medium">{restaurant.google_rating}</span>
      </div>
    </div>
  );
}
```

---

## Endpoints Backend Disponibles

### GET `/restaurants`
Retorna lista básica con coordenadas.

**Response:**
```json
{
  "count": 21,
  "restaurants": [
    {
      "restaurant_id": 1,
      "name": "Azca Prime Grill",
      "latitude": 40.447514,
      "longitude": -3.693008
    }
  ]
}
```

### GET `/restaurants/nearby?user_latitude=40.4475&user_longitude=-3.6930`
**Endpoint recomendado** - Retorna restaurantes ya ordenados por distancia.

**Response:**
```json
{
  "count": 21,
  "user_latitude": 40.4475,
  "user_longitude": -3.693,
  "restaurants": [
    {
      "restaurant_id": 1,
      "name": "Azca Prime Grill",
      "latitude": 40.447514,
      "longitude": -3.693008,
      "distance_km": 0.00,
      "image_url": "https://...",
      "google_rating": 4.7,
      "cuisine_type": "Grill"
    },
    {
      "restaurant_id": 5,
      "name": "Picasso Fine Dining",
      "latitude": 40.450100,
      "longitude": -3.693500,
      "distance_km": 0.28,
      "image_url": "https://...",
      "google_rating": 4.2,
      "cuisine_type": "Italian"
    }
  ]
}
```

---

## Datos de Restaurantes Disponibles

En la BD tienes:

```sql
SELECT 
  restaurant_id,
  name,
  latitude,          -- ✅ NUEVO
  longitude,         -- ✅ NUEVO
  google_rating,
  cuisine_type,
  image_url,
  capacity_limit,
  opens_weekends,
  has_wifi
FROM dim_restaurants
```

**Ejemplo de datos:**
```
ID | Nombre                | Lat        | Lon       | Rating | Cuisine
1  | Azca Prime Grill      | 40.447514  | -3.693008 | 4.7    | Grill
2  | Castellana Tradición  | 40.448210  | -3.691500 | 4.4    | Spanish
5  | Picasso Fine Dining   | 40.450100  | -3.693500 | 4.2    | Italian
```

---

## Funciones Útiles de Geolocation Service

### 1. `requestGeolocationPermission()`
Verifica el estado actual del permiso sin pedir

```javascript
const permission = await requestGeolocationPermission();
// 'granted', 'denied', 'prompt'
```

### 2. `getUserLocation(options)`
Obtiene coordenadas actuales del dispositivo

```javascript
const location = await getUserLocation({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000
});
// { latitude, longitude, accuracy, timestamp }
```

### 3. `formatDistance(km)`
Formatea kilómetros para mostrar en UI

```javascript
formatDistance(0.35);   // "350 m"
formatDistance(1.2);    // "1.2 km"
formatDistance(15.5);   // "15.5 km"
```

### 4. `calculateHaversineDistance(lat1, lon1, lat2, lon2)`
Calcula distancia entre dos puntos (backup si falla backend)

```javascript
const dist = calculateHaversineDistance(
  40.4475,    // usuario lat
  -3.6930,    // usuario lon
  40.447514,  // restaurante lat
  -3.693008   // restaurante lon
);
// 0.00073 km (en radianes)
```

### 5. `saveUserLocationLocal(location)` / `loadUserLocationLocal(maxAgeMinutes)`
Cache local de ubicación

```javascript
// Guardar
saveUserLocationLocal({ latitude: 40.4475, longitude: -3.6930 });

// Cargar (máx 30 minutos de antigüedad)
const cached = loadUserLocationLocal(30);
if (!cached) {
  // Ubicación expiró, pedir de nuevo
}
```

---

## Flujo de Privacidad & Permisos

1. **Primera visita**: Modal pide permiso
2. **Usuario acepta**: Se obtiene ubicación, se cachea 30 min
3. **Usuario rechaza**: Se oculta modal, se intenta sin ubicación
4. **Navegador deniega**: Se muestra mensaje de error
5. **Ubica​ción expirada**: Se pide de nuevo después de 30 min

---

## Testing

```javascript
// Mock de ubicación en desarrollo
const mockLocation = {
  latitude: 40.4475,
  longitude: -3.6930
};

// Probar component sin geolocalización
<RestaurantCard 
  restaurant={restaurantMock}
  userLocation={null}  // Sin ubicación
/>

// Probar con distancia
<RestaurantCard 
  restaurant={{
    ...restaurantMock,
    distance_km: 0.35
  }}
  userLocation={mockLocation}
/>
```

---

## Notas Importantes

✅ **Backend**: Las coordenadas `latitude` y `longitude` ya están en la BD  
✅ **API**: Endpoint `/restaurants/nearby` calcula distancias en el servidor  
✅ **Frontend**: Componentes listos para usar  
✅ **Cache**: LocalStorage guarda ubicación 30 minutos  
✅ **Fallback**: Si falla el backend, el frontend calcula Haversine  
✅ **Privacidad**: Ubicación solo se usa localmente, no se envía a terceros  

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| HTTPS requerido | Geolocation API solo funciona en HTTPS (o localhost) |
| Permisos denegados | Usuario debe habilitar en navegador → Configuración |
| No aparece distancia | Verificar que `latitude` y `longitude` están en BD |
| Distancias incorrectas | Validar coordenadas en BD (Madrid ~40.45° N, -3.69° W) |
| API devuelve 500 | Verificar que las columnas existen en SQL Server |

---

**¡Geolocalización lista para producción! 🚀**
