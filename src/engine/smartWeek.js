// ─── Semana inteligente ─────────────────────────────────────────────────────
// Genera el lunes–viernes (lo que cubre el batch del domingo) con los precios
// de ese momento. El fin de semana no se planifica: el coste semanal se da
// como referencia (×7/5), pero nada del plan cuenta con sábado ni domingo.
//
// Estructura: comida y cena son un plato cada una para los 5 días (una olla
// cada una); desayuno y merienda van por persona (la merienda de cada uno
// puede ser cualquiera, también los días de trabajo fuera).
//
// Dos fases, para que sea rápido también en el móvil:
//   1. Modelo rápido: con las cifras de cada plato se prueban TODAS las
//      parejas comida+cena y, para cada una, todos los desayunos y meriendas
//      de cada persona (cientos de miles de combinaciones en ~100 ms).
//   2. Motor real: las mejores se calculan con el mismo motor que el resto de
//      la app (raciones escaladas por persona y día) y se ordenan de nuevo.
//
// Reglas (lo que no se puede romper cuesta mucho en la puntuación):
//   · legumbre, cebolla/ajo o fibra insoluble: como mucho 1 comida al día
//     (perfil con `digestive`);
//   · cena sin carne roja (etiqueta 'red-meat'; el solomillo es blanca);
//   · comida y cena no comparten base (patata y patata cansa);
//   · desayuno del perfil digestivo: ≥400 kcal, ≤15 g grasa, sin legumbre,
//     cebolla/ajo ni fibra insoluble;
//   · fibra soluble ≥10 g/día y verdura ≥ vegMin g/día por persona;
//   · proteína ≥ objetivo y ≤ techo (protCap); PCOS: desayuno nunca «alto».
// Paquetes y despensa (solo en la fase exacta): lo que ya hay en casa sale
// gratis; de lo que caduca en la semana (calabacín, verdura fresca) cuenta
// un 30 % de lo que sobraría del paquete; lo que aguanta (la bolsa de
// cebollas, huevos, yogur, congelados) pasa a la semana siguiente sin coste.
// Y lo que aprende: platos rechazados («Not this one») pesan menos, los que
// cargas pesan más, y no repite el batch de las 2 semanas anteriores.

import {
  comboAgg, comboFibSol, comboScaleCapacity, dishHasGOS, dishHasAllium, dishHasInsolubleFiber, dishHasTag,
  pcosCarbLevel, personTargetForDay, makeByPersonSlot,
} from './calc'
import { SOLUBLE_FIBER_DAILY_MIN, VEG_DAILY_MIN, DIGESTIVE_MAX_PER_DAY, dishVegGrams } from './weekRules'
import { DAY_KEYS, dayForPerson, dayTotals } from '../lib/mealplan'
import { starchFamily, tagsOf } from '../lib/tags'
import { aggregateIngredients, needAmount, packPlan } from '../lib/needs'
import { packOf, fmtAmount } from '../lib/packs'
import { composeDishes, isGenerated, GEN_PREFIX } from './composeDishes'
import { cuisineDishes } from './cuisines'

export const PRIORITIES = ['price', 'protein', 'veg']
export const PLAN_DAYS = [0, 1, 2, 3, 4] // lunes–viernes
const EXCLUDE_KEYS = new Set(['b-gentle-shake-bad-stomach-day', 'm-sourdough-toast-with-boiled-apple-and-honey-binding']) // para días malos de estómago
const TOP_PAIRS = 60

// Pesos de la puntuación, en dólares equivalentes.
const W = {
  hard: 40,           // regla digestiva rota (por día)
  solPerG: 1.0,       // por g de fibra soluble que falte (por persona y día)
  vegPerG: 0.04,      // por g de verdura que falte (100 g = $4)
  protLowPerG: 0.06,  // por g por debajo del objetivo
  protHighPerG: 0.15, // por g por encima del techo
  kcalPer: 0.02,      // por kcal fuera del ±5 % que no se pueda cerrar
  pcosRed: 2.5, pcosYellow: 0.5,
  sameBase: 3,        // comida y cena con la misma base (por persona y día)
  recent: 4,          // plato del batch de las 2 semanas anteriores (por semana)
  pref: 2.5,          // por punto de gusto (−: rechazado, +: cargado), por semana
  reuse: 8,           // plato (o variante) ya enseñado en «New ideas»
  waste: 0.3,         // por $ de paquete fresco que sobraría y se tiraría
  pantry: 1,          // por $ de despensa que se gasta (ya está pagado)
  sameVeg: 0.5,       // comida y cena con la misma verdura (por verdura, persona y día)
}
const BONUS = { protein: 0.02, veg: 0.012 } // por g, según la prioridad

// ── Semillas y ruido reproducible (para «New ideas») ────────────────────────
function hash(str) { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
function noise(seed, key, amp) { if (!seed) return 1; const x = hash(seed + ':' + key) / 4294967295; return 1 + (x * 2 - 1) * amp }

function hasPowder(c) { return (c.items ?? []).some(it => it.k === 'whey-protein') }
// «Aragonese rancho stew (cheap)» y «(XL)» son el mismo plato para la variedad.
export function familyOf(name = '') { return name.split(' (')[0].trim().toLowerCase() }
// Familia por clave: los platos compuestos se agrupan por su proteína (así
// «Not this one» y «New ideas» cambian de verdad de plato, no solo la base).
function famOfKey(k, allCombos) {
  if (isGenerated(k)) return 'gen:' + k.slice(GEN_PREFIX.length).split('+')[0]
  return familyOf(allCombos[k]?.name)
}
function prefOf(prefs, key) { return Math.max(-3, Math.min(3, prefs?.[key] ?? 0)) }
function basesOf(combo, allIng) {
  return new Set((combo?.items ?? []).filter(it => (it.p?.grams ?? 0) >= 30).map(it => starchFamily(it.k, allIng)).filter(Boolean))
}

// ── Fase 0: cifras de cada plato ────────────────────────────────────────────
function dishStats(key, combo, allIng, seed) {
  const a = comboAgg(combo, allIng)
  const cap = comboScaleCapacity(combo, allIng)
  const n = noise(seed, key, 0.15)
  return {
    key, name: combo.name, fam: isGenerated(key) ? famOfKey(key) : familyOf(combo.name), kcal: a.kcal, cost: a.cost * n, prot: a.prot ?? 0, fat: a.fat ?? 0,
    sol: comboFibSol(combo, allIng), veg: dishVegGrams(combo, allIng), bases: basesOf(combo, allIng),
    gos: dishHasGOS(combo, allIng) ? 1 : 0, all: dishHasAllium(combo, allIng) ? 1 : 0, ins: dishHasInsolubleFiber(combo, allIng) ? 1 : 0,
    red: dishHasTag(combo, 'red-meat', allIng),
    pcosB: pcosCarbLevel(combo, allIng, 'desayuno'), pcosD: pcosCarbLevel(combo, allIng, 'cena'),
    up: cap.upKcal, oil: cap.oilKcal ?? 0, mc: cap.costPerKcal * n, mp: cap.protPerKcal, floor: cap.floor,
  }
}

function pools(allCombos, allIng, people, ctx) {
  const all = Object.entries(allCombos).filter(([k, c]) => c?.items?.length && !EXCLUDE_KEYS.has(k) && !hasPowder(c))
  const stat = {}
  const st = k => (stat[k] ??= dishStats(k, allCombos[k], allIng, ctx.seed))
  const of = slot => all.filter(([k, c]) => (c.meals ?? []).includes(slot) && !ctx.exclude.has(k)).map(([k]) => st(k))
  // Por ingredientes: comida y cena solo de los platos compuestos.
  const main = slot => ctx.poolKeys ? of(slot).filter(d => ctx.poolKeys.has(d.key)) : of(slot)
  const lock = (list, k) => k && allCombos[k] ? [st(k)] : list
  // «New ideas»: lo ya enseñado como comida no vuelve como comida (ni en
  // variante) mientras queden alternativas de sobra; igual con la cena.
  const fresh = (list, seen) => { const f = list.filter(d => !seen.has(d.fam)); return f.length >= 6 ? f : list }
  const L = lock(fresh(main('comida'), ctx.shownL), ctx.locks.L)
  const D = lock(fresh(main('cena').filter(d => !d.red), ctx.shownD), ctx.locks.D) // cena sin carne roja
  const B = of('desayuno'), S = of('merienda')
  const per = {}
  for (const p of people) {
    let b = B.filter(d => d.kcal < 900)
    if (p.digestive) b = b.filter(d => d.kcal >= 400 && d.fat <= 15 && !d.gos && !d.all && !d.ins)
    if (p.pcos) b = b.filter(d => d.pcosB !== 'red')
    if (!b.length) b = B
    per[p.id] = { B: lock(b, ctx.locks.B?.[p.id]), S: lock(S.length ? S : B, ctx.locks.S?.[p.id]) }
  }
  return { L, D, per }
}

// ── Fase 1: modelo rápido de un día de una persona ──────────────────────────
// Imita personMealScale: si sobra, comida y cena se reducen (hasta el 55 %);
// si falta, crece la base de la comida, luego la de la cena, luego AOVE.
function fastDay(target, b, s, l, d) {
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

// Mejor desayuno+merienda de una persona para una pareja comida/cena.
function bestForPerson(p, ctx, pool, l, d) {
  let best = null
  for (const b of pool.B) {
    for (const s of pool.S) {
      let score = W.pref * (-prefOf(ctx.prefs, b.key) - prefOf(ctx.prefs, s.key)) / 2 + (ctx.jit(b.key) + ctx.jit(s.key)) / 2
      for (const i of PLAN_DAYS) {
        const f = fastDay(personTargetForDay(p, i), b, s, l, d)
        score += dayPenalty(p, ctx, b, s, l, d, f.cost, f.prot, f.short)
      }
      if (!best || score < best.score) best = { score, b, s }
    }
  }
  return best
}

function sharedBase(l, d) { for (const f of l.bases) if (d.bases.has(f)) return f; return null }

function rankPairs(ctx, P, people) {
  const out = []
  let tried = 0
  const digestive = people.some(p => p.digestive)
  for (const l of P.L) {
    for (const d of P.D) {
      if (l.fam === d.fam) continue
      if (ctx.shown.has(`${l.key}|${d.key}`) || ctx.shownFamPairs.has(`${l.fam}|${d.fam}`)) continue // «New ideas» no repite
      if (digestive && (l.gos + d.gos > DIGESTIVE_MAX_PER_DAY || l.all + d.all > DIGESTIVE_MAX_PER_DAY || l.ins + d.ins > DIGESTIVE_MAX_PER_DAY)) continue
      let score = 0
      const choice = {}
      for (const p of people) {
        const pool = P.per[p.id]
        const bst = bestForPerson(p, ctx, pool, l, d)
        tried += pool.B.length * pool.S.length
        score += bst.score
        choice[p.id] = { b: bst.b.key, s: bst.s.key }
      }
      if (sharedBase(l, d)) score += W.sameBase * PLAN_DAYS.length * people.length
      for (const x of [l, d]) {
        score += ctx.jit(x.key)
        if (ctx.recent.has(x.key) || ctx.recentFam.has(x.fam)) score += W.recent
        if (ctx.shownFam.has(x.fam)) score += W.reuse
        score -= W.pref * prefOf(ctx.prefs, x.key)
      }
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

// ── Plan → huecos del planificador (solo lunes–viernes) ─────────────────────
export function planToSlots(plan, people, allCombos) {
  const meal = k => ({ type: 'desayuno', recipeKey: k })
  const slots = {}
  PLAN_DAYS.forEach(i => {
    const dk = DAY_KEYS[i]
    slots[`${dk}-comida`] = meal(plan.L)
    slots[`${dk}-cena`] = meal(plan.D)
    slots[`${dk}-desayuno`] = makeByPersonSlot(Object.fromEntries(people.map(p => [p.id, meal(plan.B[p.id])])))
    slots[`${dk}-merienda`] = makeByPersonSlot(Object.fromEntries(people.map(p => [p.id, meal(plan.S[p.id])])))
  })
  return slots
}

// ── Fase 2: motor real ──────────────────────────────────────────────────────
const DAY_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
function listDays(ix) {
  if (ix.join() === '0,1,2,3,4') return 'Mon–Fri'
  return ix.map(i => DAY_EN[i]).join(', ')
}

export function evaluatePlan(plan, people, allIng, allCombos, ctx) {
  const slots = planToSlots(plan, people, allCombos)
  let cost = 0, score = 0
  const issues = { veg: [], sol: [], dig: [], protLow: [], protHigh: [], kcal: [] }
  const perPerson = people.map(p => {
    let kcal = 0, tgt = 0, prot = 0, veg = 0, sol = 0, hit = 0
    PLAN_DAYS.forEach(i => {
      const dk = DAY_KEYS[i]
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
          if (dishes.filter(x => test(x, allIng)).length > DIGESTIVE_MAX_PER_DAY) { pen += W.hard; issues.dig.push([p, i]) }
        }
      }
      if (ctx.priority === 'protein') pen -= t.prot * BONUS.protein
      if (ctx.priority === 'veg') pen -= dayVeg * BONUS.veg
      score += t.cost + pen
    })
    const n = PLAN_DAYS.length
    return { p, kcal: Math.round(kcal / n), target: Math.round(tgt / n), prot: Math.round(prot / n), veg: Math.round(veg / n), sol: +(sol / n).toFixed(1), hit }
  })

  // Lo que no depende del día.
  const lc = allCombos[plan.L], dc = allCombos[plan.D]
  const lb = basesOf(lc, allIng), db = basesOf(dc, allIng)
  const base = [...lb].find(f => db.has(f))
  if (base) score += W.sameBase * PLAN_DAYS.length * people.length
  const vegOf = c => new Set((c?.items ?? []).filter(it => (it.p?.grams ?? 0) >= 60 && tagsOf(it.k, allIng).includes('veg')).map(it => it.k))
  const lv = vegOf(lc), sharedVeg = [...vegOf(dc)].filter(k => lv.has(k))
  score += W.sameVeg * sharedVeg.length * PLAN_DAYS.length * people.length
  const jit = ctx.jit ?? (() => 0)
  score += jit(plan.L) + jit(plan.D) + people.reduce((t, p) => t + (jit(plan.B[p.id]) + jit(plan.S[p.id])) / 2, 0)
  for (const k of [plan.L, plan.D]) {
    if (ctx.recent.has(k) || ctx.recentFam.has(famOfKey(k, allCombos))) score += W.recent
    score -= W.pref * prefOf(ctx.prefs, k)
  }

  const pk = packScore(slots, people, allIng, allCombos, ctx.stock ?? {})
  score += W.waste * pk.waste - W.pantry * pk.pantry

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
  if (base) warnings.push(`Lunch and dinner share the same base (${base})`)
  if (dishHasTag(dc, 'red-meat', allIng)) warnings.push('Red meat at dinner')

  return { plan, slots, cost, weekCost: cost * 7 / PLAN_DAYS.length, score, perPerson, warnings, packs: pk }
}

// Cuánto de la despensa usa esta semana y cuánto de lo fresco se tiraría.
function packScore(slots, people, allIng, allCombos, stock) {
  const windowDates = PLAN_DAYS.map(i => ({ date: null, wk: 'W', dayKey: DAY_KEYS[i] }))
  const agg = aggregateIngredients({ weekPlan: { W: slots }, windowDates, people, allIng, allCombos })
  let waste = 0, pantry = 0
  const fromPantry = [], leftovers = []
  for (const [k, data] of Object.entries(agg)) {
    const ing = allIng[k]
    const pack = packOf(ing)
    if (!pack || pack.price == null) continue
    const need = needAmount(data, ing, pack)
    if (!(need > 0)) continue
    const pp = packPlan(k, need, stock[k] ?? 0, allIng)
    if (pp.use > 0) { pantry += pp.use * pp.unitPrice; fromPantry.push({ k, name: ing.name, amount: pp.use, dim: pack.dim, value: pp.use * pp.unitPrice }) }
    if (pp.packs > 0 && pp.leftover > pack.amount * 0.03) {
      const used = pp.toBuy / (pp.packs * pack.amount)
      if (pp.keeps === 'week') waste += pp.leftover * pp.unitPrice
      leftovers.push({ k, name: ing.name, used, amount: pp.leftover, dim: pack.dim, keeps: pp.keeps, value: pp.leftover * pp.unitPrice })
    }
  }
  fromPantry.sort((a, b) => b.value - a.value)
  leftovers.sort((a, b) => (a.keeps === 'week' ? 0 : 1) - (b.keeps === 'week' ? 0 : 1) || b.value - a.value)
  const notes = []
  if (fromPantry.length) notes.push(`From the pantry: ${fromPantry.slice(0, 4).map(x => `${x.name} ${fmtAmount(x.amount, x.dim)}`).join(', ')}${fromPantry.length > 4 ? ` +${fromPantry.length - 4}` : ''}`)
  for (const x of leftovers.filter(x => x.keeps === 'week' && x.value >= 0.5).slice(0, 3)) notes.push(`${x.name}: uses ${Math.round(x.used * 100)}% of the pack — ${fmtAmount(x.amount, x.dim)} would go to waste`)
  const carry = leftovers.filter(x => x.keeps === 'weeks' && x.value >= 1)
  if (carry.length) notes.push(`Carries over to next week: ${carry.slice(0, 3).map(x => `${x.name} ${fmtAmount(x.amount, x.dim)}`).join(', ')}`)
  return { waste, pantry, notes }
}

// Alternativas de verdad: no repiten la pareja (ni en variante) y cada plato
// comida distinta en cada opción (la cena puede repetirse una vez).
function pickDiverse(exact, count, fam, locked) {
  const out = [], nL = {}, nD = {}
  for (const r of exact) {
    const lf = fam(r.plan.L), df = fam(r.plan.D)
    if (out.some(o => fam(o.plan.L) === lf && fam(o.plan.D) === df)) continue
    if (!locked.L && (nL[lf] ?? 0) >= 1) continue
    if (!locked.D && (nD[df] ?? 0) >= 2) continue
    nL[lf] = (nL[lf] ?? 0) + 1; nD[df] = (nD[df] ?? 0) + 1
    out.push(r)
    if (out.length >= count) break
  }
  return out
}

/**
 * Genera las mejores semanas (lunes–viernes).
 * opts: priority 'price'|'protein'|'veg' · vegMin · seed (para «New ideas»)
 *       shown ['L|D'] parejas ya enseñadas · exclude [recipeKey] · prefs {key: n}
 *       recent [recipeKey] del batch de las 2 semanas anteriores
 *       locks { L, D, B: {pid}, S: {pid} } para cambiar solo un plato
 *       stock { ingKey: amount } despensa disponible (sin lo caducado)
 *       source 'dishes' (catálogo) | 'ingredients' (platos compuestos, ver composeDishes)
 * Devuelve { results: [evaluatePlan…], tried, ms }.
 */
export function generateSmartWeeks({
  allIng, allCombos, people, priority = 'price', vegMin = VEG_DAILY_MIN, seed = 0,
  shown = [], exclude = [], prefs = {}, recent = [], locks = {}, stock = {}, source = 'dishes', country = null, count = 3,
}) {
  const t0 = performance.now()
  // Fuentes de comidas y cenas:
  //   dishes      → el catálogo (y tus platos);
  //   ingredients → platos compuestos de ingredientes (composeDishes);
  //   country     → recetas de un país (cuisines.js), hechas con tus ingredientes;
  //   surprise    → compuestos + recetas del mundo, al azar: sin prioridad, con las reglas.
  // Solo «dishes» usa las comidas y cenas del catálogo; desayunos y meriendas
  // salen siempre del catálogo.
  let generated = null, poolKeys = null
  if (source === 'ingredients') {
    generated = composeDishes(allIng, allCombos, { stock })
    poolKeys = new Set(Object.keys(generated))
  } else if (source === 'country') {
    generated = cuisineDishes(allIng, country)
    poolKeys = new Set(Object.keys(generated))
  } else if (source === 'surprise') {
    generated = { ...composeDishes(allIng, allCombos, { stock, limit: 40 }), ...cuisineDishes(allIng) }
    // Cada «Surprise» saca al azar unos 45 de esos platos (rápido también en
    // el móvil, y cada vez distinto).
    const all = Object.keys(generated)
    const share = Math.min(1, 45 / Math.max(1, all.length))
    poolKeys = new Set(all.filter(k => hash(`${seed}:pick:${k}`) / 4294967295 < share))
    for (const k of [locks.L, locks.D]) if (k) poolKeys.add(k)
  }
  if (generated) allCombos = { ...allCombos, ...generated }
  // Azar reproducible por semilla: en «surprise» pesa tanto como el precio.
  const amp = source === 'surprise' ? 12 : source === 'country' ? 3 : 0
  const jit = amp ? k => (k ? (hash(`${seed}:j:${k}`) / 4294967295 * 2 - 1) * amp : 0) : () => 0
  const ctx = {
    priority: source === 'surprise' || source === 'country' ? 'price' : priority, vegMin, seed, prefs, locks, stock, source, poolKeys, jit, solMin: SOLUBLE_FIBER_DAILY_MIN,
    shown: new Set(shown), exclude: new Set(exclude), recent: new Set(recent),
    recentFam: new Set(recent.map(k => famOfKey(k, allCombos)).filter(Boolean)),
  }
  const fam = k => famOfKey(k, allCombos)
  ctx.shownFamPairs = new Set(shown.map(x => x.split('|').map(fam).join('|')))
  ctx.shownFam = new Set(shown.flatMap(x => x.split('|')).map(fam))
  ctx.shownL = new Set(shown.map(x => fam(x.split('|')[0])))
  ctx.shownD = new Set(shown.map(x => fam(x.split('|')[1])))
  if (locks.L) ctx.shownFam.delete(fam(locks.L))
  if (locks.D) ctx.shownFam.delete(fam(locks.D))
  if (!people.length) return { results: [], tried: 0, ms: 0 }
  const P = pools(allCombos, allIng, people, ctx)
  if (!P.L.length || !P.D.length) return { results: [], tried: 0, ms: 0 }

  const { top, tried } = rankPairs(ctx, P, people)
  const exact = top.slice(0, 40).map(x => evaluatePlan({
    L: x.l, D: x.d,
    B: Object.fromEntries(people.map(p => [p.id, x.choice[p.id].b])),
    S: Object.fromEntries(people.map(p => [p.id, x.choice[p.id].s])),
  }, people, allIng, allCombos, ctx))
  exact.sort((x, y) => x.score - y.score)
  const results = pickDiverse(exact, count, fam, locks)
  // Los platos compuestos que usa cada opción viajan con ella (para poder
  // enseñarlos y guardarlos como platos tuyos al cargar la semana).
  if (generated) for (const r of results) r.newDishes = Object.fromEntries([r.plan.L, r.plan.D].filter(k => generated[k]).map(k => [k, generated[k]]))
  return { results, tried, ms: Math.round(performance.now() - t0), composed: generated ? Object.keys(generated).length : 0 }
}
