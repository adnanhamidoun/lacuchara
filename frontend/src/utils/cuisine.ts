export const CUISINE_META: Record<string, { label: string; emoji: string }> = {
  grill: { label: 'Parrilla y Brasa', emoji: '🔥' },
  spanish: { label: 'Cocina Española', emoji: '🇪🇸' },
  mediterranean: { label: 'Cocina Mediterránea', emoji: '🫒' },
  stew: { label: 'Guisos y Estofados', emoji: '🥘' },
  fried: { label: 'Fritura Andaluza', emoji: '🍤' },
  italian: { label: 'Italiana', emoji: '🇮🇹' },
  asian: { label: 'Asiática', emoji: '🍜' },
  latin: { label: 'Latinoamericana', emoji: '🌎' },
  arabic: { label: 'Turca/Árabe', emoji: '🧆' },
  avantgarde: { label: 'Cocina de Vanguardia y Autor', emoji: '🧪' },
  plantbased: { label: 'Plant-Based', emoji: '🌱' },
  streetfood: { label: 'Street Food', emoji: '🚚' },
}

const CUISINE_ALIASES: Record<string, string> = {
  bbq: 'grill',
  barbacoa: 'grill',
  asador: 'grill',
  parrilla: 'grill',
  cocinaespanola: 'spanish',
  española: 'spanish',
  espanol: 'spanish',
  espana: 'spanish',
  spanish: 'spanish',
  mediterranean: 'mediterranean',
  cocinamediterranea: 'mediterranean',
  mediterranea: 'mediterranean',
  mediterránea: 'mediterranean',
  guisos: 'stew',
  estofados: 'stew',
  italian: 'italian',
  italiana: 'italian',
  cocinaitaliana: 'italian',
  asian: 'asian',
  asiatica: 'asian',
  asiática: 'asian',
  japonesa: 'asian',
  latin: 'latin',
  latinoamericana: 'latin',
  arabic: 'arabic',
  arabe: 'arabic',
  árabe: 'arabic',
  avantgarde: 'avantgarde',
  vanguardia: 'avantgarde',
  plantbased: 'plantbased',
  streetfood: 'streetfood',
}

function normalizeCuisineCode(code: string): string {
  return code
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]+/g, '')
}

export function getCanonicalCuisineCode(code: string | null | undefined) {
  if (!code) return null

  const normalizedCode = normalizeCuisineCode(code)
  return CUISINE_ALIASES[normalizedCode] ?? normalizedCode
}

export function getCuisineMeta(code: string | null | undefined) {
  if (!code) {
    return { label: 'Sin especificar', emoji: '🍽️' }
  }

  const canonicalCode = getCanonicalCuisineCode(code)

  return CUISINE_META[canonicalCode] ?? { label: code, emoji: '🍽️' }
}