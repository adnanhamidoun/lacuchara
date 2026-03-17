// Sección de supervisión y control humano
// Muestra cómo los usuarios pueden controlar y dar feedback sobre predicciones

export interface AISupervisionSectionProps {
  showDetails?: boolean
}

export default function AISupervisionSection({
  showDetails = true,
}: AISupervisionSectionProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">👤</span>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text)] text-lg">
            Control Humano en IA
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Tú siempre tienes el control. La IA sugiere, tú decides.
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="space-y-3 pl-11">
          {[
            {
              icon: '👁️',
              title: 'Transparencia',
              desc: 'Ves exactamente qué datos usa la IA y sus limitaciones',
            },
            {
              icon: '🙋',
              title: 'Tu Voto Importa',
              desc: 'Feedback: "Buena", "Regular", "Mala" - ayuda a mejorar',
            },
            {
              icon: '🚫',
              title: 'Siempre Puedes Rechazar',
              desc: 'Si una predicción no te gusta = ignórala. Tú decides.',
            },
            {
              icon: '🔓',
              title: 'Explicable',
              desc: 'No es "magia". Puedes entender por qué sugirió eso.',
            },
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="font-medium text-sm text-[var(--text)]">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cita inspiradora */}
      <div className="mt-4 p-4 rounded-lg bg-[var(--surface-soft)]/50 border border-[var(--border)] italic text-sm text-[var(--text-muted)]">
        <p>
          "La IA es una herramienta poderosa, pero tu experiencia y criterio son invaluables.
          Úsalas juntas para tomar mejores decisiones."
        </p>
      </div>
    </div>
  )
}
