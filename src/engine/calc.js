// Pure calculation engine — all functions accept the merged ingredient map
// so price overrides propagate automatically everywhere.

import { PROTEIN } from '../data/proteins.js'

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

// BUG CRITICO CORREGIDO 3 sep 2026 — AOVE contado DOS VECES.
// El sumando plano de 235 kcal viene de cuando el aceite no estaba en `items`.
// Hoy 103 de 118 platos SI lo llevan como item, `aove` tiene kcml: 9, y NINGUN
// plato declara `noAove`. Resultado: comboAgg contaba el aceite por ml y encima
// se le sumaban 235 kcal fijas. Un dia con tres platos con aceite se inflaba
// +705 kcal; una semana, +4.935 kcal.
//
// Y no era solo un numero mal en pantalla. dayKcal alimenta a personLunchScale,
// que calcula los gramos de arroz o patata a servir como
// neededKcal = objetivo - fixedKcal. Con fixedKcal inflado, neededKcal salia
// demasiado bajo y el motor servia MENOS base de la necesaria. A 64 kg, IMC
// 18,7 y con objetivo de GANAR peso, el motor llevaba tiempo racionando
// exactamente lo que hacia falta aumentar.
const AOVE_FLAT_KCAL = 235

function aoveFlatKcal(combo) {
  if (!combo || combo.noAove) return 0
  if (combo.items?.some(it => it.k === 'aove')) return 0   // ya contado por ml
  return AOVE_FLAT_KCAL
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
         + aoveFlatKcal(combo)
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

// AOVE auto-close (6 sep 2026): el generador de las 11 semanas modelo
// (scripts/html-core.mjs) cerraba el hueco que dejaba el tope de almidon con
// un chorro de AOVE ANTES de reportar un deficit -- por eso sus totales
// llegaban casi exactos al objetivo dia a dia. Esa pasada nunca se porto al
// motor de la app, asi que el Planificador mostraba kcal muy por debajo del
// objetivo (hasta -500) en los mismos dias que el HTML daba casi exacto.
// Mismo tope que alli: 30ml por plato, 9 kcal/ml.
const AOVE_KCAL_ML = 9
const AOVE_AUTOCLOSE_CAP_KCAL = 30 * AOVE_KCAL_ML // 270 kcal ~ 30ml

// Physical ceiling: what actually fits in a tupper once cooked. Grains/legumes
// expand a lot when cooked, so the cap must live in COOKED grams, not dry — a
// "4× dry" cap let rice balloon to ~840g cooked, which no tupper holds and no
// one eats. Beyond this, the day's deficit overflows to olive oil instead.
const MAX_COOKED_BASE_GRAMS = 300
// 5 sep 2026 -- auditoria de las 11 semanas: romano-beans (judias romano,
// legumbre SECA -- su propio precio en ingredients.js ya dice "80g seco")
// faltaba aqui. Es la base escalable de 4 platos de comida (uno de ellos,
// "Turkey + alubias pintas + huevo", aparece en 3 de las 11 semanas) -- sin
// su ratio, el tope de arriba la trataba como si no se hinchara al
// cocerse (ratio 1) y dejaba subir hasta 300g SECOS -- unos ~750g cocidos,
// muy por encima de lo que cabe en un tupper. Con el ratio (igual que sus
// hermanas garbanzos/black-beans/alubias, todas 2.5x) el tope real queda en
// ~120g secos, coherente con el resto de legumbres.
const DRY_TO_COOKED = {
  'garbanzos': 2.5, 'black-beans': 2.5, 'lentejas-rojas': 2.5, 'lentejas-verdes': 2.0,
  'alubias-blancas': 2.5, 'cranberry-beans': 2.5, 'alubias-rojas': 2.5, 'romano-beans': 2.5,
  'arroz': 2.8, 'pasta': 2.5, 'buckwheat': 2.6,
}

// Given a full day plan + a person, returns how many grams of the LUNCH's
// scalable base to serve so the whole day approaches person.kcalTarget.
// Breakfast, dinner and all proteins are shared (fixed); only the lunch base
// flexes per person — capped at a realistic "comible" amount. When the cap
// can't reach the target, reports the deficit and the olive-oil it would take
// to close it. Returns null if the lunch has no scalable base.
// Same shape as comboAgg's result, but with EVERY item (grams/ml/units) scaled
// by `factor` first — not just the one scalable base. Used when a meal needs
// to shrink as a WHOLE (6 sep 2026): the fixed protein/cheese/butter is often
// what's oversized for a low-kcal target, not the rice/potato side. Never
// applied below WHOLE_DISH_FLOOR — it must stay recognizably the same dish.
const WHOLE_DISH_FLOOR = 0.55
export function comboAggScaled(combo, allIng, factor) {
  const items = combo.items.map(it => {
    const p = { ...it.p }
    if (p.grams != null) p.grams = Math.round(p.grams * factor)
    if (p.ml    != null) p.ml    = Math.round(p.ml    * factor)
    if (p.units != null) p.units = Math.round(p.units * factor * 2) / 2
    return { ...it, p }
  })
  return comboAgg({ ...combo, items }, allIng)
}

// Given a full day plan + a person, returns how to size ONE meal (comida or
// cena) so the whole day approaches person.kcalTarget. Desayuno, merienda and
// the OTHER of {comida,cena} are treated as fixed, at their own default
// portion. Two regimes:
//   - Falta kcal: escala solo el ingrediente base (arroz/patata/legumbre),
//     tope realista de lo que cabe en un tupper (como siempre).
//   - Sobra kcal: reduce el plato ENTERO en proporcion (no solo la base) --
//     el problema suele ser la carne/queso fijos, no el almidon. Nunca por
//     debajo de WHOLE_DISH_FLOOR (55%): sigue siendo el mismo plato.
// Returns null if the slot is empty or not a single-dish meal.
// Resuelve el objetivo de kcal de un dia concreto: kcalByDay[dayIdx] si el
// perfil lo tiene (Julio/Maria, derivado de su calendario real), si no el
// kcalTarget plano de siempre. dayIdx es 0=lunes..6=domingo (mismo orden que
// DAY_KEYS en los tabs).
export function personTargetForDay(person, dayIdx) {
  if (person?.kcalByDay && dayIdx != null) {
    const t = person.kcalByDay[dayIdx]
    if (t != null) return t
  }
  return person?.kcalTarget ?? 0
}

export function personMealScale(day, mealType, person, allIng, allCombos, opts = {}) {
  const meal = day?.[mealType]
  if (!meal || meal.type !== 'desayuno') return null
  const combo = allCombos[meal.recipeKey]
  if (!combo) return null

  const target = opts.kcalTarget ?? person.kcalTarget
  const mealAgg = comboAgg(combo, allIng)
  let totalKcal = dayKcal(day, allIng, allCombos)            // dia completo, todo a racion por defecto
  // Segunda pasada (opcional): cuando el llamador ya escalo la OTRA comida
  // (comida<->cena se afectan mutuamente), sustituye su valor por defecto
  // por el ya escalado -- si no, esta funcion nunca sabe que la otra comida
  // creció o encogió, y comida+cena pueden acabar sumando de mas o de menos.
  if (opts.otherMealType && opts.otherMealKcalOverride != null) {
    const otherMeal  = day?.[opts.otherMealType]
    const otherCombo = otherMeal?.type === 'desayuno' ? allCombos[otherMeal.recipeKey] : null
    const otherDefault = otherCombo ? comboAgg(otherCombo, allIng).kcal : 0
    totalKcal = totalKcal - otherDefault + opts.otherMealKcalOverride
  }
  const otherFixedKcal = totalKcal - mealAgg.kcal            // todo el dia MENOS este plato
  const neededFromMeal = target - otherFixedKcal             // lo que este plato tiene que aportar
  const key = comboScalableKey(combo, allIng)

  // ── Sobra: el plato a racion normal ya cubre (o se pasa de) lo que hace falta ──
  if (neededFromMeal <= mealAgg.kcal) {
    let factor = mealAgg.kcal > 0 ? neededFromMeal / mealAgg.kcal : 1
    factor = Math.max(WHOLE_DISH_FLOOR, Math.min(1, factor))
    const scaled = factor < 1 ? comboAggScaled(combo, allIng, factor) : mealAgg
    return {
      ingKey: key, ingName: key ? (allIng[key]?.name ?? null) : null,
      defaultGrams: null, grams: null, wholeDishFactor: factor,
      dayKcalAchieved: Math.round(otherFixedKcal + scaled.kcal),
      deficitKcal: 0, oilTbsp: 0,
      deltaKcal: Math.round(scaled.kcal - mealAgg.kcal),
      mealKcalAchieved: Math.round(scaled.kcal),
      mealCostAchieved: scaled.cost,
    }
  }

  // ── Falta, y el plato no tiene base escalable: cerrar con AOVE (hasta el
  // tope de siempre), y solo si aun asi falta, reportar el hueco real ──
  if (!key) {
    const rawDayKcal = otherFixedKcal + mealAgg.kcal
    const rawDeficit = target - rawDayKcal
    const oilKcal = Math.max(0, Math.min(AOVE_AUTOCLOSE_CAP_KCAL, rawDeficit))
    const dayKcalAchieved = Math.round(rawDayKcal + oilKcal)
    const deficitKcal = Math.max(0, target - dayKcalAchieved)
    return {
      ingKey: null, ingName: null, defaultGrams: null, grams: null, wholeDishFactor: 1,
      dayKcalAchieved, deficitKcal,
      oilTbsp: deficitKcal > 0 ? Math.round(deficitKcal / KCAL_PER_OIL_TBSP) : 0,
      oilMlApplied: Math.round(oilKcal / AOVE_KCAL_ML),
      deltaKcal: Math.round(oilKcal),
      mealKcalAchieved: Math.round(mealAgg.kcal + oilKcal),
      mealCostAchieved: mealAgg.cost,
    }
  }

  // ── Falta, y hay base escalable: subirla, con el mismo tope de siempre ──
  const ing = allIng[key]
  const kcalPerGram = ing.kc / 100
  const item = combo.items.find(it => it.k === key)
  const defaultGrams = item?.p?.grams ?? 0
  if (!kcalPerGram) return null

  const fixedKcal  = otherFixedKcal + (mealAgg.kcal - defaultGrams * kcalPerGram)
  const neededKcal = target - fixedKcal

  const min = opts.min ?? 0
  const cookRatio = DRY_TO_COOKED[key] ?? 1
  const cookedCapDry = MAX_COOKED_BASE_GRAMS / cookRatio
  const factorCap = Math.max(defaultGrams * SCALE_CAP_FACTOR, MIN_SCALE_CAP_GRAMS)
  const max = opts.max ?? Math.max(defaultGrams, Math.min(factorCap, cookedCapDry))
  const rawGrams = neededKcal / kcalPerGram
  const grams = Math.round(Math.max(min, Math.min(max, rawGrams)))

  const rawDayKcal = fixedKcal + grams * kcalPerGram
  const rawDeficit = target - rawDayKcal
  // Si el almidon ya esta al tope (o el objetivo no da ni para eso) y aun
  // falta, cerrar con un chorro de AOVE -- mismo tope que el generador de
  // las semanas modelo (30ml/plato), antes de reportar un hueco real.
  const oilKcal = Math.max(0, Math.min(AOVE_AUTOCLOSE_CAP_KCAL, rawDeficit))
  const dayKcalAchieved = Math.round(rawDayKcal + oilKcal)
  const deficitKcal = Math.max(0, target - dayKcalAchieved)
  const oilTbsp = deficitKcal > 0 ? Math.round(deficitKcal / KCAL_PER_OIL_TBSP) : 0
  const deltaKcal = Math.round((grams - defaultGrams) * kcalPerGram + oilKcal)

  return {
    ingKey: key,
    ingName: ing.name,
    defaultGrams,
    grams,
    wholeDishFactor: 1,
    rawGrams: Math.round(rawGrams),
    cappedHigh: rawGrams > max,
    cappedLow: rawGrams < min,
    dayKcalAchieved,
    deficitKcal,            // >0 only when the cap (almidon + AOVE) no basta
    oilTbsp,                // cucharadas de AOVE que AUN faltarian por encima del tope ya aplicado
    oilMlApplied: Math.round(oilKcal / AOVE_KCAL_ML),
    deltaKcal,
    mealKcalAchieved: Math.round(mealAgg.kcal + deltaKcal),
    mealCostAchieved: mealAgg.cost + (grams - defaultGrams) * (ing.per100 || 0) / 100,
  }
}

// Kept for existing callers — comida only. New code should call
// personMealScale directly so cena gets the same treatment.
export function personLunchScale(day, person, allIng, allCombos, opts = {}) {
  return personMealScale(day, 'comida', person, allIng, allCombos, opts)
}

// Full day kcal for one person, scaling BOTH comida and cena (whole-dish
// reduce included) against desayuno+merienda at their own default portion.
// dayIdx (0=lunes..6=domingo) resolves person.kcalByDay when present — pass
// it whenever the caller knows which day of the week this is (both tabs do).
// Dos pasadas alternas comida<->cena (6 sep 2026, corrige el motor de la app
// para que coincida con el generador de las 11 semanas modelo). Sin esto,
// comida y cena se calculaban cada una asumiendo que la OTRA se quedaba en
// su racion por defecto -- y como las dos se mueven a la vez de verdad, la
// suma podia quedarse corta o pasarse de largo varios cientos de kcal.
// Pasada 1: comida vs cena@default. Pasada 2: cena vs comida@pasada-1.
// Pasada 3: recomputar comida vs cena@pasada-2 (el mismo refinamiento que
// hacia scripts/html-core.mjs). Se exporta porque el Batch tab necesita los
// MISMOS gramos reales que aqui se usan para el kcal mostrado.
export function personMealScalesTwoPass(day, person, allIng, allCombos, target) {
  const comidaMeal = day?.comida, cenaMeal = day?.cena
  const comidaCombo = comidaMeal?.type === 'desayuno' ? allCombos[comidaMeal.recipeKey] : null
  const cenaCombo   = cenaMeal?.type   === 'desayuno' ? allCombos[cenaMeal.recipeKey]   : null
  const comidaDefault = comidaCombo ? comboAgg(comidaCombo, allIng) : null
  const cenaDefault   = cenaCombo   ? comboAgg(cenaCombo, allIng)   : null

  const c1 = personMealScale(day, 'comida', person, allIng, allCombos, { kcalTarget: target })
  const c1Kcal = c1?.mealKcalAchieved ?? comidaDefault?.kcal ?? 0
  const n = personMealScale(day, 'cena', person, allIng, allCombos, {
    kcalTarget: target, otherMealType: 'comida', otherMealKcalOverride: c1Kcal,
  })
  const nKcal = n?.mealKcalAchieved ?? cenaDefault?.kcal ?? 0
  const c2 = personMealScale(day, 'comida', person, allIng, allCombos, {
    kcalTarget: target, otherMealType: 'cena', otherMealKcalOverride: nKcal,
  })

  return {
    comida: c2 ?? c1, cena: n,
    comidaDefaultKcal: comidaDefault?.kcal ?? 0, cenaDefaultKcal: cenaDefault?.kcal ?? 0,
    comidaDefaultCost: comidaDefault?.cost ?? 0, cenaDefaultCost: cenaDefault?.cost ?? 0,
  }
}

export function personDayKcal(day, person, allIng, allCombos, dayIdx = null) {
  const target = personTargetForDay(person, dayIdx)
  const base = dayKcal(day, allIng, allCombos) // todo a racion por defecto
  const { comida, cena, comidaDefaultKcal, cenaDefaultKcal } = personMealScalesTwoPass(day, person, allIng, allCombos, target)
  const comidaKcal = comida?.mealKcalAchieved ?? comidaDefaultKcal
  const cenaKcal   = cena?.mealKcalAchieved   ?? cenaDefaultKcal
  return Math.round(base - comidaDefaultKcal - cenaDefaultKcal + comidaKcal + cenaKcal)
}

// Same idea as personDayKcal but for cost — used by the weekly cost card.
function dayCost(day, allIng, allCombos) {
  return Object.values(day || {}).reduce((s, m) => {
    if (!m || m.type !== 'desayuno') return s
    const combo = allCombos[m.recipeKey]
    return combo ? s + comboAgg(combo, allIng, m.comboVariants || {}).cost : s
  }, 0)
}

export function personDayCost(day, person, allIng, allCombos, dayIdx = null) {
  const target = personTargetForDay(person, dayIdx)
  const base = dayCost(day, allIng, allCombos)
  const { comida, cena, comidaDefaultCost, cenaDefaultCost } = personMealScalesTwoPass(day, person, allIng, allCombos, target)
  const comidaCost = comida?.mealCostAchieved ?? comidaDefaultCost
  const cenaCost   = cena?.mealCostAchieved   ?? cenaDefaultCost
  return base - comidaDefaultCost - cenaDefaultCost + comidaCost + cenaCost
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

// ─── Per-person slot shape (weekPlan) ────────────────────────────────────────
// 6 sep 2026: hasta ahora cada slot de weekPlan (`{lun-desayuno: meal}`) era
// UN plato compartido por todos los perfiles activos ese dia — no se podia
// representar "Julio come burrito, Maria come torta de garbanzo" el mismo
// dia. Los dos formatos coexisten a proposito:
//   - Forma plana  { type, recipeKey, ... }        → igual para todos (como
//     siempre; lo que escribe el picker manual, sin tocar).
//   - Forma nueva  { byPerson: { [personId]: meal|null } } → cuando difieren
//     de verdad (cargado desde una semana modelo). null = esa persona no
//     come esa franja ese dia (p.ej. Maria sin merienda lunes/miercoles).
// Todo el codigo que lee un slot debe pasar por slotForPerson en vez de
// asumir la forma plana directamente.
export function slotForPerson(slot, personId) {
  if (!slot) return null
  if (slot.byPerson) return slot.byPerson[personId] ?? null
  return slot
}

// true si el slot es la forma plana, o si byPerson tiene el mismo plato (o
// ausencia) para todos los perfiles dados — para decidir si una celda del
// planificador puede mostrarse en una sola linea o necesita desglose.
export function slotIsUniform(slot, profileIds) {
  if (!slot || !slot.byPerson) return true
  const metas = profileIds.map(id => JSON.stringify(slot.byPerson[id] ?? null))
  return metas.every(m => m === metas[0])
}

export function makeByPersonSlot(map) {
  return { byPerson: map }
}
