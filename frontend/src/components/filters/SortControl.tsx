import { ChevronDown, ChevronUp } from 'lucide-react'

interface SortOption {
  value: string
  label: string
}

interface SortControlProps {
  options: SortOption[]
  currentSort: string
  sortOrder: 'asc' | 'desc'
  onSort: (value: string) => void
  onToggleOrder: () => void
}

export function SortControl({ options, currentSort, sortOrder, onSort, onToggleOrder }: SortControlProps) {
  const current = options.find((opt) => opt.value === currentSort)

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#3A3037]/50 bg-[var(--surface-soft)]/60 p-1">
      {/* Sort Options Dropdown */}
      <div className="relative group">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-[var(--text)] transition-colors duration-200 hover:bg-[var(--surface-soft)]"
        >
          {current?.label}
        </button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full hidden group-hover:block z-10 mt-2 w-40 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg p-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSort(option.value)}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                currentSort === option.value
                  ? 'bg-[#E07B54]/10 text-[#E07B54] font-medium'
                  : 'text-[var(--text)] hover:bg-[var(--surface-soft)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[var(--border)]/50" />

      {/* Sort Order Toggle */}
      <button
        type="button"
        onClick={onToggleOrder}
        className="inline-flex items-center justify-center rounded-full w-10 h-10 transition-colors duration-200 hover:bg-[var(--surface-soft)]"
        title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
      >
        {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  )
}
