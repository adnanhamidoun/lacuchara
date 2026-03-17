import { Wifi, MapPin, Wine, Star, Users, Clock, Utensils } from 'lucide-react'
import type { RestaurantDetail } from '../../types/domain'

interface RestaurantOverviewProps {
  restaurant: RestaurantDetail
}

function HighlightChip({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#E07B54]/10 px-4 py-2 border border-[#E07B54]/20">
      <Icon size={16} className="text-[#E07B54]" />
      <span className="text-sm font-semibold text-[#E07B54]">{label}</span>
    </div>
  )
}

function QuickFactCard({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)]/50 bg-[var(--surface-soft)]/40 p-4 text-center">
      <Icon size={20} className="mx-auto mb-2 text-[#E07B54]" />
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <p className="mt-2 text-lg font-bold text-[var(--text)]">{value}</p>
    </div>
  )
}

export function RestaurantOverview({ restaurant }: RestaurantOverviewProps) {
  return (
    <div className="space-y-8">
      {/* About This Restaurant */}
      <div className="rounded-3xl border border-[#3A3037]/30 bg-[var(--surface)] p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-bold text-[var(--text)]">Acerca de este Restaurante</h2>

        <p className="text-sm leading-relaxed text-[var(--text-muted)]">
          {restaurant.name} es un espacio culinario dedicado a la experiencia de {restaurant.cuisine_type?.toLowerCase()}.
          Con un ambiente {restaurant.restaurant_segment?.toLowerCase()} y una valoración de{' '}
          <span className="font-semibold text-[var(--text)]">
            {restaurant.google_rating?.toFixed(1)} estrellas
          </span>
          , ofrece una propuesta gastronómica cuidada y servicio profesional.
        </p>

        {/* Highlights Row */}
        <div className="mt-6 flex flex-wrap gap-3">
          {restaurant.has_wifi && <HighlightChip icon={Wifi} label="WiFi Disponible" />}
          {restaurant.opens_weekends && <HighlightChip icon={MapPin} label="Abierto Fines de Semana" />}
          {restaurant.terrace_setup_type && <HighlightChip icon={() => <span>🏡</span>} label="Con Terraza" />}
          {restaurant.cuisine_type && (
            <HighlightChip icon={Utensils} label={`Cocina ${restaurant.cuisine_type}`} />
          )}
        </div>
      </div>

      {/* Quick Facts Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#E07B54] uppercase tracking-wider">Datos Rápidos</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {restaurant.google_rating && (
            <QuickFactCard
              icon={Star}
              label="Valoración"
              value={`${restaurant.google_rating.toFixed(1)}/5`}
            />
          )}
          {restaurant.menu_price && (
            <QuickFactCard
              icon={Wine}
              label="Precio Menú"
              value={`€${restaurant.menu_price.toFixed(0)}`}
            />
          )}
          {restaurant.capacity_limit && (
            <QuickFactCard icon={Users} label="Capacidad" value={`${restaurant.capacity_limit} pers`} />
          )}
          {restaurant.min_service_duration && (
            <QuickFactCard icon={Clock} label="Tiempo Mín." value={`${restaurant.min_service_duration}'`} />
          )}
          {restaurant.table_count && (
            <QuickFactCard icon={() => <span className="text-lg">🪑</span>} label="Mesas" value={`${restaurant.table_count}`} />
          )}
          {restaurant.dist_office_towers && (
            <QuickFactCard icon={MapPin} label="A Oficinas" value={`${restaurant.dist_office_towers}m`} />
          )}
        </div>
      </div>
    </div>
  )
}
