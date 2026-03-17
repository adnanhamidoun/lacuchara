import type { ReactNode } from 'react'

interface FilterGroupProps {
  title: string
  children: ReactNode
  description?: string
}

export function FilterGroup({ title, children, description }: FilterGroupProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[var(--text)] tracking-wide">{title}</h4>
        {description && <p className="text-xs text-[var(--text-muted)]">{description}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}
