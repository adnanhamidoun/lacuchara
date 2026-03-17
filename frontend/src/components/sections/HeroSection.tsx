import { Search, ArrowRight, Sparkles } from 'lucide-react'

interface HeroSectionProps {
  search: string
  setSearch: (value: string) => void
  onSearch: () => void
  onShortcutClick: (label: string) => void
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const QUICK_SHORTCUTS = [
  { label: 'Gourmet', emoji: '⭐' },
  { label: 'Negocios', emoji: '💼' },
  { label: 'Terraza', emoji: '🌿' },
  { label: 'Cerca de Azca', emoji: '📍' },
]

const TRUST_INDICATORS = [
  { value: '70+', label: 'Restaurantes Premium' },
  { value: 'Menús', label: 'Digitalizados & Actuales' },
  { value: 'Zona', label: 'Azca & Alrededores' },
]

export default function HeroSection({ search, setSearch, onSearch, onShortcutClick, onKeyPress }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[var(--bg)] to-[var(--surface-soft)]/20 dark:bg-none">
      {/* Premium Background with sophisticated overlay */}
      <div className="absolute inset-0 dark:block hidden">
        {/* Base image with premium opacity (dark mode only) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Dark mode gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        
        {/* Subtle warm glow in top-right corner */}
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#E07B54]/10 blur-3xl" />
        
        {/* Dark mode vignette effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.4)]" />
      </div>

      {/* Light mode background - subtle accent gradient */}
      <div className="absolute inset-0 hidden dark:hidden opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Light mode soft overlay - cream to transparent */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#F5E6D3]/70 via-[#F9F5F0]/60 to-[#FFF8F0]/40" />
        {/* Light vignette - very soft */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(224,123,84,0.08)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12 md:px-8 md:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          {/* Premium Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E07B54]/40 bg-[#E07B54]/10 dark:border-[#E07B54]/40 dark:bg-[#E07B54]/10 px-4 py-2">
            <Sparkles size={16} className="text-[#E07B54]" />
            <span className="text-sm font-semibold tracking-wide text-[#E07B54]">SELECCIÓN GASTRONÓMICA PREMIUM EN AZCA</span>
          </div>

          {/* Main Headline - Theme Aware */}
          <h1 className="mb-6 max-w-4xl text-5xl font-bold leading-[1.2] text-[#1A1A2E] dark:text-white md:text-6xl lg:text-7xl">
            Descubre{' '}
            <span className="bg-gradient-to-r from-[#E07B54] to-[#D88B5A] bg-clip-text text-transparent">
              restaurantes exclusivos
            </span>
            {' '}para cada momento
          </h1>

          {/* Supporting Paragraph - Theme Aware */}
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-[#54646F] dark:text-gray-200 md:text-xl">
            Filtra por tipo de cocina, zona o presupuesto. Compara menús digitalizados, ofertas del día y ambiancias. Decide en segundos.
          </p>

          {/* Premium Search Block */}
          <div className="mb-8 space-y-6">
            {/* Search Bar - Theme Aware */}
            <div className="group">
              <div className="flex flex-col gap-3 rounded-2xl border border-[#D4AF37]/20 bg-white/70 p-1.5 shadow-[0_4px_20px_rgba(224,123,84,0.08)] backdrop-blur-md transition-all duration-300 hover:border-[#D4AF37]/40 hover:bg-white/80 dark:border-white/15 dark:bg-white/10 dark:shadow-2xl dark:hover:border-white/25 dark:hover:bg-white/15 md:flex-row md:p-2">
                <div className="relative flex-1">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B8860B]/60 transition-colors duration-200 dark:text-white/60 group-hover:text-[#B8860B]/80 dark:group-hover:text-white/80" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, cocina o zona..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={onKeyPress}
                    className="w-full rounded-xl bg-transparent py-4 pl-12 pr-4 text-[#1A1A2E] dark:text-white outline-none placeholder:text-[#B8860B]/40 dark:placeholder:text-white/50 transition-colors duration-200"
                  />
                </div>
                <button
                  type="button"
                  onClick={onSearch}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E07B54] to-[#D88B5A] px-8 py-4 font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#E07B54]/30 hover:brightness-110 whitespace-nowrap"
                >
                  Buscar
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            {/* Quick Shortcuts Chips - Theme Aware */}
            <div className="flex flex-wrap gap-2">
              {QUICK_SHORTCUTS.map((shortcut) => (
                <button
                  key={shortcut.label}
                  onClick={() => onShortcutClick(shortcut.label)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-white/60 px-4 py-2 text-sm font-medium text-[#1A1A2E] transition-all duration-200 hover:border-[#D4AF37]/60 hover:bg-[#FFF8DC]/80 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:border-[#E07B54]/60 dark:hover:bg-[#E07B54]/20 backdrop-blur-sm"
                >
                  <span>{shortcut.emoji}</span>
                  {shortcut.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Indicators - Theme Aware */}
          <div className="grid grid-cols-3 gap-4 pt-4 md:gap-6">
            {TRUST_INDICATORS.map((indicator, idx) => (
              <div key={idx} className="flex flex-col items-start gap-1 rounded-lg border border-[#D4AF37]/20 bg-white/50 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <div className="text-xl font-bold text-[#E07B54] md:text-2xl">{indicator.value}</div>
                <div className="text-xs text-[#54646F] dark:text-gray-300 md:text-sm">{indicator.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Smooth Transition Element - Theme Aware */}
      <div className="relative z-10">
        <div className="h-32 bg-gradient-to-b from-[#F5E6D3]/20 via-[#FFF8F0]/10 to-transparent dark:from-black/40 dark:via-black/20 dark:to-transparent" />
      </div>
    </section>
  )
}
