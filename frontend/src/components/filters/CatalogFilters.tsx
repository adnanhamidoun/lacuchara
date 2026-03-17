import type { ReactNode } from 'react'

interface CatalogFiltersProps {
  children: ReactNode
  hasActiveFilters: boolean
}

/**
 * Premium filter panel container
 * Wraps filter groups in a luxury panel with glass effect
 */
export function CatalogFilters({ children, hasActiveFilters }: CatalogFiltersProps) {
  return (
    <div
      className={`
        rounded-2xl border transition-all duration-300
        ${
          hasActiveFilters
            ? 'border-[#D88B5A]/30 bg-[var(--surface)] shadow-lg'
            : 'border-[var(--border)] bg-[var(--surface)]'
        }
        backdrop-blur-sm
      `}
    >
      {children}
    </div>
  )
}
