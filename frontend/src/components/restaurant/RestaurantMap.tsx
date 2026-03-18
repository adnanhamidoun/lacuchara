import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { RestaurantDetail } from '../../types/domain'

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css'

// Fix for default icons issue in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface RestaurantMapProps {
  restaurant: RestaurantDetail & { latitude?: number; longitude?: number }
}

export function RestaurantMap({ restaurant }: RestaurantMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  const latitude = restaurant.latitude
  const longitude = restaurant.longitude

  // Hide map if no coordinates
  if (!latitude || !longitude) {
    return null
  }

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) return

    // Initialize map only once
    if (!map.current) {
      map.current = L.map(mapContainer.current).setView([latitude, longitude], 16)

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current)

      // Add restaurant marker
      const customIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })

      L.marker([latitude, longitude], { icon: customIcon })
        .bindPopup(`<strong>${restaurant.name}</strong>`)
        .addTo(map.current)
        .openPopup()
    }

    // Cleanup
    return () => {
      // Keep map persistent for this view
    }
  }, [latitude, longitude, restaurant.name])

  return (
    <div className="rounded-3xl border border-[#3A3037]/30 bg-[var(--surface)] overflow-hidden shadow-lg">
      <h2 className="p-4 text-lg font-bold text-[var(--text)] uppercase tracking-wide border-b border-[#3A3037]/30">
        📍 Ubicación
      </h2>
      <div
        ref={mapContainer}
        className="w-full h-64"
        style={{ minHeight: '250px' }}
      />
    </div>
  )
}
