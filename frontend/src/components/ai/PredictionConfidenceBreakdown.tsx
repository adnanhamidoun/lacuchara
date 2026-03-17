// Componente que muestra visualmente los factores que afectan la confianza de una predicción

export interface ConfidenceFactor {
  name: string
  score: number // 0-100
  description: string
  impact: 'high' | 'medium' | 'low' // Impacto en predicción final
}

export interface PredictionConfidenceBreakdownProps {
  overallConfidence: number // 0-100
  factors: ConfidenceFactor[]
  explanation?: string
}

export default function PredictionConfidenceBreakdown({
  overallConfidence,
  factors,
  explanation,
}: PredictionConfidenceBreakdownProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return '#4CAF50'
    if (score >= 60) return '#FFB84D'
    return '#FF6B6B'
  }

  const getConfidenceLevel = (score: number) => {
    if (score >= 80) return 'Muy Alta'
    if (score >= 60) return 'Media'
    return 'Baja'
  }

  const impactIcons = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }

  const impactLabels = {
    high: 'Impacto Alto',
    medium: 'Impacto Medio',
    low: 'Impacto Bajo',
  }

  return (
    <div className="space-y-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
      {/* Confianza General */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text)]">Nivel de Confianza General</h3>
          <span
            className="text-3xl font-bold"
            style={{ color: getConfidenceColor(overallConfidence) }}
          >
            {overallConfidence}%
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${overallConfidence}%`,
              backgroundColor: getConfidenceColor(overallConfidence),
            }}
          />
        </div>

        <p className="text-sm text-[var(--text-muted)]">
          Confianza {getConfidenceLevel(overallConfidence)} - 
          {overallConfidence >= 80
            ? ' Predicción bien fundamentada'
            : overallConfidence >= 60
              ? ' Predicción aceptable, úsala con criterio'
              : ' Predicción poco confiable, verifica manualmente'}
        </p>
      </div>

      {/* Explicación personalizada */}
      {explanation && (
        <p className="text-sm text-[var(--text-muted)] leading-relaxed italic border-l-2 border-[var(--border)] pl-4">
          💭 {explanation}
        </p>
      )}

      {/* Factores de Confianza */}
      <div className="space-y-3">
        <h4 className="font-semibold text-[var(--text)] text-sm">Factores que afectan la precisión:</h4>

        <div className="space-y-2">
          {factors.map((factor, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-[var(--surface-soft)]/50 border border-[var(--border)]/50">
              {/* Header del factor */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{impactIcons[factor.impact]}</span>
                  <span className="font-medium text-[var(--text)]">{factor.name}</span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded">
                    {impactLabels[factor.impact]}
                  </span>
                </div>
                <span
                  className="font-bold text-sm"
                  style={{ color: getConfidenceColor(factor.score) }}
                >
                  {factor.score}%
                </span>
              </div>

              {/* Barra de factor */}
              <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mb-2">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${factor.score}%`,
                    backgroundColor: getConfidenceColor(factor.score),
                  }}
                />
              </div>

              {/* Descripción */}
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{factor.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer con contexto */}
      <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] space-y-1">
        <p>
          ℹ️ La confianza se calcula considerando: cantidad de datos históricos, consistencia del patrón, 
          variabilidad de factores externos y desempeño histórico.
        </p>
        <p>
          📊 Última actualización: Hace 6 horas | Próxima revisión: En 24 horas
        </p>
      </div>
    </div>
  )
}
