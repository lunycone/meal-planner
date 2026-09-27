// ─── Paquetes: lo que compras de verdad ─────────────────────────────────────
// Un ingrediente guarda su paquete como datos: packQty + packUnit + packPrice
// («10 lb por $8.39»). De ahí salen el precio por 100 g / ml / unidad, el
// texto «10 lb · $8.39» y, más adelante, cuánto sobra de cada paquete.
// Los ingredientes de fábrica solo traen el texto `pack`; packOf() lo
// interpreta cuando se puede («908 g (Costco) · $20.00», «4L · $7.50»,
// «30 eggs (Costco) · $11.00»…).

export const WEIGHT_UNITS = { g: 1, kg: 1000, lb: 453.592, oz: 28.3495 }
export const VOLUME_UNITS = { ml: 1, L: 1000 }
export const UNIT_LABEL = { g: 'g', kg: 'kg', lb: 'lb', oz: 'oz', ml: 'ml', L: 'L', unit: 'units' }

/** Dimensión de una unidad: 'g' (peso), 'ml' (volumen) o 'unit'. */
export function dimOf(unit) {
  if (unit in WEIGHT_UNITS) return 'g'
  if (unit in VOLUME_UNITS) return 'ml'
  return 'unit'
}
/** Cantidad del paquete en su unidad base (g, ml o unidades). */
export function toBase(qty, unit) {
  return qty * (WEIGHT_UNITS[unit] ?? VOLUME_UNITS[unit] ?? 1)
}

const num = s => parseFloat(String(s).replace(',', '.'))

/** Lee el texto antiguo del pack. Devuelve { qty, unit, price } o null. */
export function parsePackText(text) {
  if (!text) return null
  const price = /\$\s?(\d+(?:[.,]\d+)?)/.exec(text)
  if (!price) return null
  if (/\/\s*(kg|lb)\b/i.test(text)) return null // precio por kilo en el mostrador, sin paquete fijo
  const m = /(\d+(?:[.,]\d+)?)\s*(kg|g|lb|lbs|oz|ml|l)\b/i.exec(text)
  if (m) {
    const u = m[2].toLowerCase()
    const unit = u === 'lbs' ? 'lb' : u === 'l' ? 'L' : u
    return { qty: num(m[1]), unit, price: num(price[1]) }
  }
  const units = /(\d+)\s*(?:eggs|ud|units|uds|pcs)\b/i.exec(text)
  if (units) return { qty: num(units[1]), unit: 'unit', price: num(price[1]) }
  if (/docena|dozen/i.test(text)) return { qty: 12, unit: 'unit', price: num(price[1]) }
  return null
}

/** Paquete de un ingrediente: { qty, unit, price, amount (base), dim } o null. */
export function packOf(ing) {
  if (!ing) return null
  let p = null
  if (ing.packQty > 0 && ing.packUnit) p = { qty: ing.packQty, unit: ing.packUnit, price: ing.packPrice ?? null }
  else p = parsePackText(ing.pack)
  if (!p || !(p.qty > 0)) return null
  return { ...p, amount: toBase(p.qty, p.unit), dim: dimOf(p.unit) }
}

export function fmtQtyUnit(qty, unit) {
  const q = Math.round(qty * 100) / 100
  return unit === 'unit' ? `${q} ${q === 1 ? 'unit' : 'units'}` : `${q} ${UNIT_LABEL[unit] ?? unit}`
}
export function formatPack({ qty, unit, price }, store) {
  const where = store ? ` (${store})` : ''
  return `${fmtQtyUnit(qty, unit)}${where}${price != null ? ` · $${price.toFixed(2)}` : ''}`
}

// ─── Cuánto aguanta ─────────────────────────────────────────────────────────
// 'week'   → fresco: hay que gastarlo en la semana (verdura de hoja, carne
//            fresca, pescado, fruta blanda…);
// 'weeks'  → aguanta 2–4 semanas en casa (cebolla, patata, zanahoria,
//            ajo, calabaza, lácteos cerrados, huevos…);
// 'months' → despensa o congelador (arroz, legumbre seca, harina, latas,
//            aceite, especias, frutos secos, congelados).
export const KEEPS = ['week', 'weeks', 'months']
export const KEEPS_LABEL = { week: 'About a week', weeks: '2–4 weeks', months: 'Months' }
export const KEEPS_DAYS = { week: 7, weeks: 24, months: 180 }

const LONG_FRESH = /^(patata|cebolla|ajo|zanahoria|squash|beet|col$|manzana|naranja|mandarina|limon|lima|huevo)/
const FROZEN = /frozen|congelad/i

export function keepsOf(key, ing) {
  if (!ing) return 'week'
  if (ing.keeps && KEEPS.includes(ing.keeps)) return ing.keeps
  if (FROZEN.test(`${ing.name} ${ing.pack ?? ''}`)) return 'months'
  if (LONG_FRESH.test(key)) return 'weeks'
  switch (ing.cat) {
    case 'base': case 'legumbre': case 'proteina': return 'months'
    case 'lacteo': return 'weeks'
    case 'carne': return /lata|can\b|ahumado|smoked|bacon|cured|jam[oó]n|ham\b/i.test(`${key} ${ing.name}`) ? 'weeks' : 'week'
    case 'fresco': return /seed|nut|almond|hazel|coco|chia|pumpkin|sunflower|macadamia|avellana|almendra|pipas/i.test(`${key} ${ing.name}`) ? 'months' : 'week'
    default: return 'months'
  }
}
