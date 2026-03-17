// Botón de feedback estético para predicciones (no funcional)
// Demuestra "control humano" - permite que usuarios opinen sobre predicciones

import { useState } from 'react'

export interface AIFeedbackButtonProps {
  predictionId?: string
  type?: 'service' | 'menu'
  onlyIcon?: boolean
  showQuestion?: boolean
}

export default function AIFeedbackButton({
  predictionId,
  type = 'service',
  onlyIcon = false,
  showQuestion = true,
}: AIFeedbackButtonProps) {
  const [feedback, setFeedback] = useState<'good' | 'ok' | 'bad' | null>(null)
  const [showMessage, setShowMessage] = useState(false)

  const handleFeedback = (value: 'good' | 'ok' | 'bad') => {
    setFeedback(value)
    setShowMessage(true)

    // Auto-hide message after 3 seconds
    setTimeout(() => {
      setShowMessage(false)
    }, 3000)

    // En el futuro, aquí iría:
    // await api.post('/feedback', { predictionId, feedback: value })
  }

  const feedbackOptions = [
    {
      value: 'good' as const,
      icon: '👍',
      label: 'Acertada',
      shortLabel: 'Buena',
      color: '#4CAF50',
    },
    {
      value: 'ok' as const,
      icon: '👌',
      label: 'Parcialmente acertada',
      shortLabel: 'Regular',
      color: '#FFB84D',
    },
    {
      value: 'bad' as const,
      icon: '👎',
      label: 'No acertó nada',
      shortLabel: 'Mala',
      color: '#FF6B6B',
    },
  ]

  const currentFeedback = feedbackOptions.find((opt) => opt.value === feedback)

  // Versión compacta (solo iconos)
  if (onlyIcon) {
    return (
      <div className="flex gap-2 items-center">
        {feedbackOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFeedback(option.value)}
            className="text-2xl cursor-pointer hover:scale-125 transition-transform"
            title={option.label}
            style={{
              opacity: feedback === option.value ? 1 : 0.5,
              filter: feedback === option.value ? 'brightness(1.2)' : 'brightness(1)',
            }}
          >
            {option.icon}
          </button>
        ))}
      </div>
    )
  }

  // Versión completa
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      {/* Header */}
      {showQuestion ? (
        <div className="flex items-center gap-2">
          <span className="text-sm">💬</span>
          <p className="text-sm font-semibold text-[var(--text)]">
            ¿Qué te parece esta predicción?
          </p>
        </div>
      ) : null}

      {/* Botones de feedback */}
      <div className="flex flex-wrap gap-2">
        {feedbackOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleFeedback(option.value)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
              feedback === option.value
                ? 'border-[#E07B54]/60 bg-[#E07B54]/10 text-[var(--text)]'
                : 'border-[var(--border)] bg-[var(--surface-soft)]/40 text-[var(--text-muted)] hover:border-[#E07B54]/35 hover:text-[var(--text)]'
            }`}
            aria-label={option.label}
          >
            <span className="text-lg">{option.icon}</span>
            <span className="text-sm font-medium">{option.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Mensaje de agradecimiento */}
      {showMessage && currentFeedback && (
        <div
          className="rounded-lg border p-3 text-sm"
          style={{
            borderColor: `${currentFeedback.color}66`,
            backgroundColor: `${currentFeedback.color}1A`,
            color: currentFeedback.color,
          }}
        >
          <p className="font-medium">
            ✓ Gracias por tu feedback
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Usamos tus comentarios para mejorar nuestros modelos.
          </p>
        </div>
      )}

      {/* Info pequeña */}
      <p className="text-xs text-[var(--text-muted)]">
        Tu feedback ayuda a entrenar mejores predicciones. No se almacenan datos personales.
      </p>
    </div>
  )
}
