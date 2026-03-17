import { motion } from 'framer-motion'
import type { RestaurantDetail } from '../../types/domain'

interface MenuCategoryItem {
  title: string
  items: string[]
  icon: string
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
        className="rounded-2xl border border-[var(--border)]/40 bg-[var(--surface-soft)]/40 p-8 backdrop-blur-sm"
      >
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">Menú del día no disponible</p>
        </div>
      </motion.div>
    )
  }

  // Build menu categories - show ALL items, no truncation
  const menuCategories: MenuCategoryItem[] = [
    { title: 'Entrantes', items: parseMenuCourse(menuData.starter), icon: '🥗' },
    { title: 'Principales', items: parseMenuCourse(menuData.main), icon: '🍖' },
    { title: 'Postres', items: parseMenuCourse(menuData.dessert), icon: '🍰' },
  ].filter((section) => section.items.length > 0)

  const finalPrice = menuData.menu_price ?? restaurant.menu_price ?? 20

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
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {new Date(menuData.date).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              
              {/* Subtle accent line */}
              <div className="h-px w-12 bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/0" />
            </div>

            {/* Menu Categories - 3 Column Layout for better space usage */}
            <div className="grid grid-cols-3 gap-8 mb-10">
              {menuCategories.map((category, categoryIndex) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: categoryIndex * 0.1 }}
                  className="space-y-5"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text)] border-b-2 border-[#D4AF37]/40 pb-1">
                      {category.title}
                    </h4>
                  </div>

                  {/* All Dishes - NO TRUNCATION */}
                  <div className="space-y-3 pl-8">
                    {category.items.map((item, itemIndex) => (
                      <motion.div
                        key={`${category.title}-${itemIndex}`}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{
                          duration: 0.3,
                          delay: (categoryIndex * 0.1) + (itemIndex * 0.03),
                        }}
                        className="flex items-start gap-2"
                      >
                        {/* Minimalist bullet marker */}
                        <span className="mt-1 h-1 w-1 rounded-full bg-[#D4AF37]/60 flex-shrink-0" />
                        {/* Dish name */}
                        <p className="text-xs leading-tight text-[var(--text)]">
                          {item}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Price and Details Footer */}
            <div className="pt-8 border-t border-[var(--border)]/40 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Precio del menú
                </p>
                <p className="text-3xl font-bold text-[#D4AF37]">
                  €{finalPrice.toFixed(2)}
                </p>
              </div>
              
              {menuData.includes_drink && (
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-[#D4AF37] font-semibold">
                    ✓ Incluye bebida
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
