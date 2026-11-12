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
// Paquetes y despensa (solo en la fase exacta): la despensa NO abarata el plato (vale lo mismo);
// de lo que caduca en la semana (calabacín, verdura fresca) cuenta
// un 30 % de lo que sobraría del paquete; lo que aguanta (la bolsa de
// cebollas, huevos, yogur, congelados) pasa a la semana siguiente sin coste.
// Y lo que aprende: platos rechazados («Not this one») pesan menos, los que
// cargas pesan más, y no repite el batch de las 2 semanas anteriores.

import {
  glycemicCheck, comboAgg, comboFibSol, comboScalableKey, comboScaleCapacity, dishHasGOS, dishHasAllium, dishHasInsolubleFiber, dishHasTag,
  pcosCarbLevel, personTargetForDay, makeByPersonSlot,
} from './calc'
import { SOLUBLE_FIBER_DAILY_MIN, VEG_DAILY_MIN, DIGESTIVE_MAX_PER_DAY, dishVegGrams } from './weekRules'
import { DAY_KEYS, dayForPerson, dayTotals } from '../lib/mealplan'
import { hasPasta, starchFamily, tagsOf } from '../lib/tags'
import { aggregateIngredients, needAmount, packPlan } from '../lib/needs'
import { packOf, fmtAmount } from '../lib/packs'
import { composeDishes, isGenerated, GEN_PREFIX } from './composeDishes'
import { batchLunchDishes, isBatchLunchDish, isBatchLunchSource } from './batchLunchDishes'
import { cuisineDishes } from './cuisines'
import { rangeLabel } from '../lib/batchConfig'
import { smartSnackCandidates } from './snackGen'

export const PRIORITIES = ['price', 'protein', 'veg']
export const PLAN_DAYS = [0, 1, 2, 3, 4] // por defecto lunes–viernes; los de verdad vienen de Ajustes (ctx.days)
const EXCLUDE_KEYS = new Set(['b-gentle-shake-bad-stomach-day', 'm-sourdough-toast-with-boiled-apple-and-honey-binding']) // para días malos de estómago
const TOP_PAIRS = 60
const INGREDIENT_DISH_LIMIT = 200
const SNACK_VARIETY_SLACK = 4   // how much worse (in «dollars» of score) an option may get to show a different snack

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
    red: dishHasTag(combo, 'red-meat', allIng), pasta: hasPasta(combo, allIng),
    pcosB: pcosCarbLevel(combo, allIng, 'desayuno'), pcosD: pcosCarbLevel(combo, allIng, 'cena'),
    starch: cap.key,
    missingStarchGI: !!cap.key && allIng[cap.key]?.gi == null,
    dinnerBase: cap.key ? starchFamily(cap.key, allIng) ?? cap.key : null,
    up: cap.upKcal, oil: cap.oilKcal ?? 0, mc: cap.costPerKcal * n, mp: cap.protPerKcal, floor: cap.floor,
  }
}

function pools(allCombos, allIng, people, ctx) {
  const all = Object.entries(allCombos).filter(([k, c]) => c?.items?.length && !EXCLUDE_KEYS.has(k) && !hasPowder(c) && !c.date) // las de cita, aparte
  const stat = {}
  // Snack recipes built from ingredients (engine/snackGen.js): each one sized for ONE person, so they
  // go only into that person's snack pool, not into the shared `all` list.
  const withSnacks = ctx.snackPool ? { ...allCombos, ...ctx.snackPool.combos } : allCombos
  const st = k => (stat[k] ??= dishStats(k, withSnacks[k], allIng, ctx.seed))
  const of = slot => all.filter(([k, c]) => (c.meals ?? []).includes(slot) && !ctx.exclude.has(k)).map(([k]) => st(k))
  const main = slot => {
    const list = of(slot)
    if (!ctx.poolKeys || (isBatchLunchSource(ctx.source) && slot === 'cena')) return list
    return list.filter(d => ctx.poolKeys.has(d.key))
  }
  const lock = (list, k) => k && withSnacks[k] ? [st(k)] : list
  // «New ideas»: lo ya enseñado como comida no vuelve como comida (ni en
  // variante) mientras queden alternativas de sobra; igual con la cena.
  const fresh = (list, seen) => { const f = list.filter(d => !seen.has(d.fam)); return f.length >= 6 ? f : list }
  const L = lock(fresh(main('comida'), ctx.shownL), ctx.locks.L)
  const canDine = d => !d.red && !isBatchLunchDish(d.key)
  const D = lock(fresh(main('cena').filter(canDine), ctx.shownD), ctx.locks.D).filter(canDine)
  const B = of('desayuno'), S = of('merienda')
  const per = {}
  for (const p of people) {
    let b = B.filter(d => d.kcal < 900)
    if (p.digestive) b = b.filter(d => d.kcal >= 400 && d.fat <= 15 && !d.gos && !d.all && !d.ins)
    if (p.pcos) b = b.filter(d => d.pcosB !== 'red')
    if (!b.length) b = B
    const mine = (ctx.snackPool?.byPerson?.[p.id] ?? []).filter(k => !ctx.exclude.has(k)).map(st)
    const personalSnack = key => {
      if (withSnacks[key]?.ownerId) return withSnacks[key].ownerId === p.id
      const combo = withSnacks[key]
      if (combo?.snack || combo?.snackGenerated) {
        const owner = people.find(person => combo.name.endsWith(' · ' + person.name))
        if (owner) return owner.id === p.id
      }
      const id = combo?.customId
      return !id?.startsWith('gen-snk-') || id.slice('gen-snk-'.length).split('-').slice(1).join('-') === p.id
    }
    const catalogS = (S.length ? S : B).filter(d => personalSnack(d.key))
    per[p.id] = { B: lock(b, ctx.locks.B?.[p.id]), S: lock(ctx.snackMode === 'new' ? mine : [...catalogS, ...mine], personalSnack(ctx.locks.S?.[p.id]) ? ctx.locks.S?.[p.id] : null) }
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
  if (p.pcos && d.missingStarchGI) pen += W.pcosRed
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
      for (const i of ctx.days) {
        const f = fastDay(personTargetForDay(p, i), b, s, l, d)
        score += dayPenalty(p, ctx, b, s, l, d, f.cost, f.prot, f.short)
      }
      if (!best || score < best.score) best = { score, b, s }
    }
  }
  return best
}

function sharedBase(l, d) { for (const f of l.bases) if (d.bases.has(f)) return f; return null }

function rankPairs(ctx, P, people, keepAll = false) {
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
      if (sharedBase(l, d)) score += W.sameBase * ctx.days.length * people.length
      for (const x of [l, d]) {
        score += ctx.jit(x.key)
        if (ctx.recent.has(x.key) || ctx.recentFam.has(x.fam)) score += W.recent
        if (ctx.shownFam.has(x.fam)) score += W.reuse
        score -= W.pref * prefOf(ctx.prefs, x.key)
      }
      out.push({ l: l.key, d: d.key, lf: l.fam, df: d.fam, starch: d.starch, score, choice })
    }
  }
  if (keepAll) return { top: out, tried }
  out.sort((a, b) => a.score - b.score)
  // Variedad: como mucho 3 parejas con el mismo plato de comida o de cena.
  const nL = {}, nD = {}, top = []
  for (const x of out) {
    if ((nL[x.lf] ?? 0) >= 3 || (nD[x.df] ?? 0) >= 3) continue
    nL[x.lf] = (nL[x.lf] ?? 0) + 1; nD[x.df] = (nD[x.df] ?? 0) + 1
    top.push(x)
    if (top.length >= TOP_PAIRS) break
  }
  // Keep alternatives that the protein-family cap would otherwise discard.
  const byBase = new Map()
  const selected = new Set(top)
  for (const pair of out) {
    const taken = byBase.get(pair.starch) ?? 0
    if (taken >= 12) continue
    byBase.set(pair.starch, taken + 1)
    selected.add(pair)
  }
  return { top: [...selected], tried }
}

// ── Plan → huecos del planificador (solo lunes–viernes) ─────────────────────
export function planToSlots(plan, people, allCombos, days = PLAN_DAYS) {
  const meal = k => ({ type: 'desayuno', recipeKey: k })
  const slots = {}
  days.forEach(i => {
    const dk = DAY_KEYS[i]
    slots[`${dk}-comida`] = meal(plan.L)
    slots[`${dk}-cena`] = meal(plan.D)
    slots[`${dk}-desayuno`] = makeByPersonSlot(Object.fromEntries(people.map(p => [p.id, meal(plan.B[p.id])])))
    slots[`${dk}-merienda`] = makeByPersonSlot(Object.fromEntries(people.map(p => [p.id, meal(plan.S[p.id])])))
  })
  return slots
}

// ── Fase 2: motor real ──────────────────────────────────────────────────────
function listDays(ix) { return rangeLabel(ix) }

export function evaluatePlan(plan, people, allIng, allCombos, ctx, { includePacks = true } = {}) {
  const days = ctx.days ?? PLAN_DAYS
  const slots = planToSlots(plan, people, allCombos, days)
  let cost = 0, score = 0
  const issues = { veg: [], sol: [], dig: [], protLow: [], protHigh: [], kcal: [], gl: [], breakfast: [], uncertain: [] }
  const daily = {}
  const perPerson = people.map(p => {
    daily[p.id] = {}
    let kcal = 0, tgt = 0, prot = 0, veg = 0, sol = 0, hit = 0
    days.forEach(i => {
      const dk = DAY_KEYS[i]
      const day = dayForPerson(slots, dk, p.id)
      const t = dayTotals(day, p, i, allIng, allCombos)
      const c = t.resolved
      const dishes = Object.values(c)
      t.prot = t.rawProtein
      const daySol = dishes.reduce((s, x) => s + comboFibSol(x, allIng), 0)
      const dayVeg = dishes.reduce((s, x) => s + dishVegGrams(x, allIng), 0)
      daily[p.id][i] = { protein: t.prot, veg: dayVeg, fiber: daySol, kcal: t.kcal, target: t.target }
      cost += t.cost; kcal += t.kcal; tgt += t.target; prot += t.prot; veg += dayVeg; sol += daySol
      const off = Math.abs(t.kcal - t.target)
      if (off <= t.target * 0.05) hit++; else issues.kcal.push([p, i])
      let pen = off > t.target * 0.05 ? (off - t.target * 0.05) * W.kcalPer : 0
      if (daySol < ctx.solMin) { pen += (ctx.solMin - daySol) * W.solPerG; issues.sol.push([p, i]) }
      if (dayVeg < ctx.vegMin) { pen += (ctx.vegMin - dayVeg) * W.vegPerG; issues.veg.push([p, i]) }
      if (p.proteinTarget && t.prot < p.proteinTarget) { pen += (p.proteinTarget - t.prot) * W.protLowPerG; issues.protLow.push([p, i]) }
      if (p.protCap && t.prot > p.protCap) { pen += (t.prot - p.protCap) * W.protHighPerG; issues.protHigh.push([p, i]) }
      if (p.pcos) {
        for (const slot of ['desayuno', 'cena']) {
          const dish = c[slot]
          if (!dish) continue
          const check = glycemicCheck(dish, allIng, slot)
          if (check.status === 'exceeded') {
            issues[slot === 'cena' ? 'gl' : 'breakfast'].push([p, i])
            pen += W.pcosRed
          } else if (check.status === 'unknown') {
            issues.uncertain.push([p, i])
            pen += W.pcosYellow
          } else if (pcosCarbLevel(dish, allIng, slot) === 'yellow') pen += W.pcosYellow
        }
      }
      if (p.digestive && c.desayuno) {
        const breakfast = comboAgg(c.desayuno, allIng)
        if (breakfast.kcal < 400 || breakfast.fat > 15 || [dishHasGOS, dishHasAllium, dishHasInsolubleFiber].some(test => test(c.desayuno, allIng))) issues.breakfast.push([p, i])
      }
      if (p.digestive) {
        for (const test of [dishHasGOS, dishHasAllium, dishHasInsolubleFiber]) {
          if (dishes.filter(x => test(x, allIng)).length > DIGESTIVE_MAX_PER_DAY) { pen += W.hard; issues.dig.push([p, i]) }
        }
      }
      if (ctx.priority === 'protein') pen -= t.prot * BONUS.protein
      if (ctx.priority === 'veg') pen -= dayVeg * BONUS.veg
      score += t.cost + pen
    })
    const n = days.length
    return { p, kcal: Math.round(kcal / n), target: Math.round(tgt / n), prot: Math.round(prot / n), veg: Math.round(veg / n), sol: +(sol / n).toFixed(1), hit }
  })

  // Lo que no depende del día.
  const lc = allCombos[plan.L], dc = allCombos[plan.D]
  const lb = basesOf(lc, allIng), db = basesOf(dc, allIng)
  const base = [...lb].find(f => db.has(f))
  if (base) score += W.sameBase * days.length * people.length
  const vegOf = c => new Set((c?.items ?? []).filter(it => (it.p?.grams ?? 0) >= 60 && tagsOf(it.k, allIng).includes('veg')).map(it => it.k))
  const lv = vegOf(lc), sharedVeg = [...vegOf(dc)].filter(k => lv.has(k))
  score += W.sameVeg * sharedVeg.length * days.length * people.length
  const jit = ctx.jit ?? (() => 0)
  score += jit(plan.L) + jit(plan.D) + people.reduce((t, p) => t + (jit(plan.B[p.id]) + jit(plan.S[p.id])) / 2, 0)
  for (const k of [plan.L, plan.D]) {
    if (ctx.recent.has(k) || ctx.recentFam.has(famOfKey(k, allCombos))) score += W.recent
    score -= W.pref * prefOf(ctx.prefs, k)
  }

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
  group(issues.gl, (n, d) => `${n}: high estimated dinner glycemic load on ${d}`)
  group(issues.kcal, (n, d) => `${n}: kcal more than 5% off on ${d}`)
  group(issues.breakfast, (n, d) => `${n}: breakfast exceeds profile limits on ${d}`)
  group(issues.uncertain, (n, d) => `${n}: incomplete GI for breakfast or dinner on ${d}`)
  const violations = Object.entries(issues).filter(([rule]) => rule !== 'uncertain').reduce((n, [rule, list]) => n + list.filter(([person]) => person.smartRequired?.[rule] !== false).length, 0)
  const uncertainty = issues.uncertain.length
  if (base) warnings.push(`Lunch and dinner share the same base (${base})`)
  if (dishHasTag(dc, 'red-meat', allIng)) warnings.push('Red meat at dinner')

  const result = { plan, slots, days, daily, violations, uncertainty, cost, weekCost: cost * 7 / days.length, score, perPerson, warnings }
  return includePacks ? withPackScore(result, people, allIng, allCombos, ctx.stock) : result
}

function withPackScore(result, people, allIng, allCombos, stock = {}) {
  const packs = packScore(result.slots, people, allIng, allCombos, stock, result.days)
  return { ...result, score: result.score + W.waste * packs.waste, packs }
}

// Cuánto de la despensa usa esta semana y cuánto de lo fresco se tiraría.
function packScore(slots, people, allIng, allCombos, stock, days) {
  const windowDates = days.map(i => ({ date: null, wk: 'W', dayKey: DAY_KEYS[i] }))
  const agg = aggregateIngredients({ weekPlan: { W: slots }, windowDates, people, allIng, allCombos })
  let waste = 0, pantry = 0, checkout = 0
  const unpriced = []
  const fromPantry = [], leftovers = []
  for (const [k, data] of Object.entries(agg)) {
    const ing = allIng[k]
    const pack = packOf(ing)
    if (!pack || !pack.amount || pack.price == null) { unpriced.push(ing?.name ?? k); continue }
    const need = needAmount(data, ing, pack)
    if (!(need > 0)) { unpriced.push(ing?.name ?? k); continue }
    const pp = packPlan(k, need, stock[k] ?? 0, allIng)
    checkout += pp.buyCost
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
  return { waste, pantry, checkout, unpriced, notes }
}

// Alternativas de verdad: no repiten la pareja (ni en variante) y cada plato
// comida distinta en cada opción (la cena puede repetirse una vez).
function compareFit(a, b) {
  return a.violations - b.violations || a.uncertainty - b.uncertainty
}

function pickDiverse(exact, count, baseOf, locked, lunchFamily = null) {
  const chosen = []
  const usedBases = new Set()
  const usedDinners = new Set()
  const usedLunches = new Set()
  const remaining = [...exact]
  while (chosen.length < count && remaining.length) {
    const first = remaining[0]
    let tier = remaining.filter(r => Boolean(r.violations) === Boolean(first.violations) && Boolean(r.uncertainty) === Boolean(first.uncertainty))
    if (lunchFamily) {
      const newLunches = tier.filter(r => !usedLunches.has(lunchFamily(r.plan.L)))
      if (newLunches.length) tier = newLunches
    }
    const next = (!locked.D && tier.find(r => !usedBases.has(baseOf(r.plan.D))))
      || tier.find(r => !usedDinners.has(r.plan.D))
      || tier[0]
    chosen.push(next)
    usedBases.add(baseOf(next.plan.D))
    usedDinners.add(next.plan.D)
    if (lunchFamily) usedLunches.add(lunchFamily(next.plan.L))
    remaining.splice(remaining.indexOf(next), 1)
  }
  return chosen
}

// ── Meriendas nuevas (opcional): recetas hechas con tus ingredientes ─────────
// Se calculan una vez por petición y se guardan entre peticiones (rechazar un plato o cambiar
// de prioridad repite los mismos candidatos; «New ideas» cambia la semilla y salen otros).
let snackMemo = null
function snackPoolFor({ allIng, allCombos, people, priority, source, seed = 0, snackMode = 'catalog', snackNovelty = 1, snackKeep = 8 }) {
  if (snackMode === 'catalog' || people.length !== 2) return null
  const prio = source === 'surprise' || source === 'country' ? 'variety' : priority === 'protein' ? 'protein' : 'price'
  // «Probado» = en un plato tuyo. Los compuestos por la app y los de cita no cuentan.
  const tried = {}
  for (const [k, c] of Object.entries(allCombos)) {
    if (isGenerated(k) || c.generated || c.date || /^gen-/.test(c.customId ?? '') || !c.items?.length) continue
    tried[k] = { items: c.items }
  }
  const key = JSON.stringify([seed || 1, prio, snackNovelty, snackKeep, people, tried, allIng])
  if (snackMemo?.key !== key) snackMemo = { key, val: smartSnackCandidates({ allIng, tried, people, priority: prio, seed: seed || 1, novelty: snackNovelty, keep: snackKeep }) }
  return snackMemo.val
}

/**
 * Genera las mejores semanas (lunes–viernes).
 * opts: priority 'price'|'protein'|'veg' · vegMin · seed (para «New ideas»)
 *       shown ['L|D'] parejas ya enseñadas · exclude [recipeKey] · prefs {key: n}
 *       recent [recipeKey] del batch de las 2 semanas anteriores
 *       locks { L, D, B: {pid}, S: {pid} } para cambiar solo un plato
 *       stock { ingKey: amount } despensa disponible (sin lo caducado)
 *       source 'dishes' | 'ingredients' | 'salads' | 'bowls' | 'country' | 'surprise'
 * Devuelve { results: [evaluatePlan…], tried, ms }.
 */
export function generateSmartWeeks({
  allIng, allCombos, people, priority = 'price', vegMin = VEG_DAILY_MIN, seed = 0,
  shown = [], exclude = [], prefs = {}, recent = [], locks = {}, stock = {}, source = 'dishes', country = null, pairPrefs = {}, days = PLAN_DAYS, count = 3,
  snackPool = null, snackMode = 'catalog', blockedBase = null, strictRules = false, allPairs = true, ingredientDishes = null,
}) {
  const t0 = performance.now()
  // Fuentes de comidas y cenas:
  //   dishes      → el catálogo (y tus platos);
  //   ingredients → platos compuestos de ingredientes (composeDishes);
  //   salads/bowls → comidas de su familia y cenas del catálogo;
  //   country     → platos compuestos con el perfil de sabor de un país (cuisines.js);
  //   surprise    → compuestos + recetas del mundo, al azar: sin prioridad, con las reglas.
  let generated = null, poolKeys = null
  if (source === 'ingredients') {
    generated = ingredientDishes ?? composeDishes(allIng, allCombos, { stock, pairPrefs, priority, limit: INGREDIENT_DISH_LIMIT })
    poolKeys = new Set(Object.keys(generated))
  } else if (isBatchLunchSource(source)) {
    const lunches = batchLunchDishes(source, allIng, stock)
    poolKeys = new Set(Object.keys(lunches))
    generated = Object.fromEntries(Object.entries(lunches).filter(([key]) => !allCombos[key]))
  } else if (source === 'country') {
    generated = cuisineDishes(allIng, allCombos, { country, stock, pairPrefs })
    poolKeys = new Set(Object.keys(generated))
  } else if (source === 'surprise') {
    generated = { ...composeDishes(allIng, allCombos, { stock, limit: 40, pairPrefs }), ...cuisineDishes(allIng, allCombos, { stock, pairPrefs }) }
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
  // Your «tastes» (prefs) go up every time you load a week, so the shakes you have loaded often
  // would always beat a recipe that has never been shown (it starts at 0). The new snack recipes
  // start with the same score as your current favorite snack, so they compete on cost and fit.
  if (snackPool) {
    const fav = Math.max(0, ...Object.entries(allCombos).filter(([, c]) => (c.meals ?? []).includes('merienda')).map(([k]) => prefOf(prefs, k)))
    if (fav > 0) { prefs = { ...prefs }; for (const k of Object.keys(snackPool.combos)) prefs[k] = Math.max(prefs[k] ?? 0, fav) }
  }
  const jit = amp ? k => (k ? (hash(`${seed}:j:${k}`) / 4294967295 * 2 - 1) * amp : 0) : () => 0
  const ctx = {
    days, priority: source === 'surprise' || source === 'country' ? 'price' : priority, vegMin, seed, prefs, locks, stock, source, poolKeys, jit, solMin: SOLUBLE_FIBER_DAILY_MIN,
    shown: new Set(shown), exclude: new Set(exclude), recent: new Set(recent), snackPool, snackMode,
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
  P.D = P.D.filter(d => !d.pasta)
  if (blockedBase) P.D = P.D.filter(d => (d.dinnerBase ?? 'none') !== blockedBase)
  if (!P.L.length || !P.D.length || people.some(p => !P.per[p.id].B.length || !P.per[p.id].S.length)) return { results: [], tried: 0, ms: 0 }
  // From here on the plan may use the snack recipes, so evaluating it must find them.
  if (snackPool) allCombos = { ...allCombos, ...snackPool.combos }

  const byDinner = new Map()
  const order = (a,b) => compareFit(a,b) || a.score-b.score
  const nonnegativeWaste = Object.values(allIng).every(ing => (packOf(ing)?.price ?? 0) >= 0)
  const personalChoices = people.reduce((n,p) => n * P.per[p.id].B.length * P.per[p.id].S.length, 1)
  const exhaustive = P.L.length * P.D.length * personalChoices <= 3000
  // On small catalogs retain every admissible pair and test its personal meals.
  const { top: pairs, tried } = rankPairs(ctx, P, people, exhaustive || allPairs || strictRules)
  for (const x of pairs) {
    const plan = { L: x.l, D: x.d, B: {}, S: {} }
    const kept = byDinner.get(x.d) ?? []
    let best
    function visit(index) {
      if (index === people.length) {
        const ev = evaluatePlan({ ...plan, B: { ...plan.B }, S: { ...plan.S } }, people, allIng, allCombos, ctx)
        if (!best || compareFit(ev,best) < 0 || (compareFit(ev,best) === 0 && ev.score < best.score)) best = ev
        return
      }
      const id = people[index].id
      for (const b of P.per[id].B) for (const snack of P.per[id].S) {
        plan.B[id] = b.key
        plan.S[id] = snack.key
        visit(index + 1)
      }
    }
    if (exhaustive) visit(0)
    else {
      for (const p of people) {
        plan.B[p.id] = x.choice[p.id].b
        plan.S[p.id] = x.choice[p.id].s
      }
      const candidate = evaluatePlan(plan, people, allIng, allCombos, ctx, { includePacks: false })
      // Pack waste can only add to the score. Skip it when even zero waste
      // couldn't put this plan ahead of the retained options for this dinner.
      if (nonnegativeWaste && kept.length >= count && order(candidate, kept[kept.length - 1]) >= 0) continue
      best = withPackScore(candidate, people, allIng, allCombos, ctx.stock)
    }
    if (!best) continue
    // At most count results with the same dinner can appear in the final selection.
    if (kept.length < count || order(best,kept[kept.length-1]) < 0) {
      kept.push(best)
      kept.sort(order)
      if (kept.length > count) kept.pop()
      byDinner.set(x.d, kept)
    }
  }
  const exact = [...byDinner.values()].flat().sort(order)
  const dinnerBases = new Map(P.D.map(d => [d.key, d.dinnerBase]))
  const eligible = strictRules ? exact.filter(r => !r.violations && !r.uncertainty) : exact
  const results = pickDiverse(eligible, count, key => dinnerBases.get(key), locks, source === 'bowls' ? fam : null)
  // Smart keeps only the best snack per lunch/dinner pair, so options with the same pair would
  // all show the same snack. In options 2 and 3, swap in the best snack not shown yet, as long as
  // the plan does not get much worse (SNACK_VARIETY_SLACK).
  if (snackPool && results.length > 1) {
    const seen = Object.fromEntries(people.map(p => [p.id, new Set([results[0].plan.S[p.id]])]))
    for (let i = 1; i < results.length; i++) {
      const r = results[i]
      const plan = { ...r.plan, S: { ...r.plan.S } }
      const l = P.L.find(x => x.key === plan.L), d = P.D.find(x => x.key === plan.D)
      let changed = false
      for (const p of people) {
        if (!seen[p.id].has(plan.S[p.id])) { seen[p.id].add(plan.S[p.id]); continue }
        const b = P.per[p.id].B.find(x => x.key === plan.B[p.id])
        const rest = P.per[p.id].S.filter(x => !seen[p.id].has(x.key))
        if (!l || !d || !b || !rest.length) continue
        const alt = bestForPerson(p, ctx, { B: [b], S: rest }, l, d)
        if (alt) { plan.S[p.id] = alt.s.key; seen[p.id].add(alt.s.key); changed = true }
      }
      if (changed) {
        const ev = evaluatePlan(plan, people, allIng, allCombos, ctx)
        if (compareFit(ev, r) <= 0 && ev.warnings.every(note => r.warnings.includes(note)) && ev.score <= r.score + SNACK_VARIETY_SLACK) results[i] = ev
      }
    }
  }
  // Los platos compuestos que usa cada opción viajan con ella (para poder
  // enseñarlos y guardarlos como platos tuyos al cargar la semana).
  // (and the snack recipes the option picked, so they can be saved too)
  if (generated || snackPool) {
    for (const r of results) {
      const nd = {}
      if (generated) for (const k of [r.plan.L, r.plan.D]) if (generated[k]) nd[k] = generated[k]
      if (snackPool) for (const k of Object.values(r.plan.S)) if (snackPool.combos[k]) nd[k] = snackPool.combos[k]
      r.newDishes = nd
    }
  }
  const closest = strictRules && !results.length && exact.length ? { warnings: exact[0].warnings } : null
  return { results, closest, tried, ms: Math.round(performance.now() - t0), composed: generated ? Object.keys(generated).length : 0 }
}

// ── Varios días de batch ─────────────────────────────────────────────────────
// Con más de un batch a la semana (Ajustes), cada uno es su propia olla:
// se genera cada sesión con sus días y se juntan las opciones, sin repetir en
// la segunda los platos (ni variantes) de la primera. Con uno solo es lo de
// siempre. Devuelve opciones con `parts` (una por sesión) y lo combinado:
// slots, coste, coste semanal (×7/días cubiertos), avisos y notas.
export function generateSmartPlan({ sessions = [PLAN_DAYS], locks = {}, count = 3, ...args }) {
  const t0 = performance.now()
  const partLocks = i => locks.parts?.[i] ?? {}
  const multi = sessions.length > 1
  const snackPool = snackPoolFor(args)
  const ingredientDishes = multi && args.source === 'ingredients'
    ? composeDishes(args.allIng, args.allCombos, { stock: args.stock, pairPrefs: args.pairPrefs, priority: args.priority ?? 'price', limit: INGREDIENT_DISH_LIMIT })
    : null
  if (args.splitDinners && sessions.length === 2) {
    const run = (days, lock, n, blockedBase) => generateSmartWeeks({
      ...args, snackPool, ingredientDishes, days, locks: lock, count: n, blockedBase,
    })
    const first = run(sessions[0], partLocks(0), count * 4)
    const candidates = []
    let tried = first.tried
    let closest = first.closest
    const base = part => {
      const combo = part.newDishes?.[part.plan.D] ?? args.allCombos[part.plan.D]
      const key = comboScalableKey(combo, args.allIng)
      return key ? starchFamily(key, args.allIng) ?? key : 'none'
    }
    for (const a of first.results) {
      const shared = { ...partLocks(1), L: a.plan.L, B: a.plan.B, S: a.plan.S }
      const second = run(sessions[1], shared, count * 2, base(a))
      tried += second.tried
      closest ??= second.closest
      for (const b of second.results) candidates.push(combineParts([a,b], args))
    }
    candidates.sort((a,b) => compareFit(a,b) || a.score-b.score)
    const results = []
    const seenBases = new Set(), seenPairs = new Set(), seenLunches = new Set()
    const lunchFamily = c => famOfKey(c.parts[0].plan.L, args.allCombos)
    while (results.length < count && candidates.length) {
      let tier = candidates.filter(c => !!c.violations === !!candidates[0].violations && !!c.uncertainty === !!candidates[0].uncertainty)
      if (args.source === 'bowls') {
        const newLunches = tier.filter(c => !seenLunches.has(lunchFamily(c)))
        if (newLunches.length) tier = newLunches
      }
      const bases = c => c.parts.map(base).sort().join('|')
      const pair = c => c.parts.map(p => p.plan.D).sort().join('|')
      const pick = tier.find(c => !seenBases.has(bases(c))) || tier.find(c => !seenPairs.has(pair(c))) || tier[0]
      results.push(pick)
      seenBases.add(bases(pick))
      seenPairs.add(pair(pick))
      if (args.source === 'bowls') seenLunches.add(lunchFamily(pick))
      candidates.splice(candidates.indexOf(pick),1)
    }
    return { results: results.slice(0,count), closest: results.length ? null : closest, tried, ms: Math.round(performance.now()-t0), composed: first.composed, snacks: snackPool?.count ?? 0 }
  }
  const batchLunch = isBatchLunchSource(args.source)
  // Keep extra candidates so sauce variants of the same lunch don't crowd out other menus.
  const candidateCount = batchLunch ? count * 3 : multi ? count * 2 : count
  const runs = sessions.map((days, i) => generateSmartWeeks({ ...args, snackPool, ingredientDishes, snackMode: args.snackMode ?? 'catalog', days, locks: partLocks(i), count: candidateCount }))
  const fam = (k, r) => batchLunch ? famOfKey(k, args.allCombos) : familyOf((r.newDishes?.[k] ?? args.allCombos[k])?.name ?? k)
  const results = [], seenSets = new Set()
  for (const first of runs[0].results) {
    if (results.length >= count) break
    const parts = [first]
    const used = new Set([fam(first.plan.L, first), fam(first.plan.D, first)])
    for (let si = 1; si < runs.length; si++) {
      const opts = runs[si].results
      const pick = opts.find(r => !used.has(fam(r.plan.L, r)) && !used.has(fam(r.plan.D, r))) ?? opts[results.length % Math.max(1, opts.length)]
      if (!pick) break
      parts.push(pick); used.add(fam(pick.plan.L, pick)); used.add(fam(pick.plan.D, pick))
    }
    if (parts.length < sessions.length) continue
    // No la misma semana con las sesiones cambiadas de orden.
    const set = parts.flatMap(p => [fam(p.plan.L, p), fam(p.plan.D, p)]).sort().join('|')
    if (seenSets.has(set)) continue
    seenSets.add(set)
    const combined = combineParts(parts, args)
    results.push(combined)
  }
  return {
    closest: results.length ? null : runs.find(run => run.closest)?.closest,
    results: results.sort((a, b) => compareFit(a, b) || a.score - b.score), tried: runs.reduce((t, r) => t + r.tried, 0), ms: Math.round(performance.now() - t0),
    composed: runs[0].composed ?? 0, snacks: snackPool?.count ?? 0,
  }
}

function combineParts(parts, args) {
  if (parts.length === 1) return { ...parts[0], parts }
  const days = parts.flatMap(p => p.days)
  const cost = parts.reduce((t, p) => t + p.cost, 0)
  const perPerson = parts[0].perPerson.map((x, j) => {
    const all = parts.map(p => p.perPerson[j]), w = parts.map(p => p.days.length), W_ = w.reduce((a, b) => a + b, 0)
    const avg = k => all.reduce((t, a, i) => t + a[k] * w[i], 0) / W_
    return { p: x.p, kcal: Math.round(avg('kcal')), target: Math.round(avg('target')), prot: Math.round(avg('prot')), veg: Math.round(avg('veg')), sol: +avg('sol').toFixed(1), hit: all.reduce((t, a) => t + a.hit, 0) }
  })
  const slots = Object.assign({}, ...parts.map(p => p.slots))
  const newDishes = Object.assign({}, ...parts.map(p => p.newDishes))
  const packs = packScore(slots, args.people, args.allIng, { ...args.allCombos, ...newDishes }, args.stock ?? {}, days)
  return {
    parts, plan: parts[0].plan, days, cost, weekCost: cost * 7 / days.length,
    violations: parts.reduce((t, p) => t + p.violations, 0), uncertainty: parts.reduce((t, p) => t + p.uncertainty, 0),
    score: parts.reduce((t, p) => t + p.score - W.waste * p.packs.waste, W.waste * packs.waste), perPerson,
    slots,
    daily: Object.fromEntries(args.people.map(p => [p.id, Object.assign({}, ...parts.map(part => part.daily[p.id]))])),
    warnings: [...new Set(parts.flatMap(p => p.warnings))],
    packs, newDishes,
  }
}
