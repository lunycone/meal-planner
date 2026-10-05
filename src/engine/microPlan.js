// ─── Vitaminas del DÍA y del batch + sugerencias ─────────────────────────────
// Las necesidades (RDA/AI) son diarias, así que aquí se mira el día entero de
// cada persona (con su ración real: base escalada y chorro de AOVE) y el
// promedio de los días que cubre el batch. Un plato pobre en calcio no importa
// si el desayuno ya lo trae.
//
// Las sugerencias (subir lo que ya lleva un plato, o añadirle algo de la
// despensa) se evalúan con el MISMO motor del plan: se sustituye el plato por
// una versión modificada y se recalcula el día, así que el efecto en kcal,
// coste y vitaminas incluye el reescalado de la base.

import { personMealScalesTwoPass, personTargetForDay, personDayKcal, personDayCost, dishHasGOS, dishHasAllium, dishHasInsolubleFiber, slotForPerson } from './calc'
import { comboMicros, NUTRIENTS, sexOf } from './micros'
import { tagsOf } from '../lib/tags'
import { MEALS } from '../lib/mealplan'

const OIL = { k: 'evoo' }

// Los ingredientes de un plato tal como se comen: ración de la persona (base
// escalada, plato reducido o chorro de AOVE), variantes y extras elegidos.
function scaledItems(meal, combo, sc) {
  const variants = meal.comboVariants || {}
  const factor = sc?.wholeDishFactor != null && sc.wholeDishFactor < 0.995 ? sc.wholeDishFactor : 1
  const items = combo.items.map(it => {
    let p = { ...it.p }
    if (variants[it.k] != null && p.units != null) p.units = variants[it.k]
    if (sc?.ingKey === it.k && sc.grams != null && p.grams != null) p.grams = sc.grams
    else if (factor !== 1) { if (p.grams != null) p.grams *= factor; if (p.ml != null) p.ml *= factor; if (p.units != null) p.units *= factor }
    return { k: it.k, p }
  })
  for (const k of meal.comboOptionals ?? []) {
    const oi = combo.optionalItems?.find(o => o.k === k)
    if (oi) items.push({ k, p: { ...oi.p } })
  }
  if (sc?.oilMlApplied > 0) items.push({ ...OIL, p: { ml: sc.oilMlApplied } })
  return items
}

/** Micronutrientes, kcal y coste del día de una persona (ración real). */
export function personDayMicros(day, person, dayIdx, allIng, allCombos) {
  const target = personTargetForDay(person, dayIdx)
  const tp = personMealScalesTwoPass(day, person, allIng, allCombos, target)
  const items = []
  for (const m of MEALS) {
    const meal = day?.[m]
    const combo = meal?.type === 'desayuno' ? allCombos[meal.recipeKey] : null
    if (!combo) continue
    items.push(...scaledItems(meal, combo, m === 'comida' || m === 'cena' ? tp[m] : null))
  }
  return { ...comboMicros(items, allIng), kcal: personDayKcal(day, person, allIng, allCombos, dayIdx), cost: personDayCost(day, person, allIng, allCombos, dayIdx), target }
}

const needOf = (n, person) => n.dri[sexOf(person)]

/**
 * Resumen del batch para una persona: por día y de media, qué fracción de la
 * necesidad diaria cubre cada nutriente.
 *  days: [{ dayKey, dayIdx }]
 */
export function batchSummary({ weekData, person, days, allIng, allCombos }) {
  const perDay = days.map(({ dayKey, dayIdx }) => {
    const day = Object.fromEntries(MEALS.map(m => [m, slotForPerson(weekData?.[`${dayKey}-${m}`] ?? null, person.id)]))
    const planned = MEALS.some(m => day[m])
    return { dayKey, dayIdx, day, planned, ...(planned ? personDayMicros(day, person, dayIdx, allIng, allCombos) : { totals: null, kcal: 0, cost: 0, covered: 1, missing: [], target: 0 }) }
  })
  return { person, perDay, ...summarize(perDay, person) }
}

function summarize(perDay, person) {
  const planned = perDay.filter(d => d.planned)
  const rows = NUTRIENTS.map(n => {
    const need = needOf(n, person)
    const byDay = perDay.map(d => d.planned ? d.totals[n.key] / need : null)
    const avg = planned.length ? planned.reduce((s, d) => s + d.totals[n.key] / need, 0) / planned.length : 0
    return { ...n, avg, byDay }
  })
  const score = rows.reduce((s, r) => s + Math.min(1, r.avg), 0)   // 0..12: cuánto de la necesidad cubre de media
  const covered = planned.length ? Math.min(...planned.map(d => d.covered)) : 1
  return { rows, score, covered, plannedDays: planned.length }
}

// ─── Candidatos ──────────────────────────────────────────────────────────────
// Qué se puede añadir a cada franja (de la despensa de siempre) y en qué ración.
const SNACK = ['merienda'], BRK = ['desayuno'], MAIN = ['comida', 'cena']
const ALL = ['desayuno', 'comida', 'merienda', 'cena']
const ADD = [
  { k: 'eggs', p: { units: 1 }, slots: [...BRK, ...MAIN], label: '1 egg' },
  { k: 'greek-yogurt', p: { grams: 150 }, slots: [...BRK, ...SNACK], label: 'Greek yogurt (150 g)' },
  { k: 'cow-yogurt', p: { grams: 150 }, slots: [...BRK, ...SNACK], label: 'yogurt (150 g)' },
  { k: 'kefir', p: { grams: 150 }, slots: [...BRK, ...SNACK], label: 'kefir (150 g)' },
  { k: 'cheddar', p: { grams: 30 }, slots: [...BRK, ...MAIN], label: 'cheddar (30 g)' },
  { k: 'feta-cow', p: { grams: 30 }, slots: MAIN, label: 'feta (30 g)' },
  { k: 'pumpkin-seeds', p: { grams: 20 }, slots: ALL, label: 'pumpkin seeds (20 g)' },
  { k: 'sunflower-seeds', p: { grams: 15 }, slots: ALL, label: 'sunflower seeds (15 g)' },
  { k: 'chia', p: { grams: 10 }, slots: [...BRK, ...SNACK], label: 'chia (10 g)' },
  { k: 'ground-flaxseed', p: { grams: 10 }, slots: [...BRK, ...SNACK, 'cena'], label: 'ground flax (10 g)' },
  { k: 'walnuts', p: { grams: 20 }, slots: ALL, label: 'walnuts (20 g)' },
  { k: 'almonds', p: { grams: 25 }, slots: [...BRK, ...SNACK], label: 'almonds (25 g)' },
  { k: 'sardines-half-can', p: {}, slots: MAIN, label: '½ can of sardines' },
  { k: 'broccoli', p: { grams: 100 }, slots: MAIN, label: 'broccoli (100 g)' },
  { k: 'frozen-spinach', p: { grams: 80 }, slots: MAIN, label: 'spinach (80 g)' },
  { k: 'kale', p: { grams: 50 }, slots: MAIN, label: 'kale (50 g)' },
  { k: 'yellow-pepper-costco', p: { grams: 60 }, slots: MAIN, label: 'pepper (60 g)' },
  { k: 'carrot', p: { grams: 80 }, slots: MAIN, label: 'carrot (80 g)' },
  { k: 'mushrooms-costco', p: { grams: 80 }, slots: MAIN, label: 'mushrooms (80 g)' },
  { k: 'green-peas-costco', p: { grams: 60 }, slots: MAIN, label: 'peas (60 g)' },
  { k: 'lemon', p: { units: 0.5 }, slots: MAIN, label: '½ lemon' },
  { k: 'orange', p: { grams: 150 }, slots: [...BRK, ...SNACK], label: 'orange (150 g)' },
  { k: 'strawberries', p: { grams: 100 }, slots: [...BRK, ...SNACK], label: 'strawberries (100 g)' },
  { k: 'blueberries', p: { grams: 80 }, slots: [...BRK, ...SNACK], label: 'blueberries (80 g)' },
  { k: 'banana', p: { grams: 120 }, slots: [...BRK, ...SNACK], label: 'banana' },
  { k: 'avocado', p: { units: 0.5 }, slots: [...BRK, ...MAIN], label: '½ avocado' },
  { k: 'green-lentils', p: { grams: 40 }, slots: MAIN, label: 'lentils (40 g dry)' },
  { k: 'chickpeas', p: { grams: 40 }, slots: MAIN, label: 'chickpeas (40 g dry)' },
]
// Lo que de un plato se puede subir sin que deje de ser ese plato.
const SCALABLE_TAGS = ['veg', 'fruit', 'nut', 'dairy', 'egg', 'legume']
const MAX_SCALE_UP = 1.6

const fmtAmt = p => p.grams != null ? `${Math.round(p.grams)} g` : p.units != null ? `${p.units}` : ''

const dayOf = (weekData, person, dayKey) => Object.fromEntries(MEALS.map(m => [m, slotForPerson(weekData?.[`${dayKey}-${m}`] ?? null, person.id)]))

/**
 * Sugerencias para el batch. Devuelve [{ id, mealType, recipeKey, dayKeys, personIds, kind, text, items, effects, dKcal, dCost }].
 *  people: [{ person, summary }] (las personas activas)
 *  rejected: Set de ids ya rechazados
 */
export function suggestChanges({ weekData, people, days, allIng, allCombos, stock = {}, rejected = new Set(), max = 6 }) {
  const out = []
  // Grupos: franja + plato + días en los que lo come alguien (por persona).
  const groups = new Map()
  for (const { person } of people) for (const m of MEALS) {
    const byKey = new Map()
    for (const { dayKey } of days) {
      const meal = slotForPerson(weekData?.[`${dayKey}-${m}`] ?? null, person.id)
      if (meal?.type !== 'desayuno' || !allCombos[meal.recipeKey]) continue
      const arr = byKey.get(meal.recipeKey) ?? []; arr.push(dayKey); byKey.set(meal.recipeKey, arr)
    }
    for (const [recipeKey, dayKeys] of byKey) {
      const id = `${m}|${recipeKey}|${dayKeys.join(',')}`
      const g = groups.get(id) ?? { id, mealType: m, recipeKey, dayKeys, persons: [] }
      g.persons.push(person); groups.set(id, g)
    }
  }

  for (const g of groups.values()) {
    const combo = allCombos[g.recipeKey]
    const cands = []
    // 1) Subir lo que el plato ya lleva
    combo.items.forEach((it, i) => {
      if (it.k === 'evoo' || it.p?.grams == null) return
      const ing = allIng[it.k]; if (!ing) return
      if (!tagsOf(it.k, allIng).some(t => SCALABLE_TAGS.includes(t))) return
      if (combo.scalable === it.k) return
      const grams = Math.round(it.p.grams * 1.5 / 5) * 5
      if (grams <= it.p.grams || grams > it.p.grams * MAX_SCALE_UP) return
      const items = combo.items.map((x, j) => j === i ? { ...x, p: { ...x.p, grams } } : x)
      cands.push({ kind: 'more', text: `More ${(ing.name ?? it.k).split(' (')[0].split(' · ').pop().toLowerCase()} (${Math.round(it.p.grams)} → ${grams} g)`, items, key: `more:${it.k}` })
    })
    // 2) Añadir algo de la despensa
    for (const a of ADD) {
      if (!a.slots.includes(g.mealType)) continue
      const ing = allIng[a.k]; if (!ing || ing.hideInTable || ing.dateOnly || ing.pend) continue
      if (ing.temporary && !(stock[a.k] > 0)) continue
      if (combo.items.some(x => x.k === a.k)) continue
      cands.push({ kind: 'add', text: `Add ${a.label}`, items: [...combo.items, { k: a.k, p: { ...a.p } }], key: `add:${a.k}` })
    }

    for (const c of cands) {
      const newCombo = { ...combo, items: c.items }
      const newKey = '__cand'
      const combos2 = { ...allCombos, [newKey]: newCombo }
      const benefit = []
      for (const person of g.persons) {
        const base = people.find(x => x.person.id === person.id).summary
        // Reglas digestivas: no se introduce lo que la persona evita.
        if (person.digestive) {
          if ((dishHasGOS(newCombo, allIng) && !dishHasGOS(combo, allIng)) || (dishHasAllium(newCombo, allIng) && !dishHasAllium(combo, allIng)) || (dishHasInsolubleFiber(newCombo, allIng) && !dishHasInsolubleFiber(combo, allIng))) continue
          // legumbre solo si ese día no hay ya otra
          if (c.key === 'add:green-lentils' || c.key === 'add:chickpeas') {
            if (g.dayKeys.some(dk => MEALS.some(m => m !== g.mealType && allCombos[dayOf(weekData, person, dk)[m]?.recipeKey] && dishHasGOS(allCombos[dayOf(weekData, person, dk)[m].recipeKey], allIng)))) continue
          }
        }
        // Se recalcula SOLO el día de cada día afectado, con el plato modificado.
        let dKcal = 0, dCost = 0, overKcal = false
        const perDay = base.perDay.map(d => {
          if (!g.dayKeys.includes(d.dayKey)) return d
          const day = { ...d.day, [g.mealType]: { ...d.day[g.mealType], recipeKey: newKey } }
          const after = personDayMicros(day, person, d.dayIdx, allIng, combos2)
          dKcal += after.kcal - d.kcal; dCost += after.cost - d.cost
          if (d.target > 0 && after.kcal > d.target * 1.08) overKcal = true
          return { ...d, day, ...after }
        })
        if (overKcal) continue
        const sum = summarize(perDay, person)
        const gain = sum.score - base.score
        if (gain < 0.06) continue   // menos de un 6 % de una necesidad no merece un cambio (ni su coste)
        const effects = sum.rows.map((r, ri) => ({ key: r.key, label: r.label, before: base.rows[ri].avg, after: r.avg })).filter(e => e.before < 1 && Math.min(1, e.after) - e.before >= 0.03).sort((a, b) => (Math.min(1, b.after) - b.before) - (Math.min(1, a.after) - a.before)).slice(0, 3)
        benefit.push({ person, gain, dKcal: dKcal / g.dayKeys.length, dCost: dCost / g.dayKeys.length, dCostTotal: dCost, effects })
      }
      if (!benefit.length) continue
      const id = `${g.id}|${c.key}`
      if (rejected.has(id)) continue
      const gain = benefit.reduce((s, b) => s + b.gain, 0)
      const dCostDay = benefit.reduce((s, b) => s + b.dCost, 0)
      out.push({
        id, mealType: g.mealType, recipeKey: g.recipeKey, dayKeys: g.dayKeys, kind: c.kind, text: c.text, items: c.items, comboName: combo.name,
        benefit, gain, dCostTotal: benefit.reduce((s, b) => s + b.dCostTotal, 0), rank: gain - 0.15 * Math.max(0, dCostDay),
      })
    }
  }
  // Las mejores, sin repetir el mismo plato más de dos veces.
  out.sort((a, b) => b.rank - a.rank)
  // Un solo plato máximo por tipo de cambio (p. ej. espinacas una vez, no en cuatro platos) y dos por plato.
  // y como mucho dos cambios para el mismo hueco principal (no seis formas de subir el calcio).
  const perDish = {}, perKind = new Set(), perNutrient = {}, pick = []
  for (const s of out) {
    const k = `${s.mealType}|${s.recipeKey}`, ck = s.id.split('|').pop()
    const main = s.benefit[0].effects[0]?.key ?? '-'
    if ((perDish[k] ?? 0) >= 2 || perKind.has(ck) || (perNutrient[main] ?? 0) >= 2) continue
    perDish[k] = (perDish[k] ?? 0) + 1; perKind.add(ck); perNutrient[main] = (perNutrient[main] ?? 0) + 1; pick.push(s)
    if (pick.length >= max) break
  }
  return pick
}

export const NEEDS = needOf
