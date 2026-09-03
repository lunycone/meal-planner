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
  comboFibSol, comboAgg,
} from './calc'

export const CADENCE_MAX_DAYS = 4      // de 7, por franja horaria
export const SOLUBLE_FIBER_DAILY_MIN = 8   // g/dia
export const PROTEIN_DAILY_MAX_G_PER_KG = 2.2

// week = [{ desayuno, comida, merienda, cena }, ...] con combos ya resueltos.
// Devuelve la lista de infracciones de semana, vacia si todo correcto.
export function weekViolations(week, allIng, person = {}) {
  const out = []
  const slots = ['desayuno', 'comida', 'merienda', 'cena']

  for (const slot of slots) {
    const combos = week.map(d => d?.[slot]).filter(Boolean)
    if (!combos.length) continue

    const gosDays = combos.filter(dishHasGOS).length
    if (gosDays > CADENCE_MAX_DAYS) out.push({
      rule: 'cadencia-gos', slot, days: gosDays,
      msg: `Legumbre o harina de legumbre en ${slot} ${gosDays}/7 dias (max ${CADENCE_MAX_DAYS}).`,
    })

    const fructanDays = combos.filter(dishHasAllium).length
    if (fructanDays > CADENCE_MAX_DAYS) out.push({
      rule: 'cadencia-fructanos', slot, days: fructanDays,
      msg: `Cebolla, ajo, puerro o alcachofa en ${slot} ${fructanDays}/7 dias (max ${CADENCE_MAX_DAYS}).`,
    })

    const insolDays = combos.filter(dishHasInsolubleFiber).length
    if (insolDays > CADENCE_MAX_DAYS) out.push({
      rule: 'cadencia-insoluble', slot, days: insolDays,
      msg: `Fibra insoluble en ${slot} ${insolDays}/7 dias (max ${CADENCE_MAX_DAYS}).`,
    })

    // Dos dias seguidos con legumbre en la MISMA franja: prohibido en cena,
    // avisado en el resto. Es la regla que ya existia, ahora aplicada a todas.
    for (let i = 1; i < combos.length; i++) {
      if (dishHasGOS(combos[i]) && dishHasGOS(combos[i - 1])) {
        out.push({
          rule: 'gos-consecutivo', slot, day: i,
          msg: `Legumbre en ${slot} dos dias seguidos (dias ${i} y ${i + 1}).`,
        })
        break
      }
    }
  }

  // Suelo diario de fibra soluble. Evitar el desencadenante no es lo mismo que
  // aportar el remedio: en SII-M con rachas de estrenimiento, quitar insoluble
  // sin poner soluble deja una dieta simplemente baja en fibra, que empeora la
  // mitad estrenida del cuadro.
  week.forEach((day, i) => {
    const sol = slots.reduce((s, k) => s + (day?.[k] ? comboFibSol(day[k], allIng) : 0), 0)
    if (sol < SOLUBLE_FIBER_DAILY_MIN) out.push({
      rule: 'fibra-soluble-baja', day: i, value: Math.round(sol * 10) / 10,
      msg: `Dia ${i + 1}: ${sol.toFixed(1)} g de fibra soluble (min ${SOLUBLE_FIBER_DAILY_MIN}).`,
    })
  })

  // Techo de proteina. En un cuerpo de 64 kg que quiere GANAR peso, pasar de
  // ~2,2 g/kg es contraproducente por cuatro vias a la vez: la proteina es el
  // macro mas saciante, el de mayor efecto termico (~25-30% frente a ~2% de la
  // grasa), el mas caro por caloria, y el excedente no absorbido alimenta la
  // fermentacion proteolitica en colon — gas sulfuroso, que es exactamente lo
  // que el registro del 20 de agosto documenta antes de la peor deposicion.
  if (person.weightKg) {
    const cap = person.weightKg * PROTEIN_DAILY_MAX_G_PER_KG
    week.forEach((day, i) => {
      const prot = slots.reduce((s, k) => s + (day?.[k] ? comboAgg(day[k], allIng).prot : 0), 0)
      if (prot > cap) out.push({
        rule: 'proteina-excesiva', day: i, value: Math.round(prot),
        msg: `Dia ${i + 1}: ${Math.round(prot)} g de proteina (techo ${Math.round(cap)} g a ${person.weightKg} kg).`,
      })
    })
  }

  return out
}

export function weekIsClean(week, allIng, person) {
  return weekViolations(week, allIng, person).length === 0
}
