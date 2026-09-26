// Utilidades de fecha compartidas — antes copiadas y pegadas, con pequeñas
// divergencias de estilo pero la misma lógica, en BatchPrepTab.jsx,
// WeeklyMealPlannerTab.jsx y HomeView.jsx. Un solo sitio para arreglar bugs
// de zona horaria/semana ISO en vez de tener que acordarse de los 3.

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  // 26 sep 2026 -- faltaba el +1 (dia del año empieza en 1): en los años
  // cuyo 1 de enero cae en jueves (2026) TODAS las semanas salian una por
  // debajo de la ISO real (W39 para la semana 40). Los datos guardados con
  // la formula vieja se renumeran una vez, ver migrateWeekKeys.
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d - yearStart) / 86400000 + 1) / 7)).padStart(2, '0')}`
}

/** Clave de semana guardada con la formula vieja → clave ISO correcta. Solo
 *  cambia en los años cuyo 1 de enero es jueves (la vieja daba una menos,
 *  empezando en W00); en el resto las dos formulas coinciden. */
export function fixLegacyWeekKey(key) {
  const m = /^(\d{4})-W(\d{2})$/.exec(key)
  if (!m) return key
  const year = +m[1]
  if (new Date(Date.UTC(year, 0, 1)).getUTCDay() !== 4) return key
  return `${year}-W${String(+m[2] + 1).padStart(2, '0')}`
}

/** weekPlan con todas sus claves renumeradas (ver fixLegacyWeekKey). */
export function migrateWeekKeys(weekPlan) {
  if (!weekPlan) return weekPlan
  const out = {}
  for (const [k, v] of Object.entries(weekPlan)) out[fixLegacyWeekKey(k)] = v
  return out
}

/** Lunes de la semana en weekOffset semanas desde hoy (0 = esta semana). */
export function getWeekMonday(weekOffset) {
  const now    = new Date()
  const target = new Date(now.getTime() + weekOffset * 7 * 24 * 60 * 60 * 1000)
  const day    = target.getDay()
  const diff   = target.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(new Date(target).setDate(diff))
}

/** Los 7 días (Lunes..Domingo) de la semana en weekOffset. */
export function getWeekDates(weekOffset) {
  const monday = getWeekMonday(weekOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

/** "16 jun" */
export function formatDateShort(date) {
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

/** "16 de junio" */
export function formatFullDate(date) {
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${date.getDate()} de ${months[date.getMonth()]}`
}

export function getDayName(date) {
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  return days[date.getDay()]
}

export function isToday(date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

const DEFAULT_DAY_KEYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']

/** Clave (lun..dom) del día de hoy dentro de la semana actual. */
export function getTodayDayKey(dayKeys = DEFAULT_DAY_KEYS) {
  const dates = getWeekDates(0)
  const i = dates.findIndex(isToday)
  return i === -1 ? null : dayKeys[i]
}
