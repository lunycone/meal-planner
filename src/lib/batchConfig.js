// ─── Días de batch (configurables) ──────────────────────────────────────────
// Antes estaba fijo «el domingo se cocina lunes–viernes». Ahora se elige en
// Ajustes (engranaje junto a J/M): uno o varios días de batch y cuántos días
// cubre cada uno. Todo lo demás (Compra, Batch, Planificador, Hoy,
// sugerencias, semana inteligente) lee de aquí.
//
// Una sesión = { cook: 0..6 (0 = lunes … 6 = domingo), days: n }.
//   · cook = domingo → cubre desde el LUNES siguiente (la semana que empieza).
//   · cualquier otro → cubre desde el día siguiente, dentro de la misma semana.
// Lo que cubre no pasa del domingo (la semana del plan es lunes–domingo) y
// las sesiones no se pisan. Los días que no cubre ninguna son «libres» (como
// antes el fin de semana): no se planifican ni se compran.
// El registro vive en el módulo (como los colores de tienda): useStore llama a
// applyBatchSettings al arrancar y cada vez que cambia.

import { DAY_KEYS, addDays, mondayOf, startOfDay, weekKeyOf } from './mealplan'

export const DAY_SHORT_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LONG_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const DEFAULT_BATCH = { sessions: [{ cook: 6, days: 5 }] }

const firstDay = s => (s.cook === 6 ? 0 : s.cook + 1)
/** Máximo de días que puede cubrir una sesión que cocina en `cook`. */
export const maxDaysFor = cook => 7 - (cook === 6 ? 0 : cook + 1)

/** Deja la configuración válida: ordenada, sin solapes, sin salirse del domingo. */
export function normalizeBatch(settings) {
  const raw = (settings?.sessions ?? []).filter(s => Number.isInteger(s?.cook) && s.cook >= 0 && s.cook <= 6)
    .map(s => ({ cook: s.cook, days: Math.max(1, Math.min(maxDaysFor(s.cook), Math.round(s.days ?? 1))) }))
    .sort((a, b) => firstDay(a) - firstDay(b))
  const out = []
  for (const s of raw) {
    const prev = out[out.length - 1]
    if (prev) {
      const prevEnd = firstDay(prev) + prev.days // primer día libre tras la anterior
      if (firstDay(s) < prevEnd) {
        // Se pisan: la anterior se recorta para acabar antes de que empiece esta.
        prev.days = firstDay(s) - firstDay(prev)
        if (prev.days < 1) out.pop()
      }
    }
    out.push({ ...s })
  }
  return { sessions: out.length ? out : DEFAULT_BATCH.sessions.map(s => ({ ...s })) }
}

let CUR = normalizeBatch(DEFAULT_BATCH)
export function applyBatchSettings(settings) { CUR = normalizeBatch(settings ?? DEFAULT_BATCH) }
export const batchSettings = () => CUR

/** Índices (0..6) que cubre la sesión `s`. */
export function sessionDayIdx(s) {
  const a = firstDay(s)
  return Array.from({ length: s.days }, (_, i) => a + i)
}
/** Sesiones con sus días: [{ si, cook, days: [idx], dayKeys, label, cookLabel }]. */
export function batchSessions(settings = CUR) {
  return settings.sessions.map((s, si) => {
    const days = sessionDayIdx(s)
    return { si, cook: s.cook, days, dayKeys: days.map(i => DAY_KEYS[i]), label: rangeLabel(days), cookLabel: DAY_LONG_EN[s.cook] }
  })
}
/** Todos los días cubiertos por algún batch (índices ordenados). */
export function coveredDays(settings = CUR) {
  return [...new Set(settings.sessions.flatMap(sessionDayIdx))].sort((a, b) => a - b)
}
export const batchDayKeys = (settings = CUR) => coveredDays(settings).map(i => DAY_KEYS[i])
export const freeDayKeys = (settings = CUR) => DAY_KEYS.filter((_, i) => !coveredDays(settings).includes(i))
/** Sesión que cubre ese día (índice) o -1. */
export function sessionOfDay(dayKey, settings = CUR) {
  const i = DAY_KEYS.indexOf(dayKey)
  return settings.sessions.findIndex(s => sessionDayIdx(s).includes(i))
}

/** «Mon–Fri», «Thu–Sun», «Mon», «Mon, Wed & Fri». */
export function rangeLabel(idx) {
  const d = [...idx].sort((a, b) => a - b)
  if (!d.length) return '—'
  if (d.length === 1) return DAY_SHORT_EN[d[0]]
  const contiguous = d.every((x, i) => i === 0 || x === d[i - 1] + 1)
  if (contiguous) return `${DAY_SHORT_EN[d[0]]}–${DAY_SHORT_EN[d[d.length - 1]]}`
  const names = d.map(i => DAY_SHORT_EN[i])
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

/** Fecha en que se cocina la sesión `si` para la semana que empieza en `monday`. */
export function cookDateFor(monday, si, settings = CUR) {
  const s = settings.sessions[si] ?? settings.sessions[0]
  return addDays(monday, s.cook === 6 ? -1 : s.cook)
}
/** Días (fecha, semana, clave) que cubre la sesión `si` de la semana `monday`. */
export function sessionDates(monday, si, settings = CUR) {
  const s = settings.sessions[si] ?? settings.sessions[0]
  const wk = weekKeyOf(monday)
  return sessionDayIdx(s).map(i => ({ date: addDays(monday, i), wk, dayKey: DAY_KEYS[i] }))
}
/** Clave estable para marcas de esa sesión (compatible con las de antes). */
export const sessionKey = (monday, si) => (si ? `${weekKeyOf(monday)}-${si}` : weekKeyOf(monday))

/** Todos los batches en orden desde la semana `fromMonday`: [{ monday, si, cookDate }]. */
function batchesAround(fromMonday, weeksBefore, weeksAfter, settings = CUR) {
  const out = []
  for (let w = -weeksBefore; w <= weeksAfter; w++) {
    const monday = addDays(fromMonday, 7 * w)
    settings.sessions.forEach((_, si) => out.push({ monday, si, cookDate: cookDateFor(monday, si, settings) }))
  }
  return out.sort((a, b) => a.cookDate - b.cookDate)
}
/** El próximo batch por cocinar (hoy incluido). */
export function nextBatch(today = new Date(), settings = CUR) {
  const t = startOfDay(today)
  return batchesAround(mondayOf(t), 1, 2, settings).find(b => b.cookDate >= t)
}
/** El batch `step` posiciones antes (−) o después (+) de `ref`. */
export function stepBatch(ref, step, settings = CUR) {
  const list = batchesAround(ref.monday, 2, 2, settings)
  const i = list.findIndex(b => +b.monday === +ref.monday && b.si === ref.si)
  return list[Math.max(0, Math.min(list.length - 1, (i < 0 ? 0 : i) + step))]
}
/** Batches que se cocinan ese día: [{ monday, si }]. */
export function batchesCookedOn(date, settings = CUR) {
  const d = startOfDay(date)
  return batchesAround(mondayOf(d), 1, 1, settings).filter(b => +startOfDay(b.cookDate) === +d)
}
/** Días que lleva cocinado lo que se come en `date` (o null si no es día de batch). */
export function daysSinceCook(date, settings = CUR) {
  const d = startOfDay(date), monday = mondayOf(d)
  const si = sessionOfDay(DAY_KEYS[(d.getDay() + 6) % 7], settings)
  if (si < 0) return null
  return Math.round((d - startOfDay(cookDateFor(monday, si, settings))) / 86400000)
}
/** Resumen corto: «Sun → Mon–Fri», «Sun → Mon–Wed · Wed → Thu–Sun». */
export function batchSummary(settings = CUR) {
  return batchSessions(settings).map(s => `${DAY_SHORT_EN[s.cook]} → ${s.label}`).join(' · ')
}
