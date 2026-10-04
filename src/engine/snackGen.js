// Generador de desayunos/meriendas. Modulo PURO (sin React ni store): recibe
// los datos ya resueltos (allIng = selectAllIng, dishes, perfiles de persona)
// y devuelve un plan. Asi se puede probar desde Node.
//
// Piezas:
//   1. candidatos  = arquetipo x perfil de sabor x eleccion concreta de ingredientes
//   2. cantidades  = busqueda local en pasos de cocina hasta la kcal de cada persona
//                    (la misma preparacion para los dos; Julio fija el tamano)
//   3. semana      = reinicios aleatorios con semilla; descarta lo que rompe reglas
//                    y se queda con el plan de menor puntuacion
//
// Reglas duras: topes de lo ya probado (tolerance.js), maximo de novedades por
// semana, cadencias digestivas (dishHas* de calc.js), no repetir dias seguidos,
// y los lunes/miercoles de Maria solo preparaciones portables.

import { comboAgg, dishHasGOS, dishHasAllium, dishHasInsolubleFiber, personTargetForDay } from './calc'
import { testedIngredients } from './tolerance'
import { weekViolations } from './weekRules'
import { ARCHETYPES } from '../data/archetypes'
import { FLAVOR_PROFILES, DEFAULT_POOL } from '../data/flavorProfiles'
import { snackRoleOf, NO_MEALS } from '../data/snackRoles'
import { MARIA_NO_BATIDO_CASERO } from '../data/modelWeeks'

// share = fraccion de la kcal del dia que se come en ese hueco (supuesto
// editable, no medido: 0.25 ~ el batido de ~800 kcal sobre 3100).
export const SLOT_RULES = {
  merienda: { share: 0.25, protGoalShare: 0.20 },
  desayuno: { share: 0.15, protGoalShare: 0.20, kcalMin: 400, fatMax: 15, noGOS: true },
}

// Nadie por debajo de este porcentaje de su objetivo de kcal en el hueco
const MIN_FILL = 0.65
// No protein powder: the user dropped it everywhere (Smart weeks exclude it too).
const OPTIONAL_PROB = { protein: 0, fiber: 0.3 }
const MARIA_PORTABLE_DAYS = MARIA_NO_BATIDO_CASERO   // Mon/Wed: she works, no blender or cooking

// ─── utilidades ──────────────────────────────────────────────────────────────
function rngFrom(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const pickOne = (arr, rnd) => arr[Math.floor(rnd() * arr.length)]
const roleList = r => (Array.isArray(r) ? r : [r])
const snap = (v, step) => Math.round(v / step) * step

// cantidad de slot (g/ml/ud) -> porcion en el formato del ingrediente
function portionFor(ing, unit, q) {
  if (ing.flat != null) return {}
  if (unit === 'ea') return ing.perUnit != null ? { units: q } : { grams: q * (ing.unitGrams ?? 100) }
  if (ing.per100 != null) return { grams: q }
  if (ing.perML != null) return { ml: q }
  if (ing.perUnit != null) return { units: q / (ing.unitGrams ?? 100) }
  return { grams: q }
}
// ug = gramos por unidad: permite comparar gramos con un tope probado en unidades
const portionQty = (p, unit, ug) =>
  unit === 'g' ? (p.grams ?? p.ml ?? (p.units != null && ug ? p.units * ug : undefined))
  : unit === 'ml' ? (p.ml ?? p.grams)
  : (p.units ?? (p.grams != null && ug ? p.grams / ug : undefined))

const r1 = v => Math.round(v * 10) / 10
function scaleP(p, f) {
  const o = {}
  if (p.grams != null) o.grams = r1(p.grams * f)
  if (p.ml != null) o.ml = r1(p.ml * f)
  if (p.units != null) o.units = Math.round(p.units * f * 100) / 100
  return o
}

// ─── 1. candidatos ───────────────────────────────────────────────────────────
function slotPool(slot, profile, allIng, tasteArch, mealSlot) {
  const out = []
  const seen = new Set()
  for (const r of roleList(slot.role)) {
    const keys = profile.pick[r] ?? DEFAULT_POOL[r] ?? []
    for (const k of keys) {
      const ing = allIng[k]
      if (!ing || seen.has(k)) continue
      if (NO_MEALS[k]?.includes(mealSlot)) continue
      const taste = snackRoleOf(k, allIng)?.taste
      if (tasteArch === 'sweet' && taste === 'savory') continue
      if (tasteArch === 'savory' && taste === 'sweet') continue
      seen.add(k); out.push(k)
    }
  }
  return out
}

export function buildCandidates({ allIng, mealSlot, rnd, variantsPer = 3, archetypes = ARCHETYPES, profiles = FLAVOR_PROFILES }) {
  const cands = []
  const sigs = new Set()
  for (const [pid, prof] of Object.entries(profiles)) {
    for (const aid of prof.suits) {
      const arch = archetypes[aid]
      if (!arch || arch.taste !== prof.taste) continue
      // un perfil con fruta/hortaliza solo vale en arquetipos que tengan hueco para ella
      const hasFruitSlot = arch.slots.some(s => roleList(s.role).some(r => r === 'fruit' || r === 'veg'))
      if (prof.pick.fruta && !hasFruitSlot) continue
      const pools = {}
      let ok = true
      for (const s of arch.slots) {
        pools[s.id] = slotPool(s, prof, allIng, arch.taste, mealSlot)
        if (!s.optional && !pools[s.id].length) ok = false
      }
      if (!ok) continue
      for (let v = 0; v < variantsPer; v++) {
        const picks = {}
        for (const s of arch.slots) {
          const pool = pools[s.id]
          if (!pool.length) continue
          const definesProfile = roleList(s.role).some(r => ['fruit', 'veg', 'flavor', 'cured'].includes(r) && prof.pick[r])
          if (s.optional && !definesProfile && rnd() > (OPTIONAL_PROB[s.id] ?? 0.5)) continue
          picks[s.id] = pickOne(pool, rnd)
        }
        const sig = pid + '|' + aid + '|' + Object.entries(picks).map(([a, b]) => a + b).join(',')
        if (sigs.has(sig)) continue
        sigs.add(sig)
        // main ingredient (what the recipe is «about»): used to avoid a week that is all banana
        const mainKey = picks.fruit ?? picks.filling ?? picks.cured ?? picks.crunch ?? null
        cands.push({ id: sig, profileId: pid, profileName: prof.name, archId: aid, kind: arch.kind, picks, mainKey })
      }
    }
  }
  return cands
}

// Fills the {tokens} of the steps with ingredient and amount. Unused optional
// slots disappear; a step with no ingredient at all is dropped.
export function fillSteps(arch, items, allIng) {
  const bySlot = Object.fromEntries(items.map(i => [i.slotId, i]))
  const name = i => allIng[i.k].name.replace(/\s*\(.*$/, '').trim().toLowerCase()
  const fmtI = i => i.unit === 'taste' ? `${name(i)} (to taste)` : `${name(i)} (${i.q} ${i.unit})`
  const list = xs => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' and ' + xs[xs.length - 1])
  const out = []
  for (const step of arch.steps) {
    const hadTokens = /\{\w+\}/.test(step)
    let any = false
    let t = step.replace(/\{\w+\}(?:(?:, | and )\{\w+\})*/g, m => {
      const present = (m.match(/\{(\w+)\}/g) || []).map(x => bySlot[x.slice(1, -1)]).filter(Boolean)
      if (present.length) any = true
      return present.length ? list(present.map(fmtI)) : '\u2205'
    })
    if (hadTokens && !any) continue
    t = t.replace(/\s+(with|and|or)\s+\u2205/g, '')
         .replace(/\u2205\s+(and|or|with)\s+/g, '')
         .replace(/\u2205/g, '')
         .replace(/\s{2,}/g, ' ').replace(/\s+([.,])/g, '$1').replace(/,\s*\./g, '.').replace(/,\s*,/g, ',')
    out.push(t.charAt(0).toUpperCase() + t.slice(1))
  }
  return out
}

// Recipe name from what it REALLY contains (not from the profile).
const SHORT = { cocoa: 'cocoa', vanilla: 'vanilla', cinnamon: 'cinnamon', 'barley-flakes': 'barley', 'dark-chocolate': 'dark chocolate', 'butternut-squash': 'butternut', 'pumpkin-seeds': 'pumpkin seed', 'shredded-coconut': 'coconut', 'cooked-ham': 'ham', 'cold-cuts': 'cold cuts', 'peanut-butter': 'peanut butter', strawberries: 'strawberry', blueberries: 'blueberry', walnuts: 'walnut', hazelnuts: 'hazelnut', almonds: 'almond' }
function shortName(k, allIng) {
  if (SHORT[k]) return SHORT[k]
  return allIng[k].name.replace(/\s*\(.*$/, '').split(' / ')[0].trim().toLowerCase()
}
export function labelFor(arch, items, allIng) {
  const take = r => items.filter(i => roleList(r).includes(snackRoleOf(i.k, allIng)?.role)).map(i => shortName(i.k, allIng))
  const main = [...take(['fruit', 'veg']), ...take('cured'), ...take('flavor')].filter((v, i, a) => a.indexOf(v) === i).slice(0, 2)
  const extra = main.length ? main : take('crunch').slice(0, 1)
  const t = extra.length ? `${extra.join(' & ')} ${arch.label}` : arch.label
  return t.charAt(0).toUpperCase() + t.slice(1)
}

// ─── 2. cantidades ───────────────────────────────────────────────────────────
function itemsFrom(arch, picks, qty, allIng) {
  return arch.slots.filter(s => picks[s.id] != null && qty[s.id] > 0)
    // Spices and vanilla are priced as a flat amount, not per gram: showing 10 g of nutmeg
    // would be wrong (and unsafe), so they are «to taste» and carry no quantity.
    .map(s => ({ k: picks[s.id], slotId: s.id, unit: allIng[picks[s.id]].flat != null ? 'taste' : s.unit, q: allIng[picks[s.id]].flat != null ? 1 : qty[s.id], ug: allIng[picks[s.id]].unitGrams, p: portionFor(allIng[picks[s.id]], s.unit, qty[s.id]) }))
}

function aggOf(items, allIng) {
  return comboAgg({ items: items.map(i => ({ k: i.k, p: i.p })) }, allIng)
}

// exceso respecto a lo ya probado: suma de (cantidad - tope)/tope por ingrediente
function capExcess(items, tested, factor = 1) {
  let ex = 0
  for (const it of items) {
    const t = tested[it.k]
    if (!t || t.max == null) continue
    const q = portionQty(it.p, t.unit, it.ug)
    if (q == null) continue
    if (q * factor > t.max + 1e-9) ex += (q * factor - t.max) / t.max
  }
  return ex
}

function initialQty(arch, picks) {
  const qty = {}
  for (const s of arch.slots) {
    if (picks[s.id] == null) continue
    const [mn, mx, st] = s.qty
    qty[s.id] = mn === mx ? mn : Math.max(st, snap((mn + mx) / 2, st))
  }
  return qty
}

// Busqueda local (coordenadas) para una porcion individual.
function solvePortion({ arch, picks, allIng, targetKcal, protGoal, tested, rules }) {
  const qty = initialQty(arch, picks)
  const free = arch.slots.filter(s => picks[s.id] != null && s.qty[0] !== s.qty[1])
  const lo = s => (s.optional ? s.qty[2] : s.qty[0])
  const loss = q => {
    const items = itemsFrom(arch, picks, q, allIng)
    const a = aggOf(items, allIng)
    let l = 3 * Math.abs(a.kcal - targetKcal) / targetKcal
    l += 1.5 * Math.max(0, protGoal - a.prot) / Math.max(protGoal, 1)
    l += 0.3 * a.cost
    l += 100 * capExcess(items, tested)
    if (rules?.fatMax && a.fat > rules.fatMax) l += 5 * (a.fat - rules.fatMax) / rules.fatMax
    return l
  }
  let best = loss(qty)
  for (let it = 0; it < 40; it++) {
    let improved = false
    for (const s of free) {
      for (const d of [1, -1]) {
        const nq = qty[s.id] + d * s.qty[2]
        if (nq < lo(s) || nq > s.qty[1]) continue
        const trial = { ...qty, [s.id]: nq }
        const l = loss(trial)
        if (l < best - 1e-9) { best = l; qty[s.id] = nq; improved = true }
      }
    }
    if (!improved) break
  }
  return { qty, loss: best }
}

function describe(items, allIng, extra = {}) {
  const a = aggOf(items, allIng)
  return {
    combo: { items: items.map(i => ({ k: i.k, p: i.p })) },
    kcal: Math.round(a.kcal), prot: Math.round(a.prot * 10) / 10, fat: Math.round(a.fat * 10) / 10,
    fib: Math.round(a.fib * 10) / 10, cost: a.cost,
    items: items.map(i => ({ k: i.k, name: allIng[i.k].name, qty: i.q, unit: i.unit, slotId: i.slotId })),
    ...extra,
  }
}

// Escala la receta de Julio a Maria con el mismo conjunto de ingredientes.
function scaleTo(arch, picks, qtyJ, ratio, allIng) {
  const qty = {}
  for (const s of arch.slots) {
    if (picks[s.id] == null) continue
    const [mn, mx, st] = s.qty
    qty[s.id] = mn === mx ? mn : Math.min(mx, Math.max(Math.max(st, s.optional ? st : mn), snap(qtyJ[s.id] * ratio, st)))
  }
  return qty
}

// Leche para completar la kcal cuando la preparacion no lleva liquido propio.
// Respeta el tope de lo ya probado de la leche.
function companionFor(arch, gap, ctx) {
  const { allIng, tested } = ctx
  if (!allIng['whole-milk'] || arch.slots.some(s => roleList(s.role).includes('liquid')) || gap < 80) return []
  const cap = tested['whole-milk']?.max ?? 300
  const ml = Math.min(cap, snap(gap / (allIng['whole-milk'].kc / 100), 50))
  if (ml <= 0) return []
  return [{ k: 'whole-milk', slotId: 'companion', unit: 'ml', q: ml, p: portionFor(allIng['whole-milk'], 'ml', ml) }]
}

// Resuelve un candidato para Julio y Maria. Devuelve null si no es viable.
export function solveCandidate(c, ctx) {
  const { allIng, persons, tested, mealSlot, rules } = ctx
  const arch = ARCHETYPES[c.archId]
  const [J, M] = persons
  const tJ = ctx.targets[J.id], tM = ctx.targets[M.id]
  const pgJ = ctx.protGoals[J.id], pgM = ctx.protGoals[M.id]

  if (arch.kind === 'portion') {
    const sol = solvePortion({ arch, picks: c.picks, allIng, targetKcal: tJ, protGoal: pgJ, tested, rules })
    let itemsJ = itemsFrom(arch, c.picks, sol.qty, allIng)
    let aJ = aggOf(itemsJ, allIng)
    if (capExcess(itemsJ, tested) > 0) return null
    const compJ = companionFor(arch, tJ - aJ.kcal, ctx)
    if (compJ.length) { itemsJ = [...itemsJ, ...compJ]; aJ = aggOf(itemsJ, allIng) }
    if (rules?.noGOS && dishHasGOS({ items: itemsJ }, allIng)) return null
    const qtyM = scaleTo(arch, c.picks, sol.qty, tM / tJ, allIng)
    let itemsM = itemsFrom(arch, c.picks, qtyM, allIng)
    const compM = companionFor(arch, tM - aggOf(itemsM, allIng).kcal, ctx)
    if (compM.length) itemsM = [...itemsM, ...compM]
    const outJ = describe(itemsJ, allIng), outM = describe(itemsM, allIng)
    const dev = Math.abs(outJ.kcal - tJ) / tJ + Math.abs(outM.kcal - tM) / tM
    if (outJ.kcal < MIN_FILL * tJ || outM.kcal < MIN_FILL * tM) return null
    return { ...c, arch, dev, combo: { items: itemsJ.map(i => ({ k: i.k, p: i.p })) },
      persons: { [J.id]: outJ, [M.id]: outM },
      label: labelFor(arch, itemsJ, allIng),
      steps: fillSteps(arch, itemsJ.filter(i => i.slotId !== 'companion'), allIng),
      costPerUse: aJ.cost + aggOf(itemsM, allIng).cost, nTotalUses: 1,
      loss: sol.loss }
  }

  // LOTE: receta fija; cada persona come n raciones + leche para completar kcal
  const qty = initialQty(arch, c.picks)
  const batchItems = itemsFrom(arch, c.picks, qty, allIng)
  const batch = aggOf(batchItems, allIng)
  const per = { kcal: batch.kcal / arch.yield, cost: batch.cost / arch.yield }
  const stepN = arch.yield >= 12 ? 1 : 0.5
  const maxN = arch.yield >= 12 ? 6 : 3
  const milkKey = allIng['whole-milk'] ? 'whole-milk' : null
  const milkKcal = milkKey ? 3 * allIng[milkKey].kc : 0
  // raciones por persona: trozo grande + hasta ~300 ml de leche para el resto
  const nOf = {}
  for (const [P, t] of [[J, tJ], [M, tM]]) {
    let n = Math.min(maxN, Math.max(stepN, snap((t - milkKcal) / per.kcal, stepN)))
    // tope de probado para Julio: cantidad por racion x n
    if (P.id === J.id) {
      while (n > stepN && capExcess(batchItems, tested, n / arch.yield) > 0) n -= stepN
      if (capExcess(batchItems, tested, n / arch.yield) > 0) return null
    }
    nOf[P.id] = n
  }
  nOf[M.id] = Math.min(nOf[M.id], nOf[J.id])   // la misma preparacion: Maria nunca mas raciones que Julio
  // tope de tandas (espacio de nevera/congelador/horno): si cubrir todos los dias
  // del lote exige mas tandas de las permitidas, se bajan las raciones
  const batchLen = Math.min(arch.shelfDays, ctx.maxBatchDays ?? 5)
  const maxTotal = (arch.maxBatches ?? 2) * arch.yield
  while ((nOf[J.id] + nOf[M.id]) * batchLen > maxTotal) {
    // se reduce a Julio solo si come mas que Maria; si van iguales, primero ella
    const big = nOf[J.id] > nOf[M.id] ? J.id : M.id
    if (nOf[big] <= stepN) return null
    nOf[big] -= stepN
  }
  const out = {}
  for (const [P, t] of [[J, tJ], [M, tM]]) {
    const n = nOf[P.id]
    const gap = t - n * per.kcal
    const milkMl = milkKey ? Math.min(tested['whole-milk']?.max ?? 300, Math.max(0, snap(gap / (allIng[milkKey].kc / 100), 50))) : 0
    const compItems = milkMl > 0 ? [{ k: milkKey, slotId: 'companion', unit: 'ml', q: milkMl, p: portionFor(allIng[milkKey], 'ml', milkMl) }] : []
    const comp = compItems.length ? aggOf(compItems, allIng) : { kcal: 0, prot: 0, fat: 0, fib: 0, cost: 0 }
    const kcal = n * per.kcal + comp.kcal
    const prot = n * (batch.prot / arch.yield) + comp.prot
    out[P.id] = {
      kcal: Math.round(kcal), prot: Math.round(prot * 10) / 10,
      fat: Math.round((n * batch.fat / arch.yield + comp.fat) * 10) / 10,
      fib: Math.round((n * batch.fib / arch.yield + comp.fib) * 10) / 10,
      cost: n * per.cost + comp.cost,
      combo: { items: [...batchItems.map(i => ({ k: i.k, p: scaleP(i.p, n / arch.yield) })), ...compItems.map(i => ({ k: i.k, p: i.p }))] },
      portions: n, items: compItems.map(i => ({ k: i.k, name: allIng[i.k].name, qty: i.q, unit: i.unit, slotId: i.slotId })),
      slotsOfBatch: batchItems.map(i => ({ k: i.k, name: allIng[i.k].name, qty: i.q, unit: i.unit, slotId: i.slotId })),
    }
  }
  const devL = Math.abs(out[J.id].kcal - tJ) / tJ + Math.abs(out[M.id].kcal - tM) / tM
  if (out[J.id].kcal < MIN_FILL * tJ || out[M.id].kcal < MIN_FILL * tM) return null
  return { ...c, arch, dev: devL, combo: { items: batchItems.map(i => ({ k: i.k, p: i.p })) },
    batch: describe(batchItems, allIng), label: labelFor(arch, batchItems, allIng), steps: fillSteps(arch, batchItems, allIng), yield: arch.yield, shelfDays: arch.shelfDays,
    persons: out, portionsPerDay: out[J.id].portions + out[M.id].portions, batchCost: batch.cost,
    loss: devL }
}

// ─── 3. semana ───────────────────────────────────────────────────────────────
function noveltyKeysOf(sol, tested) {
  const ks = new Set()
  for (const it of sol.combo.items) if (!tested[it.k]) ks.add(it.k)
  for (const k of Object.keys(sol.persons).flatMap(p => (sol.persons[p].items ?? []).map(i => i.k))) if (!tested[k]) ks.add(k)
  return ks
}

function portableOnMariaDay(sol) {
  const a = sol.arch
  if (sol.kind === 'batch') return a.portable
  return a.portable && a.gear.length === 0
}

// New digestive rule (weekRules.js): legumes, onion/garlic or insoluble fiber in
// at most ONE meal per day. The snack must not add a second one on a day where
// breakfast, lunch or dinner already has it (checked per person on the base week).
const DIGESTIVE = [dishHasGOS, dishHasAllium, dishHasInsolubleFiber]
const ALL_MEALS = ['desayuno', 'comida', 'merienda', 'cena']
function digestiveOk(sol, d, baseWeek, persons, mealSlot, allIng) {
  if (!baseWeek) return true
  for (const P of persons) {
    const bw = Array.isArray(baseWeek) ? baseWeek : baseWeek[P.id]
    const day = bw?.[d]
    if (!day) continue
    const combo = sol.persons[P.id].combo
    for (const has of DIGESTIVE) {
      if (!has(combo, allIng)) continue
      if (ALL_MEALS.some(m => m !== mealSlot && day[m] && has(day[m], allIng))) return false
    }
  }
  return true
}

// ─── Priorities (like «Best price / Most protein» in Smart weeks) ───────────
// The score is in «dollars»: cost counts, kcal off-target counts, and the rest are
// small rewards. Each priority only shifts the weights.
export const PRIORITIES = {
  price:   { label: 'Cheapest',      best: 'Best price',   cost: 1,    kcal: 2.5, prot: 0,    variety: 0.6, profile: 0.15, main: 0.8 },
  protein: { label: 'More protein',  best: 'Most protein', cost: 0.35, kcal: 2.5, prot: 0.3,  variety: 0.6, profile: 0.15, main: 0.8 },
  variety: { label: 'More variety',  best: 'Most variety', cost: 0.5,  kcal: 2.5, prot: 0,    variety: 2.2, profile: 0.6,  main: 2 },
}
const keyOfSol = s => s.profileId + '|' + s.archId

// How convenient a recipe is for a priority, in «dollars» per day (lower = better).
function solValue(s, w, persons, days, maxBatchDays) {
  const span = s.kind === 'batch' ? Math.max(1, Math.min(s.shelfDays, maxBatchDays, days)) : 1
  const cost = s.kind === 'batch' ? Math.ceil(s.portionsPerDay * span / s.yield) * s.batchCost / span : s.costPerUse
  const prot = persons.reduce((a, P) => a + s.persons[P.id].prot, 0)
  return w.cost * cost + w.kcal * (s.dev ?? 0) - w.prot * prot / 10
}

// Everything that does not depend on the week: candidates solved for both people.
// opts: { allIng, dishes, persons:[J,M], mealSlot, candidateSeed, maxBatchDays }
export function buildPool(opts) {
  const { allIng, dishes, persons, mealSlot = 'merienda', candidateSeed = 1, maxBatchDays = 5 } = opts
  const rules = SLOT_RULES[mealSlot]
  const tested = testedIngredients(dishes)
  const targets = {}, protGoals = {}
  for (const P of persons) {
    const mean = [0, 1, 2, 3, 4, 5, 6].reduce((s, d) => s + personTargetForDay(P, d), 0) / 7
    targets[P.id] = Math.max(rules.kcalMin ?? 0, Math.round(mean * rules.share))
    protGoals[P.id] = (P.proteinTarget ?? 100) * rules.protGoalShare
  }
  const ctx = { allIng, persons, tested, mealSlot, rules, targets, protGoals, maxBatchDays }
  const cands = buildCandidates({ allIng, mealSlot, rnd: rngFrom(candidateSeed) })
  const sols = []
  for (const c of cands) {
    const sol = solveCandidate(c, ctx)
    if (sol) sols.push(sol)
  }
  return {
    sols, byId: Object.fromEntries(sols.map(x => [x.id, x])), novel: Object.fromEntries(sols.map(x => [x.id, noveltyKeysOf(x, tested)])),
    tested, targets, ctx, candidateSeed, candidates: cands.length,
  }
}

// One week from a pool. opts: { seed, noveltyMax, restarts, days, baseWeek, weights, pinned:{day:id},
//   batches, batchStartDays, maxBatchDays, avoid:[«profile|arch»], avoidWeight }
export function assemble(pool, opts) {
  const { sols, byId, novel, targets, ctx } = pool
  const { allIng, persons, mealSlot } = ctx
  const { seed = 1, noveltyMax = 1, restarts = 300, days = 7, baseWeek = null, pinned = {}, batchStartDays = [0], maxBatchDays = 5,
          batches = 'auto', avoid = [], avoidWeight = 2.5, banned = [], mainCap = 3 } = opts
  const w = { ...PRIORITIES.price, ...(opts.weights ?? {}) }
  const avoidSet = new Set(avoid)
  const banSet = new Set(banned)
  const rnd = rngFrom(seed)

  // Value of each recipe for this priority (lower = better), per day it covers. The search
  // tries the most convenient recipes first, with growing noise so it does not get stuck.
  const keyOf = x => x.rule + ':' + (x.day ?? '') + ':' + (x.slots?.join('+') ?? x.slot ?? '')
  const baseKeys = {}
  if (baseWeek) for (const P of persons) { const bw = Array.isArray(baseWeek) ? baseWeek : (baseWeek[P.id] ?? null); if (bw) baseKeys[P.id] = new Set(weekViolations(bw, allIng, P).map(keyOf)) }
  const value = new Map()
  for (const s of sols) {
    value.set(s.id, solValue(s, w, persons, days, maxBatchDays) + (avoidSet.has(keyOfSol(s)) ? avoidWeight : 0))
  }

  let best = null
  for (let r = 0; r < restarts; r++) {
    const slots = Array(days).fill(null)         // { sol, startDay, len }
    const used = { profile: {}, arch: {}, main: {} }
    const noveltyUsed = new Set()
    let cost = 0, ok = true
    for (let d = 0; d < days && ok; d++) {
      if (slots[d]) continue
      let chosen = null
      const noise = [0.4, 1.5, 4, 12][r % 4]
      let order = pinned[d] && byId[pinned[d]] ? [byId[pinned[d]]]
        : sols.map(x => [value.get(x.id) + noise * rnd(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1])
      if (batches === 'no') order = order.filter(x => x.kind !== 'batch')
      if (batches === 'yes' && d === batchStartDays[0] && !pinned[d]) order = order.filter(x => x.kind === 'batch')
      for (const s of order) {
        const prev = slots[d - 1]?.sol
        if (banSet.has(keyOfSol(s)) && pinned[d] !== s.id) continue   // «Not this one» (never where it was pinned)
        if (prev && (prev.id === s.id || prev.profileId === s.profileId)) continue
        if ((used.profile[s.profileId] ?? 0) >= 2 || (used.arch[s.archId] ?? 0) >= 2) continue
        if (s.mainKey && (used.main[s.mainKey] ?? 0) >= mainCap) continue   // not banana every day
        const nk = novel[s.id]
        if (new Set([...noveltyUsed, ...nk]).size > noveltyMax) continue
        if (s.kind === 'batch' && !batchStartDays.includes(d)) continue   // cooked on Sunday
        const len = s.kind === 'batch' ? Math.min(s.shelfDays, maxBatchDays, days - d) : 1
        // Maria's work days: only portable recipes
        let bad = false
        for (let i = d; i < d + len; i++) if (MARIA_PORTABLE_DAYS.includes(i) && !portableOnMariaDay(s)) bad = true
        if (bad) continue
        if (s.kind === 'batch' && slots.slice(d, d + len).some(Boolean)) continue
        // a batch never runs over days that are pinned (kept) by «Not this one»
        if (s.kind === 'batch') { let over = false; for (let i = d + 1; i < d + len; i++) if (pinned[i]) over = true; if (over) continue }
        // digestive rule per day, against what is already planned
        let digestive = true
        for (let i = d; i < d + len; i++) if (!digestiveOk(s, i, baseWeek, persons, mealSlot, allIng)) digestive = false
        if (!digestive) continue
        chosen = { s, len, nk }
        break
      }
      if (!chosen) { ok = false; break }
      const { s, len, nk } = chosen
      for (let i = d; i < d + len; i++) slots[i] = { sol: s, startDay: d, len }
      used.profile[s.profileId] = (used.profile[s.profileId] ?? 0) + 1
      used.arch[s.archId] = (used.arch[s.archId] ?? 0) + 1
      if (s.mainKey) used.main[s.mainKey] = (used.main[s.mainKey] ?? 0) + 1
      nk.forEach(k => noveltyUsed.add(k))
      if (s.kind === 'batch') {
        const batchesNeeded = Math.ceil(s.portionsPerDay * len / s.yield)
        cost += batchesNeeded * s.batchCost
        slots[d].batches = batchesNeeded
        // milk that goes with the batch, every day
        for (const P of persons) cost += (s.persons[P.id].items[0]?.qty ?? 0) > 0 ? len * s.persons[P.id].items.reduce((a, it) => a + it.qty * (allIng[it.k].per100 ?? 0) / 100, 0) : 0
      } else {
        cost += s.costPerUse
      }
    }
    if (!ok) continue

    // score: cost + kcal off target − protein/variety rewards + notes + ideas to avoid
    let score = cost * w.cost
    let prot = 0
    for (const sl of slots) if (sl) { score += w.kcal * (sl.sol.dev ?? 0); for (const P of persons) prot += sl.sol.persons[P.id].prot }
    score -= w.prot * prot / 10
    const starts = slots.filter((sl, d) => sl && sl.startDay === d)
    score -= w.profile * new Set(slots.map(x => x.sol.profileId)).size + w.variety * new Set(slots.map(x => x.sol.archId)).size
    score -= w.main * new Set(slots.map(x => x.sol.mainKey).filter(Boolean)).size
    for (const sl of starts) if (avoidSet.has(keyOfSol(sl.sol))) score += avoidWeight
    const violations = []
    if (baseWeek) {
      for (const P of persons) {
        const bw = Array.isArray(baseWeek) ? baseWeek : (baseWeek[P.id] ?? null)
        if (!bw) continue
        const week = slots.map((sl, i) => ({ ...(bw[i] ?? {}), [mealSlot]: sl.sol.persons[P.id].combo }))
        const v = weekViolations(week, allIng, P).filter(x => !baseKeys[P.id].has(keyOf(x)))
        score += 5 * v.length
        v.forEach(x => violations.push({ person: P.id, ...x }))
      }
    }
    if (!best || score < best.score) best = { score, slots, cost, novelty: [...noveltyUsed], violations }
  }
  if (!best) return { error: 'No week fits these rules.' }

  const outDays = []
  for (let d = 0; d < days; d++) {
    const sl = best.slots[d]; const s = sl.sol
    outDays.push({
      dayIdx: d, candidateId: s.id, candidateKey: keyOfSol(s), label: s.label, archetype: s.archId, profile: s.profileId,
      kind: s.kind, isStart: sl.startDay === d, startDay: sl.startDay, coverDays: sl.len, batches: sl.batches ?? null,
      persons: Object.fromEntries(persons.map(P => [P.id, s.persons[P.id]])),
      novelty: [...novel[s.id]], steps: s.steps,
    })
  }
  // Per person: average kcal and protein per day, days within ±12% of the target, soluble fiber the snack adds.
  const perPerson = persons.map(P => {
    const t = targets[P.id]
    const xs = outDays.map(d => d.persons[P.id])
    const avg = k => Math.round(xs.reduce((a, x) => a + x[k], 0) / xs.length)
    return { id: P.id, target: t, kcal: avg('kcal'), prot: avg('prot'), hit: xs.filter(x => Math.abs(x.kcal - t) / t <= 0.12).length, days: xs.length,
      cost: xs.reduce((a, x, i) => a + (outDays[i].kind === 'batch' ? 0 : x.cost), 0) }
  })
  return { seed, cost: best.cost, score: best.score, novelty: best.novelty, violations: best.violations, warnings: best.violations.map(v => ({ person: v.person, msg: v.msg })),
    days: outDays, targets, perPerson }
}

const signature = r => r.days.map(d => d.candidateId).join('|')

// Several different weeks for one priority (the three cards).
// opts: everything buildPool/assemble take + { priority, count, avoidKeys, avoidWeight }
export function generateOptions(opts) {
  const { priority = 'price', count = 3, avoidKeys = [], avoidWeight = 2.5, restarts = 300, seed = 1 } = opts
  const pool = opts.pool ?? buildPool(opts)
  if (!pool.sols.length) return { options: [], tried: 0, recipes: 0, candSeed: pool.candidateSeed, error: 'No recipe fits your rules and ingredients.' }
  const options = []
  let avoid = [...avoidKeys]
  for (let i = 0; i < count; i++) {
    let r = null
    for (let attempt = 0; attempt < 3; attempt++) {
      r = assemble(pool, { ...opts, weights: PRIORITIES[priority], avoid, avoidWeight, seed: seed + i * 7919 + attempt * 104729 })
      if (r.error || !options.some(o => signature(o) === signature(r))) break
    }
    if (!r || r.error || options.some(o => signature(o) === signature(r))) break
    r.candSeed = pool.candidateSeed
    options.push(r)
    avoid = [...avoid, ...r.days.filter(d => d.isStart).map(d => d.candidateKey)]
  }
  return { options, tried: restarts * Math.max(options.length, 1), recipes: pool.sols.length, candSeed: pool.candidateSeed,
    error: options.length ? null : 'No week fits these rules.' }
}

// Single week (kept for tests and simple callers).
export function generateWeek(opts) {
  const out = generateOptions({ ...opts, count: 1, priority: opts.priority ?? 'price', candidateSeed: opts.candidateSeed ?? opts.seed ?? 1 })
  if (!out.options.length) return { error: out.error, candidates: out.recipes }
  return { ...out.options[0], candidatesTried: out.recipes }
}


// ─── Load model week → Smart ─────────────────────────────────────────────────
// Smart picks ONE snack per person for the whole batch, comparing it with the lunch/dinner
// pair. Here the generator hands it recipes built from your ingredients (already sized for
// each person) to compete with the catalog. Only the best few go in, so Smart stays fast:
//   · `keep` recipes made of ingredients you have already used in your dishes;
//   · plus up to 3 recipes that share ONE new ingredient (never two new ones in a week).
// Returns { combos, byPerson, count, novelty } or null (needs exactly two people).
const hash36 = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) }

export function smartSnackCandidates({ allIng, tried, people, priority = 'price', seed = 1, novelty = 1, keep = 8, mealSlot = 'merienda' }) {
  const persons = [...people].sort((a, b) => (b.digestive ? 1 : 0) - (a.digestive ? 1 : 0))
  if (persons.length !== 2) return null
  const pool = buildPool({ allIng, dishes: tried, persons, mealSlot, candidateSeed: seed || 1 })
  if (!pool.sols.length) return null
  const w = PRIORITIES[priority] ?? PRIORITIES.price
  const scored = pool.sols.map(s => ({ s, v: solValue(s, w, persons, 5, 5), novel: pool.novel[s.id] })).sort((a, b) => a.v - b.v)
  // Variety: at most 3 per archetype, 2 per main ingredient, one flavor profile each.
  const take = (list, n) => {
    const out = [], arch = {}, main = {}, prof = new Set()
    for (const x of list) {
      if (out.length >= n) break
      const m = x.s.mainKey
      if ((arch[x.s.archId] ?? 0) >= 3 || (m && (main[m] ?? 0) >= 2) || prof.has(x.s.profileId)) continue
      arch[x.s.archId] = (arch[x.s.archId] ?? 0) + 1
      if (m) main[m] = (main[m] ?? 0) + 1
      prof.add(x.s.profileId); out.push(x)
    }
    return out
  }
  let chosen = take(scored.filter(x => x.novel.size === 0), keep)
  if (novelty >= 1) {
    const byNew = {}
    for (const x of scored) if (x.novel.size === 1) (byNew[[...x.novel][0]] ??= []).push(x)
    const best = Object.values(byNew).sort((a, b) => a[0].v - b[0].v)[0]
    if (best) chosen = [...chosen, ...take(best, 3)]
  }
  const combos = {}, byPerson = {}
  for (const x of chosen) {
    for (const P of persons) {
      const id = `gen-snk-${hash36(x.s.id)}-${P.id}`
      const key = 'custom-' + id
      combos[key] = { name: `${x.s.label} · ${P.name}`, meals: [mealSlot], items: x.s.persons[P.id].combo.items.map(i => ({ k: i.k, p: i.p })), generated: true, isCustom: true, customId: id }
      ;(byPerson[P.id] ??= []).push(key)
    }
  }
  return { combos, byPerson, count: chosen.length, novelty: [...new Set(chosen.flatMap(x => [...x.novel]))] }
}
