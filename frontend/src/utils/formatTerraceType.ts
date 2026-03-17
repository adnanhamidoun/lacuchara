/**
 * Utility function to convert raw terrace_setup_type values to user-friendly Spanish labels
 * Maps database values to premium, user-facing terrace availability labels
 */

export function formatTerraceType(terraceValue: string | null | undefined): string {
  if (!terraceValue) return 'No disponible'

  const normalized = terraceValue.toLowerCase().trim()

  // Year-round / all seasons / full availability
  if (
    normalized === 'all_year' ||
    normalized.includes('all year') ||
    normalized.includes('todo el año') ||
    normalized.includes('year round') ||
    normalized.includes('full')
  ) {
    return 'Todo el año'
  }

  // Summer only
  if (
    normalized === 'summer_only' ||
    normalized.includes('summer') ||
    normalized.includes('verano')
  ) {
    return 'Solo verano'
  }

  // Winter only
  if (
    normalized === 'winter_only' ||
    normalized.includes('winter') ||
    normalized.includes('invierno')
  ) {
    return 'Solo invierno'
  }

  // No terrace
  if (normalized === 'none' || normalized === 'no') {
    return 'No disponible'
  }

  // Default: unavailable
  return 'No disponible'
}
