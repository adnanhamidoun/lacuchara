import { motion } from 'framer-motion'
import type { RestaurantDetail } from '../../types/domain'

interface MenuItem {
  title: string
  items: string[]
  icon: string
}

interface RestaurantMenuCardProps {
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
  isLoading?: boolean
}

function parseMenuCourse(rawValue: string | null | undefined): string[] {
  if (!rawValue) return []
  return rawValue
    .split(';')
    .map((value) => value.trim())
    .filter(Boolean)
}

/**
 * Premium restaurant menu card component
 * Displays the daily menu like a refined paper menu card
 * with elegant typography and refined styling
 */
export function RestaurantMenuCard({ restaurant, menuData, isLoading }: RestaurantMenuCardProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-[var(--border)]/20 bg-gradient-to-b from-[var(--surface)]/40 to-[var(--surface)]/20 p-8 backdrop-blur-sm"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-[var(--surface-soft)]" />
          <div className="h-4 w-24 rounded bg-[var(--surface-soft)]" />
          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-[var(--surface-soft)]" />
            <div className="h-4 w-full rounded bg-[var(--surface-soft)]" />
          </div>
        </div>
      </motion.div>
    )
  }

  if (!menuData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="overflow-hidden rounded-2xl border border-[var(--border)]/30 bg-gradient-to-br from-[#F5F1E8] to-[#EAE5DB] dark:from-[#2A2520] dark:to-[#1F1B16] p-12 shadow-md"
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="text-4xl">📋</div>
          <h3 className="text-center text-lg font-semibold text-[var(--text)]">
            Este restaurante no ha publicado menú para hoy
          </h3>
          <p className="text-center text-sm text-[var(--text-muted)]">
            Consulta la carta del restaurante en el local o contacta directamente
          </p>
        </div>
      </motion.div>
    )
  }

  const menuSections: MenuItem[] = [
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
      transition={{ duration: 0.6 }}
      className="overflow-hidden rounded-3xl border border-[var(--border)]/40 shadow-xl"
    >
      {/* Paper-like background with subtle texture */}
      <div className="relative">
        {/* Light mode: warm cream/ivory background */}
        <div className="bg-gradient-to-br from-[#FAF7F0] via-[#F5F1E8] to-[#EAE5DB] dark:from-[#2D2823] dark:via-[#24201B] dark:to-[#1F1B16] transition-colors duration-300">
          {/* Subtle paper texture overlay */}
          <div className="absolute inset-0 opacity-30 dark:opacity-10 bg-[radial-gradient(ellipse_at_20%_50%,rgba(0,0,0,.1),transparent_50%)]" />

          <div className="relative z-10 p-8 sm:p-10 md:p-12">
            {/* Header Section */}
            <div className="mb-10 border-b border-[var(--border)]/40 pb-8">
              {/* Menu Label */}
              <div className="mb-6 flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37] via-[#D4AF37]/40 to-transparent" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  Menú del día
                </p>
                <div className="h-px flex-1 bg-gradient-to-l from-[#D4AF37] via-[#D4AF37]/40 to-transparent" />
              </div>

              {/* Date and Info */}
              <div className="mb-4 text-center sm:text-left">
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  {new Date(menuData.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Restaurant Name - Optional subtle reference */}
              <h2 className="text-center text-2xl sm:text-3xl font-serif font-bold text-[var(--text)] italic">
                {restaurant.name}
              </h2>

              {/* Drink Badge */}
              <div className="mt-6 flex justify-center">
                <span className="inline-block rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                  {menuData.includes_drink ? '🍷 Incluye bebida' : '🍽️ Sin bebida'}
                </span>
              </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-8">
              {menuSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: sectionIndex * 0.1 }}
                  className="space-y-4"
                >
                  {/* Section Header */}
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <h3 className="text-lg font-serif font-bold text-[var(--text)] uppercase tracking-wide">
                      {section.title}
                    </h3>
                    {sectionIndex < menuSections.length - 1 && (
                      <div className="ml-auto h-px flex-1 bg-gradient-to-l from-transparent to-[var(--border)]/40" />
                    )}
                  </div>

                  {/* Items List */}
                  <div className="space-y-3 pl-8 sm:pl-10">
                    {section.items.map((item, itemIndex) => (
                      <motion.div
                        key={`${section.title}-${itemIndex}`}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: (sectionIndex * 0.1) + (itemIndex * 0.05) }}
                        className="flex items-start gap-3"
                      >
                        {/* Elegant bullet */}
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#D4AF37]/60 flex-shrink-0" />
                        {/* Item text */}
                        <p className="text-sm leading-relaxed text-[var(--text)]">{item}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Section separator */}
                  {sectionIndex < menuSections.length - 1 && (
                    <div className="pt-2">
                      <div className="h-px bg-gradient-to-r from-[var(--border)]/20 via-[var(--border)]/40 to-[var(--border)]/20" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Price Section */}
            <div className="mt-10 border-t border-[var(--border)]/40 pt-8">
              <div className="text-center">
                <p className="mb-2 text-xs uppercase tracking-widest text-[var(--text-muted)]">
                  Precio del menú del día
                </p>
                <p className="text-4xl font-serif font-bold text-[#D4AF37]">
                  €{finalPrice.toFixed(2)}
                </p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">Por persona</p>
              </div>
            </div>

            {/* Bottom Decoration */}
            <div className="mt-8 flex items-center justify-center gap-2 text-[#D4AF37]/40">
              <span className="text-lg">✦</span>
              <span className="text-lg">✦</span>
              <span className="text-lg">✦</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
