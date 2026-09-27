// Ayudantes compartidos por la UI nueva (Hoy, Planificador, Compra, Batch).
// Solo LEEN el motor (engine/calc.js) — no calculan nada por su cuenta, para
// que cualquier cifra en pantalla sea la misma que ya usa el resto de la app.

import {
  comboAgg, comboAggScaled, personMealScalesTwoPass, personTargetForDay,
  personDayKcal, personDayCost, personDayProt, slotForPerson, slotIsUniform,
  pcosCarbLevel,
} from '../engine/calc'
import { getISOWeek } from '../utils/date'

export const DAY_KEYS   = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
export const DAY_SHORT  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LONG   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const MONTHS     = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MEALS      = ['desayuno', 'comida', 'merienda', 'cena']
export const MEAL_LABEL = { desayuno: 'Breakfast', comida: 'Lunch', merienda: 'Snack', cena: 'Dinner' }
export const MEAL_TIME  = { desayuno: '9:00', comida: '12:00', merienda: '16:30', cena: '19:30' }

// Los días de batch ya no son fijos: ver lib/batchConfig.js (Ajustes).

// Días en nevera a partir de los cuales el tupper conviene congelarlo
// (cocinado el domingo: jueves = 4 días, viernes = 5).
export const FREEZE_FROM_DAY = 'jue'

export function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

/** Lunes (00:00) de la semana ISO que contiene `date`. */
export function mondayOf(date) {
  const d = startOfDay(date)
  const dow = d.getDay()
  return addDays(d, dow === 0 ? -6 : 1 - dow)
}

export function weekDatesFrom(monday) {
  return DAY_KEYS.map((_, i) => addDays(monday, i))
}

/** weekKey de weekPlan para el lunes dado (el jueves decide el año ISO). */
export function weekKeyOf(monday) {
  return getISOWeek(addDays(monday, 3))
}

export function dayIndexOf(date) {
  const dow = date.getDay()
  return dow === 0 ? 6 : dow - 1
}

export function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Próximo batch: el domingo que viene (u hoy si es domingo) cocina la
 *  semana que empieza el lunes siguiente. El de esta semana ya se cocinó. */
export function nextBatchMonday(today = new Date()) {
  return addDays(mondayOf(today), 7)
}

export function fmtMoney(n) { return '$' + (n ?? 0).toFixed(2) }
export function fmtShortDate(d) { return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}` }
export function fmtRange(a, b) {
  return a.getMonth() === b.getMonth()
    ? `${MONTHS_SHORT[a.getMonth()]} ${a.getDate()} – ${b.getDate()}`
    : `${fmtShortDate(a)} – ${fmtShortDate(b)}`
}

export function activeProfilesOn(profiles, date) {
  const d = startOfDay(date)
  return (profiles ?? []).filter(p => {
    if (p.validoDesde && new Date(p.validoDesde) > d) return false
    if (p.validoHasta && new Date(p.validoHasta) <= d) return false
    return true
  })
}

/** Nombre corto de un plato para vistas densas: corta en el primer « + ». */
export function shortName(name = '') {
  const cut = name.split(' + ')[0].split(' (')[0]
  return cut.length > 34 ? cut.slice(0, 32) + '…' : cut
}

/** Día (4 franjas) resuelto para una persona. */
export function dayForPerson(weekData, dayKey, personId) {
  return Object.fromEntries(MEALS.map(m => [m, slotForPerson(weekData?.[`${dayKey}-${m}`] ?? null, personId)]))
}

/** Cifras de UNA franja para UNA persona, con la ración real del motor. */
export function mealInfo(day, mealType, person, dayIdx, allIng, allCombos) {
  const meal = day?.[mealType]
  if (!meal || meal.type !== 'desayuno') return null
  const combo = allCombos[meal.recipeKey]
  if (!combo) return null
  const agg = comboAgg(combo, allIng, meal.comboVariants || {}, {}, meal.comboOptionals || [])
  let kcal = agg.kcal, cost = agg.cost, prot = agg.prot ?? 0, fat = agg.fat ?? 0, carb = agg.carb ?? 0
  let portion = 'Base portion', scaled = null
  if (mealType === 'comida' || mealType === 'cena') {
    const tp = personMealScalesTwoPass(day, person, allIng, allCombos, personTargetForDay(person, dayIdx))
    const sc = tp[mealType]
    if (sc) {
      kcal = sc.mealKcalAchieved ?? kcal
      cost = sc.mealCostAchieved ?? cost
      if (sc.grams != null && sc.ingKey) {
        const a = comboAgg(combo, allIng, meal.comboVariants || {}, { [sc.ingKey]: sc.grams })
        prot = a.prot ?? prot
        fat = a.fat ?? fat
        carb = a.carb ?? carb
        portion = `${sc.ingName} ${sc.grams} g`
        scaled = { ingName: sc.ingName, grams: sc.grams, defaultGrams: sc.defaultGrams, oilMl: sc.oilMlApplied ?? 0 }
        fat += sc.oilMlApplied ?? 0
      } else if (sc.wholeDishFactor != null && sc.wholeDishFactor < 0.995) {
        const sa = comboAggScaled(combo, allIng, sc.wholeDishFactor)
        prot = sa.prot ?? prot; fat = sa.fat ?? fat; carb = sa.carb ?? carb
        portion = `Portion ×${sc.wholeDishFactor.toFixed(2)}`
        scaled = { factor: sc.wholeDishFactor }
      } else if ((sc.oilMlApplied ?? 0) > 0) {
        portion = `Base portion + ${sc.oilMlApplied} ml EVOO`
        scaled = { oilMl: sc.oilMlApplied }
        fat += sc.oilMlApplied
      }
    }
  }
  const carbs = carb
  return {
    key: meal.recipeKey, combo, name: combo.name, kcal: Math.round(kcal), prot: Math.round(prot), cost,
    fat: Math.round(fat), carbs: Math.round(carbs), baseKcal: Math.round(agg.kcal),
    pcos: pcosCarbLevel(combo, allIng, mealType), portion, scaled,
  }
}

/** Totales del día de UNA persona (mismo motor que Planificador/Batch). */
export function dayTotals(day, person, dayIdx, allIng, allCombos) {
  const any = MEALS.some(m => day?.[m])
  if (!any) return { kcal: 0, prot: 0, cost: 0, target: personTargetForDay(person, dayIdx), planned: 0 }
  return {
    kcal: personDayKcal(day, person, allIng, allCombos, dayIdx),
    prot: Math.round(personDayProt(day, person, allIng, allCombos, dayIdx)),
    cost: personDayCost(day, person, allIng, allCombos, dayIdx),
    target: personTargetForDay(person, dayIdx),
    planned: MEALS.filter(m => day?.[m]).length,
  }
}

export function slotUniform(slot, profiles) {
  return slotIsUniform(slot, (profiles ?? []).map(p => p.id))
}

/** Macros de la receta base en % de kcal: [prot, carbo, grasa]. */
export function macroPct(info) {
  if (!info) return [0, 0, 0]
  const P = info.prot * 4, C = info.carbs * 4, F = info.fat * 9, T = P + C + F || 1
  return [Math.round(P / T * 100), Math.round(C / T * 100), Math.round(F / T * 100)]
}

// Paleta de franjas (glass crema). color = trazo/texto, tint = fondo suave.
export const MEAL_STYLE = {
  desayuno: { color: '#C1850C', tint: 'rgba(224,162,27,0.16)', glow: 'rgba(224,162,27,0.30)' },
  comida:   { color: '#D9486A', tint: 'rgba(232,98,124,0.15)', glow: 'rgba(232,98,124,0.28)' },
  merienda: { color: '#2585BC', tint: 'rgba(46,155,214,0.15)', glow: 'rgba(46,155,214,0.28)' },
  cena:     { color: '#7154DA', tint: 'rgba(139,111,232,0.15)', glow: 'rgba(139,111,232,0.30)' },
}

export const PERSON_COLOR = ['#E97B2E', '#C9489F', '#2E8B6E', '#3B6FD8']

export const PCOS_STYLE = {
  green:  { color: '#2F9E5B', label: 'PCOS low',  long: 'Low carb (PCOS)' },
  yellow: { color: '#B7791F', label: 'PCOS mid', long: 'Mid carb (PCOS)' },
  red:    { color: '#D64545', label: 'PCOS high',  long: 'High carb (PCOS)' },
}

/** Lunes de una clave de semana ISO ('2026-W40' → lun 28 sep 2026). */
export function mondayOfWeekKey(key) {
  const m = /^(\d{4})-W(\d{2})$/.exec(key ?? '')
  if (!m) return null
  return addDays(mondayOf(new Date(+m[1], 0, 4)), (+m[2] - 1) * 7)
}

/** Dónde aparece un plato en el plan: [{ weekKey, monday, days:Set, count }],
 *  de la semana más reciente a la más antigua. */
export function dishUsage(weekPlan, recipeKey) {
  const out = []
  for (const [wk, week] of Object.entries(weekPlan ?? {})) {
    if (!week) continue
    let count = 0
    const days = new Set()
    for (const [slot, v] of Object.entries(week)) {
      if (!v) continue
      const metas = v.byPerson ? Object.values(v.byPerson) : [v]
      const n = metas.filter(m => m?.recipeKey === recipeKey).length
      if (n) { count += n; days.add(slot.split('-')[0]) }
    }
    if (count) out.push({ weekKey: wk, monday: mondayOfWeekKey(wk), days, count })
  }
  return out.sort((a, b) => (b.monday?.getTime() ?? 0) - (a.monday?.getTime() ?? 0))
}

/** Cifras de una semana entera (28 huecos) con el motor real: coste de todos,
 *  kcal media por persona frente a su objetivo, días dentro de ±5 % y los
 *  platos de comida (para reconocerla de un vistazo). */
export function weekStats(slots, people, allIng, allCombos) {
  let cost = 0, hit = 0, n = 0, planned = 0
  const perPerson = people.map(p => {
    let kcal = 0, tgt = 0
    DAY_KEYS.forEach((dk, i) => {
      const t = dayTotals(dayForPerson(slots, dk, p.id), p, i, allIng, allCombos)
      cost += t.cost; kcal += t.kcal; tgt += t.target
      n++; if (t.planned && Math.abs(t.kcal - t.target) <= t.target * 0.05) hit++
    })
    return { p, kcal: Math.round(kcal / 7), target: Math.round(tgt / 7) }
  })
  DAY_KEYS.forEach(dk => MEALS.forEach(m => { if (slots?.[`${dk}-${m}`]) planned++ }))
  const keyOf = v => v?.byPerson ? Object.values(v.byPerson).find(Boolean)?.recipeKey : v?.recipeKey
  const comida = [...new Set(DAY_KEYS.map(dk => keyOf(slots?.[`${dk}-comida`])).filter(Boolean))]
    .map(k => shortName(allCombos[k]?.name ?? k))
  return { cost, hit, n, perPerson, comida, planned }
}
