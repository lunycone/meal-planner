// ─── Persistence seam ────────────────────────────────────────────────────────
// The store talks only to this adapter — never directly to a backend.
// Swap createStorageAdapter() contents to change backend; nothing else changes.
//
// HYDRATION GUARD: `hydrated` flag prevents the race condition where Zustand
// fires setItem with empty default state during store initialization (before
// getItem resolves), which would overwrite real data in Supabase.

import { createClient } from '@supabase/supabase-js'

export const STORAGE_KEY = 'meal-planner-v3'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export function createStorageAdapter() {
  if (!supabase) {
    console.info('[storage] Supabase not configured — using localStorage')
    return {
      getItem:    (name) => { const r = localStorage.getItem(name); return r ? JSON.parse(r) : null },
      setItem:    (name, value) => localStorage.setItem(name, JSON.stringify(value)),
      removeItem: (name) => localStorage.removeItem(name),
    }
  }

  let hydrated = false
let lastSyncError = null

  // 5 sep 2026 -- setItem es async (round-trip de red); si el usuario recarga
  // la pagina para "comprobar que se guardo" ANTES de que esa promesa
  // resuelva, el navegador cancela el fetch a medio camino y ese guardado no
  // llega nunca a Supabase -- sin ningun aviso, porque no habia nada
  // avisando de que aun quedaba un guardado en vuelo. pendingWrites cuenta
  // los setItem en curso; el beforeunload de abajo avisa si se intenta salir
  // con alguno todavia pendiente.
  let pendingWrites = 0
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', (e) => {
      if (pendingWrites > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    })
  }

  // 5 sep 2026 -- SEGUNDA CARRERA, entre acciones (no dentro de una): cargar
  // "semana 1" y, poco despues, cargar "semana 5" dispara DOS peticiones de
  // red distintas -- agrupar cada carga en una sola escritura (arreglo
  // anterior) ya evita que se pisen ENTRE SI los 28 huecos de una misma
  // carga, pero no evita que la escritura de la semana 1 (mas antigua)
  // TARDE MAS en responder que la de la semana 5 y por tanto gane en la
  // base de datos -- exactamente "elijo la 5, pero al final se queda la 1".
  // pendingValue/writing convierten el escritor en una cola de UN solo hueco:
  // mientras hay una peticion en vuelo, cualquier setItem nuevo solo
  // actualiza pendingValue (nunca dispara una peticion en paralelo); en
  // cuanto la peticion en curso termina, se envia el valor MAS RECIENTE
  // pendiente (nunca uno intermedio ya obsoleto). Nunca hay dos peticiones a
  // la vez, asi que no hay orden de respuesta que perder.
  let writing = false
  let pendingValue = null
  let hasPending = false

  async function flushLoop() {
    writing = true
    while (hasPending) {
      const value = pendingValue
      hasPending = false
      pendingValue = null

      pendingWrites++
      try {
        // onConflict explicito: si "id" NO tiene de verdad una restriccion
        // unica en la tabla, Postgres devuelve aqui un error claro ("no unique
        // or exclusion constraint matching ON CONFLICT") en vez de insertar en
        // silencio una fila duplicada mas -- convierte la corrupcion silenciosa
        // en un error visible la primera vez que pasa.
        const { error } = await supabase
          .from('plan_state')
          .upsert({ id: 1, data: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'id' })

        if (error) {
          console.error('[storage] setItem error', error)
          lastSyncError = error
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncError', { detail: error }))
          }
        } else {
          lastSyncError = null
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('syncSuccess'))
          }
        }
      } finally {
        pendingWrites--
      }
    }
    writing = false
  }

  return {
    // 5 sep 2026 -- se investigo si la tabla tenia filas duplicadas con id=1
    // (que habria hecho fallar un .maybeSingle() con "multiple rows
    // returned", devolviendo null == estado vacio siempre). El usuario lo
    // comprobo por SQL: 0 duplicados, esa no era la causa. La causa real
    // era la carrera entre escrituras (ver flushLoop arriba). Se deja de
    // todos modos .order + .limit(1) en vez de .maybeSingle() -- pedir la
    // MAS RECIENTE en vez de exigir que sea unica no cuesta nada y evita que
    // el dia de mañana una fila duplicada (manual, o de otra fuente) rompa
    // la lectura por completo.
    async getItem(_name) {
      const { data, error } = await supabase
        .from('plan_state')
        .select('data')
        .eq('id', 1)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('[storage] getItem error', error)
        hydrated = true  // Allow writes even if initial read failed
        return null
      }

      const raw = data?.[0]?.data ?? null
      if (raw === null) { hydrated = true; return null }

      let parsed
      if (typeof raw === 'string') {
        try { parsed = JSON.parse(raw) } catch { parsed = null }
      } else {
        parsed = raw
      }

      hydrated = true
      return parsed
    },

    async setItem(_name, value) {
      if (!hydrated) return

      pendingValue = value
      hasPending = true
      if (!writing) flushLoop()  // fire-and-forget: zustand no espera el resultado de setItem
    },

    async removeItem(_name) {
      const { error } = await supabase.from('plan_state').delete().eq('id', 1)
      if (error) console.error('[storage] removeItem error', error)
    },
  }
}
