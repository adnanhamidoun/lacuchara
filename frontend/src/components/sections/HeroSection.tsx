import { Search, ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  search: string
  setSearch: (value: string) => void
  onSearch: () => void
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export default function HeroSection({ search, setSearch, onSearch, onKeyPress }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--border)]/30">
      {/* Background gradient y decorativos */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(120deg, rgba(224, 123, 84, 0.1), rgba(216, 139, 90, 0.05)), url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 px-6 py-20 md:px-12 md:py-32">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight text-[var(--text)] md:text-6xl lg:text-7xl">
              Descubre la Excelencia Gastronómica
            </h1>
            <p className="max-w-2xl text-xl text-[var(--text-muted)] md:text-2xl">
              Explora los mejores restaurantes gourmet, tradicionales y exclusivos. Filtra, compara y reserva en minutos.
            </p>
          </div>

          {/* Search Bar */}
          <div className="pt-4">
            <div className="flex flex-col gap-3 rounded-2xl bg-[var(--surface)]/95 p-4 shadow-xl backdrop-blur md:flex-row">
              <div className="relative flex-1">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, cocina o zona..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={onKeyPress}
                  className="w-full rounded-xl border border-[var(--border)] bg-transparent py-4 pl-12 pr-4 text-[var(--text)] outline-none transition-all duration-200 focus:border-[#E07B54] focus:ring-2 focus:ring-[#E07B54]/20 placeholder:text-[var(--text-muted)]"
                />
              </div>
              <button
                type="button"
                onClick={onSearch}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E07B54] px-8 py-4 font-semibold text-white transition-all duration-200 hover:brightness-95 whitespace-nowrap"
              >
                Buscar
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
