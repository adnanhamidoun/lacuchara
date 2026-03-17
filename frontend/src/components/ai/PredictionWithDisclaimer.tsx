// Wrapper componente para mostrar predicciones con disclaimer de IA responsable

import { ReactNode } from 'react'
import AIDisclaimer from './AIDisclaimer'

export interface PredictionWithDisclaimerProps {
  title: string
  children: ReactNode
  type?: 'service' | 'menu'
  showDisclaimer?: boolean
  confidenceLevel?: 'low' | 'medium' | 'high'
}

export default function PredictionWithDisclaimer({
  title,
  children,
  type = 'service',
  showDisclaimer = true,
  confidenceLevel = 'medium',
}: PredictionWithDisclaimerProps) {
  const confidenceColors = {
    low: { color: '#FF6B6B', label: 'Confianza Baja' },
    medium: { color: '#FFB84D', label: 'Confianza Media' },
    high: { color: '#4CAF50', label: 'Confianza Alta' },
  }

  const typeLabels = {
    service: 'Predicción de Servicios',
    menu: 'Predicción de Platos',
  }

  const confidence = confidenceColors[confidenceLevel]

  const disclaimerMessages = {
    service: 'Las predicciones de servicios dependen de historial reciente. Cambios drásticos en el negocio pueden reducir precisión.',
    menu: 'Las recomendaciones de platos se basan en historial. Los platos nuevos necesitarán más datos para precisión.',
  }

  return (
    <div className="space-y-4">
      {/* Header con confianza */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        <div
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: confidence.color }}
        >
          {confidence.label}
        </div>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <AIDisclaimer
          type="info"
          title={`${typeLabels[type]} - IA Responsable`}
          message={disclaimerMessages[type]}
        />
      )}

      {/* Contenido de la predicción */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        {children}
      </div>

      {/* Pie de página con meta información */}
      <div className="text-xs text-[var(--text-muted)] flex gap-4 text-center">
        <span>🔄 Actualizado: Hace 1 hora</span>
        <span>📊 Datos: 28 días históricos</span>
        <span>🎯 Precisión esperada: {confidenceLevel === 'high' ? '85-95%' : confidenceLevel === 'medium' ? '75-85%' : '60-75%'}</span>
      </div>
    </div>
  )
}
