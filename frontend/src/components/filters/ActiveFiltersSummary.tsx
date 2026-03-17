import { X } from 'lucide-react'

interface ActiveFiltersTag {
  id: string
  label: string
  onRemove: () => void
}

interface ActiveFiltersSummaryProps {
  activeCount: number
  tags?: ActiveFiltersTag[]
  onClearAll: () => void
  resultCount: number
}

export function ActiveFiltersSummary({
  activeCount,
  tags = [],
  onClearAll,
  resultCount,
}: ActiveFiltersSummaryProps) {
  if (activeCount === 0) {
    return null
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#D88B5A]/20 bg-[#E07B54]/5 p-4">
      {/* Summary Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E07B54] text-xs font-bold text-white">
            {activeCount}
          </span>
          <p className="text-sm font-semibold text-[var(--text)]">
            {activeCount} filtro{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-[#E07B54] hover:text-[#D88B5A] transition-colors"
        >
          Limpiar todo
        </button>
      </div>

      {/* Result Count */}
      <div className="text-xs text-[var(--text-muted)]">
        <span className="font-semibold text-[var(--text)]">{resultCount}</span> restaurante{resultCount !== 1 ? 's' : ''} encontrado{resultCount !== 1 ? 's' : ''}
      </div>

      {/* Tags (optional) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-2 rounded-full bg-[#E07B54]/20 px-3 py-1 text-xs font-medium text-[#E07B54]"
            >
              {tag.label}
              <button
                type="button"
                onClick={tag.onRemove}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
