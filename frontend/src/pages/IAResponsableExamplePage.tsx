// Página de ejemplo - Cómo integrar IA responsable en predicciones

import AIFailureWarning from '../components/ai/AIFailureWarning'
import PredictionConfidenceBreakdown from '../components/ai/PredictionConfidenceBreakdown'
import AIDisclaimer from '../components/ai/AIDisclaimer'
import ServicePredictionTransparency from '../components/ai/ServicePredictionTransparency'
import MenuPredictionTransparency from '../components/ai/MenuPredictionTransparency'
import PredictionWithDisclaimer from '../components/ai/PredictionWithDisclaimer'
import AIFeedbackButton from '../components/ai/AIFeedbackButton'
import AISupervisionSection from '../components/ai/AISupervisionSection'

export default function IAResponsableExamplePage() {
  // Ejemplo 1: Predicción de servicios
  const serviciosFactores = [
    {
      name: 'Datos Históricos',
      score: 95,
      description: '45 días de historial disponible (excelente cobertura)',
      impact: 'high' as const,
    },
    {
      name: 'Patrón Consistente',
      score: 82,
      description: 'Demanda semanal predecible con varianza normale',
      impact: 'high' as const,
    },
    {
      name: 'Factores Externos',
      score: 65,
      description: 'Clima predecible pero sin información de eventos',
      impact: 'medium' as const,
    },
    {
      name: 'Estabilidad Restaurante',
      score: 90,
      description: 'Sin cambios recientes de ubicación, horarios o menú',
      impact: 'medium' as const,
    },
  ]

  // Escenarios de fallo para servicios
  const serviciosFailures = [
    {
      scenario: 'Evento local no previsto',
      probability: 'high' as const,
      example: 'Se anuncia un concierto gratuito en la plaza cercana → +40% servicios',
      whatToDo: 'Si sabes de eventos próximos, ajusta manualmente tu stock',
    },
    {
      scenario: 'Cambio de marketing',
      probability: 'medium' as const,
      example: 'Promoción viral en TikTok → inesperado aumento de tráfico',
      whatToDo: 'Monitorea redes sociales. Si promoción funciona, notifica al sistema.',
    },
    {
      scenario: 'Cambio de competencia',
      probability: 'medium' as const,
      example: 'Cierra el pub de al lado → clientes migran',
      whatToDo: 'El modelo se adaptará en 2-3 semanas. Mientras, ajusta manualmente.',
    },
    {
      scenario: 'Pandemia o cierre obligatorio',
      probability: 'low' as const,
      example: '2020: COVID lockdown → todos los restaurantes cerrados',
      whatToDo: 'En crisis menor: el modelo se adapta. En crisis mayor: ignora predicciones.',
    },
  ]

  // Ejemplo 2: Predicción de platos
  const platosFactores = [
    {
      name: 'Historial de Órdenes',
      score: 88,
      description: '30 días de datos de órdenes (suficiente para tendencias)',
      impact: 'high' as const,
    },
    {
      name: 'Consistencia Semanal',
      score: 75,
      description: 'Algunos platos tienen demanda variable por día',
      impact: 'high' as const,
    },
    {
      name: 'Factores de Estación',
      score: 60,
      description: 'Básico, sin considerar cambios de ingrediente',
      impact: 'medium' as const,
    },
    {
      name: 'Cambios de Menú',
      score: 30,
      description: '3 platos nuevos en últimas 2 semanas → datos limitados',
      impact: 'high' as const,
    },
  ]

  const platosFailures = [
    {
      scenario: 'Plato nuevo sin historial',
      probability: 'high' as const,
      example: 'Acabas de agregar "Tarta de Zanahoria". Model no tiene datos.',
      whatToDo: 'Primeras 2 semanas: ignora predicción del plato. Después mejora.',
    },
    {
      scenario: '"Alucinación": recomienda plato inexistente',
      probability: 'low' as const,
      example: 'Model recomienda "Paella Negra" que eliminaste hace 6 meses',
      whatToDo: 'Raro pero posible. Siempre valida contra menú actual antes de cocinar.',
    },
    {
      scenario: 'Cambio de precio o tamaño',
      probability: 'medium' as const,
      example: 'Subiste "Ensalada" de 6€ a 9€ → demanda cae (no capturado)',
      whatToDo: 'El modelo no ve cambios de precio. Notifica al sistema si cambio es drástico.',
    },
    {
      scenario: 'Tendencia viral no prevista',
      probability: 'low' as const,
      example: 'TikTok: "Challenge: probar el plato X" → demanda de un plato x10',
      whatToDo: 'Evento viral es impredecible. Confía en instinto + historial.',
    },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[var(--text)]">
            🤖 Ejemplo: IA Responsable en Predicciones
          </h1>
          <p className="text-lg text-[var(--text-muted)]">
            Esta página muestra cómo usar correctamente los componentes de IA responsable 
            en tu dashboard de predicciones real.
          </p>
        </div>

        {/* Sección 1: Predicción de Servicios */}
        <section className="space-y-8 pb-8 border-b border-[var(--border)]">
          <h2 className="text-3xl font-bold text-[var(--text)]">
            📈 Ejemplo 1: Predicción de Servicios
          </h2>

          {/* Disclaimer general */}
          <AIDisclaimer
            type="info"
            title="Sobre esta predicción"
            message="Las predicciones se basan en historial y factores externos. Úsalas como guía, no como verdad absoluta."
          />

          {/* Wrapper con todo */}
          <PredictionWithDisclaimer
            title="Predicción: Servicios para Sábado 25 de Feb"
            type="service"
            confidenceLevel="high"
          >
            {/* Contenido simulado */}
            <div className="space-y-6">
              {/* Predicción principal */}
              <div className="p-6 rounded-lg bg-[var(--surface-soft)]/50 border border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)] mb-2">Servicios estimados:</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[#4CAF50]">18</span>
                  <span className="text-2xl font-semibold text-[var(--text-muted)]">± 3</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">
                  Rango probable: 15-21 servicios
                </p>
              </div>

              {/* Desglose de confianza */}
              <PredictionConfidenceBreakdown
                overallConfidence={87}
                factors={serviciosFactores}
                explanation="Alta confianza porque tienes suficiente historial, patrones consistentes y factores externos predecibles. Sin embargo, eventos no previstos podrían cambiar esto."
              />

              {/* Transparencia */}
              <ServicePredictionTransparency />

              {/* Escenarios de fallo */}
              <AIFailureWarning scenarios={serviciosFailures} />

              {/* Feedback del usuario - CONTROL HUMANO */}
              <AIFeedbackButton type="service" />

              {/* Explicación de supervisión */}
              <AISupervisionSection showDetails={false} />
            </div>
          </PredictionWithDisclaimer>
        </section>

        {/* Sección 2: Predicción de Platos */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-[var(--text)]">
            🍽️ Ejemplo 2: Predicción de Platos
          </h2>

          <AIDisclaimer
            type="warning"
            title="Validar contra menú actual"
            message="Los platos nuevos tendrán predicciones pobres. Siempre valida que el plato existe en tu menú actual."
          />

          <PredictionWithDisclaimer
            title="Recomendaciones de Platos para Sábado 25 de Feb"
            type="menu"
            confidenceLevel="medium"
          >
            <div className="space-y-6">
              {/* Top recomendaciones */}
              <div className="p-6 rounded-lg bg-[var(--surface-soft)]/50 border border-[var(--border)] space-y-3">
                <p className="text-sm font-semibold text-[var(--text)]">Top 5 Platos Predichos:</p>
                <div className="space-y-2 text-sm">
                  {[
                    { nombre: '1. Carne a la Sal', pred: 4, conf: 92 },
                    { nombre: '2. Ensalada Mixta', pred: 3, conf: 87 },
                    { nombre: '3. Gambas al Ajillo', pred: 3, conf: 81 },
                    { nombre: '4. Pulpo a la Gallega', pred: 2, conf: 78 },
                    { nombre: '5. Atún Rojo', pred: 2, conf: 64 },
                  ].map((item) => (
                    <div key={item.nombre} className="flex justify-between items-center">
                      <span className="text-[var(--text)]">{item.nombre}</span>
                      <div className="flex gap-3">
                        <span className="text-[var(--text-muted)]">{item.pred} unid. aprox.</span>
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{
                            backgroundColor:
                              item.conf >= 80
                                ? '#4CAF50'
                                : item.conf >= 60
                                  ? '#FFB84D'
                                  : '#FF6B6B',
                          }}
                        >
                          {item.conf}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose de confianza */}
              <PredictionConfidenceBreakdown
                overallConfidence={74}
                factors={platosFactores}
                explanation="Confianza media porque tienes 3 platos nuevos sin historial suficiente. A medida que se ordenen más, la predicción mejorará. El resto de platos tiene predicción más fiable."
              />

              {/* Transparencia */}
              <MenuPredictionTransparency />

              {/* Escenarios de fallo */}
              <AIFailureWarning scenarios={platosFailures} />

              {/* Feedback del usuario - CONTROL HUMANO */}
              <AIFeedbackButton type="menu" />

              {/* Explicación de supervisión */}
              <AISupervisionSection showDetails={false} />
            </div>
          </PredictionWithDisclaimer>
        </section>

        {/* Resumen de mejores prácticas */}
        <section className="space-y-6 p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <h2 className="text-2xl font-bold text-[var(--text)]">✅ Mejores Prácticas con IA Responsable</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: '✓',
                title: 'HAGO: Combinar IA con criterio humano',
                desc: 'IA sugiere, tú decides. No ignores tu experiencia.',
              },
              {
                icon: '✓',
                title: 'HAGO: Validar predicciones vs realidad',
                desc: 'Si predice "20 servicios" pero llegan 30, ajusta manualmente.',
              },
              {
                icon: '✓',
                title: 'HAGO: Comunicar cambios importantes',
                desc: 'Si haces promoción o cambias menú, avisa al sistema.',
              },
              {
                icon: '✓',
                title: 'HAGO: Revisar confianza',
                desc: 'Confianza baja (< 60%) → aumenta tu margen de error.',
              },
              {
                icon: '✗',
                title: 'NO HAGO: Confiar ciegamente',
                desc: 'Aunque diga 95% confianza, siempre hay riesgo.',
              },
              {
                icon: '✗',
                title: 'NO HAGO: Ignorar "alucinaciones"',
                desc: 'Valida que platos existen en tu menú actual.',
              },
              {
                icon: '✗',
                title: 'NO HAGO: Usar predicciones >30 días futuro',
                desc: 'Precisión cae mucho. Usa solo para planificación general.',
              },
              {
                icon: '✗',
                title: 'NO HAGO: Culpar a IA por resultados',
                desc: 'IA es herramienta, decisión es tuya. Úsala responsablemente.',
              },
            ].map((practice, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  practice.icon === '✓'
                    ? 'border-[#4CAF50]/30 bg-[#4CAF50]/5'
                    : 'border-[#FF6B6B]/30 bg-[#FF6B6B]/5'
                }`}
              >
                <p className="font-semibold text-[var(--text)] flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                    style={{
                      backgroundColor: practice.icon === '✓' ? '#4CAF50' : '#FF6B6B',
                      color: 'white',
                    }}
                  >
                    {practice.icon}
                  </span>
                  {practice.title}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">{practice.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Control Humano - Sección destacada */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-[var(--text)]">👤 Control Humano - El Corazón de la IA Responsable</h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: '👍',
                title: 'Tu Feedback',
                desc: 'Dinos "Buena", "Regular" o "Mala". No es obligatorio, pero ayuda.',
                action: '← Ve arriba ↑',
              },
              {
                icon: '❌',
                title: 'Rechaza Predicciones',
                desc: 'Si no te parece, ignórala. Tú estás en control, no la IA.',
                action: 'Tu decisión',
              },
              {
                icon: '📞',
                title: 'Reporte Problemas',
                desc: 'Si algo parece muy raro, escríbenos. Queremos aprender.',
                action: 'ia-responsable@azca.es',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-2 hover:border-[var(--text-muted)]/50 transition"
              >
                <p className="text-3xl">{item.icon}</p>
                <h4 className="font-semibold text-[var(--text)]">{item.title}</h4>
                <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                <p className="text-xs text-[var(--text-muted)] italic pt-2 border-t border-[var(--border)]">
                  {item.action}
                </p>
              </div>
            ))}
          </div>

          <AISupervisionSection showDetails />
        </section>

        {/* Conclusión */}
        <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50">
          <h3 className="text-xl font-bold text-[var(--text)] mb-3">🎯 Conclusión</h3>
          <p className="text-[var(--text-muted)] leading-relaxed">
            La IA responsable no es "IA perfecta", es "IA honesta". AZCA usa IA para ayudarte a tomar 
            mejores decisiones, pero siempre documentamos qué datos usamos, qué limitaciones tenemos y 
            cuándo puede fallar. Tu experiencia local + nuestras predicciones = mejor resultado. 
            Confiamos en ti para usar esta herramienta responsablemente.
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-4">
            📧 Si detectas sesgos o errores sistemáticos, reporta a 
            <strong> ia-responsable@azca.es</strong>
          </p>
        </div>
      </div>
    </div>
  )
}
