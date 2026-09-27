// Sugerencias del panel de la bombilla. Todo sale de los datos reales
// (weekPlan + motor), nada escrito a mano: si no aplica, no aparece.

import { slotForPerson } from './calc'
import { weekViolations } from './weekRules'
import {
  DAY_KEYS, DAY_LONG, MEALS, addDays, mondayOf, weekKeyOf, nextBatchMonday,
  activeProfilesOn, dayForPerson, dayTotals, fmtRange, startOfDay,
} from '../lib/mealplan'
import { nextBatch, sessionDates, daysSinceCook } from '../lib/batchConfig'

const SOAK_KEYS = new Set(['chickpeas', 'black-beans', 'white-beans', 'kidney-beans', 'cranberry-beans', 'romano-beans'])
const OVERNIGHT_KEYS = new Set(['oats'])

function batchSlots(weekPlan, dates, profiles, allCombos) {
  // [{ dayKey, mealType, person, combo, key, date }] de los días de un batch
  const out = []
  dates.forEach(({ dayKey: dk, date, wk }) => {
    const week = weekPlan[wk] ?? {}
    activeProfilesOn(profiles, date).forEach(person => {
      MEALS.forEach(mt => {
        const meal = slotForPerson(week[`${dk}-${mt}`] ?? null, person.id)
        const combo = meal?.type === 'desayuno' ? allCombos[meal.recipeKey] : null
        if (combo) out.push({ dayKey: dk, mealType: mt, person, combo, key: meal.recipeKey, date })
      })
    })
  })
  return out
}

export function computeInsights({ weekPlan, profiles, allIng, allCombos, today = new Date() }) {
  const out = []
  const t = startOfDay(today)
  const dow = t.getDay() // 0 dom … 6 sáb
  // El próximo batch por cocinar (Ajustes → días de batch).
  const nb = nextBatch(t)
  const nbDates = sessionDates(nb.monday, nb.si)
  const nextMon = nextBatchMonday(t)
  const nextSlots = batchSlots(weekPlan, nbDates, profiles, allCombos)
  const range = fmtRange(nbDates[0].date, nbDates[nbDates.length - 1].date)
  const daysToCook = Math.round((startOfDay(nb.cookDate) - t) / 86400000)
  const cookName = DAY_LONG[(nb.cookDate.getDay() + 6) % 7]

  // 1 · Víspera del batch: lo que necesita la noche
  if (daysToCook === 1 && nextSlots.length) {
    const overnight = {}, soak = new Set()
    nextSlots.forEach(s => {
      const keys = s.combo.items.map(it => it.k)
      if ((s.mealType === 'desayuno' || s.mealType === 'merienda') && keys.some(k => OVERNIGHT_KEYS.has(k))) {
        overnight[s.combo.name] = (overnight[s.combo.name] ?? 0) + 1
      }
      keys.filter(k => SOAK_KEYS.has(k)).forEach(k => soak.add(allIng[k]?.name ?? k))
    })
    const list = Object.entries(overnight).map(([n, c]) => `${n} ×${c}`)
    if (list.length) out.push({
      id: 'vispera', when: 'Tonight', icon: 'moon', color: '#7154DA', tint: 'rgba(139,111,232,0.15)',
      title: 'Put the oat dishes in the fridge', detail: list.join(' · ') + '. They need the night before the batch.',
    })
    if (soak.size) out.push({
      id: 'remojo', when: 'Tonight', icon: 'moon', color: '#2585BC', tint: 'rgba(46,155,214,0.15)',
      title: 'Soak the legumes', detail: `${[...soak].join(', ')}: 8–12 h in water for tomorrow's batch.`,
    })
  }

  // 2 · Congelar / descongelar: lo que se come 4+ días después de cocinarlo
  if ((daysToCook === 0 || daysToCook === 1) && nextSlots.length) {
    const late = nextSlots.filter(s => (s.mealType === 'comida' || s.mealType === 'cena') && Math.round((startOfDay(s.date) - startOfDay(nb.cookDate)) / 86400000) >= 4)
    const lateDays = [...new Set(late.map(s => DAY_KEYS.indexOf(s.dayKey)))].sort((a, b) => a - b)
    if (late.length) out.push({
      id: 'congelar', when: daysToCook === 0 ? 'Today, after the batch' : 'Tomorrow, at the batch', icon: 'snow', color: '#2585BC', tint: 'rgba(46,155,214,0.15)',
      title: `Freeze the ${late.length} ${lateDays.map(i => DAY_LONG[i]).join(' and ')} containers`, detail: `Cooked on ${cookName} they would be 4+ days in the fridge.`, view: 'batch',
    })
  }
  {
    const tmr = addDays(t, 1)
    const since = daysSinceCook(tmr)
    const tdk = DAY_KEYS[(tmr.getDay() + 6) % 7]
    const week = weekPlan[weekKeyOf(mondayOf(tmr))] ?? {}
    const has = ['comida', 'cena'].some(m => week[`${tdk}-${m}`])
    if (since != null && since >= 4 && has) out.push({
      id: 'descongelar', when: 'Tonight', icon: 'snow', color: '#2585BC', tint: 'rgba(46,155,214,0.15)',
      title: `Move ${DAY_LONG[DAY_KEYS.indexOf(tdk)]}'s containers to the fridge`, detail: "So they're ready to reheat tomorrow.",
    })
  }

  // 3 · Compra del próximo batch
  if (nextSlots.length && daysToCook <= 3) {
    const ings = new Set()
    nextSlots.forEach(s => s.combo.items.forEach(it => ings.add(it.k)))
    if (ings.size) out.push({
      id: 'compra', when: daysToCook === 0 ? 'Today' : `Before ${cookName}`, icon: 'bag', color: '#C1850C', tint: 'rgba(224,162,27,0.16)',
      title: `Batch shopping: ${ings.size} ingredients`, detail: `For ${range}.`, view: 'compra',
    })
  }

  // 4 · Semana que viene sin planificar
  {
    const wk = weekKeyOf(nextMon)
    const week = weekPlan[wk] ?? {}
    const missing = DAY_KEYS.length * MEALS.length - DAY_KEYS.reduce((s, dk) => s + MEALS.filter(m => week[`${dk}-${m}`]).length, 0)
    if (missing > 0 && (dow >= 4 || dow === 0)) out.push({
      id: 'planificar', when: 'Next week', icon: 'cal', color: '#1F1B16', tint: 'rgba(31,27,22,0.08)',
      title: missing === 28 ? 'Next week is not planned yet' : `${missing} meals still to plan`,
      detail: `Week of ${fmtRange(nextMon, addDays(nextMon, 6))}. You can load a model week.`, view: 'planificador',
    })
  }

  // 6 · Techo de proteína (perfiles con protCap)
  profiles.filter(p => p.protCap).forEach(person => {
    const mon = mondayOf(t), week = weekPlan[weekKeyOf(mon)] ?? {}
    const over = []
    DAY_KEYS.forEach((dk, i) => {
      const date = addDays(mon, i)
      if (date < t || !activeProfilesOn([person], date).length) return
      const tot = dayTotals(dayForPerson(week, dk, person.id), person, i, allIng, allCombos)
      if (tot.prot > person.protCap) over.push(`${DAY_LONG[i]} ${tot.prot} g`)
    })
    if (over.length) out.push({
      id: 'prot-' + person.id, when: `Protein · ${person.name}`, icon: 'flame', color: '#B7791F', tint: 'rgba(183,121,31,0.14)',
      title: `Over their ${person.protCap} g ceiling`, detail: over.join(' · ') + '.', view: 'planificador',
    })
  })

  // 7 · Reglas digestivas de semana (perfiles con digestive)
  profiles.filter(p => p.digestive).forEach(person => {
    const mon = mondayOf(t), week = weekPlan[weekKeyOf(mon)] ?? {}
    const days = DAY_KEYS.map(dk => {
      const d = dayForPerson(week, dk, person.id)
      return Object.fromEntries(MEALS.map(m => [m, d[m]?.type === 'desayuno' ? allCombos[d[m].recipeKey] : null]))
    })
    const v = weekViolations(days, allIng, {}).filter(x => x.rule.startsWith('dosis-'))
    if (v.length) out.push({
      id: 'dig-' + person.id, when: `Digestion · ${person.name}`, icon: 'leaf', color: '#2F9E5B', tint: 'rgba(47,158,91,0.14)',
      title: 'Too much of one food group in a day', detail: v.slice(0, 2).map(x => x.msg).join(' '), view: 'planificador',
    })
  })

  return out
}
