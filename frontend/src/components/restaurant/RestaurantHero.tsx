import { Star, MapPin, Clock, Users, Wifi, Utensils, Wine, CalendarDays, TrendingUp } from 'lucide-react'
import type { RestaurantDetail } from '../../types/domain'

interface RestaurantHeroProps {
  restaurant: RestaurantDetail
  imageUrl: string
  onBack: () => void
}

export function RestaurantHero({ restaurant, imageUrl, onBack }: RestaurantHeroProps) {
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#E07B54] hover:text-[#D88B5A] transition-colors"
      >
        ← Volver al catálogo
      </button>

      {/* Hero Image Container */}
      <div className="relative overflow-hidden rounded-3xl border border-[#3A3037]/30 bg-[var(--surface-soft)] shadow-lg">
        {/* Image */}
        <div className="relative h-80 w-full overflow-hidden bg-[var(--surface-soft)]">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={restaurant.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
            </>
          ) : (
            /* Fallback when no image */
            <div className="h-full w-full bg-gradient-to-br from-[#3A3037] via-[#2D2823] to-[#1F1B16] flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-3">🏢</div>
                <p className="text-[var(--text-muted)] text-sm">Imagen no disponible</p>
              </div>
            </div>
          )}

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white bg-gradient-to-t from-black/60 to-transparent">
            {/* Restaurant Segment Badge */}
            {restaurant.restaurant_segment && (
              <div className="mb-3 inline-block">
                <span className="rounded-full bg-[#E07B54]/90 px-3 py-1 text-xs font-semibold backdrop-blur">
                  {restaurant.restaurant_segment}
                </span>
              </div>
            )}

            {/* Name */}
            <h1 className="mb-2 text-4xl font-bold text-white drop-shadow-lg">
              {restaurant.name}
            </h1>

            {/* Subtitle with Cuisine & Rating */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Cuisine Type */}
              {restaurant.cuisine_type && (
                <div className="flex items-center gap-1.5">
                  <Utensils size={16} className="text-[#E8C07D]" />
                  <span className="text-sm font-medium">{restaurant.cuisine_type}</span>
                </div>
              )}

              {/* Rating */}
              {restaurant.google_rating && (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    <Star size={16} className="fill-[#E8C07D] text-[#E8C07D]" />
                    <span className="text-sm font-semibold">{restaurant.google_rating.toFixed(1)}</span>
                  </div>
                </div>
              )}

              {/* Average Price */}
              {restaurant.menu_price && (
                <div className="flex items-center gap-1.5">
                  <Wine size={16} className="text-[#E8C07D]" />
                  <span className="text-sm font-medium">€{restaurant.menu_price.toFixed(2)} menú</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
