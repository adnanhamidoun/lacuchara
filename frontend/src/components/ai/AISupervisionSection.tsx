// Sección de supervisión y control humano
// Muestra cómo los usuarios pueden controlar y dar feedback sobre predicciones

export interface AISupervisionSectionProps {
  showDetails?: boolean
}

export default function AISupervisionSection({
  showDetails = true,
}: AISupervisionSectionProps) {
  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-[var(--text)]">Control Humano en IA</h3>
        <p className="text-sm text-[var(--text-muted)]">Tú siempre tienes el control. La IA sugiere, tú decides.</p>
      </div>

      {showDetails && (
        <ul className="space-y-2.5 border-t border-[var(--border)]/70 pt-3">
          {[
            {
              title: 'Transparencia',
              desc: 'Ves exactamente qué datos usa la IA y sus limitaciones',
            },
            {
              title: 'Tu Voto Importa',
              desc: 'Feedback: "Buena", "Regular", "Mala" - ayuda a mejorar',
            },
            {
              title: 'Siempre Puedes Rechazar',
              desc: 'Si una predicción no te gusta = ignórala. Tú decides.',
            },
            {
              title: 'Explicable',
              desc: 'No es "magia". Puedes entender por qué sugirió eso.',
            },
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#E07B54]/70" />
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
