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

/**
 * Full restaurant menu card for the detail page
 * Shows complete menu items for each category with premium dark aesthetic
 * Integrated into upper left section of restaurant detail page
 */
export function RestaurantMenuPreviewCard({ restaurant, menuData }: RestaurantMenuPreviewCardProps) {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="h-full overflow-hidden rounded-3xl border border-[#3A3037]/30 bg-[var(--surface)] p-6 shadow-lg"
    >
      <div className="flex h-full flex-col">
        <div className="mb-6 border-b border-[var(--border)]/40 pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold uppercase tracking-wide text-[var(--text)]">
              Menú del día
            </h3>
            <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
              <CalendarDays size={14} className="text-[#E07B54]" />
              {new Date(menuData.date).toLocaleDateString('es-ES', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
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
                        className="flex items-start gap-2"
                      >
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#E07B54]/70" />
                        <p className="text-xs leading-snug text-[var(--text)]">{item}</p>
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
