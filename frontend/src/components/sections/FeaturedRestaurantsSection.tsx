import { memo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, Crown } from 'lucide-react'
import type { RestaurantDetail } from '../../types/domain'
import { getCuisineMeta } from '../../utils/cuisine'

function RatingDisplay({ rating }: { rating: number | null }) {
  const safeRating = typeof rating === 'number' ? Math.max(0, Math.min(5, rating)) : null
  const getStarFill = (index: number) => {
    if (safeRating === null) return 0
    const decimal = safeRating - index
    if (decimal >= 1) return 100
    if (decimal > 0) return decimal * 100
    return 0
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="relative h-4 w-4 overflow-hidden">
          <Star size={16} className="absolute text-[var(--text-muted)]" />
          <div
            className="absolute h-full overflow-hidden"
            style={{ width: `${getStarFill(i)}%` }}
          >
            <Star size={16} className="absolute fill-[#E07B54] text-[#E07B54]" />
          </div>
        </div>
      ))}
      {safeRating !== null && <span className="text-xs font-semibold text-[var(--text-muted)]">{safeRating.toFixed(1)}</span>}
    </div>
  )
}

const FeaturedRestaurantCard = memo(function FeaturedRestaurantCard({
  restaurant,
  index,
}: {
  restaurant: RestaurantDetail
  index: number
}) {
  const cuisineMeta = getCuisineMeta(restaurant.cuisine_type)
  const [imageUrl, setImageUrl] = useState<string>('https://placehold.co/400x300?text=Restaurante')

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(`/get-restaurant-image/${restaurant.restaurant_id}`)
        if (response.ok) {
          const data = await response.json()
          setImageUrl(data.image_url)
        }
      } catch (error) {
        console.error('Error loading image:', error)
      }
    }
    loadImage()
  }, [restaurant.restaurant_id])

  return (
    <Link
      to={`/cliente/restaurantes/${restaurant.restaurant_id}/menu`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)]/50 bg-[var(--surface)] transition-all duration-300 hover:border-[#E07B54]/50 hover:shadow-lg hover:-translate-y-1"
      style={{
        animation: `slideInUp 0.4s ease-out ${index * 100}ms backwards`,
      }}
    >
      {/* Image */}
      <div className="relative h-56 w-full overflow-hidden bg-[var(--surface-soft)]">
        <img
          src={imageUrl}
          alt={restaurant.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badge - Rating */}
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur">
          <RatingDisplay rating={restaurant.google_rating} />
        </div>

        {/* Badge - Segment */}
        {restaurant.restaurant_segment && (
          <div className="absolute left-3 top-3 rounded-full bg-[#E07B54]/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {restaurant.restaurant_segment}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-lg font-bold text-[var(--text)]">{restaurant.name}</h3>
        <p className="text-sm text-[var(--text-muted)]">{cuisineMeta.label}</p>

        <div className="mt-auto pt-3 border-t border-[var(--border)]/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {restaurant.menu_price ? `€${restaurant.menu_price}` : 'Consultar'}
            </span>
            <div className="inline-flex items-center gap-1 text-xs font-semibold text-[#E07B54] opacity-0 transition-all duration-200 group-hover:opacity-100">
              Ver menú
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
})

interface FeaturedRestaurantsSectionProps {
  restaurants: RestaurantDetail[]
}

export default function FeaturedRestaurantsSection({ restaurants }: FeaturedRestaurantsSectionProps) {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold text-[var(--text)] md:text-5xl">Restaurantes Destacados</h2>
        <p className="mt-4 text-lg text-[var(--text-muted)]">
          Una selección de nuestros mejores restaurantes para inspirarte.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {restaurants.map((restaurant, index) => (
          <FeaturedRestaurantCard key={restaurant.restaurant_id} restaurant={restaurant} index={index} />
        ))}
      </div>
    </section>
  )
}
