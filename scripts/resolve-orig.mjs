import { agg } from '../scripts/gen-core.mjs'
import { DISHES } from '../src/data/dishes.js'

// Mapa nombre-original -> clave real del catalogo, resuelto por coincidencia
// exacta o por abreviacion identificada a mano (ver verificacion previa).
const NAME_TO_KEY = {}
for (const [k, d] of Object.entries(DISHES)) NAME_TO_KEY[d.name] = k

const ABBREV = {
  'Burrito maíz + 2 huevos': 'Burrito 100% maíz',
  'Burrito 50/50 (maíz+garbanzo)': 'Burrito 50/50 (maíz + garbanzo)',
  'Torta garbanzo (50g) + huevo': 'Torta de garbanzo (50g) + 1 huevo + AOVE',
  'Torta garbanzo (60g), sin huevo': 'Torta de garbanzo (60g) + AOVE',
  'Overnight oats sin chía': 'Overnight oats de chocolate',
  'Batido blando ajustado': 'Batido blando (día malo de estómago)',
  'Pollo asado + puré + pipas': 'Pollo pierna asada + puré rústico + pipas de girasol',
  'Lomo cerdo + patata + adobo': 'Lomo cerdo + patata asada + adobo pimentón',
  'Lomo cerdo + patata asada + adobo': 'Lomo cerdo + patata asada + adobo pimentón',
  'Solomillo + puré + manzana': 'Solomillo + puré de patata + manzana batida',
  'Turkey + mejillones en cazuela': 'Turkey y mejillones en cazuela',
  'Bacalao + mejillones en cazuela': 'Bacalao y mejillones en cazuela',
  'Cordero + puré + cebolla + laurel': 'Cordero + puré de patata + cebolla + laurel',
  'Turkey + cebolla + mostaza': 'Turkey + cebolla caramelizada + salsa de mostaza',
  'Shakshuka de turkey': 'Shakshuka de pimiento verde y tomate con turkey desmenuzado',
  'Frittata turkey+cheddar': 'Frittata al horno de turkey y cheddar',
  'Fajita bowl turkey': 'Fajita bowl de turkey',
  'Ceviche de bacalao': 'Ceviche de bacalao curado en lima + cebolla morada + aguacate',
  'Mejillones a la marinera + patata': 'Mejillones a la marinera + patata pequeña salteada',
  'Pollo + arroz afgano + cebolla y limón': 'Pollo pierna + arroz afgano + cebolla y limón',
  'Turkey + cebolla + escabeche': 'Turkey + cebolla caramelizada estilo escabeche',
}

export function resolve(origName) {
  const real = ABBREV[origName] || origName
  const key = NAME_TO_KEY[real]
  return key || null
}

export function real(origName) {
  const key = resolve(origName)
  if (!key) return null
  return agg(key)
}
