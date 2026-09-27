// ─── Cocinas del mundo ──────────────────────────────────────────────────────
// Para «Countries»: recetas tipo de cada país escritas como plantillas de
// ingredientes (nunca platos del catálogo). Cada hueco admite alternativas ('chicken-thigh*|chicken-leg*')
// y se elige la que haya y salga más barata (por g de proteína en la
// proteína, por coste en el resto), así que los precios de hoy y los
// ingredientes nuevos cuentan. Si falta algo imprescindible, el plato no sale.
// Las plantillas salen como platos compuestos (`custom-gen-…`): al cargar o
// guardar la semana se quedan en Dishes como tuyos.

import { ingCost, ingProt } from './calc'
import { GEN_PREFIX } from './composeDishes'

export const COUNTRIES = [
  { id: 'es', label: 'Spain', flag: '🇪🇸' }, { id: 'fr', label: 'France', flag: '🇫🇷' },
  { id: 'it', label: 'Italy', flag: '🇮🇹' }, { id: 'gr', label: 'Greece', flag: '🇬🇷' },
  { id: 'ch', label: 'Switzerland', flag: '🇨🇭' }, { id: 'us', label: 'USA', flag: '🇺🇸' },
  { id: 'mx', label: 'Mexico', flag: '🇲🇽' }, { id: 'uk', label: 'UK', flag: '🇬🇧' },
  { id: 'me', label: 'Middle East', flag: '🇱🇧' },
]
export const COUNTRY_LABEL = Object.fromEntries(COUNTRIES.map(c => [c.id, `${c.flag} ${c.label}`]))

const CHICKEN = 'chicken-thigh*|chicken-leg*|chicken-drumstick*'
const BREAST = 'chicken-breast*|chicken-thigh-boneless'
const WHITE = `${CHICKEN}|turkey-drumstick`
const TENDER = 'pork-tenderloin*'
const RIBS = 'pork-ribs|pork-side-ribs-costco|pork-back-ribs-costco'
const PEPPER = 'green-pepper|yellow-pepper'
const ZUC = 'zucchini*'
const TOMS = 'canned-tomatoes|peeled-tomatoes|passata'

// [patrón, cantidad, unidad] — unidad 'g' por defecto, 'u' unidades, 'ml';
// sin cantidad = una pizca (especias, precio fijo). `?` al final del patrón:
// opcional (si no está, el plato sale igual).
const R = (country, name, meals, items) => ({ country, name, meals, items })
const B = ['comida', 'cena'], L = ['comida'], D = ['cena']

export const RECIPES = [
  // España
  R('es', 'Chicken chilindrón with rice', B, [[CHICKEN, 160], ['rice', 75], [TOMS, 100], [PEPPER, 100], ['paprika'], ['evoo', 15, 'ml']]),
  R('es', 'Lentil stew with pork ribs and carrot', L, [[RIBS, 120], ['green-lentils', 80], ['carrot', 80], ['bay-leaves'], ['paprika'], ['evoo', 10, 'ml']]),
  R('es', 'Basque-style cod with potatoes and peas', D, [['cod', 160], ['potato', 250], ['frozen-peas', 60], ['white-wine?', 30, 'ml'], ['dried-parsley?'], ['evoo', 15, 'ml']]),
  R('es', 'Spanish potato omelette', D, [['eggs', 3, 'u'], ['potato', 250], ['evoo', 20, 'ml']]),
  R('es', 'Chicken paella with green beans', B, [[CHICKEN, 150], ['rice', 80], ['green-beans', 90], [TOMS, 60], ['paprika'], ['evoo', 15, 'ml']]),
  R('es', 'Galician octopus with potatoes', B, [['octopus', 160], ['potato', 250], ['paprika'], ['evoo', 20, 'ml']]),
  R('es', 'Chickpeas with spinach and egg', B, [['chickpeas', 80], ['frozen-spinach', 130], ['eggs', 2, 'u'], ['cumin'], ['paprika'], ['evoo', 15, 'ml']]),
  // Francia
  R('fr', 'Chicken basquaise with rice', B, [[CHICKEN, 160], ['rice', 75], [PEPPER, 120], [TOMS, 80], ['evoo', 15, 'ml']]),
  R('fr', 'Ratatouille with turkey and rice', B, [['turkey-drumstick', 150], ['rice', 75], [ZUC, 120], [PEPPER, 80], [TOMS, 80], ['evoo', 15, 'ml']]),
  R('fr', 'Moules marinières with roast potatoes', B, [['mussels', 220], ['potato', 250], ['white-wine?', 30, 'ml'], ['dried-parsley?'], ['evoo', 15, 'ml']]),
  R('fr', 'Cod provençale with potatoes', D, [['cod', 160], ['potato', 250], [TOMS, 80], [ZUC, 100], ['evoo', 15, 'ml']]),
  R('fr', 'Hachis parmentier', L, [['ground-beef', 120], ['potato', 250], ['carrot', 60], ['whole-milk', 60], ['butter', 8], ['evoo', 5, 'ml']]),
  R('fr', 'Turkey blanquette with rice and mushrooms', B, [['turkey-drumstick', 150], ['rice', 75], ['carrot', 90], ['mushrooms', 80], ['sour-cream?', 30], ['evoo', 10, 'ml']]),
  R('fr', 'Puy lentils with pork tenderloin', B, [[TENDER, 130], ['green-lentils', 80], ['carrot', 80], ['bay-leaves'], ['evoo', 15, 'ml']]),
  // Italia
  R('it', 'Pasta al ragù', L, [['ground-beef', 120], ['pasta', 90], [TOMS, 120], ['carrot', 50], ['evoo', 10, 'ml']]),
  R('it', 'Pasta with chicken and zucchini', B, [[BREAST, 140], ['pasta', 90], [ZUC, 150], ['evoo', 15, 'ml']]),
  R('it', 'Chicken cacciatore with potatoes', B, [[CHICKEN, 160], ['potato', 250], [TOMS, 100], ['mushrooms', 70], [PEPPER, 60], ['evoo', 15, 'ml']]),
  R('it', 'Pasta with mussels and tomato', B, [['mussels', 200], ['pasta', 90], [TOMS, 80], ['dried-parsley?'], ['evoo', 15, 'ml']]),
  R('it', 'Zucchini and potato frittata', D, [['eggs', 3, 'u'], [ZUC, 130], ['potato', 200], ['evoo', 15, 'ml']]),
  R('it', 'Cod livornese with potatoes', D, [['cod', 160], ['potato', 250], [TOMS, 100], ['evoo', 15, 'ml']]),
  R('it', 'Pesto pasta with chicken and green beans', B, [[BREAST, 130], ['pasta', 90], ['green-beans', 100], ['pesto', 20], ['evoo', 5, 'ml']]),
  // Grecia
  R('gr', 'Chicken souvlaki with rice and salad', B, [[CHICKEN, 160], ['rice', 75], ['tomato', 100], ['cucumber', 80], ['greek-yogurt*|cow-yogurt', 50], ['lemon', 0.5, 'u'], ['evoo', 15, 'ml']]),
  R('gr', 'Greek lemon chicken with potatoes', B, [[CHICKEN, 160], ['potato', 260], ['lemon', 0.5, 'u'], ['evoo', 20, 'ml']]),
  R('gr', 'White beans plaki with cod', B, [['white-beans', 80], ['cod', 130], [TOMS, 100], ['carrot', 60], ['evoo', 15, 'ml']]),
  R('gr', 'Moussaka-style beef, potato and zucchini', L, [['ground-beef', 120], ['potato', 200], [ZUC, 120], [TOMS, 80], ['greek-yogurt*|cow-yogurt', 40], ['evoo', 10, 'ml']]),
  R('gr', 'Octopus with orzo and tomato', B, [['octopus', 160], ['pasta', 85], [TOMS, 100], ['evoo', 15, 'ml']]),
  R('gr', 'Spanakorizo with eggs and feta', D, [['rice', 70], ['frozen-spinach', 150], ['eggs', 2, 'u'], ['feta*', 30], ['lemon', 0.5, 'u'], ['evoo', 15, 'ml']]),
  R('gr', 'Fasolakia with chicken and potatoes', B, [[CHICKEN, 150], ['green-beans', 150], ['potato', 200], [TOMS, 80], ['evoo', 15, 'ml']]),
  // Suiza
  R('ch', 'Rösti with fried eggs', D, [['potato', 300], ['eggs', 3, 'u'], ['butter', 8], ['evoo', 10, 'ml']]),
  R('ch', 'Zurich-style pork with mushrooms and rösti', B, [[TENDER, 150], ['mushrooms', 100], ['sour-cream?', 30], ['white-wine?', 30, 'ml'], ['potato', 250], ['evoo', 10, 'ml']]),
  R('ch', 'Älplermagronen with applesauce', L, [['pasta', 80], ['potato', 150], ['cheddar', 35], ['whole-milk', 60], ['cooked-ham', 50], ['applesauce?', 60], ['evoo', 5, 'ml']]),
  R('ch', 'Swiss chicken with carrots and potatoes', B, [[CHICKEN, 160], ['potato', 250], ['carrot', 120], ['butter', 8], ['dried-parsley?'], ['evoo', 10, 'ml']]),
  R('ch', 'Ticino risotto with chicken and mushrooms', B, [[CHICKEN, 150], ['rice', 80], ['mushrooms', 100], ['cheddar?', 15], ['white-wine?', 30, 'ml'], ['evoo', 15, 'ml']]),
  R('ch', 'Bernese pork tenderloin with rice and green beans', B, [[TENDER, 150], ['rice', 75], ['green-beans', 130], ['butter', 8], ['evoo', 10, 'ml']]),
  R('ch', 'Swiss turkey with spätzle-style pasta and carrots', B, [['turkey-drumstick', 150], ['pasta', 85], ['carrot', 120], ['butter', 8], ['evoo', 10, 'ml']]),
  R('ch', 'Lake-style cod with butter and green beans', D, [['cod', 160], ['potato', 230], ['green-beans', 120], ['butter', 8], ['lemon', 0.5, 'u'], ['evoo', 5, 'ml']]),
  // EE. UU.
  R('us', 'BBQ ribs with potatoes and coleslaw', L, [[RIBS, 150], ['potato', 250], ['cabbage', 100], ['carrot', 50], ['vinegar', 10, 'ml'], ['honey', 10], ['evoo', 10, 'ml']]),
  R('us', 'Chili con carne with rice', L, [['ground-beef', 110], ['kidney-beans|black-beans', 60], ['rice', 60], [TOMS, 100], ['cumin'], ['paprika'], ['evoo', 10, 'ml']]),
  R('us', 'Southern chicken, mash and green beans', B, [[CHICKEN, 160], ['potato', 250], ['whole-milk', 60], ['butter', 8], ['green-beans', 120], ['evoo', 10, 'ml']]),
  R('us', 'Turkey jambalaya', B, [['turkey-drumstick', 150], ['rice', 80], [PEPPER, 80], ['celery?'], [TOMS, 80], ['paprika'], ['evoo', 15, 'ml']]),
  R('us', 'Mac and cheese with chicken and broccoli', B, [[BREAST, 120], ['pasta', 85], ['cheddar', 35], ['whole-milk', 80], ['broccoli', 120], ['evoo', 5, 'ml']]),
  R('us', 'New England cod chowder', D, [['cod', 160], ['potato', 220], ['whole-milk', 120], ['carrot', 60], ['celery?'], ['butter', 8]]),
  // México
  R('mx', 'Chicken tinga with rice', B, [[CHICKEN, 160], ['rice', 75], [TOMS, 120], ['jalapeno?', 0.5, 'u'], ['evoo', 15, 'ml']]),
  R('mx', 'Pork carnitas with black beans', L, [['pork-shoulder-costco|pork-loin*', 140], ['black-beans', 80], ['lime|lemon', 0.5, 'u'], ['cumin'], ['cabbage', 80], ['evoo', 10, 'ml']]),
  R('mx', 'Turkey fajitas with rice and peppers', B, [['turkey-drumstick', 150], ['rice', 75], [PEPPER, 130], ['cumin'], ['paprika'], ['evoo', 15, 'ml']]),
  R('mx', 'Huevos a la mexicana with beans and tortillas', D, [['eggs', 3, 'u'], ['masa-harina', 60], ['tomato', 120], ['black-beans', 50], ['jalapeno?', 0.5, 'u'], ['evoo', 15, 'ml']]),
  R('mx', 'Cod tacos with cabbage and avocado', B, [['cod', 160], ['masa-harina', 70], ['cabbage', 90], ['avocado', 50], ['lime|lemon', 0.5, 'u'], ['evoo', 10, 'ml']]),
  // Reino Unido
  R('uk', "Shepherd's pie", L, [['lamb|ground-beef', 120], ['potato', 250], ['carrot', 60], ['frozen-peas', 50], ['whole-milk', 50], ['butter', 8]]),
  R('uk', 'Fish pie with peas', D, [['cod', 160], ['potato', 250], ['frozen-peas', 70], ['whole-milk', 80], ['butter', 8]]),
  R('uk', 'Chicken and leek pie filling with rice', B, [[CHICKEN, 150], ['rice', 75], ['leek', 90], ['carrot', 60], ['whole-milk', 60], ['evoo', 10, 'ml']]),
  R('uk', 'Sunday roast chicken with carrots and peas', B, [[CHICKEN, 170], ['potato', 250], ['carrot', 90], ['frozen-peas', 60], ['evoo', 15, 'ml']]),
  // Oriente Medio
  R('me', 'Chicken shawarma with rice and salad', B, [[CHICKEN, 160], ['rice', 75], ['tomato', 90], ['cucumber', 80], ['tahini?', 15], ['cumin'], ['paprika'], ['lemon', 0.5, 'u'], ['evoo', 10, 'ml']]),
  R('me', 'Mujadara with eggs', D, [['green-lentils', 70], ['rice', 50], ['eggs', 2, 'u'], ['cumin'], ['evoo', 15, 'ml']]),
  R('me', 'Kofta with rice and tomato salad', L, [['ground-beef|lamb', 130], ['rice', 75], ['tomato', 100], ['cucumber', 80], ['cumin'], ['evoo', 10, 'ml']]),
  R('me', 'Baked cod with tahini and potatoes', D, [['cod', 160], ['potato', 230], ['tahini?', 15], ['lemon', 0.5, 'u'], [ZUC, 100], ['evoo', 10, 'ml']]),
]


const priced = ing => ing && !ing.pend && !ing.hideInTable && (ing.per100 != null || ing.perUnit != null || ing.perML != null || ing.perServing != null || ing.flat != null)

function candidates(pattern, allIng) {
  const out = []
  for (const alt of pattern.split('|')) {
    if (alt.endsWith('*')) {
      const pre = alt.slice(0, -1)
      for (const k of Object.keys(allIng)) if (k.startsWith(pre) && priced(allIng[k])) out.push(k)
    } else if (priced(allIng[alt])) out.push(alt)
  }
  return [...new Set(out)]
}

function portion(amount, unit) {
  if (amount == null) return {}
  if (unit === 'u') return { units: amount }
  if (unit === 'ml') return { ml: amount }
  return { grams: amount }
}

/** Platos de un país (o de todos con country = null) con los ingredientes de hoy. */
export function cuisineDishes(allIng, country = null) {
  const out = {}
  for (const r of RECIPES) {
    if (country && r.country !== country) continue
    const items = []
    let ok = true
    for (const [pat0, amount, unit] of r.items) {
      const optional = pat0.endsWith('?')
      const pat = optional ? pat0.slice(0, -1) : pat0
      const p = portion(amount, unit)
      const cands = candidates(pat, allIng)
      if (!cands.length) { if (optional) continue; ok = false; break }
      // La más barata: por g de proteína si es la proteína del plato, si no por coste.
      const metric = k => { const c = ingCost(k, p, allIng), pr = ingProt(k, p, allIng); return pr > 8 ? c / pr : c }
      const k = cands.length === 1 ? cands[0] : cands.reduce((a, b) => (metric(b) < metric(a) ? b : a))
      items.push({ k, p })
    }
    if (!ok) continue
    const slug = r.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const id = `gen-${r.country}-${slug}`
    out[GEN_PREFIX + id.slice(4)] = { name: r.name, meals: r.meals, items, generated: true, isCustom: true, customId: id, country: r.country }
  }
  return out
}
