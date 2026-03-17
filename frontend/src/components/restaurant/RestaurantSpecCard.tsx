import { MapPin, Users, Clock, Wifi, BarChart3, Utensils, Star, BadgeEuro, Armchair, Umbrella, CalendarDays } from 'lucide-react'
import type { RestaurantDetail } from '../../types/domain'
import { formatTerraceType } from '../../utils/formatTerraceType'

interface RestaurantSpecCardProps {
  restaurant: RestaurantDetail
}

function SpecRow({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[var(--border)]/30 last:border-b-0">
      <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center">
        <Icon size={14} className="text-[#E07B54]" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-sm font-semibold text-[var(--text)]">{value}</p>
      </div>
    </div>
  )
}

function SpecSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-bold text-[#E07B54] uppercase tracking-wider">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function RestaurantSpecCard({ restaurant }: RestaurantSpecCardProps) {
  return (
    <div className="h-full rounded-3xl border border-[#3A3037]/30 bg-[var(--surface)] p-4 shadow-lg">
      <h2 className="mb-4 text-lg font-bold text-[var(--text)] uppercase tracking-wide">Ficha del Restaurante</h2>

      <div className="space-y-5">
        {/* Experiencia Section */}
        <SpecSection title="Experiencia">
          {restaurant.cuisine_type && (
            <SpecRow
              icon={Utensils}
              label="Cocina"
              value={restaurant.cuisine_type}
            />
          )}
          {restaurant.restaurant_segment && (
            <SpecRow
              icon={BarChart3}
              label="Segmento"
              value={restaurant.restaurant_segment}
            />
          )}
          {restaurant.google_rating && (
            <SpecRow
              icon={Star}
              label="Valoración"
              value={`${restaurant.google_rating.toFixed(1)} / 5.0`}
            />
          )}
          {restaurant.menu_price && (
            <SpecRow
              icon={BadgeEuro}
              label="Precio medio del menú"
              value={`€${restaurant.menu_price.toFixed(2)}`}
            />
          )}
        </SpecSection>

        {/* Capacidad y Servicio Section */}
        {(restaurant.capacity_limit || restaurant.table_count || restaurant.min_service_duration) && (
          <SpecSection title="Capacidad y Servicio">
            {restaurant.capacity_limit && (
              <SpecRow
                icon={Users}
                label="Capacidad máxima"
                value={`${restaurant.capacity_limit} personas`}
              />
            )}
            {restaurant.table_count && (
              <SpecRow
                icon={Armchair}
                label="Número de mesas"
                value={`${restaurant.table_count} mesas`}
              />
            )}
            {restaurant.min_service_duration && (
              <SpecRow
                icon={Clock}
                label="Tiempo mínimo de servicio"
                value={`${restaurant.min_service_duration} minutos`}
              />
            )}
          </SpecSection>
        )}

        {/* Comodidades Section */}
        {(restaurant.has_wifi !== undefined || restaurant.terrace_setup_type || restaurant.opens_weekends !== undefined) && (
          <SpecSection title="Comodidades">
            {restaurant.has_wifi !== undefined && (
              <SpecRow
                icon={Wifi}
                label="WiFi"
                value={restaurant.has_wifi ? 'Disponible' : 'No disponible'}
              />
            )}
            {restaurant.terrace_setup_type && (
              <SpecRow
                icon={Umbrella}
                label="Terraza"
                value={formatTerraceType(restaurant.terrace_setup_type)}
              />
            )}
            {restaurant.opens_weekends !== undefined && (
              <SpecRow
                icon={CalendarDays}
                label="Abre fines de semana"
                value={restaurant.opens_weekends ? 'Sí' : 'No'}
              />
            )}
          </SpecSection>
        )}

        {/* Ubicación Section */}
        {restaurant.dist_office_towers && (
          <SpecSection title="Ubicación Práctica">
            <SpecRow
              icon={MapPin}
              label="Distancia a oficinas"
              value={`${restaurant.dist_office_towers}m`}
            />
          </SpecSection>
        )}
      </div>
    </div>
  )
}
