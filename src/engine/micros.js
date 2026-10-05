// ─── Vitaminas y minerales de un plato + veredicto por franja ───────────────
// Todo con reglas (sin IA): instantáneo, funciona sin conexión y cada nota se
// puede explicar. Los datos por 100 g están en data/micros.js.
//
// Idea: se mide la DENSIDAD, no el tamaño. Un plato de 1.000 kcal cubre mucho
// del día solo por ser grande; lo que importa es si, para las kcal que aporta,
// trae lo que le toca de cada nutriente. Cada nutriente se compara con la parte
// de las kcal del día que es ese plato (un plato que aporta el 30 % de las
// kcal debería traer al menos el 30 % de lo que necesitas). Cada franja pesa
// distinto los nutrientes que más le tocan. El veredicto es la media ponderada.
//
// Esto es una guía alimentaria con valores aproximados, no consejo médico.

import { MICROS_REF, MICROS_NEGLIGIBLE, MICROS_UNSUPPORTED, FLAT_GRAMS, NUTRIENT_KEYS } from '../data/micros'
import { edibleOf } from './calc'

// Objetivos diarios en adultos de 19-30 años (Health Canada / IOM): RDA, y AI
// donde no hay RDA (potasio, vitamina K, omega-3). `ul` = límite máximo diario.
// La vitamina D no está: ya la tomáis en pastilla.
export const NUTRIENTS = [
  { key: 'fe',  label: 'Iron',         unit: 'mg', dec: 1, dri: { M: 8,    F: 18   }, ul: 45  },
  { key: 'ca',  label: 'Calcium',      unit: 'mg', dec: 0, dri: { M: 1000, F: 1000 } },
  { key: 'mg',  label: 'Magnesium',    unit: 'mg', dec: 0, dri: { M: 400,  F: 310  } },
  { key: 'k',   label: 'Potassium',    unit: 'mg', dec: 0, dri: { M: 3400, F: 2600 } },
  { key: 'zn',  label: 'Zinc',         unit: 'mg', dec: 1, dri: { M: 11,   F: 8    }, ul: 40  },
  { key: 'b12', label: 'Vitamin B12',  unit: 'µg', dec: 1, dri: { M: 2.4,  F: 2.4  } },
  { key: 'fol', label: 'Folate',       unit: 'µg', dec: 0, dri: { M: 400,  F: 400  } },
  { key: 'c',   label: 'Vitamin C',    unit: 'mg', dec: 0, dri: { M: 90,   F: 75   }, ul: 2000 },
  { key: 'a',   label: 'Vitamin A',    unit: 'µg', dec: 0, dri: { M: 900,  F: 700  } },
  { key: 'kv',  label: 'Vitamin K',    unit: 'µg', dec: 0, dri: { M: 120,  F: 90   } },
  { key: 'n3',  label: 'Omega-3',      unit: 'g',  dec: 1, dri: { M: 1.6,  F: 1.1  } },
  { key: 'se',  label: 'Selenium',     unit: 'µg', dec: 0, dri: { M: 55,   F: 55   }, ul: 400 },
]
// «vitamin C», «iron»… para frases (la C y la B12 siguen en mayúscula).
for (const n of NUTRIENTS) n.phrase = n.label.replace(/^Vitamin /, 'vitamin ').replace(/^(?!vitamin)(.)/, c => c.toLowerCase())
export const NUTRIENT = Object.fromEntries(NUTRIENTS.map(n => [n.key, n]))

// Los perfiles no guardan sexo: se deduce del perfil por defecto (María y
// Carla = F, Julio = M) salvo que el perfil traiga `sex: 'F' | 'M'`.
export const sexOf = p => p?.sex ?? ({ maria: 'F', carla: 'F' }[p?.id] ?? 'M')

// Las necesidades (RDA/AI) están pensadas para una dieta de unas 2.000 kcal: es la
// referencia de «densidad» (nutrientes por kcal). Si se usaran las kcal de Julio
// (3.100), cualquier plato parecería denso solo porque él come mucho.
export const REF_KCAL = 2000
// Parte de esa referencia que es un plato, con un suelo del 5 % para que un bocado no salga «denso» por pesar poco.
export const kcalShareOf = kcal => Math.max(0.05, Math.min(1, (kcal || 0) / REF_KCAL))

// Qué nutrientes pesan más en cada franja (por qué, en una línea):
//  · desayuno: B12, folato y calcio (huevo, lácteo, cereal); C ayuda a absorber el hierro.
//  · comida: la comida fuerte — hierro, zinc y magnesio.
//  · merienda: sin exigirle mucho; magnesio, calcio, potasio y C (fruta, frutos secos, yogur).
//  · cena: magnesio, omega-3 y potasio; ligera pero que repare.
export const SLOT_WEIGHTS = {
  desayuno: { b12: 2, fol: 1.5, ca: 1.5, c: 1, fe: 1, mg: 1, k: 0.5, zn: 0.5, a: 0.5, se: 0.5, kv: 0.25, n3: 0.5 },
  comida:   { fe: 2, zn: 1.5, mg: 1.5, b12: 1, fol: 1, k: 1, c: 1, se: 0.5, a: 0.5, ca: 0.75, kv: 0.5, n3: 0.5 },
  merienda: { mg: 1, ca: 1, k: 1, c: 1, fe: 0.5, zn: 0.5, fol: 0.5, b12: 0.5, a: 0.5, se: 0.25, kv: 0.25, n3: 0.5 },
  cena:     { mg: 1.5, n3: 1.5, k: 1, ca: 1, b12: 1, fol: 1, zn: 1, fe: 1, c: 0.75, a: 0.5, se: 0.5, kv: 0.5 },
}

// En qué se fija más cada franja (se enseña en la tarjeta).
export const SLOT_FOCUS = {
  desayuno: 'B12, folate and calcium',
  comida: 'iron, zinc and magnesium',
  merienda: 'magnesium, calcium, potassium and vitamin C',
  cena: 'magnesium, omega-3 and potassium',
}

// Qué comer para subir cada nutriente (lo que hay en una despensa como la vuestra).
const FIX = {
  fe: 'lentils, beans, red meat or mussels',
  ca: 'yogurt, cheese or sardines',
  mg: 'pumpkin seeds, almonds, oats or beans',
  k: 'potato, banana, beans or avocado',
  zn: 'meat, pumpkin seeds or cheese',
  b12: 'eggs, fish, dairy or meat',
  fol: 'lentils, chickpeas or leafy greens',
  c: 'pepper, lemon, broccoli or fruit',
  a: 'carrot, squash or egg',
  kv: 'leafy greens or broccoli',
  n3: 'sardines, salmon, walnuts or chia',
  se: 'fish, eggs or mussels',
}

// ── Emparejar un ingrediente con su fila de referencia ──
const matchCache = new Map()
function refFor(key, ing) {
  const id = `${key}|${ing?.name ?? ''}`
  if (matchCache.has(id)) return matchCache.get(id)
  const text = `${key} ${ing?.name ?? ''}`
  let out = null
  if (ing?.micros) out = { v: ing.micros, kcal: null, est: false, own: true }  // valores propios del ingrediente
  else if (MICROS_UNSUPPORTED.test(text)) out = null
  else if (MICROS_NEGLIGIBLE.test(text)) out = 'negligible'
  else out = MICROS_REF.find(r => r.re.test(text)) ?? null
  matchCache.set(id, out)
  return out
}
export const microsRefFor = refFor

// Gramos COMESTIBLES de una porción (la parte con hueso/concha no cuenta).
function ediblePortionGrams(key, p, ing, ref) {
  if (p.grams != null) return p.grams * edibleOf(ing)
  if (p.ml != null) return p.ml * (/oil|evoo|aove/i.test(`${key} ${ing?.name}`) ? 0.92 : 1)
  if (p.units != null) {
    if (ing?.kcu != null && ref?.kcal) return p.units * ing.kcu / ref.kcal * 100  // las mismas kcal que cuenta la app
    if (ing?.unitGrams) return p.units * ing.unitGrams
    return null
  }
  if (FLAT_GRAMS[key] != null) return FLAT_GRAMS[key]
  return null
}

const ANIMAL = /chicken|turkey|pork|beef|lamb|liver|cod|salmon|sardine|mackerel|mussel|octopus|shrimp|\beggs?\b|ham/i
const RETINOL = /liver|\beggs?\b|butter|cheese|cheddar|feta|ricotta|parmesan|mozzarella|gouda|milk|yogurt|kefir|cream/i

/**
 * Micronutrientes de una lista de ingredientes [{ k, p }] tal como están en el
 * plato (cantidades tal cual). Devuelve
 *   totals   { fe, ca, … }  suma de lo que tiene datos
 *   covered  gramos con datos / gramos que deberían tenerlos (0-1)
 *   missing  nombres de lo que pesa y no tiene datos
 *   est      true si algún valor es estimado
 *   hemeFe   hierro que viene de carne/pescado/huevo (el resto es de origen vegetal)
 *   retinolA vitamina A preformada (hígado, huevo, lácteos): la que tiene límite máximo
 */
export function comboMicros(items, allIng) {
  const totals = Object.fromEntries(NUTRIENT_KEYS.map(k => [k, 0]))
  let have = 0, need = 0, est = false, hemeFe = 0, retinolA = 0
  const missing = [], used = []
  for (const it of items ?? []) {
    const ing = allIng[it.k]
    if (!ing) continue
    const ref = refFor(it.k, ing)
    if (ref === 'negligible') continue
    const p = it.p ?? {}
    // Un toque (ajo, especias… «por uso», sin cantidad) no pesa lo bastante para contar ni para avisar.
    if (p.grams == null && p.ml == null && p.units == null && FLAT_GRAMS[it.k] == null) continue
    const g = ref ? ediblePortionGrams(it.k, p, ing, ref) : null
    // Lo que pesa en el plato (para saber qué parte del plato tiene datos); 30 g si no se sabe.
    const w = g ?? (p.grams != null ? p.grams * edibleOf(ing) : p.ml ?? 30)
    need += w
    if (!ref || g == null) { missing.push(ing.name); continue }
    have += w
    if (ref.est) est = true
    const f = g / 100, text = `${it.k} ${ing.name}`
    const row = {}
    for (const n of NUTRIENT_KEYS) { const v = (ref.v[n] ?? 0) * f; totals[n] += v; row[n] = v }
    if (ANIMAL.test(text)) hemeFe += row.fe
    if (RETINOL.test(text)) retinolA += row.a
    used.push({ k: it.k, name: ing.name, g, est: !!ref.est, ...row })
  }
  return { totals, covered: need > 0 ? have / need : 1, missing: [...new Set(missing)], est, hemeFe, retinolA, used }
}

// Densidad: cuántas veces lo que necesitas (por kcal) trae el plato. 1 = justo lo que le toca.
export const levelOf = ratio => ratio >= 1 ? 'green' : ratio >= 0.5 ? 'yellow' : 'red'

/**
 * Evalúa un plato en una franja para una persona.
 * Devuelve { rows, score, verdict, strengths, gaps, notes, warnings }.
 * verdict: 'strong' | 'okay' | 'weak' | 'nodata'.
 */
// Calibrado con los ~150 platos del catálogo: el plato típico queda en «Okay»; «Strong» es
// de los que de verdad traen más de lo que les toca (legumbres, hígado, huevo + verdura…) y
// «Weak» de los claramente pobres (arroz con pollo y cebolla, salchichas con puré…).
export const VERDICT_CUTS = { strong: 0.80, okay: 0.60 }

export function evaluateDish(micros, person, slot, kcal) {
  const W = SLOT_WEIGHTS[slot] ?? SLOT_WEIGHTS.comida
  const share = kcalShareOf(kcal)
  const sex = sexOf(person)
  const rows = NUTRIENTS.map(n => {
    const amount = micros.totals[n.key]
    const daily = n.dri[sex] ? amount / n.dri[sex] : 0
    const ratio = daily / share
    return { ...n, amount, daily, ratio, level: levelOf(ratio), weight: W[n.key] ?? 0.5 }
  })
  const wsum = rows.reduce((s, r) => s + r.weight, 0)
  const score = rows.reduce((s, r) => s + r.weight * Math.min(1, r.ratio), 0) / wsum
  const enough = micros.covered >= 0.6
  const verdict = !enough ? 'nodata' : score >= VERDICT_CUTS.strong ? 'strong' : score >= VERDICT_CUTS.okay ? 'okay' : 'weak'

  const strengths = rows.filter(r => r.weight >= 1 && r.ratio >= 1.25).sort((a, b) => b.weight * Math.min(3, b.ratio) - a.weight * Math.min(3, a.ratio)).slice(0, 3)
  const gaps = rows.filter(r => r.weight >= 0.75 && r.ratio < 0.5).sort((a, b) => b.weight * (1 - b.ratio) - a.weight * (1 - a.ratio)).slice(0, 2)

  const notes = []
  const T = micros.totals, ironRatio = rows.find(r => r.key === 'fe').ratio
  const plantFe = Math.max(0, T.fe - micros.hemeFe)
  if (T.fe > 0 && plantFe / T.fe >= 0.5 && ironRatio >= 0.5) {
    notes.push(T.c >= 25 ? 'The vitamin C here helps you absorb the plant iron.' : 'Most of the iron is plant-based — a little vitamin C (pepper, lemon) would help you absorb it.')
  }
  const warnings = []
  for (const n of NUTRIENTS) if (n.ul && T[n.key] >= n.ul) warnings.push(`${n.label} is above the daily upper limit (${n.ul} ${n.unit}) in this one dish.`)
  if (micros.retinolA > 3000) warnings.push('Preformed vitamin A (liver, eggs, dairy) is above the daily upper limit in this one dish.')
  return { rows, score, share, verdict, strengths, gaps, notes, warnings, fix: FIX }
}

export const VERDICT_TEXT = { strong: 'Strong', okay: 'Okay', weak: 'Weak', nodata: 'Not enough data' }
export const VERDICT_COLOR = { strong: '#2F9E5B', okay: '#B7791F', weak: '#D64545', nodata: '#8A8378' }
