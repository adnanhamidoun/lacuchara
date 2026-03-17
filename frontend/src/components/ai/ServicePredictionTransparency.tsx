// Componente de transparencia específico para predicciones de servicios

import AITransparencyCard from './AITransparencyCard'

export default function ServicePredictionTransparency() {
  const dataUsed = [
    'Historial de ventas: servicios de las últimas 4 semanas',
    'Información del restaurante: capacidad, horarios, segmento, ubicación',
    'Calendario: festivos, puentes, fin de semana, zona de pago',
    'Meteorología: temperatura máxima y precipitación (Open-Meteo API)',
    'Horario: día de la semana, si es día laboral',
  ]

  const limitations = [
    'No utiliza datos personales de clientes. Solo datos agregados y anónimos.',
    'Puede tener menos precisión en eventos no planificados o situaciones excepcionales.',
    'No predice cambios en preferencias debidos a campañas de marketing o cambios de menú.',
    'El modelo se actualiza mensualmente con nuevos datos históricos.',
    'Funciona mejor con al menos 2-3 semanas de historial de datos.',
  ]

  return (
    <AITransparencyCard
      title="Predicción de Servicios Esperados"
      dataUsed={dataUsed}
      limitations={limitations}
      confidenceLevel="medium"
    />
  )
}
