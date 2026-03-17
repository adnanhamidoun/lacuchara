// Badge simple para indicar que un componente usa IA responsable

export interface AIResponsibleBadgeProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'icon' | 'text' | 'full'
  tooltip?: boolean
  onClick?: () => void
}

export default function AIResponsibleBadge({
  size = 'medium',
  variant = 'icon',
  tooltip = true,
  onClick,
}: AIResponsibleBadgeProps) {
  const sizeMap = {
    small: 'w-5 h-5 text-xs',
    medium: 'w-6 h-6 text-sm',
    large: 'w-8 h-8 text-base',
  }

  const variants = {
    icon: {
      render: (
        <span
          className={`${sizeMap[size]} inline-flex items-center justify-center rounded-full bg-[#4CAF50]/20 text-[#4CAF50] font-bold cursor-pointer hover:bg-[#4CAF50]/30 transition`}
          onClick={onClick}
          title={tooltip ? 'Usa IA Responsable - Click para saber más' : undefined}
        >
          🤖
        </span>
      ),
    },
    text: {
      render: (
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-xs font-semibold cursor-pointer hover:bg-[#4CAF50]/20 transition"
          onClick={onClick}
          title={tooltip ? 'Usa IA Responsable - Click para saber más' : undefined}
        >
          <span>🤖</span>
          <span>IA Responsable</span>
        </span>
      ),
    },
    full: {
      render: (
        <div
          className="inline-block p-3 rounded-lg border border-[#4CAF50]/30 bg-[#4CAF50]/5 cursor-pointer hover:bg-[#4CAF50]/10 transition"
          onClick={onClick}
        >
          <p className="text-sm font-semibold text-[#4CAF50] flex items-center gap-2">
            <span className="text-lg">🤖</span>
            IA Responsable
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {tooltip && 'Click para saber cómo funciona esta predicción'}
          </p>
        </div>
      ),
    },
  }

  return variants[variant].render
}
