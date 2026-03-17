import { Zap, TrendingUp, Shield, Users } from 'lucide-react'

export default function ValuePropositionSection() {
  const values = [
    {
      icon: Zap,
      title: 'Rápido & Intuitivo',
      description: 'Encuentra el restaurante perfecto en menos de un minuto con nuestra búsqueda inteligente.',
    },
    {
      icon: TrendingUp,
      title: 'Información Actualizada',
      description: 'Horarios, menús y precios siempre al día, directamente de nuestros socios.',
    },
    {
      icon: Shield,
      title: 'Confiable & Verificado',
      description: 'Todos nuestros restaurantes están verificados y ofrecen experiencias de calidad.',
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Únete a miles de usuarios que descubren y comparten sus mejores experiencias gastronómicas.',
    },
  ]

  return (
    <section className="space-y-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-bold text-[var(--text)] md:text-5xl">
          Pensado para Comer en Azca
        </h2>
        <p className="mt-6 text-lg text-[var(--text-muted)]">
          Una plataforma diseñada específicamente para conectarte con los mejores restaurantes de la zona de negocios y ocio de Madrid. Más que una guía, es tu aliado para decisiones gastronómicas inteligentes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {values.map((value, index) => {
          const Icon = value.icon

          return (
            <div
              key={index}
              className="luxury-panel group flex flex-col gap-4 rounded-2xl border border-[#3A3037]/70 bg-[var(--surface)]/50 p-6 transition-all duration-300 hover:bg-[var(--surface)] hover:border-[#D88B5A]/30 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E07B54]/20 to-[#D88B5A]/10 border border-[#E07B54]/30 transition-all duration-300 group-hover:scale-110">
                <Icon size={24} className="text-[#E07B54]" />
              </div>

              <h3 className="text-lg font-bold text-[var(--text)]">{value.title}</h3>
              <p className="text-[var(--text-muted)] transition-colors duration-300 group-hover:text-[var(--text)]">
                {value.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
