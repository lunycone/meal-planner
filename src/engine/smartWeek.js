// ─── Semana inteligente ─────────────────────────────────────────────────────
// Genera semanas completas (28 huecos) con los precios de ese momento.
//
// Estructura: la del batch del domingo. Comida y cena de lunes a viernes son
// un plato cada una (una olla); sábado y domingo, otro par. Desayuno y
// merienda van por persona (laborable / fin de semana), y María merienda algo
// para llevar los lunes y miércoles (MARIA_NO_BATIDO_CASERO).
//
// Dos fases, para que sea rápido también en el móvil:
//   1. Modelo rápido: con las cifras de cada plato (kcal, coste, proteína,
//      fibra, verdura, cuánto puede crecer su base) se prueban TODAS las
//      parejas comida+cena y, para cada una, todos los desayunos y meriendas
//      de cada persona. Son cientos de miles de combinaciones en ~100 ms.
//   2. Motor real: las mejores se calculan con el mismo motor que el resto de
//      la app (raciones escaladas por persona y día) y se ordenan de nuevo.
//
// Reglas (las que no se pueden romper cuestan mucho en la puntuación):
//   · legumbre, cebolla/ajo o fibra insoluble: como mucho 1 comida al día
//     (para el perfil con `digestive`);
//   · desayuno del perfil digestivo: ≥400 kcal, ≤15 g grasa, sin legumbre,
//     cebolla/ajo ni fibra insoluble;
//   · fibra soluble ≥10 g/día y verdura ≥ vegMin g/día por persona;
//   · proteína ≥ objetivo y ≤ techo (protCap) de cada perfil;
//   · PCOS: desayuno nunca «alto», cena mejor baja/media;
//   · comida ≠ cena, y el fin de semana ≠ entre semana.

import {
  comboAgg, comboFibSol, comboScaleCapacity, dishHasGOS, dishHasAllium, dishHasInsolubleFiber,
  pcosCarbLevel, personTargetForDay, makeByPersonSlot,
} from './calc'
import { SOLUBLE_FIBER_DAILY_MIN, VEG_DAILY_MIN, DIGESTIVE_MAX_PER_DAY, dishVegGrams } from './weekRules'
import { MARIA_NO_BATIDO_CASERO, MARIA_MERIENDA_PORTATIL } from '../data/modelWeeks'
import { DAY_KEYS, dayForPerson, dayTotals } from '../lib/mealplan'

export const PRIORITIES = ['price', 'protein', 'veg']
const PARTS = [[0, 1, 2, 3, 4], [5, 6]]     // lun–vie (batch) · sáb–dom
const EXCLUDE_KEYS = new Set(['b-blando', 'm-astringente-platano-manzana']) // para días malos de estómago
const TOP_PAIRS = 36

// Pesos de la puntuación, en dólares equivalentes por persona y día.
const W = {
  hard: 40,          // regla digestiva rota
  solPerG: 1.0,      // por g de fibra soluble que falte
  vegPerG: 0.04,     // por g de verdura que falte (100 g = $4)
  protLowPerG: 0.06, // por g por debajo del objetivo
  protHighPerG: 0.15,// por g por encima del techo
  kcalPer: 0.02,     // por kcal fuera del ±5 % (sin poder cerrarse)
  pcosRed: 2.5, pcosYellow: 0.5,
  reuse: 3,          // plato ya enseñado (al barajar)
}
const BONUS = { protein: 0.02, veg: 0.012 } // por g, según la prioridad

// ── Semillas y ruido reproducible (para «Shuffle») ──────────────────────────
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
function noise(seed, key, amp) { if (!seed) return 1; const x = hash(seed + ':' + key) / 4294967295; return 1 + (x * 2 - 1) * amp }

function hasPowder(c) { return (c.items ?? []).some(it => it.k === 'proteina-polvo') }
// «Aragonese rancho stew (cheap)» y «(XL)» son el mismo plato para la variedad.
function familyOf(name = '') { return name.split(' (')[0].trim().toLowerCase() }

// ── Fase 0: cifras de cada plato ────────────────────────────────────────────
function dishStats(key, combo, allIng, seed) {
  const a = comboAgg(combo, allIng)
  const cap = comboScaleCapacity(combo, allIng)
  const n = noise(seed, key, 0.12)
  return {
    key, name: combo.name, fam: familyOf(combo.name), kcal: a.kcal, cost: a.cost * n, prot: a.prot ?? 0, fat: a.fat ?? 0,
    sol: comboFibSol(combo, allIng), veg: dishVegGrams(combo, allIng),
    gos: dishHasGOS(combo) ? 1 : 0, all: dishHasAllium(combo) ? 1 : 0, ins: dishHasInsolubleFiber(combo) ? 1 : 0,
    pcosB: pcosCarbLevel(combo, allIng, 'desayuno'), pcosD: pcosCarbLevel(combo, allIng, 'cena'),
    up: cap.upKcal, oil: cap.oilKcal ?? 0, mc: cap.costPerKcal * n, mp: cap.protPerKcal, floor: cap.floor,
  }
}

function pools(allCombos, allIng, people, seed) {
  const all = Object.entries(allCombos).filter(([k, c]) => c?.items?.length && !EXCLUDE_KEYS.has(k) && !hasPowder(c))
  const stat = {}
  const of = slot => all.filter(([, c]) => (c.meals ?? []).includes(slot)).map(([k, c]) => (stat[k] ??= dishStats(k, c, allIng, seed)))
  const L = of('comida'), D = of('cena'), B = of('desayuno'), S = of('merienda')
  const per = {}
  for (const p of people) {
    let b = B.filter(d => d.kcal < 900)
    if (p.digestive) b = b.filter(d => d.kcal >= 400 && d.fat <= 15 && !d.gos && !d.all && !d.ins)
    if (p.pcos) b = b.filter(d => d.pcosB !== 'red')
    if (!b.length) b = B
    per[p.id] = { B: b, S: S.length ? S : B }
  }
  const portable = allCombos[MARIA_MERIENDA_PORTATIL] ? (stat[MARIA_MERIENDA_PORTATIL] ?? dishStats(MARIA_MERIENDA_PORTATIL, allCombos[MARIA_MERIENDA_PORTATIL], allIng, seed)) : null
  return { L, D, per, portable }
}

function portableDays(p) { return p.id === 'maria' ? MARIA_NO_BATIDO_CASERO : [] }

// ── Fase 1: modelo rápido de un día de una persona ──────────────────────────
// Imita personMealScale: si sobra, comida y cena se reducen (hasta el 55 %);
// si falta, crece la base de la comida, luego la de la cena, luego AOVE.
function fastDay(p, target, b, s, l, d) {
  const need = target - b.kcal - s.kcal
  const base = l.kcal + d.kcal
  let cost = b.cost + s.cost, prot = b.prot + s.prot, short = 0
  if (need <= base) {
    const f = Math.max(l.floor, need / base)
    cost += (l.cost + d.cost) * f; prot += (l.prot + d.prot) * f
    const over = base * f - need
    if (over > target * 0.05) short = over - target * 0.05
  } else {
    let extra = need - base
    const uL = Math.min(extra, l.up); extra -= uL
    const uD = Math.min(extra, d.up); extra -= uD
    const oil = Math.min(extra, l.oil + d.oil); extra -= oil
    cost += l.cost + d.cost + uL * l.mc + uD * d.mc
    prot += l.prot + d.prot + uL * l.mp + uD * d.mp
    if (extra > target * 0.05) short = extra - target * 0.05
  }
  return { cost, prot, short }
}

function dayPenalty(p, ctx, b, s, l, d, cost, prot, short) {
  let pen = short * W.kcalPer
  const sol = b.sol + s.sol + l.sol + d.sol
  if (sol < ctx.solMin) pen += (ctx.solMin - sol) * W.solPerG
  const veg = b.veg + s.veg + l.veg + d.veg
  if (veg < ctx.vegMin) pen += (ctx.vegMin - veg) * W.vegPerG
  if (p.proteinTarget && prot < p.proteinTarget) pen += (p.proteinTarget - prot) * W.protLowPerG
  if (p.protCap && prot > p.protCap) pen += (prot - p.protCap) * W.protHighPerG
  if (p.pcos) pen += d.pcosD === 'red' ? W.pcosRed : d.pcosD === 'yellow' ? W.pcosYellow : 0
  if (p.digestive) {
    for (const f of ['gos', 'all', 'ins']) if (b[f] + s[f] + l[f] + d[f] > DIGESTIVE_MAX_PER_DAY) pen += W.hard
  }
  let bonus = 0
  if (ctx.priority === 'protein') bonus = prot * BONUS.protein
  if (ctx.priority === 'veg') bonus = veg * BONUS.veg
  return cost + pen - bonus
}

// Mejor desayuno+merienda de una persona para una pareja comida/cena en una
// parte de la semana. Devuelve { score, b, s }.
function bestForPerson(p, days, ctx, pool, portable, l, d) {
  const port = portableDays(p)
  let best = null
  for (const b of pool.B) {
    for (const s of pool.S) {
      let score = 0
      for (const i of days) {
        const sn = portable && port.includes(i) ? portable : s
        const t = personTargetForDay(p, i)
        const f = fastDay(p, t, b, sn, l, d)
        score += dayPenalty(p, ctx, b, sn, l, d, f.cost, f.prot, f.short)
      }
      if (!best || score < best.score) best = { score, b, s }
    }
  }
  return best
}

function pairsForPart(part, ctx, P, people) {
  const days = PARTS[part]
  const out = []
  let tried = 0
  for (const l of P.L) {
    for (const d of P.D) {
      if (l.fam === d.fam) continue
      // Regla digestiva que ya se ve sin desayuno ni merienda.
      if (people.some(p => p.digestive) && (l.gos + d.gos > DIGESTIVE_MAX_PER_DAY || l.all + d.all > DIGESTIVE_MAX_PER_DAY || l.ins + d.ins > DIGESTIVE_MAX_PER_DAY)) continue
      let score = 0
      const choice = {}
      for (const p of people) {
        const pool = P.per[p.id]
        const bst = bestForPerson(p, days, ctx, pool, P.portable, l, d)
        tried += pool.B.length * pool.S.length
        score += bst.score
        choice[p.id] = { b: bst.b.key, s: bst.s.key }
      }
      score += (ctx.avoid.has(l.key) ? W.reuse : 0) + (ctx.avoid.has(d.key) ? W.reuse : 0)
      out.push({ l: l.key, d: d.key, lf: l.fam, df: d.fam, score, choice })
    }
  }
  out.sort((a, b) => a.score - b.score)
  // Variedad: como mucho 3 parejas con el mismo plato de comida o de cena.
  const nL = {}, nD = {}, top = []
  for (const x of out) {
    if ((nL[x.lf] ?? 0) >= 3 || (nD[x.df] ?? 0) >= 3) continue
    nL[x.lf] = (nL[x.lf] ?? 0) + 1; nD[x.df] = (nD[x.df] ?? 0) + 1
    top.push(x)
    if (top.length >= TOP_PAIRS) break
  }
  return { top, tried }
}

// ── Semana → huecos del planificador ────────────────────────────────────────
export function planToSlots(plan, people, allCombos) {
  const meal = k => ({ type: 'desayuno', recipeKey: k })
  const slots = {}
  DAY_KEYS.forEach((dk, i) => {
    const part = i < 5 ? 0 : 1
    slots[`${dk}-comida`] = meal(plan.L[part])
    slots[`${dk}-cena`] = meal(plan.D[part])
    slots[`${dk}-desayuno`] = makeByPersonSlot(Object.fromEntries(people.map(p => [p.id, meal(plan.B[p.id][part])])))
    slots[`${dk}-merienda`] = makeByPersonSlot(Object.fromEntries(people.map(p => {
      const port = part === 0 && portableDays(p).includes(i) && allCombos[MARIA_MERIENDA_PORTATIL]
      return [p.id, meal(port ? MARIA_MERIENDA_PORTATIL : plan.S[p.id][part])]
    })))
  })
  return slots
}

// ── Fase 2: motor real ──────────────────────────────────────────────────────
const DAY_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function listDays(ix) {
  if (ix.length === 7) return 'every day'
  if (ix.join() === '0,1,2,3,4') return 'Mon–Fri'
  if (ix.join() === '5,6') return 'the weekend'
  return ix.map(i => DAY_EN[i]).join(', ')
}

export function evaluatePlan(plan, people, allIng, allCombos, ctx) {
  const slots = planToSlots(plan, people, allCombos)
  let cost = 0, score = 0
  const issues = { veg: [], sol: [], dig: [], protLow: [], protHigh: [], kcal: [] }
  const perPerson = people.map(p => {
    let kcal = 0, tgt = 0, prot = 0, veg = 0, sol = 0, hit = 0
    DAY_KEYS.forEach((dk, i) => {
      const day = dayForPerson(slots, dk, p.id)
      const t = dayTotals(day, p, i, allIng, allCombos)
      const c = Object.fromEntries(Object.entries(day).map(([m, v]) => [m, v ? allCombos[v.recipeKey] : null]))
      const dishes = Object.values(c).filter(Boolean)
      const daySol = dishes.reduce((s, x) => s + comboFibSol(x, allIng), 0)
      const dayVeg = dishes.reduce((s, x) => s + dishVegGrams(x, allIng), 0)
      cost += t.cost; kcal += t.kcal; tgt += t.target; prot += t.prot; veg += dayVeg; sol += daySol
      const off = Math.abs(t.kcal - t.target)
      if (off <= t.target * 0.05) hit++; else issues.kcal.push([p, i])
      let pen = off > t.target * 0.05 ? (off - t.target * 0.05) * W.kcalPer : 0
      if (daySol < ctx.solMin) { pen += (ctx.solMin - daySol) * W.solPerG; issues.sol.push([p, i]) }
      if (dayVeg < ctx.vegMin) { pen += (ctx.vegMin - dayVeg) * W.vegPerG; issues.veg.push([p, i]) }
      if (p.proteinTarget && t.prot < p.proteinTarget) { pen += (p.proteinTarget - t.prot) * W.protLowPerG; issues.protLow.push([p, i]) }
      if (p.protCap && t.prot > p.protCap) { pen += (t.prot - p.protCap) * W.protHighPerG; issues.protHigh.push([p, i]) }
      if (p.pcos && c.cena) { const lv = pcosCarbLevel(c.cena, allIng, 'cena'); pen += lv === 'red' ? W.pcosRed : lv === 'yellow' ? W.pcosYellow : 0 }
      if (p.digestive) {
        for (const test of [dishHasGOS, dishHasAllium, dishHasInsolubleFiber]) {
          if (dishes.filter(test).length > DIGESTIVE_MAX_PER_DAY) { pen += W.hard; issues.dig.push([p, i]) }
        }
      }
      if (ctx.priority === 'protein') pen -= t.prot * BONUS.protein
      if (ctx.priority === 'veg') pen -= dayVeg * BONUS.veg
      score += t.cost + pen
    })
    return { p, kcal: Math.round(kcal / 7), target: Math.round(tgt / 7), prot: Math.round(prot / 7), veg: Math.round(veg / 7), sol: +(sol / 7).toFixed(1), hit }
  })

  // Avisos legibles, agrupados por días.
  const warnings = []
  const group = (list, text) => {
    const byP = {}
    for (const [p, i] of list) (byP[p.name] ??= new Set()).add(i)
    for (const [name, set] of Object.entries(byP)) warnings.push(text(name, listDays([...set].sort())))
  }
  group(issues.dig, (n, d) => `${n}: legumes, onion/garlic or insoluble fiber twice on ${d}`)
  group(issues.veg, (n, d) => `${n}: under ${ctx.vegMin} g of veg on ${d}`)
  group(issues.sol, (n, d) => `${n}: under ${ctx.solMin} g soluble fiber on ${d}`)
  group(issues.protHigh, (n, d) => `${n}: over the protein ceiling on ${d}`)
  group(issues.protLow, (n, d) => `${n}: under the protein target on ${d}`)
  group(issues.kcal, (n, d) => `${n}: kcal more than 5% off on ${d}`)

  return { plan, slots, cost, score, perPerson, warnings }
}

let FAM = k => k
function signature(plan) { return [plan.L[0], plan.D[0], plan.L[1], plan.D[1]].map(k => FAM(k)) }
// Alternativa de verdad: otro batch (cambia la comida o la cena de lun–vie)
// y al menos dos de los cuatro platos principales distintos.
function differs(a, b) {
  const x = signature(a), y = signature(b)
  return (x[0] !== y[0] || x[1] !== y[1]) && x.filter((k, i) => k !== y[i]).length >= 2
}

/**
 * Genera las mejores semanas.
 * opts: { priority: 'price'|'protein'|'veg', vegMin, seed, avoid: [recipeKey], count }
 * Devuelve { results: [evaluatePlan…], tried, ms }.
 */
export function generateSmartWeeks({ allIng, allCombos, people, priority = 'price', vegMin = VEG_DAILY_MIN, seed = 0, avoid = [], count = 3 }) {
  const t0 = performance.now()
  const ctx = { priority, vegMin, solMin: SOLUBLE_FIBER_DAILY_MIN, avoid: new Set(avoid) }
  if (!people.length) return { results: [], tried: 0, ms: 0 }
  const P = pools(allCombos, allIng, people, seed)
  FAM = k => familyOf(allCombos[k]?.name)
  if (!P.L.length || !P.D.length) return { results: [], tried: 0, ms: 0 }

  const wd = pairsForPart(0, ctx, P, people)
  const we = pairsForPart(1, ctx, P, people)

  // Combinar: el fin de semana no repite los platos de entre semana.
  const combos = []
  for (const a of wd.top) {
    for (const b of we.top) {
      if (new Set([a.lf, a.df, b.lf, b.df]).size < 4) continue
      combos.push({ a, b, score: a.score + b.score })
    }
  }
  combos.sort((x, y) => x.score - y.score)

  const toPlan = ({ a, b }) => ({
    L: [a.l, b.l], D: [a.d, b.d],
    B: Object.fromEntries(people.map(p => [p.id, [a.choice[p.id].b, b.choice[p.id].b]])),
    S: Object.fromEntries(people.map(p => [p.id, [a.choice[p.id].s, b.choice[p.id].s]])),
  })

  // Motor real sobre los mejores candidatos, buscando variedad entre ellos.
  const exact = []
  const seen = new Set()
  for (const c of combos) {
    const sig = signature(toPlan(c)).join('|')
    if (seen.has(sig)) continue
    seen.add(sig)
    exact.push(evaluatePlan(toPlan(c), people, allIng, allCombos, ctx))
    if (exact.length >= 60) break
  }
  exact.sort((x, y) => x.score - y.score)
  const results = []
  for (const r of exact) {
    if (results.every(o => differs(o.plan, r.plan))) results.push(r)
    if (results.length >= count) break
  }
  return { results, tried: wd.tried + we.tried, ms: Math.round(performance.now() - t0) }
}
