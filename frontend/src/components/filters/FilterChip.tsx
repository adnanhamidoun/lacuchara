import type { ReactNode } from 'react'

interface FilterChipProps {
  label: string | ReactNode
  isActive: boolean
  onClick: () => void
  icon?: ReactNode
  size?: 'sm' | 'md'
}

export function FilterChip({ label, isActive, onClick, icon, size = 'md' }: FilterChipProps) {
  const sizeClasses = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-200 border
        ${sizeClasses}
        ${
          isActive
            ? 'border-[#D88B5A] bg-gradient-to-r from-[#E07B54] to-[#D88B5A] text-white shadow-[0_0_16px_rgba(224,123,84,0.35)] hover:shadow-[0_0_20px_rgba(224,123,84,0.45)]'
            : 'border-[#3A3037]/50 bg-[var(--surface-soft)]/60 text-[var(--text)] hover:border-[#D88B5A]/30 hover:bg-[var(--surface-soft)]'
        }
      `}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{label}</span>
    </button>
  )
}
