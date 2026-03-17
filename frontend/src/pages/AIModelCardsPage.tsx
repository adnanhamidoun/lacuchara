// Página de Model Cards - Documentación completa de los modelos IA utilizados

import AITransparencyCard from '../components/ai/AITransparencyCard'
import AIDisclaimer from '../components/ai/AIDisclaimer'

export default function AIModelCardsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-12">
        {/* Encabezado */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-[var(--text)]">
            🤖 Estándares de IA Responsable
          </h1>
          <p className="text-lg text-[var(--text-muted)] max-w-2xl">
            En AZCA creemos en la transparencia y la responsabilidad en el uso de inteligencia artificial.
            Esta página documenta cómo nuestros modelos funcionan, qué datos usan y qué limitaciones tienen.
          </p>
        </div>

        {/* Disclaimer principal */}
        <AIDisclaimer
          type="info"
          title="Compromiso con la IA Responsable"
          message="Todos nuestros modelos están diseñados para asistir, no reemplazar, el juicio humano. 
          No usamos datos personales de clientes y respetamos la privacidad. Investigamos constantemente 
          cómo mejorar la equidad y reducir sesgos en nuestras predicciones."
        />

        {/* Modelo 1: Predicción de Servicios */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--text)]">1. Modelo de Predicción de Servicios</h2>
          <p className="text-[var(--text-muted)]">
            Predice cuántos clientes visitarán tu restaurante en una fecha específica.
          </p>
          
          <AITransparencyCard
            title="Predicción de Demanda de Servicios"
            dataUsed={[
              '📊 Historial de ventas: servicios de los últimos 28 días',
              '🏢 Capacidad del restaurante: mesas, límite de capacidad, servicio mínimo',
              '📅 Calendario inteligente: festivos, puentes, ciclos de pago, día de semana',
              '🌤️ Meteorología: temperatura máxima y precipitación (Open-Meteo)',
              '📍 Ubicación: distancia a torres de oficina, zona de influencia',
              '⭐ Reputación: valoración en Google, tipo de cocina, segmento',
            ]}
            limitations={[
              'No usa datos personales. Solo agregativos y anónimos.',
              'Eventos no previstos (cierre de competencia, marketing viral) pueden causar desviaciones.',
              'Requiere al menos 2 semanas de datos históricos para precisión aceptable.',
              'No predice cambios de preferencia a largo plazo.',
              'Las predicciones pierden precisión >30 días en el futuro.',
            ]}
            confidenceLevel="medium"
          />

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50 p-6 text-sm text-[var(--text-muted)]">
            <strong className="text-[var(--text)]">Ejemplo:</strong> si tu restaurante tiene 20 mesas y el 
            martes pasado tuviste 12 servicios, nuestro modelo predice que este martes tendrás ~11 ± 3 servicios, 
            ajustado por clima, festividades y tendencias.
          </div>
        </div>

        {/* Modelo 2: Predicción de Menú */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-[var(--text)]">2. Modelo de Predicción de Platos (Menú)</h2>
          <p className="text-[var(--text-muted)]">
            Recomienda los platos más populares para una fecha específica basándose en datos históricos y contexto.
          </p>
          
          <AITransparencyCard
            title="Predicción de Platos del Menú"
            dataUsed={[
              '📋 Órdenes históricas: qué platos se ordenaron en fechas similares (últimos 90 días)',
              '🍽️ Tipo de cocina: española, italiana, asiática, etc.',
              '👥 Segmento de restaurante: gourmet, familiar, casual, business',
              '📆 Estacionalidad: mes, día de la semana, festividades',
              '🌡️ Meteorología: platos ligeros en verano, pesados en invierno',
              '⭐ Correlaciones: platos que se piden juntos (starter + main)',
            ]}
            limitations={[
              '❌ Evitamos "alucinaciones": pero a veces predice platos que no están en tu menú actual.',
              '📈 Los platos nuevos sin historial tendrán predicciones pobres inicialmente.',
              '🔄 Cambios de receta o nombre no se detectan automáticamente.',
              '🎯 Funciona mejor con al menos 1 mes de historial de órdenes.',
              '⚠️ A veces sobra o falta precisión: no es ciencia exacta.',
              '🚫 No considera cambios de ingredientes, costo o disponibilidad estacional.',
            ]}
            confidenceLevel="high"
          />

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/50 p-6 text-sm text-[var(--text-muted)]">
            <strong className="text-[var(--text)]">Ejemplo:</strong> si tu restaurante es de cocina mediterránea y 
            hace calor (>28°C), el modelo predice que la "Ensalada Griega" tendrá alta demanda (rank #1) con 
            score 0.87, prediciendo ~22 órdenes de 50 servicios esperados.
          </div>
        </div>

        {/* Cómo mejoramos */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <h2 className="text-2xl font-bold text-[var(--text)]">🔬 Cómo Mejoramos Nuestros Modelos</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-[var(--text)] mb-2">📊 Reentrenamiento</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Los modelos se reentrenan cada mes con los últimos datos históricos para mantenerse precisos.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--text)] mb-2">🧪 Pruebas de Sesgo</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Evaluated periodically para asegurar que no discriminan restaurantes pequeños ni aquellos en 
                zonas específicas.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--text)] mb-2">💬 Feedback de Usuarios</h3>
              <p className="text-[var(--text-muted)] text-sm">
                Tu feedback anónimo nos ayuda a mejorar. Si una predicción fue muy incorrecta, nos ayuda registrarlo.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[var(--text)] mb-2">🔐 Privacidad</h3>
              <p className="text-[var(--text-muted)] text-sm">
                No compartimos datos individuales con terceros. Solo métricas agregadas para mejorar el servicio.
              </p>
            </div>
          </div>
        </div>

        {/* Preguntas frecuentes */}
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <h2 className="text-2xl font-bold text-[var(--text)]">❓ Preguntas Frecuentes</h2>
          
          <details className="group rounded-lg border border-[var(--border)] p-4 cursor-pointer">
            <summary className="font-semibold text-[var(--text)] flex justify-between items-center">
              ¿Qué pasa si la predicción es completamente incorrecta?
              <span className="text-[var(--text-muted)]">→</span>
            </summary>
            <p className="text-sm text-[var(--text-muted)] mt-3">
              Es posible, especialmente en eventos no previstos. Por eso siempre debes combinar las predicciones 
              con tu experiencia local. Si ocurre algo extraordinario (cierre de competencia, evento viral), 
              el modelo necesitará tiempo para adaptarse.
            </p>
          </details>

          <details className="group rounded-lg border border-[var(--border)] p-4 cursor-pointer">
            <summary className="font-semibold text-[var(--text)] flex justify-between items-center">
              ¿Usáis datos de mis clientes individuales?
              <span className="text-[var(--text-muted)]">→</span>
            </summary>
            <p className="text-sm text-[var(--text-muted)] mt-3">
              No. Solo usamos números agregados: "cuántos servicios", "qué platos en total". Nunca datos 
              individuales de clientes. Respetamos la privacidad.
            </p>
          </details>

          <details className="group rounded-lg border border-[var(--border)] p-4 cursor-pointer">
            <summary className="font-semibold text-[var(--text)] flex justify-between items-center">
              ¿Qué es una "alucinación" de IA?
              <span className="text-[var(--text-muted)]">→</span>
            </summary>
            <p className="text-sm text-[var(--text-muted)] mt-3">
              A veces el modelo "alucina" y predice un plato que no existe en tu menú actual. Es raro pero 
              posible. Por eso recomendamos siempre validar las sugerencias contra tu menú real.
            </p>
          </details>

          <details className="group rounded-lg border border-[var(--border)] p-4 cursor-pointer">
            <summary className="font-semibold text-[var(--text)] flex justify-between items-center">
              ¿Con qué frecuencia se actualizan los modelos?
              <span className="text-[var(--text-muted)]">→</span>
            </summary>
            <p className="text-sm text-[var(--text-muted)] mt-3">
              Mensualmente reentrenamos los modelos con los últimos datos. Actualizaciones críticas de seguridad 
              o cambios mayores se comunican en el dashboard.
            </p>
          </details>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-[var(--border)]">
          <p className="text-sm text-[var(--text-muted)]">
            💡 Versión: AZCA AI 1.0 | Última actualización: Marzo 2026
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Para preguntas sobre nuestras prácticas de IA responsable, contáctanos.
          </p>
        </div>
      </div>
    </div>
  )
}
