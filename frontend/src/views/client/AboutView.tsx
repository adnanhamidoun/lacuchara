import { Linkedin, ArrowLeft, Sparkles, Target, Users, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FadeUpSection, ScaleInCard, SlideInLeft } from '../../components/motion/MotionWrappers'

const developers = [
  {
    name: 'Mario García',
    linkedinUrl: 'https://www.linkedin.com/in/mario-garcia-romero-453348304',
    profileImage: 'https://storagemenus.blob.core.windows.net/fotosdesarrolladores/mario.jpeg',
  },
  {
    name: 'Adnan Hamidoun',
    linkedinUrl: 'https://www.linkedin.com/in/adnan-hamidoun-el-habti-252079311',
    profileImage: 'https://storagemenus.blob.core.windows.net/fotosdesarrolladores/adnan.jpeg',
  },
  {
    name: 'Lucian Ciusa',
    linkedinUrl: 'https://www.linkedin.com/in/lucian-ciusa-66a7b92b6',
    profileImage: 'https://storagemenus.blob.core.windows.net/fotosdesarrolladores/lucian.jpeg',
  },
]

const features = [
  {
    icon: Sparkles,
    title: 'Experiencia cuidada',
    description: 'Una interfaz elegante, clara y pensada para convertir cada interacción en un momento memorable.',
  },
  {
    icon: Target,
    title: 'Curaduría experta',
    description: 'Una selección rigurosa de restaurantes basada en calidad, propuesta y posicionamiento en el mercado.',
  },
  {
    icon: Zap,
    title: 'Filtros inteligentes',
    description: 'Búsqueda avanzada por tipo de cocina, ocasión, zona o presupuesto para encontrar exactamente lo que buscas.',
  },
  {
    icon: Target,
    title: 'Recomendación asistida por IA',
    description: 'Sugerencias más relevantes según contexto, preferencias históricas y demanda del mercado.',
  },
  {
    icon: Shield,
    title: 'Menús digitales optimizados',
    description: 'Herramientas inteligentes para adaptar la oferta de forma ágil y eficiente según cada servicio.',
  },
]

const values = [
  {
    icon: Sparkles,
    title: 'Excelencia',
    description: 'Cuidamos cada detalle para ofrecer una experiencia de alto nivel en producto, diseño y servicio.',
  },
  {
    icon: Zap,
    title: 'Innovación',
    description: 'Aplicamos tecnología con propósito para resolver problemas reales del sector gastronómico.',
  },
  {
    icon: Shield,
    title: 'Integridad',
    description: 'Trabajamos con transparencia, criterio y responsabilidad en cada decisión que tomamos.',
  },
]

export default function AboutView() {
  const [logoCompleto, setLogoCompleto] = useState<string | null>(null)
  const [logoSinTexto, setLogoSinTexto] = useState<string | null>(null)

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const response = await fetch('/company/logo')
        if (response.ok) {
          const data = await response.json()
          console.log('Logos loaded:', data)
          setLogoCompleto(data.logo_completo)
          setLogoSinTexto(data.logo_sin_texto)
        } else {
          console.error(`Error: Response status ${response.status}`)
        }
      } catch (error) {
        console.error('Error loading logos:', error)
      }
    }

    loadLogos()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--text)]">
      {/* Navigation Button */}
      <div className="sticky top-0 z-40 border-b border-[var(--border)]/30 bg-[var(--surface)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)]/50 bg-[var(--surface-soft)]/50 px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--border)]/80 hover:bg-[var(--surface-soft)] hover:text-[var(--text)]"
          >
            <ArrowLeft size={16} />
            Volver
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        {/* Fondo con gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#E07B54]/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-7xl space-y-8">
          {/* Eyebrow + Título */}
          <FadeUpSection className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E07B54]/30 bg-[#E07B54]/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E07B54]" />
              <span className="text-xs font-semibold tracking-wide text-[#E07B54]">PRESTIGE RESTAURANT MANAGEMENT</span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
              Transformamos la <span className="bg-gradient-to-r from-[#E07B54] to-[#D88B5A] bg-clip-text text-transparent">excelencia gastronómica</span> con tecnología
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-3xl leading-relaxed">
              En AML impulsamos el crecimiento de restaurantes de alto nivel mediante una combinación única de tecnología, estrategia y análisis de datos. Transformamos retos complejos en resultados medibles.
            </p>
          </FadeUpSection>

          {/* CTA Buttons */}
          <FadeUpSection>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/restaurante/alta"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)]/50 bg-[var(--surface-soft)]/30 px-6 py-3 font-semibold text-[var(--text)] transition-all duration-200 hover:bg-[var(--surface-soft)]/60 hover:border-[var(--border)]/80"
              >
                Registrar restaurante
              </Link>
            </div>
          </FadeUpSection>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-20">
        {/* Sobre AML */}
        <section className="space-y-8">
          <FadeUpSection className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Sobre AML</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-[#E07B54] to-[#D88B5A] rounded-full" />
          </FadeUpSection>

          <div className="grid gap-8 md:grid-cols-2 items-center">
            <SlideInLeft className="space-y-6">
              <p className="text-base text-[var(--text-muted)] leading-relaxed">
                Impulsamos la gestión y el crecimiento de restaurantes de alto nivel mediante tecnología, estrategia y análisis de datos.
              </p>

              <p className="text-base text-[var(--text-muted)] leading-relaxed">
                En AML ayudamos a marcas gastronómicas a optimizar su operación, mejorar su propuesta de valor y tomar decisiones más inteligentes. Combinamos experiencia en hostelería, visión de negocio y soluciones digitales para transformar retos complejos en resultados medibles.
              </p>

              <ul className="space-y-3 pt-4">
                {[
                  'Estrategia digital para restaurantes de prestige',
                  'Análisis de datos orientado a decisiones',
                  'Soluciones tecnológicas diseñadas para el sector',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#E07B54]" />
                    <span className="text-sm text-[var(--text-muted)]">{item}</span>
                  </li>
                ))}
              </ul>
            </SlideInLeft>

            <ScaleInCard className="relative h-80 rounded-2xl border border-[var(--border)]/30 overflow-hidden flex items-center justify-center p-0">
              {/* Fondo negro */}
              <div className="absolute inset-0 bg-black" />
              
              {/* Logo */}
              <div className="relative z-10 w-full h-full flex items-center justify-center px-8">
                {logoCompleto ? (
                  <img
                    src={logoCompleto}
                    alt="AML Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <div className="text-5xl font-bold text-[#E07B54]/20">AML</div>
                    <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mt-2">Prestige Restaurant Management</p>
                  </>
                )}
              </div>
            </ScaleInCard>
          </div>
        </section>

        {/* CUISINE AML */}
        <section className="space-y-8">
          <FadeUpSection className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">CUISINE AML</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-[#E07B54] to-[#D88B5A] rounded-full" />
          </FadeUpSection>

          <div className="space-y-4">
            <FadeUpSection>
              <p className="text-lg text-[#E07B54] font-semibold">La plataforma que conecta excelencia gastronómica, inteligencia de negocio y personalización.</p>
            </FadeUpSection>

            <FadeUpSection>
              <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-3xl">
                CUISINE AML es nuestra solución tecnológica para descubrir, analizar y potenciar experiencias gastronómicas de alto nivel. Diseñamos una plataforma pensada tanto para comensales exigentes como para restaurantes que quieren destacar en un mercado cada vez más competitivo.
              </p>
            </FadeUpSection>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pt-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <ScaleInCard
                  key={idx}
                  className="group relative rounded-xl border border-[var(--border)]/30 bg-[var(--surface-soft)]/40 p-6 transition-all duration-200 hover:border-[#E07B54]/50 hover:bg-[var(--surface-soft)]/60 hover:shadow-lg hover:shadow-[#E07B54]/10"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="inline-flex rounded-lg bg-[#E07B54]/10 p-2 group-hover:bg-[#E07B54]/20 transition-colors duration-200">
                        <Icon size={20} className="text-[#E07B54]" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </ScaleInCard>
              )
            })}
          </div>

          {/* Cierre */}
          <FadeUpSection className="rounded-xl border border-[var(--border)]/30 bg-gradient-to-br from-[#E07B54]/10 to-[#D88B5A]/5 p-6 mt-8">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Con CUISINE AML, los restaurantes ganan visibilidad, eficiencia y capacidad de adaptación, mientras los usuarios descubren propuestas memorables de una forma más rápida y personalizada.
            </p>
          </FadeUpSection>
        </section>

        {/* Valores */}
        <section className="space-y-8">
          <FadeUpSection className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Nuestros Valores</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-[#E07B54] to-[#D88B5A] rounded-full" />
          </FadeUpSection>

          <div className="grid gap-6 md:grid-cols-3">
            {values.map((value, idx) => {
              const Icon = value.icon
              return (
                <ScaleInCard key={idx} className="space-y-4">
                  <div className="inline-flex rounded-lg bg-[#E07B54]/10 p-3">
                    <Icon size={24} className="text-[#E07B54]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{value.title}</h3>
                    <p className="text-sm text-[var(--text-muted)] leading-relaxed">{value.description}</p>
                  </div>
                </ScaleInCard>
              )
            })}
          </div>
        </section>

        {/* Equipo */}
        <section className="space-y-8">
          <FadeUpSection className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold">Equipo</h2>
            <div className="w-12 h-1 bg-gradient-to-r from-[#E07B54] to-[#D88B5A] rounded-full" />
          </FadeUpSection>

          <FadeUpSection>
            <p className="text-base text-[var(--text-muted)] leading-relaxed max-w-3xl">
              Detrás de AML hay un equipo multidisciplinar que une producto, tecnología y visión estratégica para construir soluciones útiles, escalables y enfocadas en el sector gastronómico.
            </p>
          </FadeUpSection>

          <div className="grid gap-6 md:grid-cols-3 pt-6">
            {developers.map((dev, idx) => (
              <ScaleInCard 
                key={idx}
                className="rounded-2xl border border-[var(--border)]/30 bg-[var(--surface-soft)]/40 overflow-hidden transition-all duration-200 hover:border-[#E07B54]/50 hover:bg-[var(--surface-soft)]/60 hover:shadow-lg hover:shadow-[#E07B54]/10"
              >
                <a
                  href={dev.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  {/* Profile Image */}
                  <div className="relative w-full aspect-square overflow-hidden bg-[var(--surface-soft)]">
                    <img
                      src={dev.profileImage || 'https://placehold.co/400?text=Perfil'}
                      alt={dev.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Info Section */}
                  <div className="p-6 space-y-3">
                    <h3 className="font-semibold text-base group-hover:text-[#E07B54] transition-colors duration-200">
                      {dev.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] group-hover:text-[#E07B54] transition-colors duration-200">
                      <Linkedin size={14} />
                      <span>Ver en LinkedIn</span>
                    </div>
                  </div>
                </a>
              </ScaleInCard>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="space-y-8 border-t border-[var(--border)]/30 pt-16">
          <FadeUpSection className="space-y-6 text-center max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold">
              ¿Tienes un restaurante y quieres llevarlo al siguiente nivel?
            </h2>
            <p className="text-base text-[var(--text-muted)] leading-relaxed">
              Únete a CUISINE AML y descubre cómo la inteligencia artificial puede ayudarte a mejorar tu visibilidad, optimizar tu oferta y conectar con el cliente adecuado.
            </p>
          </FadeUpSection>

          <FadeUpSection className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              to="/restaurante/alta"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9794D] to-[#E09A63] px-8 py-3 font-semibold text-white shadow-lg shadow-[#E07B54]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#E07B54]/50 hover:brightness-105"
            >
              Registrar restaurante
              <ArrowLeft size={16} className="rotate-180" />
            </Link>
          </FadeUpSection>
        </section>
      </div>

      {/* Footer Spacing */}
      <div className="h-12" />
    </div>
  )
}
