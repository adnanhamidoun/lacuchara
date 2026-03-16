export const CUISINE_META: Record<string, { label: string }> = {
  grill: { label: 'Parrilla y Brasa' },
  spanish: { label: 'Cocina Española' },
  mediterranean: { label: 'Cocina Mediterránea' },
  stew: { label: 'Guisos y Estofados' },
  fried: { label: 'Fritura Andaluza' },
  italian: { label: 'Italiana' },
  asian: { label: 'Asiática' },
  latin: { label: 'Latinoamericana' },
  arabic: { label: 'Turca/Árabe' },
  avantgarde: { label: 'Cocina de Vanguardia y Autor' },
  plantbased: { label: 'Plant-Based' },
  streetfood: { label: 'Street Food' },
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
    return { label: 'Sin especificar' }
  }

  const canonicalCode = getCanonicalCuisineCode(code)

  return CUISINE_META[canonicalCode] ?? { label: code }
}