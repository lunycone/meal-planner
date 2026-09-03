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
  if (i.fatml != null && p.ml    != null) return i.fatml * p.ml
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
  'arroz', 'pasta', 'patata', 'avena', 'pan-masa-madre', 'harina', 'buckwheat',
  'lentejas-rojas', 'lentejas-verdes', 'garbanzos', 'black-beans',
  // FIX 3 sep 2026: la clave real en ingredients.js es 'cranberry', no
  // 'cranberry-beans' — nunca coincidia, asi que las judias romano jamas se
  // trataron como base escalable. Anadida tambien 'alubias-rojas', que faltaba.
  'alubias-blancas', 'alubias-rojas', 'cranberry', 'romano-beans', 'maiz',
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
  'arroz': 2.8, 'pasta': 2.5, 'buckwheat': 2.6,
}

// Given a full day plan + a person, returns how many grams of the LUNCH's
// scalable base to serve so the whole day approaches person.kcalTarget.
// Breakfast, dinner and all proteins are shared (fixed); only the lunch base
// flexes per person — capped at a realistic "comible" amount. When the cap
// can't reach the target, reports the deficit and the olive-oil it would take
// to close it. Returns null if the lunch has no scalable base.
export function personLunchScale(day, person, allIng, allCombos, opts = {}) {
  const lunch = day?.comida
  if (!lunch || lunch.type !== 'desayuno') return null
  const combo = allCombos[lunch.recipeKey]
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

// ─── Macro % (carb by difference, Atwater 4/4/9) + PCOS badge + traffic lights ──
export function dishMacroPct(combo, allIng) {
  const agg = comboAgg(combo, allIng)
  const carbKcal = Math.max(0, agg.kcal - agg.prot * 4 - agg.fat * 9)
  return { ...agg, carbG: carbKcal / 4, carbPct: agg.kcal > 0 ? (carbKcal / agg.kcal) * 100 : 0 }
}

// ─── Glycemic load — replaces the old carb%-of-kcal PCOS metric ───────────────
// CORRECTED 2 sep 2026: the original PCOS badge banded dishes by raw carb% of
// kcal. That's wrong for PCOS specifically — what matters for insulin/glucose
// response is glycemic LOAD (how much carb, weighted by how fast each carb
// digests), not carb quantity alone. Carb% blind to type flagged the whole
// torta-de-garbanzo family as the worst offenders in the catalog, when
// chickpea (GI~28-35) is one of the lowest-GI staples we use — meanwhile
// patata (GI~80) and arroz (GI~73) sat in "green" desayuno/cena dishes
// undetected because their carb% happened to be modest. Both ingredients.js
// entries for harina-garbanzo and masa-harina already had "GI~35"/"GI~52"
// noted in their own `per` field before this fix — the data was sitting
// there and simply wasn't used. That's the root of the error, not missing
// information: convenience (carb% falls out of kcal/prot/fat, already
// computed) beat correctness (GL needs a `gi` per ingredient, which meant
// actually going and sourcing it).
//
// GL per item = ingredient GI × that item's carb grams (Atwater) / 100,
// summed across the dish. `gi` values are added on the real carb-bearing
// ingredients (patata 80, arroz 73, harina-trigo 70, avena 55, masa-harina
// 52, pan-masa-madre 53, harina-garbanzo 35, garbanzos 28, lentejas 30,
// black-beans 30, romano-beans 38, banana 51, manzana 36, arandanos 53,
// miel 61, chocolate-negro 23, cacao 20, chia 1 — standard published GI
// tables, order-of-magnitude accuracy, not lab-measured). Ingredients
// without an explicit `gi` default to 20 (low-impact) rather than being
// silently skipped, so nothing carb-bearing gets missed by omission again.
const GI_DEFAULT = 20

export function dishGlycemicLoad(combo, allIng) {
  let gl = 0
  for (const it of combo.items) {
    if (it.k === 'aove') continue
    const ing = allIng[it.k]
    if (!ing) continue
    let kc, prot, fat
    if (it.p.grams != null) { kc = (ing.kc || 0) * it.p.grams / 100; prot = (ing.prot || 0) * it.p.grams / 100; fat = (ing.fat || 0) * it.p.grams / 100 }
    else if (it.p.units != null) { kc = (ing.kcu || 0) * it.p.units; prot = (ing.protu || 0) * it.p.units; fat = (ing.fatu || 0) * it.p.units }
    else if (it.p.ml != null) { kc = (ing.kcml || 0) * it.p.ml; prot = 0; fat = 0 }
    else { kc = (ing.kcf || 0); prot = (ing.protf || 0); fat = (ing.fatf || 0) }
    const carbG = Math.max(0, kc - prot * 4 - fat * 9) / 4
    gl += (ing.gi ?? GI_DEFAULT) * carbG / 100
  }
  return gl
}

// mealType must be passed explicitly, not inferred from combo.meals — several
// dishes (the burrito/sardinas family) are tagged for BOTH desayuno and cena.
// Bands are each meal's own real gap in the catalog's GL distribution (2 sep
// 2026 sweep) — desayuno tops out lower (single-serving, fewer starch
// layers) so its own gaps sit lower than cena's. These land close to the
// published single-food GL bands (low ≤10, medium 11-19, high ≥20) — a sign
// the metric itself is sound, not just fitted to our data.
// Desayuno: green ≤10 (egg/yogurt cluster), yellow 10-20 (torta-garbanzo/
// burrito cluster — now correctly mid-tier, not worst), red >20 (burrito con
// bacon, torta extrema). Cena: green ≤10 (egg/bacalao/frittata cluster),
// yellow 10-25 (lentejas/garbanzo-without-patata cluster), red >25 (anything
// pairing legumbre+patata, or arroz/patata-heavy rancho/burrito dishes).
const PCOS_GL_MAX = { desayuno: 10, cena: 10 }
const PCOS_GL_BANDS = {
  desayuno: { yellow: 20 }, // ≤10 green, 10-20 yellow, >20 red
  cena:     { yellow: 25 }, // ≤10 green, 10-25 yellow, >25 red
}

export function pcosCarbLevel(combo, allIng, mealType) {
  const green = PCOS_GL_MAX[mealType]
  const bands = PCOS_GL_BANDS[mealType]
  if (green == null || !bands) return null // comida/merienda: not tracked
  const gl = dishGlycemicLoad(combo, allIng)
  if (gl <= green) return 'green'
  if (gl <= bands.yellow) return 'yellow'
  return 'red'
}

// ─── Digestive safety (Julio, IBS-M + functional dyspepsia, 3 sep 2026) ───────
// Two DIFFERENT mechanisms that both got called "fibra" until this was split:
//   - GOS (galacto-oligosaccharides): legumes ferment in colon regardless of
//     form — whole bean or milled flour, the sugars survive intact. Timing
//     matters (2-6h to ferment), not grinding. Whole legume AND legume flour
//     belong in the same bucket, and both belong at comida (fermentation peak
//     lands in Julio's safe window), never desayuno.
//   - Mechanical insoluble fiber (bran, whole grain, crucifers, whole nuts,
//     coconut): irritates by bulk/roughage, not fermentation. Separate rule,
//     separate foods — a legume-flour dish can be GOS-risky and insoluble-safe
//     at the same time, so these must not be collapsed into one flag.
// BUG CORREGIDO 3 sep 2026 — el regex de GOS se escribio a mano y dejaba fuera
// tres legumbres del propio catalogo: 'alubias-blancas', 'alubias-rojas' y
// 'cranberry' (cuyo NOMBRE es "Romano beans" pero cuya CLAVE no contiene
// "romano-beans", asi que /romano-beans/ nunca la tocaba). Resultado: tres
// legumbres pasaban el filtro digestivo sin marcar. Ahora se comprueba contra
// la categoria del ingrediente, no contra el nombre de la clave — asi cualquier
// legumbre futura queda cubierta por construccion y no por acordarse.
const GOS_KEYS = /garbanzo|lenteja|black-beans|romano-beans|alubias|cranberry|guisante/

// AMPLIADO 3 sep 2026. Faltaban las cruciferas del catalogo ('col' = repollo,
// 'col-rizada' = kale) y 'macadamia'. Anclado con ^...$ a proposito: un /col/
// sin anclar tambien casaria con "choColate-negro".
const INSOLUBLE_KEYS = /^brocoli$|^col$|^col-rizada$|^coco-rallado$|^almendras$|^avellana$|^macadamia$|^pumpkin-seeds$|^sunflower-seeds$|^chia$/

// RENOMBRADO: no son solo alliums. La alcachofa no es un allium y es de los
// alimentos con mayor carga de fructanos que existe — estaba sin marcar.
const FRUCTAN_KEYS = /^cebolla|^ajo$|^puerro$|^alcachofa$/
const DESAYUNO_FAT_MAX = 15    // g — Regla 2

// NUEVO 3 sep 2026 — Regla 1-bis. El suelo existe porque Regla 1 ("desayuno =
// comida mas pequena") y Regla 6 ("ningun hueco >5 h") entraban en conflicto:
// un desayuno de 277 kcal a las 8:00 con comida a las 14:00 reproduce
// exactamente el escenario del dolor epigastrico del 3 sep. Pequeno, no ausente.
const DESAYUNO_KCAL_MIN = 400

export function dishHasGOS(combo) {
  return combo.items.some(it => GOS_KEYS.test(it.k))
}
export function dishHasInsolubleFiber(combo) {
  return combo.items.some(it => INSOLUBLE_KEYS.test(it.k))
}
export function dishHasAllium(combo) {
  return combo.items.some(it => FRUCTAN_KEYS.test(it.k))
}

// ─── Fibra soluble — el mismo error que el de carb% vs GL, un campo mas alla ──
// `fib` es un unico numero y no distingue mecanismo. Para SII-M eso no vale:
// la fibra INSOLUBLE es el desencadenante y la SOLUBLE es el tratamiento, y
// ahora mismo el motor las suma en la misma columna. La cebada en copos tiene
// la fibra mas alta del catalogo (15,6 g/100g) y es mayoritariamente
// beta-glucano — es de lo mejor que puede comer, y el numero crudo la hace
// parecer lo peor. Igual que carb% marcaba en rojo la torta de garbanzo.
// `fibSol` (g solubles/100g) se anade en ingredients.js sobre los que aportan
// de verdad; los que no lo declaren asumen 25% del total, que es la proporcion
// media aproximada en alimentos vegetales mixtos.
const SOLUBLE_FALLBACK_SHARE = 0.25
const SOLUBLE_FIBER_DAILY_MIN = 8   // g/dia — suelo terapeutico en SII-M

export function ingFibSol(key, p, allIng) {
  const i = allIng[key]
  if (!i) return 0
  if (i.fibSol != null && p.grams != null) return i.fibSol * p.grams / 100
  if (i.fibSolu != null && p.units != null) return i.fibSolu * p.units
  return ingFib(key, p, allIng) * SOLUBLE_FALLBACK_SHARE
}

export function comboFibSol(combo, allIng) {
  return combo.items.reduce((s, it) => s + ingFibSol(it.k, it.p, allIng), 0)
}

// Single check for a dish in a given meal slot — only desayuno carries the
// fat ceiling and the allium exclusion (Reglas 2 and 5); GOS is a placement
// rule (never desayuno) checked separately per day when building a week, not
// a per-dish property, since the same dish can be fine at comida and wrong
// at desayuno.
export function digestiveFlags(combo, allIng, mealType) {
  const agg = comboAgg(combo, allIng)
  const flags = {
    gos: dishHasGOS(combo),
    insolubleFiber: dishHasInsolubleFiber(combo),
    fibSol: comboFibSol(combo, allIng),
  }
  if (mealType === 'desayuno') {
    flags.fatOverLimit = agg.fat > DESAYUNO_FAT_MAX
    flags.kcalUnderFloor = agg.kcal < DESAYUNO_KCAL_MIN   // Regla 1-bis
    flags.hasAllium = dishHasAllium(combo)
  }
  return flags
}

// Two tiers, per session decision: comida/cena (the main event, higher bar)
// vs desayuno/merienda (secondary, lower bar — their own targets are smaller).
const MAIN_MEALS = new Set(['comida', 'cena'])

export function proteinLevel(prot, mealType) {
  const t = MAIN_MEALS.has(mealType)
    ? { green: 40, yellow: 25 }
    : { green: 25, yellow: 15 }
  return prot >= t.green ? 'green' : prot >= t.yellow ? 'yellow' : 'red'
}

export function kcalLevel(kcal, mealType) {
  const t = MAIN_MEALS.has(mealType)
    ? { green: 800, yellow: 500 }
    : { green: 400, yellow: 250 }
  return kcal >= t.green ? 'green' : kcal >= t.yellow ? 'yellow' : 'red'
}

export const LEVEL_COLOR = { green: '#4a7a3a', yellow: '#b0871f', red: '#b8453a' }
