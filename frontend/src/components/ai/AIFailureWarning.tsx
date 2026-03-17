// Componente que explica cuándo y por qué la IA puede fallar

interface AIFailureScenario {
  scenario: string
  probability: 'high' | 'medium' | 'low'
  example: string
  whatToDo: string
}

export interface AIFailureWarningProps {
  scenarios: AIFailureScenario[]
  title?: string
}

export default function AIFailureWarning({
  scenarios,
  title = '⚠️ Cuándo estas predicciones pueden fallar',
}: AIFailureWarningProps) {
  const probabilityColors = {
    high: { bg: '#FF6B6B', text: 'Probable' },
    medium: { bg: '#FFB84D', text: 'Posible' },
    low: { bg: '#4CAF50', text: 'Raro' },
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50 p-6 space-y-4">
      <h3 className="text-lg font-semibold text-[var(--text)] flex items-center gap-2">
        <span>⚠️</span> {title}
      </h3>

      <div className="space-y-3">
        {scenarios.map((scenario, idx) => {
          const probColor = probabilityColors[scenario.probability]

          return (
            <div
              key={idx}
              className="rounded-lg border border-[var(--border)] p-4 space-y-2 bg-[var(--surface)] hover:border-[var(--text-muted)]/30 transition"
            >
              {/* Encabezado */}
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-[var(--text)] flex-1">{scenario.scenario}</p>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium text-white flex-shrink-0"
                  style={{ backgroundColor: probColor.bg }}
                >
                  {probColor.text}
                </span>
              </div>

              {/* Ejemplo */}
              <div className="text-sm text-[var(--text-muted)] pl-4 border-l-2 border-[var(--border)]">
                <p className="font-mono text-xs bg-[var(--surface-soft)] px-2 py-1.5 rounded">
                  Ejemplo: {scenario.example}
                </p>
              </div>

              {/* Qué hacer */}
              <div className="flex gap-2 items-start">
                <span className="text-lg flex-shrink-0">💡</span>
                <p className="text-sm text-[var(--text-muted)]">
                  <strong className="text-[var(--text)]">Qué hacer:</strong> {scenario.whatToDo}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
