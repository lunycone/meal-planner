// ─── Reglas de SEMANA, no de plato ──────────────────────────────────────────
// 3 sep 2026. Todo lo digestivo que habia en calc.js es por-plato o por-hueco
// horario. Faltaba la capa que solo se ve mirando los siete dias a la vez, y
// por ese hueco se colaron tres semanas del planificador impreso:
//   · S8  → black beans en la comida 7 de 7 dias
//   · S5  → cebolla en la comida 7 de 7 dias
//   · S7  → cebolla en la comida 7 de 7 dias
// Ninguna rompe una regla de plato. Las tres rompen la de dosis acumulada:
// GOS y fructanos son dosis-dependientes, y sin dia de descanso la carga
// semanal es la variable, no la de cada racion.

import {
  dishHasGOS, dishHasAllium, dishHasInsolubleFiber,
  comboFibSol, comboAgg, glycemicCheck,
} from './calc'
import { tagsOf } from '../lib/tags'

// 26 sep 2026 -- con el batch del domingo la comida y la cena de lunes a
// viernes son el MISMO plato cinco dias: «max 4 de 7 por franja» y «nunca
// legumbre dos dias seguidos» eran imposibles de cumplir. La dosis se
// controla ahora por DIA: legumbre, cebolla/ajo (fructanos) o fibra
// insoluble como mucho en UNA comida al dia. Suelo de fibra soluble subido
// de 8 a 10 g (el usuario: «sentimos que comemos poca fibra») y suelo nuevo
// de verdura (gramos de verdura de verdad, sin fruta ni frutos secos).
export const DIGESTIVE_MAX_PER_DAY = 1
export const SOLUBLE_FIBER_DAILY_MIN = 10  // g/dia
export const VEG_DAILY_MIN = 150           // g/dia, receta base
export const PROTEIN_DAILY_MAX_G_PER_KG = 2.2
const SLOT_EN = { desayuno: 'breakfast', comida: 'lunch', merienda: 'snack', cena: 'dinner' }
const DAY_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Verdura: ingredientes con la etiqueta 'veg' (lib/tags.js) — fruta, frutos
// secos y lácteos no cuentan aunque sean de la categoría «fresco».
export function isVeg(key, allIng) { return tagsOf(key, allIng).includes('veg') }
export function dishVegGrams(combo, allIng) {
  return (combo?.items ?? []).reduce((s, it) => {
    if (!isVeg(it.k, allIng)) return s
    const p = it.p ?? {}
    return s + (p.grams ?? p.ml ?? (p.units != null ? p.units * 120 : 0))
  }, 0)
}

// week = [{ desayuno, comida, merienda, cena }, ...] con combos ya resueltos.
// Devuelve la lista de infracciones de semana, vacia si todo correcto.
export function weekViolations(week, allIng, person = {}) {
  const out = []
  const slots = ['desayuno', 'comida', 'merienda', 'cena']
  const groups = [
    ['gos', dishHasGOS, 'Legumes'],
    ['fructanos', dishHasAllium, 'Onion, garlic or leek'],
    ['insoluble', dishHasInsolubleFiber, 'Insoluble fiber'],
  ]

  week.forEach((day, i) => {
    for (const [rule, test, label] of groups) {
      const hits = slots.filter(k => day?.[k] && test(day[k], allIng))
      if (hits.length > DIGESTIVE_MAX_PER_DAY) out.push({
        rule: 'dosis-' + rule, day: i, slots: hits,
        msg: `${DAY_EN[i] ?? `Day ${i + 1}`}: ${label} at ${hits.map(h => SLOT_EN[h]).join(' and ')} (max once a day).`,
      })
    }
  })

  // Suelo diario de fibra soluble. Evitar el desencadenante no es lo mismo que
  // aportar el remedio: en SII-M con rachas de estrenimiento, quitar insoluble
  // sin poner soluble deja una dieta simplemente baja en fibra, que empeora la
  // mitad estrenida del cuadro.
  week.forEach((day, i) => {
    const sol = slots.reduce((s, k) => s + (day?.[k] ? comboFibSol(day[k], allIng) : 0), 0)
    if (sol < SOLUBLE_FIBER_DAILY_MIN) out.push({
      rule: 'fibra-soluble-baja', day: i, value: Math.round(sol * 10) / 10,
      msg: `${DAY_EN[i] ?? `Day ${i + 1}`}: ${sol.toFixed(1)} g soluble fiber (min ${SOLUBLE_FIBER_DAILY_MIN}).`,
    })
  })

  // Techo de proteina. En un cuerpo de 64 kg que quiere GANAR peso, pasar de
  // ~2,2 g/kg es contraproducente por cuatro vias a la vez: la proteina es el
  // macro mas saciante, el de mayor efecto termico (~25-30% frente a ~2% de la
  // grasa), el mas caro por caloria, y el excedente no absorbido alimenta la
  // fermentacion proteolitica en colon — gas sulfuroso, que es exactamente lo
  // que el registro del 20 de agosto documenta antes de la peor deposicion.
  const cap = person.protCap ?? (person.weightKg ? person.weightKg * PROTEIN_DAILY_MAX_G_PER_KG : null)
  week.forEach((day, i) => {
    const dishes = slots.map(k => day?.[k]).filter(Boolean)
    const prot = dishes.reduce((sum,dish) => sum + comboAgg(dish, allIng).prot, 0)
    if (cap && prot > cap) out.push({ rule: 'proteina-excesiva', day: i, value: prot, msg: `${DAY_EN[i]}: ${prot.toFixed(1)} g protein (ceiling ${cap} g).` })
    if (dishes.length === slots.length && person.proteinTarget && prot < person.proteinTarget) {
      out.push({ rule: 'proteina-baja', day: i, value: prot, msg: `${DAY_EN[i]}: ${prot.toFixed(1)} g protein (target ${person.proteinTarget} g).` })
    }
    if (!person.pcos) return
    for (const slot of ['desayuno', 'cena']) {
      if (!day?.[slot]) continue
      const check = glycemicCheck(day[slot], allIng, slot)
      if (check.status === 'within') continue
      const detail = check.status === 'unknown' ? 'incomplete GI data' : `glycemic load exceeds ${check.limit}`
      out.push({ rule: `gl-${slot}-${check.status}`, day: i, msg: `${DAY_EN[i]} ${SLOT_EN[slot]}: ${detail}.` })
    }
  })

  return out
}

export function weekIsClean(week, allIng, person) {
  return weekViolations(week, allIng, person).length === 0
}
