// Componente para mostrar transparencia de IA responsable

export interface AITransparencyProps {
  title: string
  dataUsed: string[]
  limitations: string[]
  confidenceLevel?: 'low' | 'medium' | 'high'
  lastUpdated?: string
}

export default function AITransparencyCard({
  title,
  dataUsed,
  limitations,
  confidenceLevel = 'medium',
  lastUpdated,
}: AITransparencyProps) {
  const confidenceColors = {
    low: 'bg-[#FF6B6B]/10 text-[#FF6B6B] border-[#FF6B6B]/30',
    medium: 'bg-[#FFB84D]/10 text-[#FFB84D] border-[#FFB84D]/30',
    high: 'bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/30',
  }

  const confidenceLabels = {
    low: 'Baja confianza',
    medium: 'Confianza media',
    high: 'Alta confianza',
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="text-3xl">🤖</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">Modelo impulsado por IA - Información de transparencia</p>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className={`inline-block rounded-lg border px-3 py-1.5 text-xs font-semibold mb-6 ${confidenceColors[confidenceLevel]}`}>
        {confidenceLabels[confidenceLevel]}
      </div>

      {/* Data Sources */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <span>📊</span>
          Datos que utiliza este modelo
        </h4>
        <ul className="space-y-2">
          {dataUsed.map((item, idx) => (
            <li key={idx} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
              <span className="text-[#E07B54] mt-1">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Limitations */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <span>⚠️</span>
          Limitaciones y consideraciones
        </h4>
        <ul className="space-y-2">
          {limitations.map((item, idx) => (
            <li key={idx} className="text-sm text-[var(--text-muted)] flex items-start gap-2">
              <span className="text-[#FFB84D] mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Info */}
      <div className="pt-6 border-t border-[var(--border)]">
        <p className="text-xs text-[var(--text-muted)] flex items-center justify-between">
          <span>Esta predicción fue generada por un modelo de aprendizaje automático</span>
          {lastUpdated && <span>Actualizado: {lastUpdated}</span>}
        </p>
      </div>
    </div>
  )
}
