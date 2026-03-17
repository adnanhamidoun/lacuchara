// Componente de transparencia específico para predicciones de menú

import AITransparencyCard from './AITransparencyCard'

export default function MenuPredictionTransparency() {
  const dataUsed = [
    'Órdenes históricas: platos vendidos en fechas similares',
    'Características del restaurante: tipo de cocina, segmento, valoración',
    'Contexto temporal: día de la semana, estacionalidad (primavera, verano, etc)',
    'Información meteorológica: temperatura y probabilidad de lluvia',
    'Patrones de pedidos: qué platos se piden juntos',
  ]

  const limitations = [
    'No predice cambios en preferencias de clientes por factores no medibles (moda, tendencias virales).',
    'Puede subestimar o sobrestimar platos nuevos sin historial de ventas.',
    'Las recomendaciones mejoran con más datos históricos (mínimo 1 mes de datos).',
    'No considera cambios de receta o costo de ingredientes.',
    'Una pandemia, evento viral o cambio drástico puede invalidar el modelo temporalmente.',
    'Los "alucinaciones" de IA son raras pero posibles: podría recomendar un plato que no está en tu menú.',
  ]

  return (
    <AITransparencyCard
      title="Predicción de Platos (Menú del Día)"
      dataUsed={dataUsed}
      limitations={limitations}
      confidenceLevel="high"
    />
  )
}
