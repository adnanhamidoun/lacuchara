import type { ReactNode } from 'react'

interface FilterToolbarProps {
  leftContent?: ReactNode
  centerContent?: ReactNode
  rightContent?: ReactNode
  variant?: 'default' | 'highlighted'
}

/**
 * Toolbar for filter panel header
 * Shows: Filtros | Active count | Clear/Sort buttons
 */
export function FilterToolbar({
  leftContent,
  centerContent,
  rightContent,
  variant = 'default',
}: FilterToolbarProps) {
  return (
    <div
      className={`
        flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4
        ${variant === 'highlighted' ? 'border-b border-[var(--border)]/50' : ''}
      `}
    >
      {/* Left: Filter Title */}
      {leftContent && <div className="text-sm font-semibold text-[var(--text)]">{leftContent}</div>}

      {/* Center: Status */}
      {centerContent && (
        <div className="text-xs text-[var(--text-muted)] sm:text-center flex-1">{centerContent}</div>
      )}

      {/* Right: Actions */}
      {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
    </div>
  )
}
