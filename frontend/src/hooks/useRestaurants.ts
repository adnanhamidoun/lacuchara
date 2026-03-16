import { useEffect, useMemo, useState } from 'react'
import type { RestaurantDetail, RestaurantsDetailListResponse, RestaurantsListResponse } from '../types/domain'
import { getCanonicalCuisineCode } from '../utils/cuisine'

export type PriceRange = 'all' | 'low' | 'mid' | 'high'

const byName = (left: RestaurantDetail, right: RestaurantDetail) =>
  left.name.localeCompare(right.name, 'es', { sensitivity: 'base' })

const CACHE_TTL_MS = 2 * 60 * 1000

let cachedRestaurants: RestaurantDetail[] | null = null
let cacheExpiresAt = 0
let inFlightLoad: Promise<RestaurantDetail[]> | null = null

function toFallbackDetail(item: { restaurant_id: number; name: string }): RestaurantDetail {
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
  }
}

async function fetchRestaurantsDetailsBulk(): Promise<RestaurantDetail[]> {
  const response = await fetch('/restaurants/details')

  if (!response.ok) {
    const error = new Error('Bulk details endpoint not available') as Error & { status?: number }
    error.status = response.status
    throw error
  }

  const payload = (await response.json()) as RestaurantsDetailListResponse
  const rows = Array.isArray(payload?.restaurants) ? payload.restaurants : []
  return rows.sort(byName)
}

async function fetchRestaurantsLegacyNPlusOne(): Promise<RestaurantDetail[]> {
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
        return toFallbackDetail(item)
      }
      return (await detailResponse.json()) as RestaurantDetail
    }),
  )

  return detailRows.sort(byName)
}

async function loadRestaurantsData(): Promise<RestaurantDetail[]> {
  const now = Date.now()

  if (cachedRestaurants && now < cacheExpiresAt) {
    return cachedRestaurants
  }

  if (inFlightLoad) {
    return inFlightLoad
  }

  inFlightLoad = (async () => {
    try {
      let rows: RestaurantDetail[]

      try {
        rows = await fetchRestaurantsDetailsBulk()
      } catch (error) {
        const status = (error as Error & { status?: number })?.status
        if (status !== 404 && status !== 405) {
          throw error
        }
        rows = await fetchRestaurantsLegacyNPlusOne()
      }

      cachedRestaurants = rows
      cacheExpiresAt = Date.now() + CACHE_TTL_MS
      return rows
    } finally {
      inFlightLoad = null
    }
  })()

  return inFlightLoad
}

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<RestaurantDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadRestaurants = async () => {
      try {
        setLoading(true)
        const rows = await loadRestaurantsData()

        if (!isMounted) return

        setRestaurants(rows)
        setError('')
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los restaurantes.')
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadRestaurants()

    return () => {
      isMounted = false
    }
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
