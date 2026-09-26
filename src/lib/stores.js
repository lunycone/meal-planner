// Tienda de cada ingrediente (Costco, Foodland, No Frills…).
//
// Solo 13 ingredientes traen `store` en data/ingredients.js; otros ~30 lo
// dicen en el nombre o en el pack («(Costco)», «Foodland AC», «Eataly»).
// storeOf() usa el campo si existe y si no lo deduce de ese texto. Una tienda
// elegida a mano va en ingredientOverrides[key].store (guardado compartido);
// la cadena vacía '' significa «sin tienda» a propósito (no se deduce nada).

const KNOWN = [
  ['Costco',      /costco/i],
  ['Foodland',    /foodland/i],
  ['No Frills',   /no ?frills/i],
  ['FreshCo',     /freshco/i],
  ['Food Basics', /food ?basics/i],
  ['Eataly',      /eataly/i],
]

export function storeOf(ing) {
  if (!ing) return null
  if (ing.store !== undefined && ing.store !== null) return ing.store.trim() || null
  const text = `${ing.name ?? ''} ${ing.pack ?? ''} ${ing.brand ?? ''}`
  for (const [name, re] of KNOWN) if (re.test(text)) return name
  return null
}

// Colores fijos para las conocidas; el resto, estable por nombre.
const FIXED = {
  'Costco':      '#D64545',
  'Foodland':    '#2F9E5B',
  'No Frills':   '#C1850C',
  'FreshCo':     '#2585BC',
  'Food Basics': '#7154DA',
  'Eataly':      '#B0344F',
}
const EXTRA = ['#0F7B7B', '#8A5E08', '#5B3FC4', '#1F6E9E', '#A04A12', '#3F7A2E']

export function storeColor(name) {
  if (!name) return '#8A8076'
  if (FIXED[name]) return FIXED[name]
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return EXTRA[h % EXTRA.length]
}

/** Tiendas en uso, de más a menos ingredientes: [{ name, count }]. */
export function storesIn(allIng) {
  const counts = {}
  for (const ing of Object.values(allIng)) {
    const s = storeOf(ing)
    if (s) counts[s] = (counts[s] ?? 0) + 1
  }
  return Object.entries(counts).map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export const NO_STORE = 'No store'
