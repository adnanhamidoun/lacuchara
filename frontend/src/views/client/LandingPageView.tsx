import { useState, useMemo, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Building2, Briefcase, Users, Search } from 'lucide-react'
import { useRestaurants } from '../../hooks/useRestaurants'
import type { RestaurantDetail } from '../../types/domain'
import { getCanonicalCuisineCode, getCuisineMeta } from '../../utils/cuisine'
import { FadeUpSection, StaggerContainer, StaggerItem } from '../../components/motion'
import HeroSection from '../../components/sections/HeroSection'
import FeaturedRestaurantsSection from '../../components/sections/FeaturedRestaurantsSection'
import HowItWorksSection from '../../components/sections/HowItWorksSection'
import ValuePropositionSection from '../../components/sections/ValuePropositionSection'
import SectionDivider from '../../components/sections/SectionDivider'

const SEGMENTS = [
  {
    key: 'gourmet',
    label: 'Gourmet',
    description: 'Alta cocina y experiencias exclusivas.',
    icon: Sparkles,
  },
  {
    key: 'traditional',
    label: 'Tradicional',
    description: 'Sabores clásicos y cocina auténtica.',
    icon: Building2,
  },
  {
    key: 'business',
    label: 'Negocios',
    description: 'Espacios elegantes para reuniones.',
    icon: Briefcase,
  },
  {
    key: 'family',
    label: 'Familiar',
    description: 'Ambiente cercano para compartir.',
    icon: Users,
  },
] as const

type SegmentKey = (typeof SEGMENTS)[number]['key']

function normalizeSegment(segment: string | null | undefined): string {
  const normalized = (segment ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (['gourmet'].includes(normalized)) return 'gourmet'
  if (['tradicional', 'traditional'].includes(normalized)) return 'traditional'
  if (['negocios', 'business', 'corporate'].includes(normalized)) return 'business'
  if (['familiar', 'family'].includes(normalized)) return 'family'

  return normalized
}

// Componente para las tarjetas de segmentos destacados
const SegmentCard = memo(function SegmentCard({
  segment,
}: {
  segment: (typeof SEGMENTS)[number]
}) {
  const Icon = segment.icon

  return (
    <Link
      to={`/restaurantes`}
      className="group luxury-panel relative flex flex-col overflow-hidden rounded-2xl border border-[#3A3037]/70 bg-gradient-to-br from-[var(--surface)] to-[var(--surface-soft)] p-6 transition-all duration-300 hover:border-[#D88B5A]/50 hover:shadow-lg hover:-translate-y-1"
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#E07B54]/20 to-[#D88B5A]/20">
        <Icon size={24} className="text-[#E07B54]" />
      </div>

      <h4 className="mb-1 text-lg font-semibold text-[var(--text)]">{segment.label}</h4>
      <p className="text-sm text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--text)]">
        {segment.description}
      </p>

      <div className="mt-auto pt-4">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-[#E07B54] opacity-0 transition-all duration-300 group-hover:opacity-100">
          Explorar
          <ArrowRight size={16} />
        </div>
      </div>
    </Link>
  )
})

// Componente para mostrar estadísticas
const StatsSection = memo(function StatsSection({ totalRestaurants }: { totalRestaurants: number }) {
  const stats = [
    { label: 'Restaurantes', value: totalRestaurants },
    { label: 'Ciudades', value: '1' },
    { label: 'Cocinas', value: '12+' },
    { label: 'Usuarios Activos', value: '1000+' },
  ]

  return (
    <StaggerContainer className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat, index) => (
        <StaggerItem key={index} className="">
          <div className="luxury-panel flex flex-col items-center rounded-2xl border border-[#3A3037]/70 bg-[var(--surface)] p-6 text-center">
            <div className="text-3xl font-bold text-[#E07B54] md:text-4xl">{stat.value}</div>
            <div className="mt-2 text-xs font-medium text-[var(--text-muted)] md:text-sm">{stat.label}</div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  )
})

export default function LandingPageView() {
  const { restaurants } = useRestaurants()
  const [search, setSearch] = useState('')

  // Seleccionar 4 restaurantes destacados aleatoriamente
  const featuredRestaurants = useMemo(() => {
    if (restaurants.length === 0) return []

    const shuffled = [...restaurants].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 4)
  }, [restaurants])

  const handleSearch = () => {
    // El usuario será redirigido a /restaurantes con el término de búsqueda
    // Esto se puede mejorar con URL params más adelante
    window.location.href = `/restaurantes?search=${encodeURIComponent(search)}`
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <HeroSection
        search={search}
        setSearch={setSearch}
        onSearch={handleSearch}
        onKeyPress={handleKeyPress}
      />

      {/* Segmentos Destacados */}
      <section className="space-y-8">
        <FadeUpSection className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-[var(--text)] md:text-5xl">Explora Nuestros Segmentos</h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            Desde alta cocina hasta ambientes familiares, encuentra exactamente lo que buscas.
          </p>
        </FadeUpSection>

        <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SEGMENTS.map((segment) => (
            <StaggerItem key={segment.key} className="">
              <SegmentCard segment={segment} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      <SectionDivider />

      {/* How It Works */}
      <HowItWorksSection />

      <SectionDivider />

      {/* Featured Restaurants Preview */}
      {featuredRestaurants.length > 0 && (
        <FeaturedRestaurantsSection restaurants={featuredRestaurants} />
      )}

      <SectionDivider />

      {/* Value Proposition */}
      <ValuePropositionSection />

      <SectionDivider />

      {/* Stats */}
      <section className="space-y-8">
        <FadeUpSection className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-[var(--text)] md:text-5xl">Por Números</h2>
          <p className="mt-4 text-lg text-[var(--text-muted)]">
            Una plataforma confiable para descubrir los mejores lugares para comer.
          </p>
        </FadeUpSection>

        <StatsSection totalRestaurants={restaurants.length} />
      </section>

      {/* CTA Banner */}
      <FadeUpSection className="rounded-3xl border border-[#D88B5A]/30 bg-gradient-to-r from-[#E07B54]/10 via-[#D88B5A]/5 to-[#E07B54]/10 p-8 md:p-16">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <h2 className="text-4xl font-bold text-[var(--text)] md:text-5xl">
            Explorar Catálogo Completo
          </h2>
          <p className="text-lg text-[var(--text-muted)]">
            Accede a nuestra colección completa de restaurantes, filtros avanzados y recomendaciones personalizadas.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/restaurantes"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E07B54] px-8 py-4 font-semibold text-white transition-all duration-200 hover:brightness-95 shadow-lg hover:shadow-xl"
            >
              Ver Todos los Restaurantes
              <ArrowRight size={20} />
            </Link>

            <button
              type="button"
              onClick={handleSearch}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#E07B54] px-8 py-4 font-semibold text-[#E07B54] transition-all duration-200 hover:bg-[#E07B54]/5"
            >
              <Search size={20} />
              Buscar
            </button>
          </div>
        </div>
      </FadeUpSection>

      {/* Newsletter CTA */}
      <FadeUpSection className="space-y-6 rounded-3xl border border-[#3A3037]/50 bg-[var(--surface)] p-8 md:p-12">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h3 className="text-2xl font-bold text-[var(--text)]">Mantente Actualizado</h3>
          <p className="text-[var(--text-muted)]">
            Recibe notificaciones sobre nuevos restaurantes, ofertas especiales y menús destacados.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Handle newsletter signup
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              placeholder="Tu correo electrónico"
              required
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text)] outline-none transition-all duration-200 focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#E07B54] px-6 py-3 font-semibold text-white transition-all duration-200 hover:brightness-95"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </FadeUpSection>
    </div>
  )
}
