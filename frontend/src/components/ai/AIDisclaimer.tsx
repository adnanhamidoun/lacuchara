// Componente para disclaimer responsable de IA

export interface AIDisclaimerProps {
  type?: 'warning' | 'info' | 'error'
  title?: string
  message?: string
}

export default function AIDisclaimer({
  type = 'info',
  title = 'Sobre estas predicciones de IA',
  message,
}: AIDisclaimerProps) {
  const typeStyles = {
    warning: {
      bg: 'bg-[#FFB84D]/10',
      border: 'border-[#FFB84D]/30',
      icon: '⚠️',
      textColor: 'text-[#FF9800]',
    },
    info: {
      bg: 'bg-[#2196F3]/10',
      border: 'border-[#2196F3]/30',
      icon: 'ℹ️',
      textColor: 'text-[#2196F3]',
    },
    error: {
      bg: 'bg-[#E53935]/10',
      border: 'border-[#E53935]/30',
      icon: '❌',
      textColor: 'text-[#E53935]',
    },
  }

  const style = typeStyles[type]

  const defaultMessages = {
    warning: 'Las predicciones de IA pueden tener errores. Úsalas como punto de partida, no como base única para decisiones críticas.',
    info: 'Estas predicciones se generan automáticamente usando inteligencia artificial. No son garantías, sino recomendaciones.',
    error: 'Hubo un problema al generar las predicciones. Por favor, intenta de nuevo más tarde.',
  }

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-4 flex gap-3 items-start`}>
      <span className="text-2xl flex-shrink-0">{style.icon}</span>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${style.textColor}`}>{title}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {message || defaultMessages[type]}
        </p>
      </div>
    </div>
  )
}
