/**
 * Example: Animated "Cómo Funciona" section with Framer Motion
 * Shows how to use motion wrappers for scroll-based reveals
 */

import { Search, Filter, CheckCircle } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '../../components/motion'

const steps = [
  {
    number: 1,
    icon: Search,
    title: 'Descubre Restaurantes',
    description: 'Explora nuestra colección completa filtrada por segmento, cocina, precio y servicios.',
  },
  {
    number: 2,
    icon: Filter,
    title: 'Filtra & Compara',
    description: 'Personaliza tu búsqueda según tus preferencias: WiFi, horarios, ratings y más.',
  },
  {
    number: 3,
    icon: CheckCircle,
    title: 'Consulta & Decide',
    description: 'Accede al menú completo, precios y detalles para tomar la mejor decisión.',
  },
]

/**
 * Example usage with animations
 * Each card reveals with stagger effect on scroll
 */
export default function AnimatedHowItWorksSection() {
  return (
    <section className="relative w-full py-20">
      {/* Background ambient glow - subtle and controlled */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-6xl opacity-30">
          <div className="absolute inset-0 bg-radial-gradient from-[#E07B54]/10 via-transparent to-transparent rounded-full blur-3xl" />
        </div>
      </div>

      {/* Header with fade-up animation */}
      <div className="mx-auto max-w-5xl px-4 text-center mb-20">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text)] mb-4">
          Cómo Funciona
        </h2>
        <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
          Desde la búsqueda hasta la reserva, todo en pocos pasos.
        </p>
      </div>

      {/* Steps Grid with Stagger Animation */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative">
          {/* Desktop Connector Lines */}
          <div className="absolute top-16 left-0 right-0 h-0.5 hidden md:flex items-center justify-between px-8 lg:px-16 -z-5">
            <div className="absolute top-0 left-[calc(16.666%+2rem)] right-[calc(16.666%-2rem)] h-0.5 bg-gradient-to-r from-[#E07B54]/30 via-[#D88B5A]/20 to-transparent" />
          </div>

          {/* Staggered Cards */}
          <StaggerContainer
            className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
            staggerChildren={0.15}
            delayChildren={0.1}
          >
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <StaggerItem key={index} className="flex flex-col items-center">
                  {/* Step Number Circle - positioned above card */}
                  <div className="relative mb-8 flex justify-center w-full">
                    {/* Glow effect behind circle */}
                    <div className="absolute w-20 h-20 bg-[#E07B54]/20 rounded-full blur-2xl -z-10" />

                    {/* Circle with border glow */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full border border-[#E07B54]/40 blur-sm w-20 h-20 flex items-center justify-center" />
                      <div className="w-20 h-20 rounded-full border-2 border-[#D88B5A] bg-gradient-to-br from-[#4A3E3A] to-[#3A3034] flex items-center justify-center shadow-lg">
                        <span className="text-3xl font-bold text-[#E8A870]">{step.number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content - same height for all */}
                  <div className="w-full h-full rounded-2xl border border-[#D88B5A]/40 bg-gradient-to-br from-[#5A4639] to-[#483A33] p-8 shadow-lg transition-all duration-300 hover:border-[#E07B54]/60 hover:shadow-2xl hover:-translate-y-1 hover:bg-gradient-to-br hover:from-[#6B5346] hover:to-[#534539] group">
                    {/* Icon Container */}
                    <div className="w-14 h-14 rounded-full bg-[#D88B5A]/15 flex items-center justify-center mb-6 group-hover:bg-[#E07B54]/25 transition-colors">
                      <Icon size={28} className="text-[#E8A870] group-hover:text-[#F5A986] transition-colors" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[#D4C4B9] text-base leading-relaxed line-clamp-4">
                      {step.description}
                    </p>
                  </div>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </div>
    </section>
  )
}
