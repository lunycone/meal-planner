// ─── Generador por ingredientes ─────────────────────────────────────────────
// En vez de elegir entre los platos del catálogo, compone platos nuevos con lo
// que hay en Ingredientes: una proteína + una base (la que se escala por
// persona) + una o dos verduras + AOVE. Todo sale de las ETIQUETAS
// (lib/tags.js), así que un ingrediente nuevo bien etiquetado entra solo.
//
// Las raciones se aprenden del catálogo (la mediana de lo que usa cada
// ingrediente en comidas y cenas); si no aparece en ningún plato, un valor
// por tipo. Luego la semana inteligente elige la mejor pareja comida+cena con
// las mismas reglas de siempre (carne roja nunca en la cena, base distinta,
// legumbre/cebolla/fibra insoluble una vez al día, fibra, verdura, kcal…) y
// los paquetes y la despensa cuentan igual.
//
// Los platos generados llevan la clave `custom-gen-…`: al cargar o guardar
// una semana se guardan como platos tuyos (customCombos, id `gen-…`) y a
// partir de ahí son platos normales, editables en Dishes.

import { ingCost, ingKcal, ingProt } from './calc'
import { tagsOf, starchFamily } from '../lib/tags'
import { rotationHeld, rotationPaused } from '../lib/rotation'
import { conceptOf, setFit } from './pairing'

export const GEN_PREFIX = 'custom-gen-'

// Ingredientes que no son el centro de un plato de batch.
const NOT_MAIN = /bacon|cold-cuts|cooked-ham|ham-hock|smoked-salmon|liver|suet|half-can|quarter-can|whole-chicken|pepperoni|striploin/i
const NOT_BASE = /flour|flake|oats|masa|sugar|bun|bagel|nacho|bread|loaf|corn|ravioli|lasagna|brioche|gnocchi/i
const NOT_BATCH_VEG = /parsley|jalape|lettuce|arugula|radish|cucumber|black-pepper|celery/i
// Variantes del mismo producto en otra tienda: una sola, la más barata.
const kindOf = key => key.replace(/-(costco|foodland|farmboy|beretta|organic|generic|a1|ref|boneless)\b/g, '')

export function median(xs) { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null }

// Ración típica de cada ingrediente en comidas y cenas del catálogo.
export function learnPortions(allCombos) {
  const seen = {}
  for (const c of Object.values(allCombos)) {
    // Tus platos propios cuentan (son las raciones reales); los generados y los de cita, no.
    if (!(c.meals ?? []).some(m => m === 'comida' || m === 'cena') || c.generated || c.date || /^gen-/.test(c.customId ?? '')) continue
    for (const it of c.items ?? []) {
      const p = it.p ?? {}
      const slot = (seen[it.k] ??= { grams: [], units: [], ml: [] })
      if (p.grams != null) slot.grams.push(p.grams)
      else if (p.units != null) slot.units.push(p.units)
      else if (p.ml != null) slot.ml.push(p.ml)
    }
  }
  return seen
}

function portionFor(key, role, ing, learned) {
  const l = learned[key]
  const clampG = (g, lo, hi) => Math.max(lo, Math.min(hi, Math.round(g / 5) * 5))
  if (l?.grams.length >= 2) {
    const g = median(l.grams)
    if (role === 'veg') return { grams: clampG(g, 80, 180) }
    if (role === 'protein') return { grams: clampG(g, 100, 220) }
    return { grams: g }
  }
  if (l?.units.length >= 1) return { units: median(l.units) }
  if (role === 'protein') return ing.kcu != null && ing.kc == null ? { units: 2 } : { grams: 150 }
  if (role === 'egg') return { units: 3 }
  if (role === 'legume') return { grams: 80 }
  if (role === 'base') return { grams: /potato|squash/i.test(key) ? 300 : 80 }
  return { grams: 130 }
}

const priced = (key, ing) => ing && !ing.pend && !ing.hideInTable &&
  (ing.per100 != null || ing.perUnit != null || ing.perML != null) &&
  (ing.kc != null || ing.kcu != null)

const SHORT = { 'butternut-squash': 'Butternut squash', 'canned-tomatoes': 'Canned tomatoes', carrot: 'Carrots' }
export function vegName(key, ing) {
  if (SHORT[key]) return SHORT[key]
  let n = prettyName(ing).split(',')[0]
  if (n.includes(' / ')) n = n.split(' / ').pop()
  n = n.replace(/\b(organic|frozen|fresh|A1)\b/gi, '').replace(/\s+/g, ' ').trim()
  return n.charAt(0).toUpperCase() + n.slice(1)
}
export function prettyName(ing) {
  const n = (ing.name ?? '').replace(/\s*\(.*?\)\s*/g, ' ').replace(/\s·\s/g, ' ').replace(/\s+/g, ' ').trim()
  const m = /^(\w+), (\w+)$/.exec(n) // «Squash, butternut» → «Butternut squash»
  return m ? `${m[2].charAt(0).toUpperCase()}${m[2].slice(1)} ${m[1].toLowerCase()}` : n
}
// Nombre corto para el plato: sin «, marca» ni la segunda opción tras « / ».
export const shortName = ing => prettyName(ing).split(',')[0].split(' / ')[0].trim()
export const lower = s => s.charAt(0).toLowerCase() + s.slice(1)
const sentence = s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
function joinVeg(names) { return names.length === 2 ? `${names[0]} & ${names[1]}` : names[0] }

/**
 * Ingredientes candidatos por papel: { proteins, eggs, bases, legumes, veg }.
 * Cada uno { key, ing, p (ración), kind, cost, prot, kcal }.
 */
const metricOf = x => (x.role === 'protein' || x.role === 'egg' ? x.cost / Math.max(1, x.prot) : x.cost / Math.max(1, x.kcal))

export function ingredientPools(allIng, allCombos, { allowBase = null, stock = {} } = {}) {
  const learned = learnPortions(allCombos)
  const best = {} // kind → candidato más barato por g de proteína (o por kcal)
  const add = (role, key, ing) => {
    const p = portionFor(key, role, ing, learned)
    const cost = ingCost(key, p, allIng), prot = ingProt(key, p, allIng), kcal = ingKcal(key, p, allIng)
    if (!(kcal > 0)) return
    const c = { key, ing, p, role, kind: `${role}:${kindOf(key)}`, cost, prot, kcal, tags: tagsOf(key, allIng) }
    // De cada tipo se queda la variante más barata (la despensa no abarata nada: ya se pagó, pero vale lo mismo).
    if (!best[c.kind] || metricOf(c) < metricOf(best[c.kind])) best[c.kind] = c
  }
  const held = rotationHeld(allIng, stock)
  for (const [key, ing] of Object.entries(allIng)) {
    if (!priced(key, ing)) continue
    if (rotationPaused(key, ing, stock, held)) continue // otra del grupo está en la despensa
    // Temporales (una compra suelta, p. ej. del Business Centre): solo si hay en la despensa.
    if (ing.temporary && !(stock[key] > 0)) continue
    if (ing.dateOnly) continue // ingredientes de las cenas de cita (data/dateNight.js)
    const tags = tagsOf(key, allIng)
    if (tags.includes('egg')) add('egg', key, ing)
    else if (['white-meat', 'red-meat', 'fish', 'seafood'].some(t => tags.includes(t))) { if (!NOT_MAIN.test(key)) add('protein', key, ing) }
    else if (tags.includes('legume') && tags.includes('starch')) add('legume', key, ing)
    else if (tags.includes('starch')) { const t = `${key} ${ing.name}`; if (!NOT_BASE.test(t) || allowBase?.test(t)) add('base', key, ing) }
    else if (tags.includes('veg') && !tags.includes('fructan')) { if (!NOT_BATCH_VEG.test(key)) add('veg', key, ing) }
  }
  // Dos ingredientes con el mismo nombre son el mismo producto (otra tienda, o
  // una ficha duplicada): una sola, la mejor, para no generar platos gemelos.
  const byName = {}
  for (const c of Object.values(best)) {
    const nk = `${c.role}:${prettyName(c.ing).toLowerCase()}`
    const m = byName[nk]
    if (!m || metricOf(c) < metricOf(m)) byName[nk] = c
  }
  const all = Object.values(byName)
  return {
    proteins: all.filter(c => c.role === 'protein'), eggs: all.filter(c => c.role === 'egg'),
    bases: all.filter(c => c.role === 'base'), legumes: all.filter(c => c.role === 'legume'),
    veg: all.filter(c => c.role === 'veg'),
  }
}

function makeDish(main, base, vegs, allIng) {
  const parts = [main, base, ...vegs].filter(Boolean)
  // El id incluye el tamaño de la verdura: el mismo plato con otra ración es otro plato.
  const id = 'gen-' + parts.map(c => c.key).join('+') + vegs.map(v => `~${v.p.grams ?? ''}`).join('')
  const vegNames = vegs.map(v => lower(vegName(v.key, v.ing)))
  let name
  if (main && base) name = `${sentence(shortName(main.ing))} with ${shortName(base.ing).toLowerCase()}`
  else name = sentence(shortName((main ?? base).ing))
  if (vegNames.length) name += ` (${joinVeg(vegNames)})`
  const items = parts.map(c => ({ k: c.key, p: { ...c.p } }))
  items.push({ k: 'evoo', p: { ml: 15 } })
  if (allIng.salt) items.push({ k: 'salt', p: { grams: 2 } })
  return { key: GEN_PREFIX + id.slice(4), id, combo: { name, meals: ['comida', 'cena'], items, generated: true, isCustom: true, customId: id } }
}

/**
 * Compone platos y devuelve los mejores (con variedad) como { key: combo }.
 * stock: solo decide qué ingredientes están disponibles; no descuenta precio.
 */
export function composeDishes(allIng, allCombos, { stock = {}, limit = 90, pairPrefs = {}, priority = 'balanced' } = {}) {
  const P = ingredientPools(allIng, allCombos, { stock })
  const cheap = priority === 'price'
  const evooCost = ingCost('evoo', { ml: 15 }, allIng) // el AOVE también cuesta
  // Con 0, 1 o 2 verduras: en modo precio no se paga más verdura de la que
  // hace falta (la semana ya penaliza quedarse corto de verdura).
  const vegSets = priority === 'veg' ? [] : [[]]
  for (let i = 0; i < P.veg.length; i++) {
    vegSets.push([P.veg[i]])
    for (let j = i + 1; j < P.veg.length; j++) vegSets.push([P.veg[i], P.veg[j]])
  }
  const mains = [...P.proteins, ...P.eggs]
  const bases = [...P.bases, ...P.legumes]
  // El mismo ingrediente con otra cantidad (y su coste, kcal y proteína al día).
  const resize = (c, grams) => {
    if (c.p.grams == null || c.p.grams === grams) return c
    const p = { ...c.p, grams }
    return { ...c, p, cost: ingCost(c.key, p, allIng), kcal: ingKcal(c.key, p, allIng), prot: ingProt(c.key, p, allIng) }
  }
  const out = [], fitMemo = new Map()
  // Siempre con proteína: la legumbre sola deja corta la proteína del día.
  for (const main of mains) {
    for (const base of bases) {
      for (let vegs of vegSets) {
        // Modo precio: la verdura justa (150 g si es una sola, 100 g cada una si son dos).
        if (cheap) vegs = vegs.map(v => resize(v, vegs.length === 1 ? 150 : 100))
        const parts = [main, base, ...vegs].filter(Boolean)
        const kcal = parts.reduce((s, c) => s + c.kcal, 0) + 135
        const cost = parts.reduce((s, c) => s + c.cost, 0) + evooCost
        const prot = parts.reduce((s, c) => s + c.prot, 0)
        const veg = vegs.reduce((s, v) => s + (v.p.grams ?? 0), 0)
        const flags = parts.reduce((s, c) => s + (c.tags.includes('legume') ? 1 : 0) + (c.tags.includes('insoluble') ? 1 : 0), 0)
        // Puntuación previa (por 700 kcal): barato, proteína y verdura; la
        // semana inteligente hace la cuenta de verdad después.
        // Qué combina con qué (todas las cocinas) y lo que has rechazado.
        const cs = parts.map(c => (c.c ??= conceptOf(c.key, c.ing))), ck = cs.join('|')
        let pair = fitMemo.get(ck)
        if (pair === undefined) { pair = setFit(cs, null, pairPrefs); fitMemo.set(ck, pair) }
        // Modo precio: solo cuesta, con la proteína y la pareja como desempate.
        const score = cheap
          ? cost / kcal * 700 - prot * 0.004 + flags * 0.4 - pair * 0.15
          : cost / kcal * 700 - prot * 0.02 - veg * 0.01 + flags * 0.4 + (vegs.length === 2 ? -0.2 : 0) - pair * 0.5
        out.push({ main, base, vegs, score })
      }
    }
  }
  out.sort((a, b) => a.score - b.score)
  // Variedad: solo lo justo para que una proteína o una base no se coma todo el
  // grupo. NO hay tope por verdura: la más barata puede salir en todos los
  // platos (en modo precio es justo lo que se pide), y cada combinación
  // distinta de proteína + base + verduras es un plato distinto.
  const perMain = {}, perBase = {}, perPair = {}
  const mainCap = Math.max(8, Math.ceil(limit / 5)), baseCap = Math.ceil(limit / 2)
  const picked = {}
  let n = 0
  for (const d of out) {
    const mk = d.main.kind, bk = starchFamily(d.base.key, allIng) ?? d.base.key
    // Por pareja proteína+base: uno sin verdura y hasta tres con verdura.
    const pk = `${mk}|${d.base.kind}|${d.vegs.length ? 'v' : '0'}`
    if ((perPair[pk] ?? 0) >= (d.vegs.length ? (cheap ? 2 : 3) : 1) || (perMain[mk] ?? 0) >= mainCap || (perBase[bk] ?? 0) >= baseCap) continue
    perPair[pk] = (perPair[pk] ?? 0) + 1; perMain[mk] = (perMain[mk] ?? 0) + 1; perBase[bk] = (perBase[bk] ?? 0) + 1
    const g = makeDish(d.main, d.base, d.vegs, allIng)
    picked[g.key] = g.combo
    if (++n >= limit) break
  }
  return picked
}

export const isGenerated = key => typeof key === 'string' && key.startsWith(GEN_PREFIX)
