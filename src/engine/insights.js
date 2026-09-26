// Sugerencias del panel de la bombilla. Todo sale de los datos reales
// (weekPlan + motor), nada escrito a mano: si no aplica, no aparece.

import { comboAgg, pcosCarbLevel, slotForPerson } from './calc'
import { weekViolations } from './weekRules'
import {
  DAY_KEYS, DAY_LONG, BATCH_DAYS, MEALS, addDays, mondayOf, weekKeyOf, nextBatchMonday,
  activeProfilesOn, dayForPerson, dayTotals, fmtRange, startOfDay,
} from '../lib/mealplan'

const SOAK_KEYS = new Set(['garbanzos', 'black-beans', 'alubias-blancas', 'alubias-rojas', 'cranberry', 'romano-beans'])
const OVERNIGHT_KEYS = new Set(['avena'])

function batchSlots(weekPlan, monday, profiles, allCombos) {
  // [{ dayKey, mealType, person, combo, key }] de lun-vie de la semana `monday`
  const wk = weekKeyOf(monday)
  const week = weekPlan[wk] ?? {}
  const out = []
  BATCH_DAYS.forEach((dk, i) => {
    const date = addDays(monday, i)
    activeProfilesOn(profiles, date).forEach(person => {
      MEALS.forEach(mt => {
        const meal = slotForPerson(week[`${dk}-${mt}`] ?? null, person.id)
        const combo = meal?.type === 'desayuno' ? allCombos[meal.recipeKey] : null
        if (combo) out.push({ dayKey: dk, mealType: mt, person, combo, key: meal.recipeKey })
      })
    })
  })
  return out
}

export function computeInsights({ weekPlan, profiles, allIng, allCombos, today = new Date() }) {
  const out = []
  const t = startOfDay(today)
  const dow = t.getDay() // 0 dom … 6 sáb
  const nextMon = nextBatchMonday(t)
  const nextSlots = batchSlots(weekPlan, nextMon, profiles, allCombos)
  const range = fmtRange(nextMon, addDays(nextMon, 4))

  // 1 · Víspera del batch (sábado): lo que necesita la noche
  if (dow === 6 && nextSlots.length) {
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
      id: 'vispera', when: 'Esta noche', icon: 'moon', color: '#7154DA', tint: 'rgba(139,111,232,0.15)',
      title: 'Deja en la nevera lo que lleva avena', detail: list.join(' · ') + '. Necesita la noche anterior al batch.',
    })
    if (soak.size) out.push({
      id: 'remojo', when: 'Esta noche', icon: 'moon', color: '#2585BC', tint: 'rgba(46,155,214,0.15)',
      title: 'Legumbre en remojo', detail: `${[...soak].join(', ')}: 8–12 h en agua para el batch de mañana.`,
    })
  }

  // 2 · Congelar / descongelar
  if ((dow === 6 || dow === 0) && nextSlots.length) {
    const n = nextSlots.filter(s => (s.dayKey === 'jue' || s.dayKey === 'vie') && (s.mealType === 'comida' || s.mealType === 'cena')).length
    if (n) out.push({
      id: 'congelar', when: dow === 0 ? 'Hoy, al terminar el batch' : 'Mañana, en el batch', icon: 'snow', color: '#2585BC', tint: 'rgba(46,155,214,0.15)',
      title: `Congela los ${n} tuppers de jueves y viernes`, detail: 'Cocinados el domingo serían 4–5 días en nevera.', view: 'batch',
    })
  }
  if (dow === 3 || dow === 4) {
    const tomorrow = dow === 3 ? 'jue' : 'vie'
    const week = weekPlan[weekKeyOf(mondayOf(t))] ?? {}
    const has = ['comida', 'cena'].some(m => week[`${tomorrow}-${m}`])
    if (has) out.push({
      id: 'descongelar', when: 'Esta noche', icon: 'snow', color: '#2585BC', tint: 'rgba(46,155,214,0.15)',
      title: `Pasa a la nevera los tuppers del ${tomorrow === 'jue' ? 'jueves' : 'viernes'}`, detail: 'Así mañana están listos para calentar.',
    })
  }

  // 3 · Compra del próximo batch
  if (nextSlots.length && (dow >= 4 || dow === 0)) {
    const ings = new Set()
    nextSlots.forEach(s => s.combo.items.forEach(it => ings.add(it.k)))
    if (ings.size) out.push({
      id: 'compra', when: dow === 0 ? 'Hoy' : 'Antes del domingo', icon: 'bag', color: '#C1850C', tint: 'rgba(224,162,27,0.16)',
      title: `Compra del batch: ${ings.size} ingredientes`, detail: `Para ${range}.`, view: 'compra',
    })
  }

  // 4 · Semana que viene sin planificar
  {
    const wk = weekKeyOf(nextMon)
    const week = weekPlan[wk] ?? {}
    const missing = DAY_KEYS.length * MEALS.length - DAY_KEYS.reduce((s, dk) => s + MEALS.filter(m => week[`${dk}-${m}`]).length, 0)
    if (missing > 0 && (dow >= 4 || dow === 0)) out.push({
      id: 'planificar', when: 'Semana que viene', icon: 'cal', color: '#1F1B16', tint: 'rgba(31,27,22,0.08)',
      title: missing === 28 ? 'La semana que viene está sin planificar' : `Faltan ${missing} comidas por planificar`,
      detail: `Semana del ${fmtRange(nextMon, addDays(nextMon, 6))}. Puedes cargar una semana modelo.`, view: 'planificador',
    })
  }

  // 5 · PCOS (perfiles marcados) en los próximos 7 días
  profiles.filter(p => p.pcos).forEach(person => {
    let red = 0, total = 0
    const worst = {}
    for (let i = 0; i < 7; i++) {
      const date = addDays(t, i)
      if (!activeProfilesOn([person], date).length) continue
      const mon = mondayOf(date), dk = DAY_KEYS[(date.getDay() + 6) % 7]
      const day = dayForPerson(weekPlan[weekKeyOf(mon)] ?? {}, dk, person.id)
      ;['desayuno', 'cena'].forEach(mt => {
        const combo = day[mt]?.type === 'desayuno' ? allCombos[day[mt].recipeKey] : null
        if (!combo) return
        total++
        if (pcosCarbLevel(combo, allIng, mt) === 'red') { red++; worst[mt] = combo }
      })
    }
    if (red >= 3) {
      const mt = worst.cena ? 'cena' : 'desayuno'
      const base = comboAgg(worst[mt], allIng).kcal
      const alt = Object.entries(allCombos)
        .filter(([, c]) => (c.meals ?? []).includes(mt) && pcosCarbLevel(c, allIng, mt) === 'green')
        .map(([k, c]) => ({ k, c, d: Math.abs(comboAgg(c, allIng).kcal - base) }))
        .sort((a, b) => a.d - b.d).slice(0, 2).map(x => x.c.name)
      out.push({
        id: 'pcos-' + person.id, when: `PCOS · ${person.name}`, icon: 'warn', color: '#D64545', tint: 'rgba(214,69,69,0.12)',
        title: `${red} de ${total} desayunos y cenas altos en carbo esta semana`,
        detail: alt.length ? `Alternativas en verde para la ${mt}: ${alt.join(' · ')}.` : 'Busca platos en verde en el Planificador.', view: 'planificador',
      })
    }
  })

  // 6 · Techo de proteína (perfiles con protCap)
  profiles.filter(p => p.protCap).forEach(person => {
    const mon = mondayOf(t), week = weekPlan[weekKeyOf(mon)] ?? {}
    const over = []
    DAY_KEYS.forEach((dk, i) => {
      const date = addDays(mon, i)
      if (date < t || !activeProfilesOn([person], date).length) return
      const tot = dayTotals(dayForPerson(week, dk, person.id), person, i, allIng, allCombos)
      if (tot.prot > person.protCap) over.push(`${DAY_LONG[i].toLowerCase()} ${tot.prot} g`)
    })
    if (over.length) out.push({
      id: 'prot-' + person.id, when: `Proteína · ${person.name}`, icon: 'flame', color: '#B7791F', tint: 'rgba(183,121,31,0.14)',
      title: `Pasa su techo de ${person.protCap} g`, detail: over.join(' · ') + '.', view: 'planificador',
    })
  })

  // 7 · Reglas digestivas de semana (perfiles con digestive)
  profiles.filter(p => p.digestive).forEach(person => {
    const mon = mondayOf(t), week = weekPlan[weekKeyOf(mon)] ?? {}
    const days = DAY_KEYS.map(dk => {
      const d = dayForPerson(week, dk, person.id)
      return Object.fromEntries(MEALS.map(m => [m, d[m]?.type === 'desayuno' ? allCombos[d[m].recipeKey] : null]))
    })
    const v = weekViolations(days, allIng, {}).filter(x => x.rule.startsWith('cadencia') || x.rule === 'gos-consecutivo')
    if (v.length) out.push({
      id: 'dig-' + person.id, when: `Digestión · ${person.name}`, icon: 'leaf', color: '#2F9E5B', tint: 'rgba(47,158,91,0.14)',
      title: 'La semana repite demasiado un grupo', detail: v.slice(0, 2).map(x => x.msg.replace(/dias/g, 'días')).join(' '), view: 'planificador',
    })
  })

  return out
}
