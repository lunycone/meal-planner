// Escrituras del plan semanal usadas por Hoy y Planificador. Siempre UNA
// sola llamada al store por acción (setMealSlots / replaceWeek) — ver el
// comentario de carreras de escritura en useStore.js.

import { MODEL_WEEKS, expandModelWeek, MARIA_NO_BATIDO_CASERO, MARIA_MERIENDA_PORTATIL, MARIA_DESAYUNO_DOWNGRADE, MARIA_DESAYUNO_DOWNGRADE_DAYS_BY_WEEK } from '../data/modelWeeks'
import { makeByPersonSlot } from '../engine/calc'
import { DAY_KEYS } from './mealplan'
import { batchSessions, freeDayKeys, sessionOfDay } from './batchConfig'

export const slotKey = (dayKey, mealType) => `${dayKey}-${mealType}`

/** Días a los que se aplica un plato elegido para `dayKey`: los de su batch
 *  (según Ajustes) o, si es un día libre, todos los días libres. */
export function scopeDays(scope, dayKey) {
  if (scope === 'batch') { const si = sessionOfDay(dayKey); return si >= 0 ? batchSessions()[si].dayKeys : [dayKey] }
  if (scope === 'weekend') return freeDayKeys()
  return [dayKey]
}

/** Por defecto, el plato va a todo su batch si los demás días de ese batch
 *  están vacíos en esa franja; si alguno ya tiene plato, solo al día (para no
 *  pisar nada sin querer). En los días libres, igual con todos ellos. */
export function defaultScope(dayKey, mealType, weekData) {
  const scope = sessionOfDay(dayKey) >= 0 ? 'batch' : 'weekend'
  const group = scopeDays(scope, dayKey)
  if (group.length < 2) return 'day'
  const othersEmpty = group.filter(d => d !== dayKey).every(d => !weekData?.[slotKey(d, mealType)])
  return othersEmpty ? scope : 'day'
}

/** Construye los huecos a escribir. `who` = 'all' (mismo plato para todos,
 *  forma plana) o el id de una persona (forma { byPerson }, conservando lo
 *  que ya tuvieran los demás ese día). */
export function buildSelection({ weekData, dayKey, mealType, recipeKey, optionals = [], scope, who = 'all', profiles }) {
  const meal = { type: 'desayuno', recipeKey, ...(optionals.length ? { comboOptionals: optionals } : {}) }
  const slots = {}
  for (const dk of scopeDays(scope, dayKey)) {
    const key = slotKey(dk, mealType)
    if (who === 'all') { slots[key] = meal; continue }
    const existing = weekData?.[key] ?? null
    const map = existing?.byPerson
      ? { ...existing.byPerson }
      : Object.fromEntries(profiles.map(p => [p.id, existing]))
    map[who] = meal
    slots[key] = makeByPersonSlot(map)
  }
  return slots
}

/** Quita el plato de una persona (o de todos) en un día. Devuelve el nuevo
 *  valor del hueco (null = vaciar). */
export function clearFor(existing, who, profiles) {
  if (!existing || who === 'all') return null
  const map = existing.byPerson ? { ...existing.byPerson } : Object.fromEntries(profiles.map(p => [p.id, existing]))
  map[who] = null
  return Object.values(map).some(Boolean) ? makeByPersonSlot(map) : null
}

/** Semana modelo `n` → los 28 huecos de lun..dom. Con el batch del domingo
 *  (lun-vie de la misma semana) el lunes ya NO pertenece a otro ciclo, así
 *  que se rellena la semana entera tal cual: índice 0 del modelo = lunes. */
export function buildModelWeekSlots(n) {
  const week = MODEL_WEEKS.find(w => w.n === n)
  if (!week) return null
  const x = expandModelWeek(week)
  const reference = !!week.extrema
  const downgrade = reference ? [] : (MARIA_DESAYUNO_DOWNGRADE_DAYS_BY_WEEK[n] ?? [])
  const slots = {}
  DAY_KEYS.forEach((dk, i) => {
    const d = (k) => ({ type: 'desayuno', recipeKey: k })
    slots[slotKey(dk, 'desayuno')] = makeByPersonSlot({
      julio: d(x.D[i]),
      maria: d(downgrade.includes(i) ? MARIA_DESAYUNO_DOWNGRADE : x.DM[i]),
    })
    slots[slotKey(dk, 'comida')] = makeByPersonSlot({ julio: d(x.C[i]), maria: d(x.C[i]) })
    slots[slotKey(dk, 'merienda')] = makeByPersonSlot({
      julio: d(x.M[i]),
      maria: d(!reference && MARIA_NO_BATIDO_CASERO.includes(i) ? MARIA_MERIENDA_PORTATIL : x.M[i]),
    })
    slots[slotKey(dk, 'cena')] = makeByPersonSlot({ julio: d(x.N[i]), maria: d(x.N[i]) })
  })
  return slots
}

/** La semana sin el hueco `key` (o con `val` si no es null) — para escribir
 *  con replaceWeek en una sola llamada y no dejar `null` sueltos. */
export function weekWith(week, key, val) {
  const next = { ...(week ?? {}) }
  if (val) next[key] = val
  else delete next[key]
  return next
}

/** Huecos rotos (modelo 'plato' retirado, o plato que ya no existe en el
 *  catálogo). Devuelve la semana limpia, o null si no había nada que quitar. */
export function cleanWeek(week, allCombos) {
  if (!week) return null
  const ok = meal => meal && meal.type === 'desayuno' && meal.recipeKey && allCombos[meal.recipeKey]
  let changed = false
  const next = {}
  for (const [key, slot] of Object.entries(week)) {
    if (!slot) { changed = true; continue }
    if (slot.byPerson) {
      const map = Object.fromEntries(Object.entries(slot.byPerson).map(([id, m]) => [id, m && ok(m) ? m : null]))
      const bad = Object.entries(slot.byPerson).some(([id, m]) => m && !map[id])
      if (bad) changed = true
      if (Object.values(map).some(Boolean)) next[key] = bad ? makeByPersonSlot(map) : slot
      else changed = true
    } else if (ok(slot)) next[key] = slot
    else changed = true
  }
  return changed ? next : null
}
