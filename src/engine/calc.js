// Pure calculation engine — all functions accept the merged ingredient map
// so price overrides propagate automatically everywhere.

import { PROTEIN } from '../data/proteins'

export function ingCost(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.per100   != null && p.grams != null) return i.per100 * p.grams / 100
  if (i.perUnit  != null && p.units != null) return i.perUnit * p.units
  if (i.perML    != null && p.ml    != null) return i.perML * p.ml
  if (i.perServing != null) return i.perServing * (p.serv ?? 1)
  if (i.flat     != null) return i.flat
  return 0
}

export function ingKcal(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.kc   != null && p.grams != null) return i.kc * p.grams / 100
  if (i.kcu  != null && p.units != null) return i.kcu * p.units
  if (i.kcml != null && p.ml    != null) return i.kcml * p.ml
  if (i.kcs  != null) return i.kcs * (p.serv ?? 1)
  if (i.kcf  != null) return i.kcf
  return 0
}

export function ingProt(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.prot  != null && p.grams != null) return i.prot * p.grams / 100
  if (i.protu != null && p.units != null) return i.protu * p.units
  if (i.protf != null) return i.protf
  return 0
}

export function ingFat(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.fat   != null && p.grams != null) return i.fat * p.grams / 100
  if (i.fatu  != null && p.units != null) return i.fatu * p.units
  if (i.fatf  != null) return i.fatf
  return 0
}

export function ingFib(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.fib  != null && p.grams != null) return i.fib * p.grams / 100
  if (i.fibu != null && p.units != null) return i.fibu * p.units
  if (i.fibf != null) return i.fibf
  return 0
}

export function ingIsEst(key, allIng) {
  return !!(allIng[key]?.est)
}

// unitsOverride: when the protein's ration is in units (e.g. eggs), this
// optional value replaces the default unit count so users can customize it.
export function proteinCost(pr, useAlt = false, unitsOverride = null) {
  const r = (useAlt && pr.altRation) ? pr.altRation : pr.ration
  if (r.grams != null) return pr.per100 * r.grams / 100
  if (r.units != null) return pr.perUnit * (unitsOverride ?? r.units)
  if (r.flat  != null) return r.flat
  return 0
}

export function proteinKcal(pr, useAlt = false, unitsOverride = null) {
  const r = (useAlt && pr.altRation) ? pr.altRation : pr.ration
  if (r.grams != null) return pr.kc * r.grams / 100
  if (r.units != null) return pr.kcu * (unitsOverride ?? r.units)
  if (r.kc    != null) return r.kc
  return 0
}

export function proteinProt(pr, useAlt = false, unitsOverride = null) {
  const r = (useAlt && pr.altRation) ? pr.altRation : pr.ration
  if (r.grams != null) return pr.prot != null ? pr.prot * r.grams / 100 : 0
  if (r.units != null) return pr.protu != null ? pr.protu * (unitsOverride ?? r.units) : 0
  if (pr.protf != null) return pr.protf
  return 0
}

export function comboAgg(combo, allIng, variants = {}, gramsOverrides = {}, optionals = []) {
  let cost = 0, kcal = 0, prot = 0, fat = 0, fib = 0, hasEst = false
  for (const it of combo.items) {
    // If this ingredient has a variant override, use it
    let portion = it.p
    if (variants[it.k] != null && it.p.units != null) {
      portion = { ...it.p, units: variants[it.k] }
    }
    // Per-person grams override (scalable base, e.g. arroz/patata)
    if (gramsOverrides[it.k] != null && it.p.grams != null) {
      portion = { ...portion, grams: gramsOverrides[it.k] }
    }

    cost += ingCost(it.k, portion, allIng)
    kcal += ingKcal(it.k, portion, allIng)
    prot += ingProt(it.k, portion, allIng)
    fat  += ingFat(it.k, portion, allIng)
    fib  += ingFib(it.k, portion, allIng)
    if (ingIsEst(it.k, allIng)) hasEst = true
  }
  // Optional items chosen by user (e.g. bocadillo toppings)
  if (optionals.length > 0 && combo.optionalItems) {
    for (const k of optionals) {
      const optItem = combo.optionalItems.find(oi => oi.k === k)
      if (optItem) {
        cost += ingCost(k, optItem.p, allIng)
        kcal += ingKcal(k, optItem.p, allIng)
        prot += ingProt(k, optItem.p, allIng)
        fat  += ingFat(k, optItem.p, allIng)
        fib  += ingFib(k, optItem.p, allIng)
        if (ingIsEst(k, allIng)) hasEst = true
      }
    }
  }
  return { cost, kcal, prot, fat, fib, hasEst, incomplete: !!combo.incomplete }
}

export function prepAgg(prep, allIng) {
  let cost = 0, kcal = 0
  for (const it of prep.items) {
    cost += ingCost(it.k, it.p, allIng)
    kcal += ingKcal(it.k, it.p, allIng)
  }
  return { cost, kcal }
}

// ─── Per-person scaling ────────────────────────────────────────────────────
// Energy bases that may be scaled up/down per person (cheap carbs/starch).
// Anything not in this set is treated as fixed/shared.
const ENERGY_BASES = new Set([
  'arroz', 'pasta', 'patata', 'avena', 'pan-masa-madre', 'harina',
  'lentejas-rojas', 'lentejas-verdes', 'garbanzos', 'black-beans',
  'alubias-blancas', 'cranberry-beans', 'maiz',
])

// The single ingredient in a combo that scales per person. Either an explicit
// combo.scalable override, or auto-derived as the grams-based energy base that
// contributes the most kcal. Returns null for combos with no scalable base
// (e.g. 'otros' salads) → those stay identical for everyone.
export function comboScalableKey(combo, allIng) {
  if (!combo) return null
  if (combo.scalable) return combo.scalable
  let best = null, bestKcal = -1
  for (const it of combo.items) {
    if (!ENERGY_BASES.has(it.k)) continue
    if (it.p?.grams == null) continue
    const ing = allIng[it.k]
    if (!ing || ing.kc == null) continue
    const kc = ing.kc * it.p.grams / 100
    if (kc > bestKcal) { bestKcal = kc; best = it.k }
  }
  return best
}

// Total kcal of a single planned meal (desayuno recipe or plato).
export function mealKcal(meal, allIng, allCombos, gramsOverride = {}) {
  if (!meal) return 0
  if (meal.type === 'desayuno') {
    const recipe = allCombos[meal.recipeKey]
    return recipe ? comboAgg(recipe, allIng, meal.comboVariants || {}, gramsOverride).kcal : 0
  }
  if (meal.type === 'plato') {
    const protein = PROTEIN[meal.proteinKey]
    const combo   = allCombos[meal.comboKey]
    if (!protein || !combo) return 0
    return proteinKcal(protein, false, meal.proteinUnits)
         + comboAgg(combo, allIng, meal.comboVariants || {}, gramsOverride, meal.comboOptionals || []).kcal
         + (combo.noAove ? 0 : 235)
  }
  return 0
}

// Sum of all planned meals in a day ({ desayuno, comida, merienda, cena }).
export function dayKcal(day, allIng, allCombos) {
  return Object.values(day || {}).reduce((s, m) => s + mealKcal(m, allIng, allCombos), 0)
}

// The "comible" ceiling for a scalable base is derived from the combo's own
// default portion: a person may grow it up to SCALE_CAP_FACTOR× the default.
// This scales with what each dish considers a reasonable ration, so dense
// grains and watery tubers each get a sensible ceiling — and crucially the
// cap sits above the second-biggest eater's need, so people differentiate
// instead of all colliding at one absolute number.
const SCALE_CAP_FACTOR = 4
const MIN_SCALE_CAP_GRAMS = 150       // floor so tiny defaults still flex
const KCAL_PER_OIL_TBSP = 120         // olive oil, not counted in combos

// Physical ceiling: what actually fits in a tupper once cooked. Grains/legumes
// expand a lot when cooked, so the cap must live in COOKED grams, not dry — a
// "4× dry" cap let rice balloon to ~840g cooked, which no tupper holds and no
// one eats. Beyond this, the day's deficit overflows to olive oil instead.
const MAX_COOKED_BASE_GRAMS = 300
const DRY_TO_COOKED = {
  'garbanzos': 2.5, 'black-beans': 2.5, 'lentejas-rojas': 2.5, 'lentejas-verdes': 2.0,
  'alubias-blancas': 2.5, 'cranberry-beans': 2.5, 'alubias-rojas': 2.5,
  'arroz': 2.8, 'pasta': 2.5,
}

// Given a full day plan + a person, returns how many grams of the LUNCH's
// scalable base to serve so the whole day approaches person.kcalTarget.
// Breakfast, dinner and all proteins are shared (fixed); only the lunch base
// flexes per person — capped at a realistic "comible" amount. When the cap
// can't reach the target, reports the deficit and the olive-oil it would take
// to close it. Returns null if the lunch has no scalable base.
export function personLunchScale(day, person, allIng, allCombos, opts = {}) {
  const lunch = day?.comida
  if (!lunch || lunch.type !== 'plato') return null
  const combo = allCombos[lunch.comboKey]
  const key = comboScalableKey(combo, allIng)
  if (!key) return null
  const ing = allIng[key]
  const kcalPerGram = ing.kc / 100
  if (!kcalPerGram) return null

  const item = combo.items.find(it => it.k === key)
  const defaultGrams = item?.p?.grams ?? 0

  const totalKcal = dayKcal(day, allIng, allCombos)        // at default grams
  const fixedKcal = totalKcal - defaultGrams * kcalPerGram   // remove scalable share
  const neededKcal = person.kcalTarget - fixedKcal

  const min = opts.min ?? 0
  // Cap on what fits the tupper, expressed in dry grams that yield MAX_COOKED_BASE_GRAMS cooked.
  const cookRatio = DRY_TO_COOKED[key] ?? 1
  const cookedCapDry = MAX_COOKED_BASE_GRAMS / cookRatio
  const factorCap = Math.max(defaultGrams * SCALE_CAP_FACTOR, MIN_SCALE_CAP_GRAMS)
  const max = opts.max ?? Math.max(defaultGrams, Math.min(factorCap, cookedCapDry))
  const rawGrams = neededKcal / kcalPerGram
  const grams = Math.round(Math.max(min, Math.min(max, rawGrams)))

  const dayKcalAchieved = Math.round(fixedKcal + grams * kcalPerGram)
  const deficitKcal = Math.max(0, person.kcalTarget - dayKcalAchieved)
  const oilTbsp = deficitKcal > 0 ? Math.round(deficitKcal / KCAL_PER_OIL_TBSP) : 0

  return {
    ingKey: key,
    ingName: ing.name,
    defaultGrams,
    grams,
    rawGrams: Math.round(rawGrams),
    cappedHigh: rawGrams > max,
    cappedLow: rawGrams < min,
    dayKcalAchieved,
    deficitKcal,            // >0 only when the cap can't reach the target
    oilTbsp,                // tbsp of olive oil to close the deficit
    deltaKcal: Math.round((grams - defaultGrams) * kcalPerGram),
  }
}

export function fmt(n)  { return '$' + n.toFixed(2) }
export function kfmt(n) { return Math.round(n) + ' kcal' }

export function fmtPortion(p) {
  if (p.grams != null) return p.grams + 'g'
  if (p.ml    != null) return p.ml + 'ml'
  if (p.units != null) {
    const m = { 0.25: '¼', 0.5: '½', 0.75: '¾' }
    return (m[p.units] ?? p.units) + ' ud'
  }
  if (p.serv  != null) return 'porción'
  return '—'
}
