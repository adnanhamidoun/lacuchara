import { useEffect, useMemo, useState } from 'react'
import type { RestaurantDetail, RestaurantsListResponse } from '../types/domain'
import { getCanonicalCuisineCode } from '../utils/cuisine'

export type PriceRange = 'all' | 'low' | 'mid' | 'high'

const byName = (left: RestaurantDetail, right: RestaurantDetail) =>
  left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setLoading(true)
        const listResponse = await fetch('/restaurants')
        if (!listResponse.ok) {
          throw new Error('No se pudieron cargar los restaurantes disponibles.')
        }

        const listData = (await listResponse.json()) as RestaurantsListResponse
        const baseRows = Array.isArray(listData?.restaurants) ? listData.restaurants : []

        const detailRows = await Promise.all(
          baseRows.map(async (item) => {
            const detailResponse = await fetch(`/restaurants/${item.restaurant_id}`)
            if (!detailResponse.ok) {
              return {
                restaurant_id: item.restaurant_id,
                name: item.name,
                capacity_limit: null,
                table_count: null,
                min_service_duration: null,
                terrace_setup_type: null,
                opens_weekends: null,
                has_wifi: null,
                restaurant_segment: null,
                menu_price: null,
                dist_office_towers: null,
                google_rating: null,
                cuisine_type: null,
                image_url: null,
              } as RestaurantDetail
            }
            return (await detailResponse.json()) as RestaurantDetail
          }),
        )

        setRestaurants(detailRows.sort(byName))
        setError('')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los restaurantes.')
      } finally {
        setLoading(false)
      }
    }

    loadRestaurants()
  }, [])

  const cuisines = useMemo(() => {
    const values = new Set<string>()
    restaurants.forEach((row) => {
      const canonicalCuisine = getCanonicalCuisineCode(row.cuisine_type)
      if (canonicalCuisine) values.add(canonicalCuisine)
    })
    return ['all', ...Array.from(values).sort((a, b) => a.localeCompare(b, 'es'))]
  }, [restaurants])

  return { restaurants, cuisines, loading, error }
}

export function isInPriceRange(menuPrice: number | null, range: PriceRange): boolean {
  if (range === 'all') return true
  if (menuPrice === null || Number.isNaN(menuPrice)) return false
  if (range === 'low') return menuPrice < 15
  if (range === 'mid') return menuPrice >= 15 && menuPrice <= 25
  return menuPrice > 25
}
