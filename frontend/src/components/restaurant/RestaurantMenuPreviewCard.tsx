import { useEffect, useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { motion } from 'framer-motion'
import { CalendarDays, CookingPot, Dessert, GlassWater, Salad } from 'lucide-react'
import type { RestaurantDetail } from '../../types/domain'

interface MenuCategoryItem {
  title: string
  items: string[]
  icon: React.ComponentType<any>
}

interface RestaurantMenuPreviewCardProps {
  restaurant: RestaurantDetail
  menuData: {
    menu_id: number
    restaurant_id: number
    date: string
    starter: string | null
    main: string | null
    dessert: string | null
    includes_drink: boolean
    menu_price?: number | null
  } | null
}

function parseMenuCourse(rawValue: string | null | undefined): string[] {
  if (!rawValue) return []
  return rawValue
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
}

function normalizeDishName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

type DishSummaryItem = {
  dish_name: string
  dish_key: string
  avg_rating: number
  votes: number
}

type DishSummaryResponse = {
  restaurant_id: number
  rating_date: string
  items: DishSummaryItem[]
}

function DishStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (next: number) => void
  disabled?: boolean
}) {
  const safeValue = value ? Math.max(1, Math.min(5, value)) : null

  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1
        const active = safeValue !== null && starValue <= safeValue

        return (
          <button
            key={starValue}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            className="rounded p-0.5 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Valorar con ${starValue} estrellas`}
          >
            <Star
              size={14}
              className={active ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#D4AF37]/25'}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * Full restaurant menu card for the detail page
 * Shows complete menu items for each category with premium dark aesthetic
 * Integrated into upper left section of restaurant detail page
 */
export function RestaurantMenuPreviewCard({ restaurant, menuData }: RestaurantMenuPreviewCardProps) {
  const [summaryByKey, setSummaryByKey] = useState<Record<string, DishSummaryItem>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [myRatings, setMyRatings] = useState<Record<string, number>>({})
  const [pendingRatings, setPendingRatings] = useState<Record<string, { dish_name: string; rating: number }>>({})

  const menuDate = useMemo(() => {
    if (!menuData?.date) return null
    return String(menuData.date).slice(0, 10)
  }, [menuData?.date])

  useEffect(() => {
    if (!menuData || !menuDate) return

    const loadSummary = async () => {
      try {
        const response = await fetch(
          `/ratings/dishes/summary?restaurant_id=${restaurant.restaurant_id}&rating_date=${encodeURIComponent(menuDate)}`,
        )
        if (!response.ok) return
        const payload = (await response.json()) as DishSummaryResponse

        const next: Record<string, DishSummaryItem> = {}
        for (const item of payload.items ?? []) {
          next[String(item.dish_key)] = item
        }
        setSummaryByKey(next)
      } catch {
        // ignore
      }
    }

    loadSummary()
  }, [menuData, menuDate, restaurant.restaurant_id])

  // Empty state when no menu available
  if (!menuData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-[#3A3037]/30 bg-[var(--surface)] p-6 shadow-lg"
      >
        <div className="space-y-2 text-center">
          <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--text)]">Menú del día</h3>
          <p className="text-sm text-[var(--text-muted)]">Menú del día no disponible</p>
        </div>
      </motion.div>
    )
  }

  // Build menu categories - show ALL items, no truncation
  const menuCategories: MenuCategoryItem[] = [
    { title: 'Entrantes', items: parseMenuCourse(menuData.starter), icon: Salad },
    { title: 'Principales', items: parseMenuCourse(menuData.main), icon: CookingPot },
    { title: 'Postres', items: parseMenuCourse(menuData.dessert), icon: Dessert },
  ].filter((section) => section.items.length > 0)

  const finalPrice = menuData.menu_price ?? restaurant.menu_price ?? 20

  const pendingCount = Object.keys(pendingRatings).length

  const refreshSummary = async () => {
    if (!menuDate) return
    try {
      const response = await fetch(
        `/ratings/dishes/summary?restaurant_id=${restaurant.restaurant_id}&rating_date=${encodeURIComponent(menuDate)}`,
      )
      if (!response.ok) return
      const payload = (await response.json()) as DishSummaryResponse

      const next: Record<string, DishSummaryItem> = {}
      for (const item of payload.items ?? []) {
        next[String(item.dish_key)] = item
      }
      setSummaryByKey(next)
    } catch {
      // ignore
    }
  }

  const submitPendingRatings = async () => {
    if (!menuDate) return
    if (pendingCount === 0) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const entries = Object.entries(pendingRatings)

      for (const [, payload] of entries) {
        const response = await fetch('/ratings/dishes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            restaurant_id: restaurant.restaurant_id,
            dish_name: payload.dish_name,
            rating: payload.rating,
            rating_date: menuDate,
          }),
        })

        if (!response.ok) {
          throw new Error(`No se pudo enviar la valoración de ${payload.dish_name}`)
        }

      }

      setPendingRatings({})
      await refreshSummary()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudieron enviar las valoraciones.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-[var(--border)]/50 shadow-lg bg-[var(--surface)] overflow-hidden"
    >
      <div className="relative">
        {/* Premium dark background - integrated with page aesthetic */}
        <div className="bg-[var(--surface)] transition-colors duration-300">
          {/* Subtle texture overlay - very minimal */}
          <div className="absolute inset-0 opacity-30 dark:opacity-10 bg-[radial-gradient(ellipse_at_20%_50%,rgba(200,150,100,.05),transparent_50%)]" />

          <div className="relative z-10 p-8">
            {/* Header Section */}
            <div className="mb-10 pb-8 border-b border-[var(--border)]/40">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--text)]">
                  Menú del día
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || pendingCount === 0}
                    onClick={submitPendingRatings}
                    className="rounded-lg bg-gradient-to-r from-[#E07B54] to-[#D88B5A] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Enviar valoraciones{pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </button>

                  <span className="text-xs text-[var(--text-muted)] font-medium">
                    {new Date(menuData.date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {submitError ? (
                <p className="mt-2 text-xs font-medium text-[#E53935]">{submitError}</p>
              ) : null}
              
              {/* Subtle accent line */}
              <div className="h-px w-12 bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/0" />
            </div>

        <div className="flex flex-1 items-center py-2">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-3">
            {menuCategories.map((category, categoryIndex) => {
              const CategoryIcon = category.icon
              return (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: categoryIndex * 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <CategoryIcon size={16} className="text-[#E07B54]" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)]">
                      {category.title}
                    </h4>
                  </div>

                  <div className="space-y-2 pl-1">
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={`${category.title}-${itemIndex}`}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: categoryIndex * 0.1 + itemIndex * 0.03,
                        }}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="mt-1 h-1 w-1 rounded-full bg-[#D4AF37]/60 flex-shrink-0" />
                          <p className="min-w-0 text-xs leading-tight text-[var(--text)]">
                            {item}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          {(() => {
                            const dishKey = normalizeDishName(item)
                            const summary = summaryByKey[dishKey]
                            const myValue = myRatings[dishKey] ?? null
                            const disabled = isSubmitting

                            const onRate = (nextValue: number) => {
                              setSubmitError(null)
                              setMyRatings((prev) => ({ ...prev, [dishKey]: nextValue }))
                              setPendingRatings((prev) => ({
                                ...prev,
                                [dishKey]: {
                                  dish_name: item,
                                  rating: nextValue,
                                },
                              }))
                            }

                            return (
                              <div className="flex items-center gap-2">
                                <DishStars value={myValue} onChange={onRate} disabled={disabled} />
                                <span className="text-[11px] text-[var(--text-muted)]">
                                  {summary && summary.votes > 0 ? `${summary.avg_rating.toFixed(1)} (${summary.votes})` : '—'}
                                </span>
                              </div>
                            )
                          })()}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)]/40 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Precio del menú
            </p>
            <p className="text-3xl font-bold text-[#E07B54]">€{finalPrice.toFixed(2)}</p>
          </div>

          {menuData.includes_drink && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E07B54]/30 bg-[#E07B54]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#E07B54]">
              <GlassWater size={14} />
              Incluye bebida
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
