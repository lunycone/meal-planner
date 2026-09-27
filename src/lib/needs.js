// ─── Cantidades de una ventana de días ──────────────────────────────────────
// Lo que se come de verdad (raciones escaladas por persona y día, AOVE de
// autocierre incluido) sumado por ingrediente. Lo usan la Compra, el Batch
// («cocinado» descuenta de la despensa) y la semana inteligente (paquetes).
import { ingCost, ingKcal, ingProt, ingFat, comboScalableKey, personMealScalesTwoPass, personTargetForDay, slotForPerson } from '../engine/calc'
import { DAY_KEYS, activeProfilesOn } from './mealplan'
import { packOf, keepsOf, KEEPS_DAYS } from './packs'

const ALL_DAY_KEYS = DAY_KEYS
const MEALS = ['desayuno', 'comida', 'merienda', 'cena']

function getQtyValue(p) {
  if (p.grams != null) return { val: p.grams, unit: 'grams' }
  if (p.units != null) return { val: p.units, unit: 'units' }
  if (p.ml != null) return { val: p.ml, unit: 'ml' }
  // Precio fijo por racion (sardinas ½ lata, portion {}): cuenta como 1 racion
  return { val: p.serv ?? 1, unit: 'serv' }
}

/** { [ingKey]: { qtyByUnit, cost, kcal, prot, fat, meals:Set, persons } } */
export function aggregateIngredients({ weekPlan, windowDates, profiles, people, allIng, allCombos }) {
    const agg = {}
    const passCache = new Map() // dos pasadas: una vez por persona y día

    // persons: { [id]: { name, grams, units, ml, serv, days } }
    function ensureAgg(ingKey) {
      if (!agg[ingKey]) agg[ingKey] = { qtyByUnit: {}, cost: 0, kcal: 0, prot: 0, fat: 0, meals: new Set(), persons: {} }
    }
    function trackPerson(ingKey, person, pp) {
      const ps = agg[ingKey].persons
      if (!ps[person.id]) ps[person.id] = { name: person.name, grams: 0, units: 0, ml: 0, serv: 0, days: 0 }
      ps[person.id].grams += pp.grams ?? 0
      ps[person.id].units += pp.units ?? 0
      ps[person.id].ml    += pp.ml    ?? 0
      ps[person.id].serv  += pp.serv  ?? (pp.grams == null && pp.ml == null && pp.units == null ? 1 : 0)
      ps[person.id].days  += 1
    }
    // Racion de UNA persona para UNA comida — se suma al agregado y se
    // registra en el desglose por persona.
    function addForPerson(ingKey, portion, mealTag, person) {
      ensureAgg(ingKey)
      const { val, unit } = getQtyValue(portion)
      if (!agg[ingKey].qtyByUnit[unit]) agg[ingKey].qtyByUnit[unit] = 0
      agg[ingKey].qtyByUnit[unit] += val
      agg[ingKey].cost += ingCost(ingKey, portion, allIng)
      agg[ingKey].kcal += ingKcal(ingKey, portion, allIng)
      agg[ingKey].prot += ingProt(ingKey, portion, allIng)
      agg[ingKey].fat  += ingFat(ingKey, portion, allIng)
      agg[ingKey].meals.add(mealTag)
      trackPerson(ingKey, person, portion)
    }

    function scalePortion(p, factor) {
      if (factor === 1) return p
      const out = { ...p }
      if (out.grams != null) out.grams = Math.round(out.grams * factor)
      if (out.ml    != null) out.ml    = Math.round(out.ml    * factor)
      if (out.units != null) out.units = Math.round(out.units * factor * 2) / 2
      return out
    }

    windowDates.forEach(({ date, wk, dayKey }) => {
      const weekData = weekPlan[wk] ?? {}
      const dayProfiles = people ?? activeProfilesOn(profiles, date)
      if (dayProfiles.length === 0) return
      const dayIdx = ALL_DAY_KEYS.indexOf(dayKey)

      for (const mealType of MEALS) {
        const rawSlot = weekData[`${dayKey}-${mealType}`] ?? null
        if (!rawSlot) continue
        const mealTag = `${dayKey} ${mealType}`
        const isScalable = mealType === 'comida' || mealType === 'cena'

        dayProfiles.forEach(person => {
          const meal = slotForPerson(rawSlot, person.id)
          if (!meal || meal.type !== 'desayuno') return
          const combo = allCombos[meal.recipeKey]
          if (!combo) return

          let scale = null
          let scalableKey = null
          if (isScalable) {
            scalableKey = comboScalableKey(combo, allIng)
            const ck = `${wk}|${dayKey}|${person.id}`
            let twoPass = passCache.get(ck)
            if (!twoPass) {
              const target = personTargetForDay(person, dayIdx)
              const dayForPerson = Object.fromEntries(
                MEALS.map(m => [m, slotForPerson(weekData[`${dayKey}-${m}`] ?? null, person.id)])
              )
              twoPass = personMealScalesTwoPass(dayForPerson, person, allIng, allCombos, target)
              passCache.set(ck, twoPass)
            }
            scale = mealType === 'comida' ? twoPass.comida : twoPass.cena
          }

          const wholeFactor = (scale?.wholeDishFactor != null && scale.wholeDishFactor < 1) ? scale.wholeDishFactor : 1

          combo.items.forEach(it => {
            if (it.k === scalableKey && scale?.grams != null) {
              addForPerson(it.k, { ...it.p, grams: scale.grams }, mealTag, person)
            } else {
              addForPerson(it.k, scalePortion(it.p, wholeFactor), mealTag, person)
            }
          })
          if (combo.optionalItems && meal.comboOptionals?.length > 0) {
            combo.optionalItems
              .filter(oi => meal.comboOptionals.includes(oi.k))
              .forEach(it => addForPerson(it.k, scalePortion(it.p, wholeFactor), mealTag, person))
          }
          // AOVE de autocierre (personMealScale): el chorro extra que cierra
          // el hueco de kcal cuando la base ya esta al tope — mismo aceite
          // que ya se cuenta en Planificador/Batch, aqui como ingrediente mas.
          if (scale?.oilMlApplied > 0) {
            addForPerson('evoo', { ml: scale.oilMlApplied }, mealTag, person)
          }
        })
      }    // end mealType loop
    })     // end windowDates.forEach

    return agg
}

/** Cantidad necesaria en la unidad base del paquete (g, ml o unidades). */
export function needAmount(data, ing, pack) {
  const q = data?.qtyByUnit ?? {}
  if (pack?.dim === 'ml') return q.ml ?? 0
  if (pack?.dim === 'unit') return (q.units ?? 0) + (ing?.unitGrams && q.grams ? q.grams / ing.unitGrams : 0)
  return (q.grams ?? 0) + (ing?.unitGrams && q.units ? q.units * ing.unitGrams : 0)
}

/** Despensa disponible en `date`: lo caducado (según cuánto aguanta) no cuenta. */
export function stockAvailable(stock, allIng, date = new Date()) {
  const out = {}
  for (const [k, v] of Object.entries(stock ?? {})) {
    if (!(v?.amount > 0)) continue
    const days = KEEPS_DAYS[keepsOf(k, allIng[k], allIng)] ?? 180
    const added = v.addedAt ? new Date(v.addedAt) : null
    if (added && (date - added) / 86400000 > days) continue
    out[k] = v.amount
  }
  return out
}

/** Dimensión en la que se mide lo que hace falta: la del paquete, o la de la receta. */
export function needDim(data, pack) {
  if (pack) return pack.dim
  const q = data?.qtyByUnit ?? {}
  return q.grams ? 'g' : q.ml ? 'ml' : q.units ? 'unit' : null
}

/** Cómo se compra `need` de un ingrediente teniendo `have` en casa. */
export function packPlan(key, need, have, allIng) {
  const ing = allIng[key]
  const pack = packOf(ing)
  const use = Math.min(need, have ?? 0)
  const toBuy = Math.max(0, need - use)
  if (!pack || !(pack.amount > 0)) return { pack: null, use, toBuy, packs: null, leftover: 0, keeps: keepsOf(key, ing, allIng) }
  const packs = toBuy > 0 ? Math.ceil(toBuy / pack.amount - 1e-9) : 0
  return {
    pack, use, toBuy, packs, leftover: packs * pack.amount - toBuy,
    buyCost: pack.price != null ? packs * pack.price : null,
    unitPrice: pack.price != null ? pack.price / pack.amount : null,
    keeps: keepsOf(key, ing, allIng),
  }
}
