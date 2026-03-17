/**
 * EXAMPLE: Premium Filter Component Usage
 * 
 * This file demonstrates how to use the new filter components
 * together to create a premium catalog filter interface.
 */

import { useState, useMemo } from 'react'
import {
  FilterChip,
  FilterGroup,
  SortControl,
  ActiveFiltersSummary,
  CatalogFilters,
  FilterToolbar,
} from '@/components/filters'

export function PremiumFilterExample() {
  // State
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [priceRange, setPriceRange] = useState<'all' | 'low' | 'mid' | 'high'>('all')
  const [wifiOnly, setWifiOnly] = useState(false)
  const [weekendsOnly, setWeekendsOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (selectedSegment !== 'all') count++
    if (selectedCuisine !== 'all') count++
    if (priceRange !== 'all') count++
    if (wifiOnly) count++
    if (weekendsOnly) count++
    return count
  }, [selectedSegment, selectedCuisine, priceRange, wifiOnly, weekendsOnly])

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedSegment('all')
    setSelectedCuisine('all')
    setPriceRange('all')
    setWifiOnly(false)
    setWeekendsOnly(false)
  }

  // Example data
  const segments = [
    { key: 'gourmet', label: 'Gourmet' },
    { key: 'traditional', label: 'Tradicional' },
    { key: 'business', label: 'Negocios' },
    { key: 'family', label: 'Familiar' },
  ]

  const cuisines = ['Italiana', 'Española', 'Asiática', 'Francesa', 'Vegetariana']

  const resultCount = 21 // Placeholder

  return (
    <div className="space-y-6">
      {/* Active Filters Summary - Only shows when filters are active */}
      {activeFilterCount > 0 && (
        <ActiveFiltersSummary
          activeCount={activeFilterCount}
          onClearAll={handleClearFilters}
          resultCount={resultCount}
          tags={[
            // Optional: Show selected filter tags
            selectedSegment !== 'all' && {
              id: 'segment',
              label: segments.find((s) => s.key === selectedSegment)?.label || '',
              onRemove: () => setSelectedSegment('all'),
            },
            selectedCuisine !== 'all' && {
              id: 'cuisine',
              label: selectedCuisine,
              onRemove: () => setSelectedCuisine('all'),
            },
          ].filter(Boolean) as any}
        />
      )}

      {/* Premium Filter Panel */}
      <CatalogFilters hasActiveFilters={activeFilterCount > 0}>
        {/* Toolbar */}
        <FilterToolbar
          leftContent="Filtros"
          centerContent={
            resultCount > 0 ? `${resultCount} restaurante${resultCount !== 1 ? 's' : ''}` : ''
          }
          rightContent={
            activeFilterCount > 0 ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-[#E07B54] hover:text-[#D88B5A] transition-colors px-3 py-1.5"
              >
                Limpiar filtros
              </button>
            ) : null
          }
        />

        {/* Main Filter Content - 2 Column Grid */}
        <div className="border-t border-[var(--border)]/50 px-4 py-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Segmentos Group */}
              <FilterGroup
                title="Segmentos"
                description="Tipo de experiencia culinaria"
              >
                {segments.map((segment) => (
                  <FilterChip
                    key={segment.key}
                    label={segment.label}
                    isActive={selectedSegment === segment.key}
                    onClick={() =>
                      setSelectedSegment((prev) =>
                        prev === segment.key ? 'all' : segment.key
                      )
                    }
                  />
                ))}
              </FilterGroup>

              {/* Cocina Group */}
              <FilterGroup
                title="Cocina"
                description="Tipo de gastronomía"
              >
                <FilterChip
                  label="Todas"
                  isActive={selectedCuisine === 'all'}
                  onClick={() => setSelectedCuisine('all')}
                />
                {cuisines.map((cuisine) => (
                  <FilterChip
                    key={cuisine}
                    label={cuisine}
                    isActive={selectedCuisine === cuisine}
                    onClick={() => setSelectedCuisine(cuisine)}
                  />
                ))}
              </FilterGroup>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Precio Group */}
              <FilterGroup
                title="Precio"
                description="Rango de precios"
              >
                <FilterChip
                  label="Todos los precios"
                  isActive={priceRange === 'all'}
                  onClick={() => setPriceRange('all')}
                />
                <FilterChip
                  label="Hasta €15"
                  isActive={priceRange === 'low'}
                  onClick={() => setPriceRange('low')}
                />
                <FilterChip
                  label="€15 - €25"
                  isActive={priceRange === 'mid'}
                  onClick={() => setPriceRange('mid')}
                />
                <FilterChip
                  label="Más de €25"
                  isActive={priceRange === 'high'}
                  onClick={() => setPriceRange('high')}
                />
              </FilterGroup>

              {/* Extras Group */}
              <FilterGroup
                title="Extras"
                description="Comodidades y servicios"
              >
                <FilterChip
                  label="WiFi disponible"
                  isActive={wifiOnly}
                  onClick={() => setWifiOnly((prev) => !prev)}
                />
                <FilterChip
                  label="Abierto fin de semana"
                  isActive={weekendsOnly}
                  onClick={() => setWeekendsOnly((prev) => !prev)}
                />
              </FilterGroup>
            </div>
          </div>
        </div>
      </CatalogFilters>

      {/* Sort Control - Below filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-sm text-[var(--text-muted)]">
          Mostrando <span className="font-semibold text-[var(--text)]">{resultCount}</span> restaurantes
        </p>
        <SortControl
          options={[
            { value: 'name', label: 'Nombre' },
            { value: 'rating', label: 'Calificación' },
            { value: 'price', label: 'Precio' },
          ]}
          currentSort={sortBy}
          sortOrder={sortOrder}
          onSort={(value) => {
            if (sortBy === value) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
            } else {
              setSortBy(value as 'name' | 'rating' | 'price')
              setSortOrder('asc')
            }
          }}
          onToggleOrder={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        />
      </div>

      {/* Results Grid (placeholder) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Restaurant cards would go here */}
      </div>
    </div>
  )
}

/**
 * USAGE NOTES:
 * 
 * 1. Import the components:
 *    import { FilterChip, FilterGroup, SortControl, ... } from '@/components/filters'
 * 
 * 2. Manage filter state with useState:
 *    const [selectedSegment, setSelectedSegment] = useState('all')
 * 
 * 3. Track active filter count:
 *    const activeFilterCount = useMemo(() => {
 *      let count = 0
 *      if (selectedSegment !== 'all') count++
 *      return count
 *    }, [selectedSegment])
 * 
 * 4. Show ActiveFiltersSummary only when filters are active:
 *    if (activeFilterCount > 0) show the component
 * 
 * 5. Structure filters in 2-column grid:
 *    Use grid grid-cols-1 gap-8 lg:grid-cols-2
 * 
 * 6. Use FilterGroup to wrap chip groups with title and description
 * 
 * 7. Connect FilterChip click handlers to update state
 * 
 * 8. Show sort control below filters with SortControl component
 * 
 * RESPONSIVE BEHAVIOR:
 * - Desktop (lg+): 2-column grid
 * - Mobile (below lg): 1-column stacked
 * - All spacing is automatic via Tailwind
 * 
 * DARK/LIGHT MODE:
 * - Uses CSS variables (--text, --surface, etc.)
 * - Automatically adapts to theme
 * - No manual theme handling needed
 */
